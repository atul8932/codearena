# ⚔️ CodeArena — Real-Time Multiplayer Coding Battle Platform

> Enter the arena. Solve faster. Dominate the leaderboard.

A cyberpunk-themed, real-time multiplayer coding battle platform where players compete to solve algorithmic problems fastest using Socket.IO, Monaco Editor, Judge0, and Firebase.

---

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- A free [Judge0 RapidAPI key](https://rapidapi.com/judge0-official/api/judge0-ce) *(optional — mock mode works without it)*
- Firebase project *(optional — in-memory fallback works for local dev)*

### 1. Backend

```bash
cd backend
cp .env.example .env
# Edit .env with your keys (or leave defaults for mock mode)
npm install
npm run dev
# → Running on http://localhost:4000
```

### 2. Frontend

```bash
cd frontend
cp .env.example .env
# Edit VITE_BACKEND_URL if backend is not on localhost:4000
npm install
npm run dev
# → Running on http://localhost:5173
```

---

## 🎮 How to Play

1. **Create Room** — Enter your name, optionally pick difficulty, click "Launch Room"
2. **Share Room ID** — Send the 8-char ID to friends
3. **Ready Up** — All players ready, host clicks Start
4. **3-2-1-GO!** — Countdown animation, then the coding problem appears
5. **Code** — Use Monaco Editor, pick Python/JS/C++/Java
6. **Submit** — Backend judges via Judge0 API against hidden test cases
7. **Win** — Fastest correct submission gets First Blood and the crown 🏆

---

## 🏗️ Architecture

```
Frontend (React + Vite + Tailwind)
  └── Socket.IO Client ──→ Backend (Node.js + Express)
                               ├── Socket.IO Game Engine
                               ├── Judge0 API (code execution)
                               └── Firebase Firestore (room state)
                                   └── In-memory fallback (dev mode)
```

---

## ⚡ Features

| Feature | Status |
|---|---|
| Real-time room system (create/join/leave) | ✅ |
| Ready system + host controls | ✅ |
| 3-2-1 countdown animation | ✅ |
| Monaco Editor (Python, JS, C++, Java) | ✅ |
| Judge0 code execution + hidden test cases | ✅ |
| Live scoreboard (real-time rank updates) | ✅ |
| Battle timer with urgency visual | ✅ |
| Typing indicator per player | ✅ |
| Real-time progress bars | ✅ |
| Power-ups (Freeze / Hint / Double Score) | ✅ |
| AI Commentary system | ✅ |
| First Blood animation + toast | ✅ |
| Anonymous mode (names hidden mid-battle) | ✅ |
| Spectator mode | ✅ |
| Animated result podium + confetti | ✅ |
| Particle background + glitch text | ✅ |
| Cyberpunk/neon UI theme | ✅ |
| In-memory fallback (no Firebase needed) | ✅ |
| Mock execution (no Judge0 needed) | ✅ |

---

## 🔐 Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|---|---|
| `PORT` | Server port (default: 4000) |
| `CLIENT_URL` | Frontend origin for CORS |
| `JUDGE0_API_KEY` | RapidAPI key for Judge0 CE |
| `JUDGE0_HOST` | `judge0-ce.p.rapidapi.com` |
| `FIREBASE_SERVICE_ACCOUNT` | Stringified JSON of Firebase service account |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_BACKEND_URL` | Backend URL (default: `http://localhost:4000`) |
| `VITE_FIREBASE_*` | Firebase client SDK config |

---

## 📁 Project Structure

```
hack/
├── backend/
│   ├── src/
│   │   ├── server.js           # Express + Socket.IO bootstrap
│   │   ├── socket/
│   │   │   └── gameSocket.js   # Game engine (all socket events)
│   │   ├── services/
│   │   │   ├── judge0.js       # Code execution via Judge0 API
│   │   │   └── firebase.js     # Firestore + in-memory fallback
│   │   ├── routes/
│   │   │   └── roomRoutes.js   # REST endpoints
│   │   └── data/
│   │       └── problems.js     # 10 curated coding problems
│   └── render.yaml             # Render.com deployment
│
└── frontend/
    ├── src/
    │   ├── App.jsx             # Router + global hooks
    │   ├── pages/
    │   │   ├── LandingPage.jsx # Hero, particle BG, create/join form
    │   │   ├── LobbyPage.jsx   # Real-time player list, ready system
    │   │   ├── BattlePage.jsx  # Monaco + scoreboard + power-ups
    │   │   └── ResultPage.jsx  # Podium + confetti + stats
    │   ├── store/
    │   │   └── gameStore.js    # Zustand global state
    │   ├── hooks/
    │   │   └── useGame.js      # Socket.IO ↔ Zustand bridge
    │   └── services/
    │       └── socket.js       # Singleton Socket.IO client
    └── vercel.json             # Vercel SPA rewrite
```

---

## ☁️ Deployment

### Frontend → Vercel
```bash
cd frontend && npm run build
# Push to GitHub, connect repo to Vercel
# Set VITE_BACKEND_URL to your Render backend URL
```

### Backend → Render
```bash
# Connect GitHub repo, use render.yaml
# Set environment variables in Render dashboard
```

---

## 🔮 Future Roadmap

- [ ] Global matchmaking queue
- [ ] Ranking tiers (Bronze / Silver / Gold / Diamond)
- [ ] AI coding assistant (hint generation)
- [ ] Battle replay system
- [ ] Team mode (shared editor)
- [ ] Mobile app (React Native)
- [ ] Tournament brackets
- [ ] Custom problem sets

---

## 🧪 Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, Vite, Tailwind CSS v3 |
| Animations | Framer Motion |
| State | Zustand |
| Editor | Monaco Editor |
| Real-time | Socket.IO |
| Backend | Node.js, Express |
| Code Execution | Judge0 CE (RapidAPI) |
| Database | Firebase Firestore |
| Auth | Firebase Anonymous Auth |
| Deployment | Vercel (FE) + Render (BE) |
