const express = require('express');
const getDb = require('../db');
const { requireAuth } = require('./auth');
const { sendEmail } = require('../mailer');

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  const { catId, name, email, message } = req.body || {};
  const db = await getDb();

  const cat = db.prepare('SELECT * FROM cats WHERE id = ?').get(Number(catId));
  if (!cat) return res.status(404).json({ error: 'Cat not found' });
  if (cat.status !== 'available') return res.status(400).json({ error: 'This cat is no longer available' });

  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  if (!email || !email.trim()) return res.status(400).json({ error: 'Email is required' });

  db.prepare('INSERT INTO adoption_applications (user_id, cat_id, message) VALUES (?, ?, ?)').run(
    req.session.userId, cat.id, message || ''
  );

  db.prepare("UPDATE cats SET status = 'pending' WHERE id = ?").run(cat.id);

  try {
    const shelterEmail = process.env.SHELTER_EMAIL || 'shelter@example.com';
    await sendEmail({
      to: shelterEmail,
      subject: `Adoption inquiry for ${cat.name}`,
      text: [
        `Name: ${name.trim()}`,
        `Email: ${email.trim()}`,
        `Cat: ${cat.name} (id ${cat.id})`,
        `Message: ${message || 'n/a'}`,
      ].join('\n'),
      html: `<p><b>${name.trim()}</b> inquired about adopting <b>${cat.name}</b>.</p>
        <p>Email: ${email.trim()}</p>
        <p><b>Message:</b> ${message || 'n/a'}</p>`,
    });
  } catch (err) {
    console.error('Inquiry email failed:', err.message);
  }

  res.status(201).json({ message: 'Inquiry submitted' });
});

module.exports = router;