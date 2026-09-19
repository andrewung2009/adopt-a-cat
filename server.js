require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const getDb = require('./src/db');

const authRoutes = require('./src/routes/auth');
const catsRoutes = require('./src/routes/cats');
const quizRoutes = require('./src/routes/quiz');
const applicationRoutes = require('./src/routes/applications');
const preferencesRoutes = require('./src/routes/preferences');
const adminRoutes = require('./src/routes/admin');
const donationsRoutes = require('./src/routes/donations');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'dev-secret-do-not-use-in-prod',
    resave: false,
    saveUninitialized: false,
    cookie: { httpOnly: true, sameSite: 'lax', maxAge: 1000 * 60 * 60 * 24 * 7 },
  })
);

app.use('/api/auth', authRoutes);
app.use('/api/cats', catsRoutes);
app.use('/api/quiz', quizRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/preferences', preferencesRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/donations', donationsRoutes);

app.use(express.static(path.join(__dirname, 'public')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

(async () => {
  await getDb();
  app.listen(PORT, () => {
    console.log(`Cat Adoption MVP running at http://localhost:${PORT}`);
  });
})();