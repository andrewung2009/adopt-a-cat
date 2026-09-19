# Cat Adoption MVP

A full-stack cat adoption website built with Node.js + Express and `node:sqlite`.

## Features

- **Browse cats** with filters (age, personality, preferred home, location/country)
- **Country flags** — small flag overlay on each cat card
- **Searchable country dropdown** — filter cats by country on gallery and registration
- **Adoption inquiries** — submit name/email/message to claim a cat
- **Confirm password** — client + server validation on registration
- **Authentication** — register/login with email verification, admin account
- **Admin dashboard** — manage inquiries, cat statuses, feed/unfeed cats (30s auto-revert)
- **Donations** — general shelter donation page
- **User preferences** — save filter preferences for faster browsing
- **Claimed badge** — pending cats shown with "Claimed" badge and faded styling

## Tech Stack

- Node.js + Express (backend)
- `node:sqlite` (built-in SQLite database)
- Plain HTML/CSS/JS (frontend)
- `express-session` (auth)
- `bcryptjs` (password hashing)
- `nodemailer` (email via jsonTransport in dev)
- `flagcdn.com` (country flag images)

## Setup

```bash
# Install dependencies
npm install

# Seed the database (run from WSL on Windows)
node seed.js

# Start the server
npm start
```

Then visit **http://localhost:3000** in your browser.

> **Windows users:** The server runs inside WSL. Seed the database from WSL to avoid DB path conflicts:
> ```bash
> wsl bash -c "cd /mnt/c/Users/user/Desktop/opencode-check && node seed.js"
> ```

## Login Credentials

- **Admin:** `admin@shelter.com` / `password123`

## Project Structure

```
├── src/
│   ├── db.js          # SQLite database connection & schema
│   ├── mailer.js      # Nodemailer email service
│   └── routes/
│       ├── auth.js          # Register, login, logout, email verify
│       ├── cats.js          # Cat listing, filters, options
│       ├── applications.js  # Adoption inquiries
│       ├── admin.js         # Admin: feed/unfeed, status change, inquiries
│       ├── preferences.js   # User filter preferences
│       └── donations.js     # Donation handling
├── public/
│   ├── index.html       # Gallery/home page
│   ├── login.html       # Login page
│   ├── register.html    # Registration page with country picker
│   ├── cat.html         # Cat detail page
│   ├── apply.html       # Adoption inquiry form
│   ├── account.html     # User account page
│   ├── donate.html      # Donation page
│   ├── admin.html       # Admin dashboard
│   └── js/
│       ├── api.js           # Fetch wrapper, auth helpers
│       ├── gallery.js       # Gallery filters, country flags, card rendering
│       ├── countries.js     # Country list (195 countries)
│       ├── country-codes.js # Country name to ISO code mapping
│       └── register.js      # Registration form with country picker
├── seed.js              # Database seed script (10 cats, 1 admin user)
└── server.js            # Express entry point
```

## Environment Variables

Copy `.env.example` to `.env` and adjust:

```
PORT=3000
DB_PATH=/tmp/cats.db
SESSION_SECRET=change-me-to-a-long-random-string
SMTP_HOST=smtp.ethereal.email
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
SHELTER_EMAIL=shelter@example.com
APP_URL=http://localhost:3000
```
