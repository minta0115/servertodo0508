import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Pool } from 'pg';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { parseTodosFromText } from './services/aiParser.js';

dotenv.config();

const app = express();
app.use(cors({
  origin: ['https://todoservercloud.netlify.app', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

// Default API keys
const DEFAULT_NVIDIA_KEY = process.env.DEFAULT_NVIDIA_API_KEY;
const DEFAULT_MINIMAX_KEY = process.env.DEFAULT_MINIMAX_API_KEY;

async function initDb() {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(36) PRIMARY KEY,
      email VARCHAR(255) UNIQUE NOT NULL,
      password_hash VARCHAR(255) NOT NULL,
      name VARCHAR(100),
      api_key VARCHAR(255),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id VARCHAR(36) PRIMARY KEY,
      user_id VARCHAR(36) NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      content TEXT NOT NULL,
      source_type VARCHAR(50) DEFAULT 'manual',
      source_detail TEXT,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      completed_at TIMESTAMP,
      is_completed BOOLEAN DEFAULT FALSE,
      deadline TIMESTAMP,
      reminder_at TIMESTAMP,
      metadata JSONB
    )
  `);

  await pool.query(`CREATE INDEX IF NOT EXISTS idx_todos_user ON todos(user_id)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_todos_deadline ON todos(deadline)`);
  await pool.query(`CREATE INDEX IF NOT EXISTS idx_todos_reminder ON todos(reminder_at)`);

  // Migration: add deadline and reminder_at columns if not exist
  await pool.query(`
    DO $$
    BEGIN
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'deadline') THEN
        ALTER TABLE todos ADD COLUMN deadline TIMESTAMP;
      END IF;
      IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'todos' AND column_name = 'reminder_at') THEN
        ALTER TABLE todos ADD COLUMN reminder_at TIMESTAMP;
      END IF;
    END $$;
  `);

  console.log('PostgreSQL database initialized');
}

function verifyToken(token) {
  return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
}

function authMiddleware(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token);
    req.userId = decoded.userId;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

// Auth routes
app.post('/api/auth/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    const id = uuidv4();
    const passwordHash = await bcrypt.hash(password, 10);

    await pool.query(
      'INSERT INTO users (id, email, password_hash, name) VALUES ($1, $2, $3, $4)',
      [id, email, passwordHash, name]
    );

    const token = jwt.sign({ userId: id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
    res.json({ token, user: { id, email, name } });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);

    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET || 'your-secret-key', { expiresIn: '30d' });
    res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Todo routes
app.get('/api/todos', authMiddleware, async (req, res) => {
  try {
    const { completed } = req.query;
    let query = 'SELECT * FROM todos WHERE user_id = $1';
    const params = [req.userId];

    if (completed !== undefined) {
      query += ' AND is_completed = $2';
      params.push(completed === 'true');
    }

    // Order: incomplete first by deadline, then completed by completed_at desc
    query += ' ORDER BY is_completed ASC, COALESCE(deadline, \'9999-12-31\') ASC, created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (error) {
    console.error('Get todos error:', error);
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/api/todos/parse', authMiddleware, async (req, res) => {
  try {
    const { text, sourceType = 'manual', sourceDetail = null } = req.body;
    if (!text) return res.status(400).json({ error: 'Text is required' });

    // Get user's API key and preferred provider from database
    const userResult = await pool.query('SELECT api_key, preferred_provider FROM users WHERE id = $1', [req.userId]);
    const userApiKey = userResult.rows[0]?.api_key;
    const preferredProvider = userResult.rows[0]?.preferred_provider || 'nvidia';

    // Use user's own key if set, otherwise use system default based on provider
    let apiKey = userApiKey;
    if (!apiKey) {
      apiKey = preferredProvider === 'minimax' ? DEFAULT_MINIMAX_KEY : DEFAULT_NVIDIA_KEY;
    }

    const parsedTodos = await parseTodosFromText(text, apiKey, preferredProvider);
    const createdTodos = [];

    for (const todo of parsedTodos) {
      const id = uuidv4();

      // Calculate deadline and reminder
      let deadline = null;
      let reminderAt = null;

      if (todo.deadline) {
        // Parse AI-returned deadline
        const parsedDeadline = new Date(todo.deadline);
        if (!isNaN(parsedDeadline.getTime())) {
          deadline = parsedDeadline;
        }
      }

      if (!deadline) {
        // Default: 3 days from now
        deadline = new Date();
        deadline.setDate(deadline.getDate() + 3);
        deadline.setHours(23, 59, 59, 999);
      }

      // Set reminder to deadline day at 4:00 PM
      reminderAt = new Date(deadline);
      reminderAt.setHours(16, 0, 0, 0);

      await pool.query(
        `INSERT INTO todos (id, user_id, content, source_type, source_detail, deadline, reminder_at, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
        [id, req.userId, todo.content, sourceType, JSON.stringify(sourceDetail), deadline, reminderAt,
         JSON.stringify({ confidence: todo.confidence, deadline: todo.deadline, category: todo.category })]
      );

      const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
      if (result.rows.length > 0) createdTodos.push(result.rows[0]);
    }

    res.json({ parsed: parsedTodos.length, todos: createdTodos });
  } catch (error) {
    console.error('Parse todos error:', error);
    res.status(500).json({ error: 'Failed to parse todos' });
  }
});

// Direct todo creation (without AI parsing)
app.post('/api/todos', authMiddleware, async (req, res) => {
  try {
    const { content, sourceType = 'manual', sourceDetail = null, deadline = null } = req.body;
    if (!content) return res.status(400).json({ error: 'Content is required' });

    const id = uuidv4();
    let todoDeadline = deadline;
    let reminderAt = null;

    if (!todoDeadline) {
      // Default: 3 days from now
      todoDeadline = new Date();
      todoDeadline.setDate(todoDeadline.getDate() + 3);
      todoDeadline.setHours(23, 59, 59, 999);
    }

    // Set reminder to deadline day at 4:00 PM
    reminderAt = new Date(todoDeadline);
    reminderAt.setHours(16, 0, 0, 0);

    await pool.query(
      `INSERT INTO todos (id, user_id, content, source_type, source_detail, deadline, reminder_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)`,
      [id, req.userId, content, sourceType, JSON.stringify(sourceDetail), todoDeadline, reminderAt, '{}']
    );

    const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    res.json(result.rows[0]);
  } catch (error) {
    console.error('Create todo error:', error);
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.patch('/api/todos/:id/complete', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    const { isCompleted = true } = req.body;
    const completedAt = isCompleted ? new Date() : null;

    await pool.query(
      'UPDATE todos SET is_completed = $1, completed_at = $2 WHERE id = $3 AND user_id = $4',
      [isCompleted, completedAt, id, req.userId]
    );

    const result = await pool.query('SELECT * FROM todos WHERE id = $1', [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Todo not found' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    console.error('Complete todo error:', error);
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', authMiddleware, async (req, res) => {
  try {
    const { id } = req.params;
    await pool.query('DELETE FROM todos WHERE id = $1 AND user_id = $2', [id, req.userId]);
    res.json({ success: true });
  } catch (error) {
    console.error('Delete todo error:', error);
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

// Settings routes
app.get('/api/settings', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query('SELECT api_key, preferred_provider FROM users WHERE id = $1', [req.userId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      apiKey: result.rows[0].api_key || '',
      preferredProvider: result.rows[0].preferred_provider || 'nvidia'
    });
  } catch (error) {
    console.error('Get settings error:', error);
    res.status(500).json({ error: 'Failed to get settings' });
  }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
  try {
    const { apiKey, preferredProvider } = req.body;
    await pool.query(
      'UPDATE users SET api_key = $1, preferred_provider = $2 WHERE id = $3',
      [apiKey || null, preferredProvider || 'nvidia', req.userId]
    );
    res.json({ success: true });
  } catch (error) {
    console.error('Update settings error:', error);
    res.status(500).json({ error: 'Failed to update settings' });
  }
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;
initDb().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
});