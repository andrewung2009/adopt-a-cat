const express = require('express');
const getDb = require('../db');

const router = express.Router();

const AGE_OPTIONS = ['kitten', 'young', 'adult', 'senior'];
const PERSONALITY_OPTIONS = ['playful', 'calm', 'shy', 'social', 'independent'];
const HOME_OPTIONS = ['apartment', 'house', 'family', 'any'];

function toApi(row) {
  return {
    id: row.id,
    name: row.name,
    age: row.age,
    personality: row.personality,
    preferredHome: row.preferred_home,
    location: { country: row.location_country, state: row.location_state, city: row.location_city },
    health: row.health,
    photoUrl: row.photo_url,
    status: row.status,
    fedStatus: row.fed_status,
    lastFedAt: row.last_fed_at,
  };
}

router.get('/', async (req, res) => {
  const db = await getDb();
  const { age, personality, home, location } = req.query;

  const clauses = ["status IN ('available', 'pending')"];
  const params = [];

  if (age && AGE_OPTIONS.includes(age)) {
    clauses.push('age = ?');
    params.push(age);
  }
  if (personality && PERSONALITY_OPTIONS.includes(personality)) {
    clauses.push('personality = ?');
    params.push(personality);
  }
  if (home && HOME_OPTIONS.includes(home)) {
    clauses.push('(preferred_home = ? OR preferred_home = \'any\')');
    params.push(home);
  }
  if (location) {
    clauses.push('(location_country = ? OR location_state = ? OR location_city = ?)');
    params.push(location, location, location);
  }

  const rows = db
    .prepare(`SELECT * FROM cats WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC`)
    .all(...params);

  res.json({ cats: rows.map(toApi) });
});

router.get('/options', (req, res) => {
  res.json({ age: AGE_OPTIONS, personality: PERSONALITY_OPTIONS, home: HOME_OPTIONS });
});

router.get('/:id', async (req, res) => {
  const db = await getDb();
  const row = db.prepare('SELECT * FROM cats WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'Cat not found' });
  res.json({ cat: toApi(row) });
});

module.exports = router;