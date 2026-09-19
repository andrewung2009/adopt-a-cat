const express = require('express');
const getDb = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

const FEED_TIMEOUT_MS = 30000;
const feedTimers = new Map();

function requireAdmin(req, res, next) {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Not logged in' });
  }
  next();
}

function scheduleUnfeed(catId) {
  if (feedTimers.has(catId)) clearTimeout(feedTimers.get(catId));
  const timer = setTimeout(async () => {
    try {
      const db = await getDb();
      db.prepare("UPDATE cats SET fed_status = 'needs feeding', last_fed_at = NULL WHERE id = ?").run(catId);
      feedTimers.delete(catId);
      console.log(`Cat ${catId} auto-reverted to needs feeding`);
    } catch (err) {
      console.error(`Auto-unfeed failed for cat ${catId}:`, err.message);
    }
  }, FEED_TIMEOUT_MS);
  feedTimers.set(catId, timer);
}

router.post('/cats/:id/feed', requireAuth, requireAdmin, async (req, res) => {
  const db = await getDb();
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const cat = db.prepare('SELECT id, name FROM cats WHERE id = ?').get(Number(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Cat not found' });

  db.prepare("UPDATE cats SET fed_status = 'fed', last_fed_at = datetime('now') WHERE id = ?").run(cat.id);
  scheduleUnfeed(cat.id);
  res.json({ message: `${cat.name} has been fed`, fedStatus: 'fed', revertIn: FEED_TIMEOUT_MS });
});

router.post('/cats/:id/unfeed', requireAuth, requireAdmin, async (req, res) => {
  const db = await getDb();
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const cat = db.prepare('SELECT id, name FROM cats WHERE id = ?').get(Number(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Cat not found' });

  if (feedTimers.has(cat.id)) {
    clearTimeout(feedTimers.get(cat.id));
    feedTimers.delete(cat.id);
  }

  db.prepare("UPDATE cats SET fed_status = 'needs feeding', last_fed_at = NULL WHERE id = ?").run(cat.id);
  res.json({ message: `${cat.name} needs feeding`, fedStatus: 'needs feeding' });
});

router.get('/inquiries', requireAuth, requireAdmin, async (req, res) => {
  const db = await getDb();
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 10));
  const offset = (page - 1) * limit;

  const total = db.prepare('SELECT COUNT(*) AS count FROM adoption_applications').get().count;
  const totalPages = Math.ceil(total / limit);

  const inquiries = db.prepare(`
    SELECT a.*, c.name AS cat_name, u.email AS user_email, u.first_name, u.last_name
    FROM adoption_applications a
    JOIN cats c ON a.cat_id = c.id
    LEFT JOIN users u ON a.user_id = u.id
    ORDER BY a.created_at DESC
    LIMIT ? OFFSET ?
  `).all(limit, offset);

  res.json({ inquiries, page, totalPages, total });
});

router.get('/cats', requireAuth, requireAdmin, async (req, res) => {
  const db = await getDb();
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const cats = db.prepare('SELECT * FROM cats ORDER BY created_at DESC').all();
  res.json({ cats });
});

router.post('/cats/:id/status', requireAuth, requireAdmin, async (req, res) => {
  const db = await getDb();
  const user = db.prepare('SELECT is_admin FROM users WHERE id = ?').get(req.session.userId);
  if (!user || !user.is_admin) {
    return res.status(403).json({ error: 'Admin access required' });
  }

  const { status } = req.body || {};
  const validStatuses = ['available', 'pending', 'adopted'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status must be available, pending, or adopted' });
  }

  const cat = db.prepare('SELECT id, name FROM cats WHERE id = ?').get(Number(req.params.id));
  if (!cat) return res.status(404).json({ error: 'Cat not found' });

  db.prepare('UPDATE cats SET status = ? WHERE id = ?').run(status, cat.id);
  res.json({ message: `${cat.name} status changed to ${status}`, status });
});

module.exports = router;