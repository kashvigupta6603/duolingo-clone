# Duolingo Clone

A full-stack clone of the Duolingo web app: learning path, lesson player with 5 exercise types, XP, streaks, hearts, daily goal, leaderboard, profile and achievements. It also adds one original feature, the **Mistakes Vault**.

- **Live app:** https://duolingo-clone-ten-blush.vercel.app
- **API (Swagger docs):** https://duolingo-clone-jwkj.onrender.com/docs
- **Repository:** https://github.com/kashvigupta6603/duolingo-clone

> The backend runs on Render's free plan and sleeps after ~15 minutes of inactivity. The first request can take 30 to 60 seconds. Progress resets to the seeded state when the service restarts (see Assumptions).

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router), TypeScript, plain CSS design system |
| Backend | Python, FastAPI, SQLAlchemy 2.0 |
| Database | SQLite |
| Hosting | Vercel (frontend), Render (backend) |

## Features

**Core**
- Learning path with units and skills: locked, available, in-progress and completed states, progress rings, crowns
- Top bar with streak, gems (mocked), hearts and a Daily Quest XP goal
- Lesson player: multiple choice, translate (word bank), match pairs, fill in the blank, type the answer
- Feedback bar (green/red), animated progress bar, shake on wrong answer, sound effects, text-to-speech on translate questions, keyboard shortcuts (Enter, 1 to 4)
- Hearts: lose one per wrong answer, out-of-hearts modal, lazy regeneration (1 heart per 30 min), refill with gems, or earn one back by practicing
- XP, streak with testable day simulation, daily goal (changeable in Settings), weekly leaderboard, profile with stats and achievements
- Lesson-complete screen with confetti, quit-confirmation modal, toasts
- Responsive layout: desktop sidebar, tablet icon sidebar, mobile bottom bar

**Novelty: Mistakes Vault (spaced repetition)**
Every wrong answer is saved to a vault using **Leitner boxes**. A correct review moves the item up a box (1 to 2 to 3), and a wrong review sends it back to box 1. A correct answer in box 3 marks it **mastered**. Review gaps are short for demo purposes (10 min for box 2, 60 min for box 3). "Practice mistakes" builds a session from only the due items, costs no hearts, and earns one heart back. Mastering 5 items unlocks the "Mistake Master" achievement.

**Placeholders ("Coming soon")**: Guidebook, Super subscription, friends, multiple languages, most Settings rows. Authentication is simplified to a default logged-in learner.

## Architecture

```
duolingo-clone/
├── backend/
│   ├── requirements.txt
│   └── app/
│       ├── database.py   # engine, session, get_db dependency
│       ├── models.py     # SQLAlchemy models (schema)
│       ├── services.py   # business logic: hearts, streak, XP, answer checking, vault, achievements
│       ├── seed.py       # Spanish course + sample learner, generated exercises
│       └── main.py       # FastAPI routes
└── frontend/
    ├── app/              # pages: /learn, /lesson/[id], /practice, /vault, /leaderboard, /profile, /settings
    ├── components/       # Shell, StatsBar, RightPanel, PathNode, UserProvider, Avatar
    │   └── lesson/       # LessonPlayer + one component per exercise type, FeedbackBar, modals
    └── lib/              # api client, shared types, sound helpers
```

Design decisions:
- **Server-side answer checking.** `GET /api/lessons/{id}` never sends answers. The client posts an answer to `POST /api/answer` and the server replies with correctness and the correct solution. Users cannot read answers from the network tab.
- **Separation of concerns.** Routes are thin. All rules (hearts, streaks, XP, vault) live in `services.py`.
- **Lazy heart regeneration.** Hearts are computed from a timestamp on read, so no cron job or background worker is needed.
- **Streak testing.** `users.day_offset` shifts "today" so streaks can be tested without waiting 24 hours (Settings, "Simulate next day").
- **Shared user state** on the frontend lives in one React context (`UserProvider`), so the top bar, daily quest and lesson player always agree.
- **Exercise components share one props contract** (`ExProps`), so adding a new exercise type means adding one component.

## Database schema

SQLite, 12 tables. All learner progress is stored per user.

| Table | Purpose | Key columns |
|---|---|---|
| `users` | Learner profile and gamification state | `xp`, `weekly_xp`, `streak`, `last_active_date`, `hearts`, `hearts_updated_at`, `gems`, `daily_goal`, `day_offset` |
| `courses` | Language course | `language`, `flag` |
| `units` | Section of a course | `course_id` (FK), `order`, `title`, `description`, `color` |
| `skills` | Node on the path | `unit_id` (FK), `order`, `title`, `icon` |
| `lessons` | Lesson inside a skill | `skill_id` (FK), `order` |
| `exercises` | Question in a lesson | `lesson_id` (FK), `order`, `type`, `prompt`, `data` (JSON, visible to client), `answer` (JSON, server only) |
| `skill_progress` | Lessons finished per skill | `user_id` (FK), `skill_id` (FK), `lessons_completed`; unique (user, skill) |
| `lesson_completions` | History of finished lessons | `user_id`, `lesson_id`, `xp_earned`, `mistakes`, `completed_at` |
| `daily_xp` | XP per day, drives the daily goal | `user_id`, `day`, `xp`; unique (user, day) |
| `achievements` | Achievement catalogue | `code` (PK), `title`, `description`, `icon` |
| `user_achievements` | Unlocked achievements | `user_id`, `achievement_code` (FK); unique pair |
| `mistakes` | Mistakes Vault (Leitner boxes) | `user_id`, `exercise_id` (FK), `box`, `times_wrong`, `next_review_at`, `mastered`; unique (user, exercise) |

Relationships: `courses 1-N units 1-N skills 1-N lessons 1-N exercises`. `users` link to content through `skill_progress`, `lesson_completions` and `mistakes`, and to `achievements` through `user_achievements`.

Unlock logic: a skill is `locked` until every earlier skill has all its lessons completed. It is `available` or `in_progress` when it is the next one, and `completed` when `lessons_completed >= total lessons`.

## API overview

All routes are under `/api` and operate on the default learner. Interactive docs: `/docs`.

| Method | Route | Description |
|---|---|---|
| GET | `/` | Health check |
| GET | `/api/me` | Current user: XP, streak, hearts, next heart timer, gems, daily goal |
| GET | `/api/path` | Course, units, skills with lock state and progress |
| GET | `/api/lessons/{id}` | Exercises for a lesson (no answers). 403 `no_hearts` if hearts are 0 |
| POST | `/api/answer` | Check one answer. Wrong answer in lesson mode costs a heart and records a mistake. Practice mode updates the vault |
| POST | `/api/lessons/{id}/complete` | Award XP, update streak and skill progress, unlock achievements |
| POST | `/api/hearts/refill` | Spend 100 gems to refill hearts |
| GET | `/api/leaderboard` | Weekly XP ranking (seeded learners plus you) |
| GET | `/api/profile` | Stats, achievements, vault summary |
| GET | `/api/vault` | All vault items with box, status and due flag |
| GET | `/api/practice/mistakes` | Up to 8 due mistakes as a practice session |
| POST | `/api/practice/complete` | Finish a practice session: +10 XP, +1 heart |
| POST | `/api/settings` | Change daily goal (10, 20, 30 or 50) |
| POST | `/api/dev/next-day` | Simulate the next day (for testing streaks) |

## Setup (local)

Requirements: Node.js 20+, Python 3.10+, Git.

**Backend** (Windows, from the repo root)
```
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --reload
```
On Mac/Linux, activate with `source venv/bin/activate`. The API runs at http://localhost:8000 (docs at `/docs`). The SQLite file `duolingo.db` is created and seeded automatically on first start.

**Frontend** (second terminal)
```
cd frontend
npm install
```
Create `frontend/.env.local`:
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```
Then:
```
npm run dev
```
Open http://localhost:3000.

**Environment variables**

| Variable | Where | Meaning |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | frontend | Base URL of the backend |
| `FRONTEND_ORIGIN` | backend | Allowed CORS origin(s), comma separated (default `*`) |
| `DATABASE_URL` | backend | SQLAlchemy URL (default `sqlite:///./duolingo.db`) |

## Deployment

- **Backend on Render:** Web Service, root directory `backend`, build `pip install -r requirements.txt`, start `uvicorn app.main:app --host 0.0.0.0 --port $PORT`, env `PYTHON_VERSION=3.12.3`.
- **Frontend on Vercel:** root directory `frontend`, env `NEXT_PUBLIC_API_URL` pointing at the Render URL.

## Testing the gamification

1. **Hearts:** answer wrong in a lesson. The heart count drops, and at 0 the out-of-hearts modal appears.
2. **Streak:** More > "Simulate next day", then finish a lesson. The streak goes up by one.
3. **Daily goal:** More > change the goal and watch the Daily Quest card update.
4. **Vault:** make mistakes, open Mistakes Vault, practice them, and watch items move up Leitner boxes.

## Assumptions and limitations

- One seeded course (Spanish) with 2 units, 4 skills, 12 lessons and generated exercises.
- Authentication is simplified: a default learner (id 1) is always logged in.
- SQLite on Render's free plan is ephemeral, so data resets on restart or redeploy and the app reseeds itself. For persistence, attach a disk or switch `DATABASE_URL` to Postgres. The code is SQLAlchemy-based, so no model changes are needed.
- Gems are mocked. Refilling hearts costs 100 gems, and there is no purchase flow.
- The leaderboard uses seeded learners with fixed XP, and weekly XP is not reset on a schedule.
- Flags are drawn with CSS because Windows does not render flag emoji.
- Speech recognition, Super, friends and multiple languages are placeholders.