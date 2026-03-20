# 🗿 Social Sticky Notes — Built Different.

> **The ultimate gamified productivity engine for the elite. Plan, Study, and Conquer together.**

Social Sticky Notes isn't just a todo app—it's a high-performance productivity ecosystem designed for Gen Z / Chad aesthetics. Transform your daily grind into a legendary saga with real-time collaboration, AI motivation, and a deep gamification layer that rewards consistency.

---

## ✨ Premium Features

### 👑 The Aura System (Gamification)
- **Aura Points**: Earn Aura for every mission (task) accomplished.
- **Tiers & Progression**: Rise from *Unranked* to *Legendary* across 10+ tiers.
- **Daily Rituals**: Claim daily Aura rewards to maintain your streak.
- **Aura Ring & Surge**: Visual feedback loops including the "Aura Ripple" and "Energy Surge" effects on milestone completion.

### 🧘 Focus Mode (Deep Work)
- **Zen Interface**: A stripped-back, distraction-free environment for deep work.
- **Dynamic Timers**: Integrated Pomodoro-style cycles with ambient focus sounds.
- **Mobile-First UX**: Optimized for one-handed operation during intense study sessions.

### 👥 Study Circles (Tactical Collaboration)
- **Real-Time Kanban**: Drag-and-drop tasks across shared group columns.
- **Live Chat**: Socket.io-powered communication with typing indicators and instant task updates.
- **Member Ejection**: Full control over your circle's roster for admins.

### 📱 Superior Mobile UX
- **Bottom-Sheet Modals**: Interactive elements move to the bottom for effortless thumb-reach.
- **Body-Scroll Locking**: Zero background jitter—smooth, single-container scrolling.
- **Premium Toasts**: Non-blocking, beautiful notifications for every tactical event.

---

## 🚀 Technical Stack

| Layer | Technology | Purpose |
| :--- | :--- | :--- |
| **Frontend** | React 18 + Hooks | Dynamic UI & State |
| **Backend** | Express.js (Node serverless) | API Orchestration |
| **Real-time** | Socket.io | Live synchronization |
| **Database** | MongoDB + Mongoose | Scalable persistence |
| **Styling** | Vanilla CSS (Premium Tokens) | HSL color systems & Glassmorphism |
| **Auth** | JWT + Bcrypt | Secure, tiered access |

---

## 📁 Monorepo Structure

```bash
social-sticky/
├── api/                # Vercel Serverless Function Bridge
├── backend/            # Express.js Core Logic & Controllers
├── frontend/           # React SPA (Tailored for Mobile)
├── package.json        # Root workspace configuration
└── vercel.json         # Advanced monorepo routing config
```

---

## 🚀 Split Hosting (Railway + Vercel)

This project is optimized for a split-hosting architecture to ensure 100% stability for real-time features.

### 1. Backend (Deployment on Railway)
Railway provides persistent server support, which is critical for **Socket.io**.
- **Root Directory**: `backend/`
- **Environment Variables**:
  - `MONGODB_URI`: Your MongoDB connection string.
  - `JWT_SECRET`: A secure random string for tokens.
  - `CLIENT_URL`: The URL of your Vercel deployment (e.g., `https://your-app.vercel.app`).
- **Build Command**: `npm install`
- **Start Command**: `npm start`

### 2. Frontend (Deployment on Vercel)
Vercel handles the React static build and global distribution.
- **Root Directory**: `frontend/`
- **Environment Variables**:
  - `REACT_APP_API_URL`: The URL of your Railway deployment (e.g., `https://backend-production.up.railway.app`).
- **Build Command**: `npm run build`
- **Output Directory**: `build`

---

## ⚙️ Tactical Setup (Local)

### 1. Clone & Install
```bash
# Install everything (Monorepo root)
npm run install-all
```

### 2. Configure Environment Variables

- 🎨 **Sticky note aesthetic** — colourful note cards with pin icons, slight rotations and shadows
- 📊 **XP gamification** — earn 10 XP per completed task, progress bar on dashboard
- ⚡ **Real-time chat** — Socket.io group chat with typing indicators
- 👑 **Admin God Mode** — full platform monitoring in a sleek dark dashboard
- 🔑 **Password reset via email** — Nodemailer integration
- 📬 **Friend request system** — send, accept, decline
- 🔒 **JWT auth** — protected routes with middleware
