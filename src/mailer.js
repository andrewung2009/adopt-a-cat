const nodemailer = require('nodemailer');

let transporter = null;

function getTransporter() {
  if (transporter) return transporter;

  const hasSmtp = process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS;

  if (hasSmtp) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    });
  } else {
    transporter = nodemailer.createTransport({ jsonTransport: true });
  }
  return transporter;
}

const FROM = `"Cat Adoption" <${process.env.SMTP_USER || 'noreply@catadoption.local'}>`;

async function sendEmail({ to, subject, text, html }) {
  const info = await getTransporter().sendMail({
    from: FROM,
    to,
    subject,
    text,
    html,
  });
  return info;
}

module.exports = { sendEmail };