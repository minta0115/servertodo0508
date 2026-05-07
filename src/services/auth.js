import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb, saveDb } from '../config/database.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export async function register(email, password, name) {
  const db = getDb();
  const id = uuidv4();
  const passwordHash = await bcrypt.hash(password, 10);

  db.run(
    'INSERT INTO users (id, email, password_hash, name) VALUES (?, ?, ?, ?)',
    [id, email, passwordHash, name]
  );
  saveDb();

  const token = jwt.sign({ userId: id, email }, JWT_SECRET, { expiresIn: '7d' });

  return { id, email, name, token };
}

export async function login(email, password) {
  const db = getDb();

  const results = db.exec('SELECT id, email, password_hash, name FROM users WHERE email = ?', [email]);

  if (results.length === 0 || results[0].values.length === 0) {
    throw new Error('Invalid credentials');
  }

  const row = results[0].values[0];
  const columns = results[0].columns;
  const user = {};
  columns.forEach((col, i) => user[col] = row[i]);

  const validPassword = await bcrypt.compare(password, user.password_hash);

  if (!validPassword) {
    throw new Error('Invalid credentials');
  }

  const token = jwt.sign({ userId: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });

  return { id: user.id, email: user.email, name: user.name, token };
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET);
}
