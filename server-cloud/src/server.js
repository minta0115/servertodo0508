const express = require('express');
const cors = require('cors');
const path = require('path');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const aiParser = require('./services/aiParser');

require('dotenv').config();

const app = express();

// CORS配置：允许API调用
app.use(cors({
    origin: process.env.NODE_ENV === 'production' ? undefined : 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());

const JWT_SECRET = process.env.JWT_SECRET || 'secret';

// In-memory database
const db = {
    users: [],
    todos: [],
    userSettings: {},
    userApiKeys: {}
};

let nextUserId = 1;
let nextTodoId = 1;

// Middleware to verify JWT
const authMiddleware = (req, res, next) => {
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
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        if (db.users.find(u => u.email === email)) {
            return res.status(400).json({ message: 'User already exists' });
        }

        const user = {
            id: nextUserId++,
            email,
            password: hashedPassword,
            name,
            created_at: new Date().toISOString()
        };
        db.users.push(user);
        db.userSettings[user.id] = { user_id: user.id, preferred_provider: 'nvidia' };

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(400).json({ message: 'Registration error' });
    }
});

app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = db.users.find(u => u.email === email);
        if (!user) return res.status(400).json({ message: 'User not found' });

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) return res.status(400).json({ message: 'Invalid password' });

        const token = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: '30d' });
        res.json({ token, user: { id: user.id, email: user.email, name: user.name } });
    } catch (error) {
        res.status(500).json({ message: 'Login error' });
    }
});

app.get('/api/auth/me', authMiddleware, async (req, res) => {
    try {
        const user = db.users.find(u => u.id === req.userId);
        if (!user) return res.status(404).json({ message: 'User not found' });
        res.json({ id: user.id, email: user.email, name: user.name });
    } catch (error) {
        res.status(500).json({ message: 'Error fetching user' });
    }
});

// Todo routes
app.post('/api/todos/parse', authMiddleware, async (req, res) => {
    const { text } = req.body;
    try {
        const todos = await aiParser.parseTodos(text, req.userId, db);
        res.json(todos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error parsing todos' });
    }
});

app.get('/api/todos', authMiddleware, async (req, res) => {
    try {
        const todos = db.todos.filter(t => t.user_id === req.userId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        res.json(todos);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching todos' });
    }
});

app.put('/api/todos/:id', authMiddleware, async (req, res) => {
    const { id } = req.params;
    const { completed } = req.body;
    try {
        const todo = db.todos.find(t => t.id === parseInt(id) && t.user_id === req.userId);
        if (!todo) return res.status(404).json({ message: 'Todo not found' });

        todo.completed = completed ? 1 : 0;
        todo.completed_at = completed ? new Date().toISOString() : null;
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating todo' });
    }
});

// Settings routes
app.get('/api/settings', authMiddleware, async (req, res) => {
    try {
        const settings = db.userSettings[req.userId] || { preferred_provider: 'nvidia' };
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching settings' });
    }
});

app.put('/api/settings', authMiddleware, async (req, res) => {
    const { preferred_provider } = req.body;
    try {
        db.userSettings[req.userId] = {
            user_id: req.userId,
            preferred_provider
        };
        res.json({ message: 'Updated' });
    } catch (error) {
        res.status(500).json({ message: 'Error updating settings' });
    }
});

// 生产环境：提供前端静态文件
if (process.env.NODE_ENV === 'production') {
    const clientDistPath = path.join(__dirname, '../../client/dist');
    app.use(express.static(clientDistPath));

    // SPA后备路由：任何不匹配API的请求都返回index.html
    app.get('*', (req, res) => {
        res.sendFile(path.join(clientDistPath, 'index.html'));
    });
}

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});