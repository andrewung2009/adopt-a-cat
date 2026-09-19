const express = require('express');
const getDb = require('../db');
const { requireAuth } = require('./auth');

const router = express.Router();

const PASS_THRESHOLD = 3;

const QUIZ = [
  {
    id: 1,
    question: 'Have you owned or cared for cats before?',
    options: ['Yes, I have cat experience', 'No, this would be my first cat'],
    correctIndex: 0,
  },
  {
    id: 2,
    question: 'Are you prepared for yearly vet visits and vaccinations?',
    options: ['Yes', 'No'],
    correctIndex: 0,
  },
  {
    id: 3,
    question: 'If you had to move, what would you do with the cat?',
    options: ['Find it a new home', 'Take the cat with me', 'Rehome it temporarily'],
    correctIndex: 1,
  },
  {
    id: 4,
    question: 'Are all members of your household comfortable with a cat?',
    options: ['Yes', 'No', 'Not sure'],
    correctIndex: 0,
  },
];

router.get('/questions', requireAuth, (req, res) => {
  res.json({
    questions: QUIZ.map(({ id, question, options }) => ({ id, question, options })),
    passThreshold: PASS_THRESHOLD,
  });
});

router.post('/submit', requireAuth, async (req, res) => {
  const { answers } = req.body || {};
  const db = await getDb();
  if (!Array.isArray(answers) || answers.length !== QUIZ.length) {
    return res.status(400).json({ error: 'Please answer all questions' });
  }

  let score = 0;
  for (let i = 0; i < QUIZ.length; i++) {
    if (Number(answers[i]) === QUIZ[i].correctIndex) score++;
  }

  const hasExperience = Number(answers[0]) === 0;
  const passed = score >= PASS_THRESHOLD && hasExperience;

  db.prepare('UPDATE users SET quiz_score = ? WHERE id = ?').run(score, req.session.userId);

  res.json({ score, passed, passThreshold: PASS_THRESHOLD });
});

module.exports = router;