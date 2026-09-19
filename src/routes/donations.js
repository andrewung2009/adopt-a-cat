const express = require('express');
const getDb = require('../db');

const router = express.Router();

router.post('/', async (req, res) => {
  const { amount, message } = req.body || {};
  const db = await getDb();

  if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
    return res.status(400).json({ error: 'A valid donation amount is required' });
  }

  const userId = req.session.userId || null;

  db.prepare('INSERT INTO donations (user_id, amount, message) VALUES (?, ?, ?)').run(
    userId,
    Number(amount),
    message || null
  );

  res.status(201).json({ message: 'Thank you for your donation!' });
});

router.get('/total', async (req, res) => {
  const db = await getDb();
  const result = db.prepare('SELECT COALESCE(SUM(amount), 0) AS total FROM donations').get();
  res.json({ total: result.total });
});

module.exports = router;