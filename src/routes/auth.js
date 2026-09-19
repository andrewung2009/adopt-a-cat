const express = require('express');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');
const getDb = require('../db');
const { sendEmail } = require('../mailer');

const router = express.Router();

function publicUser(row) {
  return {
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    phone: row.phone,
    location: {
      country: row.location_country,
      state: row.location_state,
      city: row.location_city,
    },
    hasCatExperience: !!row.has_cat_experience,
    isAdmin: !!row.is_admin,
    quizScore: row.quiz_score,
    emailVerified: !!row.email_verified_at,
  };
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function requireAuth(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

function requireVerified(req, res, next) {
  if (!req.session.verified) {
    return res.status(403).json({ error: 'Please verify your email first' });
  }
  next();
}

router.post('/register', async (req, res) => {
  const { email, password, firstName, lastName, phone, country, state, city, hasCatExperience } = req.body || {};
  const db = await getDb();

  if (!email || !EMAIL_RE.test(email)) return res.status(400).json({ error: 'A valid email is required' });
  if (!password || password.length < 8) return res.status(400).json({ error: 'Password must be at least 8 characters' });
  if (password !== req.body.confirmPassword) return res.status(400).json({ error: 'Passwords do not match' });
  if (!firstName || !lastName) return res.status(400).json({ error: 'Name is required' });

  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (existing) return res.status(409).json({ error: 'An account with that email already exists' });

  const hash = await bcrypt.hash(password, 10);
  const token = crypto.randomBytes(24).toString('hex');
  const expires = new Date(Date.now() + 1000 * 60 * 60 * 24).toISOString();

  const result = db
    .prepare(
      `INSERT INTO users
       (email, password_hash, first_name, last_name, phone, location_country, location_state, location_city, has_cat_experience)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      email.toLowerCase(),
      hash,
      firstName,
      lastName,
      phone || '',
      country || null,
      state || null,
      city || null,
      hasCatExperience ? 1 : 0
    );

  const userId = result.lastInsertRowid;

  db.prepare('INSERT INTO email_verifications (user_id, token, expires_at) VALUES (?, ?, ?)').run(userId, token, expires);

  const verifyUrl = `${process.env.APP_URL || 'http://localhost:3000'}/api/auth/verify-email?token=${token}`;
  try {
    await sendEmail({
      to: email,
      subject: 'Confirm your email',
      text: `Welcome! Please confirm your email to adopt a cat: ${verifyUrl}`,
      html: `<p>Welcome! Please confirm your email to adopt a cat:</p><p><a href="${verifyUrl}">${verifyUrl}</a></p>`,
    });
  } catch (err) {
    console.error('Email send failed:', err.message);
  }

  res.status(201).json({ message: 'Account created. Check your email to verify.' });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body || {};
  const db = await getDb();
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(String(email || '').toLowerCase());
  if (!row || !bcrypt.compareSync(String(password || ''), row.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  req.session.userId = row.id;
  req.session.verified = !!row.email_verified_at;
  res.json({ user: publicUser(row) });
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.json({ message: 'Logged out' }));
});

router.get('/me', async (req, res) => {
  if (!req.session.userId) return res.status(401).json({ error: 'Not logged in' });
  const db = await getDb();
  const row = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!row) return res.status(401).json({ error: 'Not logged in' });
  res.json({ user: publicUser(row) });
});

router.get('/verify-email', async (req, res) => {
  const { token } = req.query;
  const db = await getDb();
  const verification = db.prepare('SELECT * FROM email_verifications WHERE token = ?').get(token || '');
  if (!verification) return res.status(400).send('Invalid or expired verification link.');
  if (new Date(verification.expires_at) < new Date()) return res.status(400).send('This verification link has expired.');

  db.prepare("UPDATE email_verifications SET verified_at = datetime('now') WHERE id = ?").run(verification.id);
  db.prepare("UPDATE users SET email_verified_at = datetime('now') WHERE id = ?").run(verification.user_id);

  if (req.session.userId === verification.user_id) req.session.verified = true;
  res.send('<h1>Email verified!</h1><p>You can now <a href="/login.html">log in</a> and adopt a cat.</p>');
});

module.exports = router;
module.exports.requireAuth = requireAuth;
module.exports.requireVerified = requireVerified;