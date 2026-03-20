const nodemailer = require('nodemailer');
const db = require('./db');

async function getTransporter() {
  const [rows] = await db.query('SELECT * FROM smtp_config ORDER BY id DESC LIMIT 1');
  if (!rows.length) throw new Error('未配置 SMTP，请先在管理后台配置邮箱');
  const cfg = rows[0];
  return {
    transporter: nodemailer.createTransport({
      host: cfg.host,
      port: cfg.port,
      secure: !!cfg.secure,
      auth: { user: cfg.user, pass: cfg.pass },
    }),
    from: `"${cfg.from_name}" <${cfg.user}>`,
  };
}

async function sendVerifyCode(email, code, type) {
  const { transporter, from } = await getTransporter();
  const subject = type === 'register' ? '注册验证码' : '登录验证码';
  await transporter.sendMail({
    from,
    to: email,
    subject,
    html: `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:32px;border:1px solid #eee;border-radius:8px">
        <h2 style="margin-top:0">${subject}</h2>
        <p>你的验证码是：</p>
        <div style="font-size:36px;font-weight:bold;letter-spacing:8px;color:#333;margin:16px 0">${code}</div>
        <p style="color:#999;font-size:13px">验证码 5 分钟内有效，请勿泄露给他人。</p>
      </div>
    `,
  });
}

module.exports = { sendVerifyCode };
