const express = require('express');
const getDb = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

router.get('/', requireAuth, async (req, res) => {
  const db = await getDb();
  let prefs = db.prepare('SELECT * FROM user_preferences WHERE user_id = ?').get(req.session.userId);
  if (!prefs) {
    prefs = { age_pref: '', personality_pref: '', home_pref: '', location_pref: '' };
  }
  res.json({
    age: prefs.age_pref || '',
    personality: prefs.personality_pref || '',
    home: prefs.home_pref || '',
    location: prefs.location_pref || '',
  });
});

router.put('/', requireAuth, async (req, res) => {
  const { age, personality, home, location } = req.body || {};
  const db = await getDb();

  const existing = db.prepare('SELECT id FROM user_preferences WHERE user_id = ?').get(req.session.userId);

  if (existing) {
    db.prepare(
      `UPDATE user_preferences SET age_pref = ?, personality_pref = ?, home_pref = ?, location_pref = ?, updated_at = datetime('now') WHERE user_id = ?`
    ).run(age || '', personality || '', home || '', location || '', req.session.userId);
  } else {
    db.prepare(
      `INSERT INTO user_preferences (user_id, age_pref, personality_pref, home_pref, location_pref) VALUES (?, ?, ?, ?, ?)`
    ).run(req.session.userId, age || '', personality || '', home || '', location || '');
  }

  res.json({ message: 'Preferences saved' });
});

router.delete('/', requireAuth, async (req, res) => {
  const db = await getDb();
  db.prepare('DELETE FROM user_preferences WHERE user_id = ?').run(req.session.userId);
  res.json({ message: 'Preferences cleared' });
});

module.exports = router;