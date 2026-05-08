const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { Pool } = require('pg');
const aiParser = require('./services/aiParser');

require('dotenv').config();

const app = express();

// CORS配置 - 允许所有来源
app.use(cors({
    origin: '*',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// PostgreSQL 连接 - Railway
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
    max: 10,
    idleTimeoutMillis: 30000,
    connectionTimeoutMillis: 15000
});

// 初始化数据库表
async function initDb() {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
            id SERIAL PRIMARY KEY,
            email VARCHAR(255) UNIQUE NOT NULL,
            password_hash VARCHAR(255) NOT NULL,
            name VARCHAR(100),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS todos (
            id SERIAL PRIMARY KEY,
            user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            content TEXT NOT NULL,
            category VARCHAR(50) DEFAULT '其他',
            due_date DATE,
            source VARCHAR(20) DEFAULT 'manual',
            completed INTEGER DEFAULT 0,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            completed_at TIMESTAMP
        )
    `);

    await pool.query(`
        CREATE TABLE IF NOT EXISTS user_settings (
            user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
            preferred_provider VARCHAR(20) DEFAULT 'nvidia',
            api_key TEXT
        )
    `);

    console.log('Database initialized');
}

// Middleware to verify JWT
const authMiddleware = async (req, res, next) => {
    const token = req.headers.authorization?.split(' ')[1];
    if (!token) return res.status(401).json({ message: 'No token provided' });

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.userId = decoded.id;
        next();
    } catch (error) {
        res.status(401).json({ message: 'Invalid token' });
    }
};

// Auth routes
app.post('/api/auth/register', async (req, res) => {
    const { email, password, name } = req.body;
    console.log('Register request:', { email, name });

    try {
        // 检查用户是否存在
        const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const result = await pool.query(
            'INSERT INTO users (email, password_hash, name) VALUES ($1, $2, $3) RETURNING id, email, name',
            [email, hashedPassword, name]
        );

        const user = result.rows[0];

        // 创建设置
        await pool.query(
            'INSERT INTO user_settings (user_id, preferred_provider) VALUES ($1, $2)',
            [user.id, 'nvidia']
        );

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
        console.log('Register success:', { id: user.id, email });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Register error:', error);
        res.status(400).json({ message: 'Registration error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    console.log('Login request:', { email });

    try {
        const result = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user) return res.status(400).json({ message: 'User not found' });

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
        console.log('Login success:', { id: user.id, email });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Login error' });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query('SELECT id, email, name FROM users WHERE id = $1', [req.userId]);
        if (result.rows.length === 0) return res.status(404).json({ message: 'User not found' });
        res.json(result.rows[0]);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// Todo routes
app.post('/api/todos/parse', authMiddleware, async (req, res) => {
    const { text } = req.body;
    try {
        // 创建模拟的 db 对象供 aiParser 使用
        const db = {
            userSettings: {},
            userApiKeys: {}
        };
        const todos = await aiParser.parseTodos(text, req.userId, db, false);
        res.json(todos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error parsing todos' });
    }
});

app.post('/api/todos/direct', authMiddleware, async (req, res) => {
    const { content, category, due_date } = req.body;
    console.log('Direct add todo:', { content, category, due_date });

    try {
        if (!content || !content.trim()) {
            return res.status(400).json({ message: 'Content is required' });
        }

        const result = await pool.query(
            `INSERT INTO todos (user_id, content, category, due_date, source, completed)
             VALUES ($1, $2, $3, $4, 'manual', 0) RETURNING *`,
            [req.userId, content.trim(), category || '其他', due_date || null]
        );

        console.log('Todo added successfully:', result.rows[0]);
        res.json({ message: 'Todo added', todo: result.rows[0] });
    } catch (error) {
        console.error('Error adding todo:', error);
        res.status(500).json({ message: 'Error adding todo' });
    }
});

// 批量添加待办（用于AI解析确认后）
app.post('/api/todos/batch', authMiddleware, async (req, res) => {
    const { todos } = req.body;
    console.log('Batch add todos for user:', req.userId, todos);

    try {
        if (!todos || !Array.isArray(todos) || todos.length === 0) {
            return res.status(400).json({ message: 'Todos array is required' });
        }

        // 确保 user_settings 表存在
        try {
            await pool.query(`
                CREATE TABLE IF NOT EXISTS user_settings (
                    user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
                    preferred_provider VARCHAR(20) DEFAULT 'nvidia',
                    api_key TEXT
                )
            `);
        } catch (e) {
            // 忽略错误
        }

        const addedTodos = [];

        for (const todo of todos) {
            if (!todo.content || !todo.content.trim()) continue;

            try {
                const result = await pool.query(
                    `INSERT INTO todos (user_id, content, category, due_date, source, completed)
                     VALUES ($1, $2, $3, $4, 'ai', 0) RETURNING *`,
                    [req.userId, todo.content.trim(), todo.category || '其他', todo.due_date || null]
                );
                addedTodos.push(result.rows[0]);
            } catch (insertError) {
                console.error('Error inserting todo:', insertError);
            }
        }

        console.log('Batch todos added successfully:', addedTodos.length);
        res.json({ message: 'Todos added', count: addedTodos.length, todos: addedTodos });
    } catch (error) {
        console.error('Error batch adding todos:', error);
        res.status(500).json({ message: 'Error adding todos', detail: error.message });
    }
});

app.get('/api/todos', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT * FROM todos WHERE user_id = $1 ORDER BY created_at DESC',
            [req.userId]
        );
        res.json(result.rows);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching todos' });
    }
});

app.put('/api/todos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;

    try {
        const result = await pool.query(
            'UPDATE todos SET completed = $1, completed_at = $2 WHERE id = $3 AND user_id = $4 RETURNING *',
            [completed ? 1 : 0, completed ? new Date() : null, id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating todo' });
    }
});

app.delete('/api/todos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            'DELETE FROM todos WHERE id = $1 AND user_id = $2 RETURNING id',
            [id, req.userId]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ message: 'Todo not found' });
        }

        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting todo' });
    }
});

// Settings routes
app.get('/api/settings', authMiddleware, async (req, res) => {
    try {
        const result = await pool.query(
            'SELECT preferred_provider, api_key FROM user_settings WHERE user_id = $1',
            [req.userId]
        );

        if (result.rows.length === 0) {
            return res.json({ preferred_provider: 'nvidia', api_key: '' });
        }

        res.json({
            preferred_provider: result.rows[0].preferred_provider || 'nvidia',
            api_key: result.rows[0].api_key || ''
        });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
    const { preferred_provider, api_key } = req.body;

    try {
        await pool.query(
            `INSERT INTO user_settings (user_id, preferred_provider, api_key)
             VALUES ($1, $2, $3)
             ON CONFLICT (user_id) DO UPDATE SET
             preferred_provider = EXCLUDED.preferred_provider,
             api_key = EXCLUDED.api_key`,
            [req.userId, preferred_provider || 'nvidia', api_key || null]
        );
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 生产环境：提供前端静态文件
if (process.env.NODE_ENV === 'production') {
    const path = require('path');
    const clientDistPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDistPath));

    // SPA fallback路由
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(clientDistPath, 'index.html'));
        }
    });
}

// 初始化数据库并启动服务
const PORT = process.env.PORT || 3001;

initDb().then(() => {
    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}).catch(err => {
    console.error('Failed to initialize database:', err);
    process.exit(1);
});
