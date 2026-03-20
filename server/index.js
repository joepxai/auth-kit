require('dotenv').config({ path: '../.env' });
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// 静态文件
app.use(express.static(path.join(__dirname, '../client')));
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// 路由
app.use('/api/auth', require('./routes/auth'));
app.use('/api/admin', require('./routes/admin'));

// 前端入口
app.get('/', (req, res) => res.sendFile(path.join(__dirname, '../client/index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, '../admin/index.html')));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`auth-kit running on http://localhost:${PORT}`));
