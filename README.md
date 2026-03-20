# 🗿 Social Sticky Notes — Built Different.

> **The ultimate gamified productivity engine for the elite. Plan, Study, and Conquer together.**

Social Sticky Notes is a high-performance MERN ecosystem optimized for modern cloud hosting.

---

## 🚀 Deployment (Render + Vercel)

This project is configured for **Render** (Backend) and **Vercel** (Frontend).

### 1. Backend (Deployment on Render)
- **URL**: `https://social-sticky.onrender.com`
- **Build Command**: `npm install`
- **Start Command**: `node server.js`
- **Environment Variables**:
  - `MONGODB_URI`: Your MongoDB connection string.
  - `JWT_SECRET`: A secure random string for tokens.
  - `CLIENT_URL`: `https://your-app.vercel.app` (Add your Vercel domain).

### 2. Frontend (Deployment on Vercel)
- **URL**: `https://social-sticky-9ufutftzc-alok-vermas-projects-2b98bf26.vercel.app`
- **Build Command**: `npm run build`
- **Output Directory**: `build`
- **Environment Variables**:
  - `REACT_APP_API_URL`: `https://social-sticky.onrender.com/api`

---

## ✨ Features
- **Aura System**: Earn Aura and move up 10+ tiers from Unranked to Legendary.
- **Focus Mode**: A Zen-like environment for deep study.
- **Study Circles**: Real-time Kanban boards and chat for group tactical work.
- **Mobile-First**: Fully responsive with professional bottom-sheet modals.

---

## 🛡️ Setup (Local)
1. Run `npm run install-all` in the root.
2. Add your `.env` in `backend/`.
3. Start both with `npm run dev` in their respective folders.

Built Different. 🗿 | Designed for high-performance operatives. ⚔️
