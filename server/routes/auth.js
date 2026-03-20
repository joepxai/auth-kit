const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { sendVerifyCode } = require('../mailer');

function randomCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// 发送验证码
router.post('/send-code', async (req, res) => {
  const { email, type = 'register' } = req.body;
  if (!email) return res.json({ ok: false, msg: '请填写邮箱' });

  // 注册时检查邮箱是否已存在
  if (type === 'register') {
    const [rows] = await db.query('SELECT id FROM users WHERE email=?', [email]);
    if (rows.length) return res.json({ ok: false, msg: '该邮箱已注册' });
  }

  // 60秒内不重复发送
  const [recent] = await db.query(
    'SELECT id FROM verify_codes WHERE email=? AND type=? AND created_at > DATE_SUB(NOW(), INTERVAL 60 SECOND)',
    [email, type]
  );
  if (recent.length) return res.json({ ok: false, msg: '发送太频繁，请稍后再试' });

  const code = randomCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await db.query('INSERT INTO verify_codes (email, code, type, expires_at) VALUES (?,?,?,?)', [email, code, type, expiresAt]);

  try {
    await sendVerifyCode(email, code, type);
    res.json({ ok: true, msg: '验证码已发送' });
  } catch (e) {
    res.json({ ok: false, msg: '邮件发送失败：' + e.message });
  }
});

// 注册
router.post('/register', async (req, res) => {
  const { email, code, password } = req.body;
  if (!email || !code || !password) return res.json({ ok: false, msg: '参数不完整' });

  const [codes] = await db.query(
    'SELECT * FROM verify_codes WHERE email=? AND code=? AND type="register" AND used=0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [email, code]
  );
  if (!codes.length) return res.json({ ok: false, msg: '验证码无效或已过期' });

  const hash = await bcrypt.hash(password, 10);
  try {
    await db.query('INSERT INTO users (email, password) VALUES (?,?)', [email, hash]);
    await db.query('UPDATE verify_codes SET used=1 WHERE id=?', [codes[0].id]);
    res.json({ ok: true, msg: '注册成功' });
  } catch (e) {
    res.json({ ok: false, msg: '邮箱已存在' });
  }
});

// 登录（密码）
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) return res.json({ ok: false, msg: '参数不完整' });

  const [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
  if (!rows.length) return res.json({ ok: false, msg: '邮箱未注册' });

  const ok = await bcrypt.compare(password, rows[0].password);
  if (!ok) return res.json({ ok: false, msg: '密码错误' });

  const token = jwt.sign({ id: rows[0].id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ ok: true, token, email });
});

// 验证码登录
router.post('/login-code', async (req, res) => {
  const { email, code } = req.body;
  if (!email || !code) return res.json({ ok: false, msg: '参数不完整' });

  const [codes] = await db.query(
    'SELECT * FROM verify_codes WHERE email=? AND code=? AND type="login" AND used=0 AND expires_at > NOW() ORDER BY id DESC LIMIT 1',
    [email, code]
  );
  if (!codes.length) return res.json({ ok: false, msg: '验证码无效或已过期' });

  let [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
  if (!rows.length) {
    await db.query('INSERT INTO users (email) VALUES (?)', [email]);
    [rows] = await db.query('SELECT * FROM users WHERE email=?', [email]);
  }

  await db.query('UPDATE verify_codes SET used=1 WHERE id=?', [codes[0].id]);
  const token = jwt.sign({ id: rows[0].id, email }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.json({ ok: true, token, email });
});

module.exports = router;
