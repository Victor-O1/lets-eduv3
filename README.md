# NixLearn – Full-Stack Study & Productivity Platform

NixLearn is a full-stack web application designed to help students **track focus time**, **organize notes**, and **analyze productivity trends** using real-time data and interactive analytics.

It combines a smart focus timer, subject-based note management, and rich visual dashboards — all secured with authentication and backed by a real database.

---

## 🚀 Features

### ⏱ Smart Focus Timer
- Start, pause, resume, and stop study sessions
- Per-subject time tracking
- No time drift (client-time–based calculation)
- Real-time updates using database subscriptions

### 📊 Advanced Analytics Dashboard
- Daily, weekly, and monthly views
- Total focus time aggregation
- 14-day productivity trend (area chart)
- Subject-wise breakdown (pie & bar charts)
- Hour-of-day productivity pattern
- 30-day consistency heatmap
- Automatic study streak calculation

### 📚 Subject & Notes Management
- Create, edit, and delete subjects
- Color-coded subjects
- Create and organize notes under subjects
- Search notes instantly
- Real-time updates via subscriptions
- Dedicated note editor page

### 🔐 Authentication & Security
- Google OAuth login
- Email magic-link authentication
- JWT-based sessions
- Secure user-scoped data access
- Protected routes with redirects

### 🎨 UI / UX
- Fully responsive layout
- Smooth animations (Framer Motion)
- Dark, distraction-free theme
- Glassmorphism UI with gradients
- Optimized loading & empty states

---

## 🧠 Architecture Overview

- **Frontend**
  - Next.js (App Router)
  - React (client components)
  - Recharts for analytics
  - Tailwind CSS for styling
  - Framer Motion for animations

- **Backend**
  - Supabase (PostgreSQL)
  - Real-time subscriptions
  - Row-level user data isolation

- **Auth**
  - NextAuth.js
  - Google OAuth
  - Email verification via Resend
  - Supabase Adapter

---

## 🗂 Data Model

- **Subjects**
  - id, user_id, name, color, created_at
- **Focus Events**
  - subject_id, type (start/pause/resume/stop)
  - client_time + server timestamp
- **Notes**
  - subject_id, title, content, timestamps

Derived state is computed client-side from immutable event logs.

---

## ⚙️ Key Technical Highlights

- Event-sourced focus tracking (no mutable timers)
- Time-zone safe date aggregation
- Single source of truth via derived state
- Optimistic UI updates
- Real-time sync with Supabase channels
- Zero-drift elapsed time calculation
- Fully memoized analytics pipelines

---

## 🛠 Tech Stack

- **Framework:** Next.js 14
- **Language:** TypeScript
- **Auth:** NextAuth.js
- **Database:** Supabase (PostgreSQL)
- **Charts:** Recharts
- **Styling:** Tailwind CSS
- **Animations:** Framer Motion
- **Email:** Resend

---

## ▶️ Running Locally

```bash
git clone <repo-url>
cd nixlearn
npm install
npm run dev
```

Environment Variables
NEXT_PUBLIC_SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
NEXTAUTH_SECRET=
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
EMAIL_FROM=
RESEND_API_KEY=
