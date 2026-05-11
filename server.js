// ─── ENV SETUP ───────────────────────────────────────────────
const PORT     = process.env.PORT     || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ─── IMPORTS ─────────────────────────────────────────────────
const express = require('express');
const app     = express();

// ─── IN-MEMORY DATA STORE ────────────────────────────────────
let posts = [
  { id: 1, title: 'Getting Started with Node.js',  body: 'Node.js is a JavaScript runtime built on Chrome V8 engine.',          author: 'John Doe',  likes: 12, createdAt: new Date('2026-01-15').toISOString() },
  { id: 2, title: 'Express.js Best Practices',     body: 'Express is a minimal and flexible Node.js web application framework.', author: 'Jane Smith', likes: 8,  createdAt: new Date('2026-01-20').toISOString() },
  { id: 3, title: 'Building RESTful APIs',          body: 'REST APIs use HTTP methods to perform CRUD operations on resources.',  author: 'John Doe',  likes: 21, createdAt: new Date('2026-02-01').toISOString() },
];

let comments = [
  { id: 1, postId: 1, name: 'Alice', email: 'alice@example.com', body: 'Great introduction!',       createdAt: new Date().toISOString() },
  { id: 2, postId: 1, name: 'Bob',   email: 'bob@example.com',   body: 'Very helpful, thank you!', createdAt: new Date().toISOString() },
  { id: 3, postId: 2, name: 'Carol', email: 'carol@example.com', body: 'Learned a lot from this.', createdAt: new Date().toISOString() },
];

let users = [
  { id: 1, name: 'John Doe',   email: 'john@example.com',  createdAt: new Date('2026-01-01').toISOString() },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com',  createdAt: new Date('2026-01-05').toISOString() },
  { id: 3, name: 'Alice Wang', email: 'alice@example.com', createdAt: new Date('2026-01-10').toISOString() },
];

let nextPostId = 4, nextCommentId = 4, nextUserId = 4;

// ─── MIDDLEWARE ───────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Logger middleware
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.originalUrl} ${res.statusCode} - ${ms}ms`);
  });
  next();
});

// ─── VALIDATION HELPERS ──────────────────────────────────────
const validatePost = (req, res, next) => {
  const { title, body, author } = req.body;
  if (!title?.trim())  return res.status(400).json({ error: 'Title is required' });
  if (!body?.trim())   return res.status(400).json({ error: 'Body is required' });
  if (!author?.trim()) return res.status(400).json({ error: 'Author is required' });
  next();
};

const validateUser = (req, res, next) => {
  const { name, email } = req.body;
  if (!name?.trim())  return res.status(400).json({ error: 'Name is required' });
  if (!email?.trim()) return res.status(400).json({ error: 'Email is required' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Valid email is required' });
  next();
};

// ─── GENERAL ROUTES ──────────────────────────────────────────
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to CommunityHub API!',
    version: '1.0.0',
    endpoints: { posts: '/api/posts', users: '/api/users', health: '/api/health', about: '/about', time: '/api/time' },
  });
});

app.get('/about', (req, res) => {
  res.json({ name: 'CommunityHub API', description: 'A RESTful API for the CommunityHub platform', author: 'chesemchanel', week: 'Week 10 - Backend Basics' });
});

app.get('/api/time', (req, res) => {
  res.json({ currentTime: new Date().toISOString(), timestamp: Date.now() });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', uptime: process.uptime(), timestamp: new Date().toISOString() });
});

// ─── POSTS ROUTES ────────────────────────────────────────────

// GET /api/posts - Get all posts with search, filter, sort, pagination
app.get('/api/posts', (req, res) => {
  let result = [...posts];

  if (req.query.author) result = result.filter(p => p.author.toLowerCase().includes(req.query.author.toLowerCase()));
  if (req.query.search) result = result.filter(p => p.title.toLowerCase().includes(req.query.search.toLowerCase()));
  if (req.query.sort === 'newest') result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  if (req.query.sort === 'oldest') result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  if (req.query.sort === 'likes')  result.sort((a, b) => b.likes - a.likes);

  const page  = parseInt(req.query.page)  || 1;
  const limit = parseInt(req.query.limit) || 10;
  const start = (page - 1) * limit;

  res.json({ success: true, total: result.length, page, limit, pages: Math.ceil(result.length / limit), data: result.slice(start, start + limit) });
});

// GET /api/posts/:id
app.get('/api/posts/:id', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  res.json({ success: true, data: post });
});

// POST /api/posts
app.post('/api/posts', validatePost, (req, res) => {
  const { title, body, author } = req.body;
  const newPost = { id: nextPostId++, title, body, author, likes: 0, createdAt: new Date().toISOString() };
  posts.push(newPost);
  res.status(201).json({ success: true, data: newPost });
});

// PUT /api/posts/:id
app.put('/api/posts/:id', (req, res) => {
  const i = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Post not found' });
  posts[i] = { ...posts[i], ...req.body, id: posts[i].id };
  res.json({ success: true, data: posts[i] });
});

// DELETE /api/posts/:id
app.delete('/api/posts/:id', (req, res) => {
  const i = posts.findIndex(p => p.id === parseInt(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Post not found' });
  posts.splice(i, 1);
  res.json({ success: true, message: 'Post deleted successfully' });
});

// PATCH /api/posts/:id/like
app.patch('/api/posts/:id/like', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  post.likes++;
  res.json({ success: true, data: post });
});

// GET /api/posts/:id/comments
app.get('/api/posts/:id/comments', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const postComments = comments.filter(c => c.postId === parseInt(req.params.id));
  res.json({ success: true, total: postComments.length, data: postComments });
});

// POST /api/posts/:id/comments
app.post('/api/posts/:id/comments', (req, res) => {
  const post = posts.find(p => p.id === parseInt(req.params.id));
  if (!post) return res.status(404).json({ error: 'Post not found' });
  const { name, email, body } = req.body;
  if (!name || !body) return res.status(400).json({ error: 'Name and body are required' });
  const newComment = { id: nextCommentId++, postId: parseInt(req.params.id), name, email, body, createdAt: new Date().toISOString() };
  comments.push(newComment);
  res.status(201).json({ success: true, data: newComment });
});

// DELETE /api/posts/:id/comments/:commentId
app.delete('/api/posts/:id/comments/:commentId', (req, res) => {
  const i = comments.findIndex(c => c.id === parseInt(req.params.commentId) && c.postId === parseInt(req.params.id));
  if (i === -1) return res.status(404).json({ error: 'Comment not found' });
  comments.splice(i, 1);
  res.json({ success: true, message: 'Comment deleted successfully' });
});

// ─── USERS ROUTES ────────────────────────────────────────────

// GET /api/users
app.get('/api/users', (req, res) => {
  res.json({ success: true, total: users.length, data: users });
});

// GET /api/users/:id
app.get('/api/users/:id', (req, res) => {
  const user = users.find(u => u.id === parseInt(req.params.id));
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json({ success: true, data: user });
});

// POST /api/users
app.post('/api/users', validateUser, (req, res) => {
  const { name, email } = req.body;
  if (users.find(u => u.email === email)) return res.status(400).json({ error: 'Email already exists' });
  const newUser = { id: nextUserId++, name, email, createdAt: new Date().toISOString() };
  users.push(newUser);
  res.status(201).json({ success: true, data: newUser });
});

// ─── 404 & ERROR HANDLER ─────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found', path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
});

// ─── START SERVER ─────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🌐 Visit: http://localhost:${PORT}`);
  console.log(`📍 Environment: ${NODE_ENV}`);
});
