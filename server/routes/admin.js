const express = require('express');
const router = express.Router();
const db = require('../db');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';

// 验证管理员密码
router.post('/login', (req, res) => {
  const { password } = req.body;
  if (password === ADMIN_PASSWORD) {
    res.json({ ok: true });
  } else {
    res.json({ ok: false, msg: '密码错误' });
  }
});

// 获取 SMTP 配置
router.get('/smtp', async (req, res) => {
  const [rows] = await db.query('SELECT * FROM smtp_config ORDER BY id DESC LIMIT 1');
  res.json({ ok: true, data: rows[0] || null });
});

// 保存 SMTP 配置
router.post('/smtp', async (req, res) => {
  const { host, port, secure, user, pass, from_name } = req.body;
  if (!host || !user || !pass) return res.json({ ok: false, msg: '请填写完整配置' });

  const [rows] = await db.query('SELECT id FROM smtp_config LIMIT 1');
  if (rows.length) {
    await db.query(
      'UPDATE smtp_config SET host=?, port=?, secure=?, user=?, pass=?, from_name=? WHERE id=?',
      [host, port || 465, secure ? 1 : 0, user, pass, from_name || '系统通知', rows[0].id]
    );
  } else {
    await db.query(
      'INSERT INTO smtp_config (host, port, secure, user, pass, from_name) VALUES (?,?,?,?,?,?)',
      [host, port || 465, secure ? 1 : 0, user, pass, from_name || '系统通知']
    );
  }
  res.json({ ok: true, msg: '保存成功' });
});

// 测试发送邮件
router.post('/smtp/test', async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ ok: false, msg: '请填写测试邮箱' });
  try {
    const { sendVerifyCode } = require('../mailer');
    await sendVerifyCode(email, '123456', 'register');
    res.json({ ok: true, msg: '测试邮件已发送' });
  } catch (e) {
    res.json({ ok: false, msg: e.message });
  }
});

module.exports = router;
