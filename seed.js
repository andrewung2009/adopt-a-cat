require('dotenv').config();
const getDb = require('./src/db');

const cats = [
  { name: 'Mochi', age: 'kitten', personality: 'playful', preferred_home: 'apartment', location_country: 'United States', location_state: 'NY', location_city: 'New York', health: 'Vaccinated, neutered, microchipped', photo_url: 'https://thumbs.dreamstime.com/b/closeup-square-portrait-calico-cat-9900445.jpg', status: 'available', fed_status: 'needs feeding' },
  { name: 'Nori', age: 'young', personality: 'social', preferred_home: 'house', location_country: 'United States', location_state: 'CA', location_city: 'Los Angeles', health: 'Vaccinated, healthy', photo_url: 'https://thumbs.dreamstime.com/b/cute-cat-portrait-square-photo-beautiful-white-closeup-105311158.jpg', status: 'available', fed_status: 'needs feeding' },
  { name: 'Basil', age: 'adult', personality: 'calm', preferred_home: 'apartment', location_country: 'United States', location_state: 'NY', location_city: 'New York', health: 'Vaccinated, slight dental care needed', photo_url: 'https://thumbs.dreamstime.com/b/cat-eyes-37694597.jpg', status: 'available', fed_status: 'needs feeding' },
  { name: 'Suki', age: 'senior', personality: 'calm', preferred_home: 'any', location_country: 'Canada', location_state: 'BC', location_city: 'Vancouver', health: 'Vaccinated, on a special diet', photo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSCf063GbMvnFFKa-C4R9TzI6X2oCONFQCWKCrUyu6CK18Ss3oWMAGASlY&s=10', status: 'available', fed_status: 'needs feeding' },
  { name: 'Taro', age: 'young', personality: 'shy', preferred_home: 'house', location_country: 'United States', location_state: 'TX', location_city: 'Austin', health: 'Vaccinated, neutered, healthy', photo_url: 'https://as2.ftcdn.net/jpg/02/59/67/91/1000_F_259679106_07rIk3YcWSD5YzkuMheBtr4mE3vk6MHx.jpg', status: 'available', fed_status: 'needs feeding' },
  { name: 'Poppy', age: 'kitten', personality: 'independent', preferred_home: 'family', location_country: 'United States', location_state: 'IL', location_city: 'Chicago', health: 'First vaccination done, dewormed', photo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSQYedLIF_xw7F7arXtpmpXf1Q6QXp6rVp0fYQ1yBAXuSGSXJscEFjU2ZrF&s=10', status: 'available', fed_status: 'needs feeding' },
  { name: 'Clementine', age: 'adult', personality: 'social', preferred_home: 'family', location_country: 'Canada', location_state: 'ON', location_city: 'Toronto', health: 'Vaccinated, spayed, healthy', photo_url: 'https://as1.ftcdn.net/jpg/01/63/11/70/1000_F_163117064_syJkTuCddASYjvl4WqyRmnuy8cDXpoQY.jpg', status: 'available', fed_status: 'needs feeding' },
  { name: 'George', age: 'adult', personality: 'independent', preferred_home: 'house', location_country: 'United States', location_state: 'WA', location_city: 'Seattle', health: 'Vaccinated, neutered, mild FIV (indoor cat)', photo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSTQVtyoMkm91EE59v_KZe2v51Lc5VvZCXTZdnr9_z3IkWsOj3bZ7VK40I&s=10', status: 'available', fed_status: 'needs feeding' },
  { name: 'Hana', age: 'young', personality: 'playful', preferred_home: 'apartment', location_country: 'Japan', location_state: '', location_city: 'Tokyo', health: 'Vaccinated, spayed, healthy', photo_url: 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQ3zySNfjeHSW8jz9d3PkMLlwPhKugPQv6zaZTmjXQ2w7fUctUg72rJk9s&s=10', status: 'available', fed_status: 'needs feeding' },
  { name: 'Ollie', age: 'senior', personality: 'shy', preferred_home: 'house', location_country: 'United States', location_state: 'FL', location_city: 'Miami', health: 'Vaccinated, needs medication for thyroid', photo_url: 'https://d2ph5fj80uercy.cloudfront.net/04/cat2972.jpg', status: 'available', fed_status: 'needs feeding' },
];

async function seed() {
  const db = await getDb();

  db.exec(`PRAGMA foreign_keys=OFF; DROP TABLE IF EXISTS adoption_applications; DROP TABLE IF EXISTS email_verifications; DROP TABLE IF EXISTS donations; DROP TABLE IF EXISTS user_preferences; DROP TABLE IF EXISTS cats; DROP TABLE IF EXISTS users;`);

  db.exec(`CREATE TABLE users (id INTEGER PRIMARY KEY AUTOINCREMENT, email TEXT NOT NULL UNIQUE, password_hash TEXT NOT NULL, first_name TEXT NOT NULL, last_name TEXT NOT NULL, phone TEXT NOT NULL, location_country TEXT, location_state TEXT, location_city TEXT, has_cat_experience INTEGER NOT NULL DEFAULT 0, is_admin INTEGER NOT NULL DEFAULT 0, quiz_score INTEGER, email_verified_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`);
  db.exec(`CREATE TABLE cats (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT NOT NULL, age TEXT NOT NULL, personality TEXT NOT NULL, preferred_home TEXT NOT NULL, location_country TEXT, location_state TEXT, location_city TEXT, health TEXT NOT NULL, photo_url TEXT, status TEXT NOT NULL DEFAULT 'available', fed_status TEXT NOT NULL DEFAULT 'needs feeding', last_fed_at TEXT, created_at TEXT NOT NULL DEFAULT (datetime('now')));`);

  const insert = db.prepare(
    `INSERT INTO cats (name, age, personality, preferred_home, location_country, location_state, location_city, health, photo_url, status, fed_status)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  for (const c of cats) insert.run(c.name, c.age, c.personality, c.preferred_home, c.location_country, c.location_state, c.location_city, c.health, c.photo_url, c.status, c.fed_status || 'needs feeding');

  const insertUser = db.prepare(
    `INSERT INTO users (email, password_hash, first_name, last_name, phone, location_country, location_state, location_city, has_cat_experience, is_admin, email_verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );
  insertUser.run(
    'admin@shelter.com',
    '$2a$10$tVOLcu6j.Z9EiZ2akliBwOwZVauuLIfatzyNM52s9D7qIhICMtPCS',
    'Shelter',
    'Admin',
    '+1 555 0200',
    'US',
    'NY',
    'New York',
    1,
    1,
    new Date().toISOString()
  );

  console.log(`Seeded ${cats.length} cats and 1 admin user.`);
  console.log('Admin login: admin@shelter.com / password123');
}

seed().catch((err) => { console.error(err); process.exit(1); });