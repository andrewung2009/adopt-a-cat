# Cat Adoption Website — Development Plan (MVP)

Based on `PLAN.md` and clarified requirements.

## 1. Overview

A prototype/MVP cat adoption website where visitors can browse cats, filter by
age / personality / preferred home / location, and send an adoption inquiry.
Adopters create an account and submit a simple inquiry form (name, email,
message). The shelter receives inquiries by email.

## 2. Goals & Non-Goals

### Goals (MVP)
- Browse cats with a filter bar (Age, Personality, Preferred Home, Location).
- Cat detail view showing health info and a phone number.
- Adopter registration + login with email verification.
- "Adopt Cat Now" flow: simplified inquiry form (name, email, message) + email to shelter.
- Persist user preferences (favorite filters) for future recommendations.
- Seed data so the site runs out of the box.
- Collect an adoption inquiry for one cat
- Collect a donation to the shelter
- Mark a cat as fed and show its current status
- Submit one adoption inquiry with valid mock details. Check whether the cat changes from Available to Under Review
- Feed one cat. Wait 30 seconds. Refresh the page. Check whether the cat changes from Fed to Hungry and the control changes back to Feed.

### Non-Goals (deferred / stretch)
- "Recommended for You" tab (stretch goal).
- Admin screen for managing cats (stretch goal).
- Payment / adoption fees.
- Image uploads (use URLs/seed images for MVP).
- Production email deliverability (dev uses a test SMTP).

## 3. Tech Stack (Minimal JS)

- **Frontend:** Plain HTML / CSS / vanilla JS served as static files.
- **Backend:** Node.js + Express.
- **Database:** SQLite via `node:sqlite` (built-in, zero setup).
- **Auth:** `express-session` with cookie sessions; `bcrypt` password hashing.
- **Email:** `nodemailer` — Ethereal test account in dev, SMTP env vars for prod.
- **Validation:** basic server-side validation + HTML5 client-side checks.

## 4. Architecture

```
Browser (HTML/CSS/JS)
        |
        |  REST JSON API
        v
Express server
  - /api/auth         register, login, logout, verify-email
  - /api/cats         list (with filters), get one
  - /api/quiz         submit questionnaire
  - /api/applications submit adoption application
  - /api/preferences  get, save, clear filter preferences
  - /api/donations    record a shelter donation
  - /api/admin        mark cat as fed (admin-only)
        |
        v
SQLite DB (node:sqlite)
  users, user_preferences, cats, adoption_applications,
  email_verifications, donations
        |
nodemailer -> email verification + application notification
```

## 5. Data Model

### users
| column | type | notes |
|---|---|---|
| id | integer PK | |
| email | text UNIQUE | |
| password_hash | text | bcrypt |
| first_name / last_name | text | |
| phone | text | shelter contact number |
| location_country / _state / _city | text | |
| email_verified_at | datetime nullable | verified => can apply |
| quiz_score | integer nullable | passing score => can apply |
| has_cat_experience | boolean | "not a first-timer" check |
| is_admin | boolean | shelter staff (can mark cats as fed) |
| created_at | datetime | |

### user_preferences
| column | type | notes |
|---|---|---|
| id | integer PK | |
| user_id | FK users | |
| age_pref | text | saved filter |
| personality_pref | text | saved filter |
| home_pref | text | saved filter |
| location_pref | text | saved filter |
| updated_at | datetime | |

### cats
| column | type | notes |
|---|---|---|
| id | integer PK | |
| name | text | |
| age | text (e.g. kitten/adult/senior) | filterable |
| personality | text (e.g. playful/calm/shy) | filterable |
| preferred_home | text (e.g. apartment/house/family) | filterable |
| location_country / _state / _city | text | filterable |
| health | text | vaccinations, neutered, notes |
| photo_url | text | |
| status | text (available / pending / adopted) | |
| fed_status | text (fed / needs feeding) | default "needs feeding" |
| last_fed_at | datetime nullable | set when marked fed |
| created_at | datetime | |

### adoption_applications
| column | type | notes |
|---|---|---|
| id | integer PK | |
| user_id | FK users | |
| cat_id | FK cats | |
| message | text | |
| status | text (submitted / approved / rejected) | |
| created_at | datetime | |

### email_verifications
| column | type | notes |
|---|---|---|
| id | integer PK | |
| user_id | FK users | |
| token | text UNIQUE | random, expiring |
| expires_at | datetime | |
| verified_at | datetime nullable | |

### donations
| column | type | notes |
|---|---|---|
| id | integer PK | |
| user_id | integer nullable FK users | null = anonymous |
| amount | real | donation amount |
| message | text nullable | optional note |
| created_at | datetime | |

## 6. Pages & Features (Presentation)

1. **Home / Gallery** — hero, filter bar (Age, Personality, Preferred Home,
   Location), grid of cat cards (photo, name, age, personality). Filters
   update the grid via API without a page reload.
2. **Cat Detail** — photo, age, personality, preferred home, location,
   **health info**, shelter **phone number**, and "Adopt Cat Now" button.
3. **Login / Register** — email + password; register captures basic profile
   and location. "Not a first-time cat owner" checkbox/field on register.
4. **Verify Email** — landing page confirming verification, link to login.
5. **Adopt Cat Now** — simplified flow: (a) login required, (b) inquiry form
   with name + email pre-filled from account, message textarea, (c) email
   to shelter. No quiz required.
6. **Account** — show saved preferences; (stretch) "Recommended for You" tab.
7. **Donation** — simple form: amount + optional message. General shelter
   donation (not cat-specific). Shows thank-you on submit.
8. **Cat Detail (updated)** — displays fed status. Admin users see a
   "Mark as fed" button.

## 7. Business Rules (Logic)

1. **Adoption must be easy** — simplified inquiry form, minimal fields, forgiving validation.
2. **Login required** — user must be logged in to submit an inquiry. Form pre-fills name/email from account.
3. **Animal lover check** — deferred to a future phase. Currently removed
   from the adoption flow.
4. **Not a first-timer** — deferred to a future phase. Currently removed
   from the adoption flow.
5. **Notifications** — on inquiry submission, email the shelter (configurable
   address) with inquirer name, contact, cat, and message so a human can follow up.
6. **Cat availability** — only `status = available` cats show "Adopt Cat Now".
   On inquiry submission, cat status changes to "pending" (under review).
7. **Donations are general** — not tied to a specific cat.
8. **Fed status is admin-only** — only shelter staff (admin users) can mark
   a cat as fed. Fed status auto-reverts to "needs feeding" after 30 seconds.

## 8. Questionnaire (quiz) — DEFERRED

**Note:** The questionnaire was removed from the adoption flow in favor of a
simplified inquiry form. This section is kept for reference if the feature is
reinstated in a future phase.

4 short questions, scored, pass = 3/4:
1. Have you owned or cared for cats before? (required yes)
2. Are you prepared for yearly vet visits / vaccinations? (yes/no)
3. What will you do if you must move? (options incl. "take the cat with me")
4. Are all household members comfortable with a cat? (yes/no)

Stored on `users.quiz_score`; the quiz can be retaken. Passing is required to
submit an application.

## 9. Email Flows

- **Verification:** on register, generate token -> send "Confirm your email"
  link `GET /api/auth/verify-email?token=...`.
- **Application:** on successful application submission, email shelter with
  applicant name, contact, cat, and application message.
- **Dev:** `nodemailer` Ethereal test inbox; env vars `SMTP_HOST`, `SMTP_PORT`,
  `SMTP_USER`, `SMTP_PASS`, `SHELTER_EMAIL`.

## 10. Milestones

| Phase | Scope | Done when |
|---|---|---|
| 0 | Scaffold: Express server, static frontend, SQLite init, env config | server starts, health check responds |
| 1 | DB schema + seed data (8-10 cats, sample users, preferences) | tables created, seed script works |
| 2 | Auth: register, login, logout, session, email verification | verified user can be created end-to-end |
| 3 | Browse: `/api/cats` with filters, gallery + detail pages | filters filter, detail shows health + phone |
| 4 | Adopt flow: simplified inquiry form (name, email, message) + email to shelter | inquiry reaches shelter inbox |
| 5 | Account: persist favorite filters from last browse session | preferences saved to `user_preferences` |
| 5b | Cat fed status (admin-only): mark as fed, show on detail page | admin can mark, status persists |
| 5c | Donation: general shelter donation form + record | donation saved, thank-you shown |
| 5d | Cat status on inquiry: status changes to "pending" when inquiry submitted | status persists, shown on detail |
| 5e | Fed timer: fed status auto-reverts to "needs feeding" after 30 seconds | timer works, page reflects change |
| 6 (stretch) | "Recommended for You" tab using saved preferences | tab shows matching cats |
| 7 (stretch) | Admin screen to add/edit cats | cats manageable via UI |

## 11. Out of Scope (for now)

- Multi-shelter / multi-tenant.
- Mobile apps.
- Production email/SMTP setup.