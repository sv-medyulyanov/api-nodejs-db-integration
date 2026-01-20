require('dotenv').config();
const express = require('express');
const { Pool } = require('pg');
const app = express();

app.use(express.json());

// Безопасное подключение через переменные окружения
const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'qa_api_portfolio',
  password: process.env.DB_PASSWORD, // пароль ТОЛЬКО из .env
  port: process.env.DB_PORT || 5432,
});

// Проверка подключения (новый синтаксис)
pool.connect()
  .then(() => {
    console.log('✅ Connected to PostgreSQL');
  })
  .catch(err => {
    console.error('Database connection error:', err.message);
  });

// GET /posts - все посты
app.get('/posts', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts ORDER BY id');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /posts - создать пост
app.post('/posts', async (req, res) => {
  try {
    const { title, body, user_id } = req.body;
    
    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }
    
    const result = await pool.query(
      'INSERT INTO posts (title, body, user_id) VALUES ($1, $2, $3) RETURNING *',
      [title, body, user_id || 1]
    );
    
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /posts/:id - один пост
app.get('/posts/:id', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM posts WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /posts/:id - удалить пост
app.delete('/posts/:id', async (req, res) => {
  try {
    const result = await pool.query('DELETE FROM posts WHERE id = $1 RETURNING *', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Post not found' });
    }
    res.json({ message: 'Post deleted', post: result.rows[0] });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Старт сервера
const PORT = process.env.PORT || 4000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log('📚 Endpoints:');
  console.log(`   GET    http://localhost:${PORT}/posts`);
  console.log(`   POST   http://localhost:${PORT}/posts`);
  console.log(`   GET    http://localhost:${PORT}/posts/:id`);
  console.log(`   DELETE http://localhost:${PORT}/posts/:id`);
});