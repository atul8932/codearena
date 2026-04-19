# ⚡ CodeArena — Real-Time Competitive Coding Platform

> *Where developers battle, not just code.*

---

## 🧩 Problem Statement

Traditional online coding platforms (LeetCode, CodeChef, HackerRank) are **solo experiences**.
Developers practice in isolation, get no real-time pressure, and receive zero competitive feedback.

**Key pain points we identified:**

| Problem | Impact |
|---|---|
| No real-time competition | No urgency, no engagement |
| Code never tested against edge cases | Solutions break in production |
| No team-based coding challenges | No collaborative skill-building |
| No live visibility into rival progress | No competitive thrill |
| No anti-cheat in timed assessments | Unfair evaluation |
| Rankings exist but no live season system | No long-term motivation |

> **Our Goal:** Build a platform where developers compete *live*, get instant feedback on edge cases, and climb a real leaderboard — exactly like a coding arena.

---

## 🏗️ What We Built

### CodeArena — A Full-Stack Real-Time Competitive Coding Platform

```
Stack:
  Frontend  → React 19 + Vite + Monaco Editor + Framer Motion
  Backend   → Node.js + Express + Socket.IO
  Database  → Firebase Firestore
  Auth      → Firebase Authentication (Google OAuth + Email)
  Execution → Judge0 CE API (code execution engine)
  Hosting   → GitHub + Render (backend) + Vercel/Netlify (frontend)
```

---

## ✅ Features Implemented

### 1. 🔐 Authentication System
- **Google Sign-In** (OAuth 2.0 via Firebase)
  - Uses `signInWithRedirect` on production (popup-blocker safe, works on all browsers)
  - Uses `signInWithPopup` on localhost for fast developer experience
  - Handles `getRedirectResult` on app mount to complete OAuth flow gracefully
- **Email & Password Auth** with email verification
- **Password Reset** via email link
- **Protected Routes** — unauthenticated users redirected to `/auth`
- Persistent session via Firebase `onAuthStateChanged`

---

### 2. ⚔️ Real-Time Battle System

**2v2 Team Battle Mode:**
- Players join a room by room code
- Host starts the battle — all players enter simultaneously
- **Live timer** counts down the battle duration
- **Real-time leaderboard** updates as players submit code
- **First Blood** — first correct submission gets special crown
- **Winner detection** — room broadcasts winner across all clients
- Socket.IO events handle: `joinRoom`, `startBattle`, `codeSubmit`, `battleEnd`

**Battle Page Features:**
- Monaco Editor (full IDE experience in browser)
- Language selector (Python, C++, JavaScript, Java, Go, Rust, etc.)
- Problem description panel
- Live scoreboard sidebar
- Timer with color transitions: green → amber → red
- Room ID display for sharing

---

### 3. 🗳️ 15-Second Problem Voting Phase
- After room fills, a **voting overlay** appears
- Players vote on which problem they want to fight over
- Live vote count updates in real time via Socket.IO
- Problem with most votes is selected and battle begins

---

### 4. 🛡️ Anti-Cheat System
- Detects **tab switching** (using `visibilitychange` event)
- Detects **copy-paste** (using clipboard event listeners)
- Issues **warnings** per violation (shown as toast notifications)
- **Auto-disqualification** after 5 warnings
- Warning state synced across session

---

### 5. 🧪 Edge Case Testing & Validation System (Practice Mode)

A complete code evaluation pipeline at `/practice`:

**Input Validation Layer:**
- Empty code detection before submission
- Unsupported language detection
- Code length sanity checks
- User-friendly inline error messages

**Edge Case Detection Engine (`edgeCaseEngine.js`):**
- Automatically detects problem type from title/description (array, string, number, graph, etc.)
- Generates relevant edge cases:
  - Boundary values (n=0, n=1, n=2)
  - Negative values (-1, INT_MIN)
  - Integer overflow (INT_MAX = 2³¹-1)
  - Duplicate values (all same elements)
  - Already-sorted / reverse-sorted arrays
  - Empty string / single character
  - Large inputs for TLE detection (n=10⁵)
  - Special characters and Unicode

**Judge0 Code Execution (`judge0.js`):**
- Submits code via Judge0 CE API (free, no key required)
- Asynchronous polling until terminal status
- **▶ Run** → executes sample test cases only
- **⚡ Submit** → executes ALL cases including edge cases (in parallel via `Promise.allSettled`)
- Supports 10 languages: Python 3, JavaScript, C++, Java, C, Go, Rust, Ruby, TypeScript, C#

**Result Analyzer:**
- Per-test-case verdict: ✅ Passed / ❌ Wrong / ⏱ TLE / ⚠️ Runtime / 🔴 Compile
- **Diff view** — side-by-side expected vs actual output (line-by-line)
- Failure analysis: rule-based diagnosis for each error type
- Fix suggestions tailored to the specific failure (null check, loop bounds, overflow guard, etc.)

**UI Components:**
- `CodeEditor.jsx` — Monaco editor with font size control, word wrap, language selector, Reset
- `TestCasesPanel.jsx` — tabbed sample/edge case list with severity badges, diff view, hints
- `ResultDisplay.jsx` — animated verdict banner, progress bar, performance stats (time/memory)

---

### 6. 🏆 Global Leaderboard

Full leaderboard at `/leaderboard`:

- Pulls top 100 players from Firestore ordered by `totalScore`
- **Sort by:** Score / Wins / Total Battles (switchable tabs)
- **Player search** by name
- **Tier badges:** S (2000+) · A (1000+) · B (500+) · C (200+) · D (50+) · E (0+)
- **Win-rate progress bar** per player (animated)
- **"You" highlight row** — see your own rank at a glance
- **Stat cards:** Total Players · Battles Fought · Total Wins · Top Score
- **Auto-refresh** every 60 seconds + manual refresh button
- **Skeleton loading** state while fetching data

---

### 7. 👤 User Profile & Battle History
- Profile page at `/profile`
- Displays: total battles, wins, total score, last played date
- **Activity heatmap** (GitHub-style calendar view)
- Recent battle history (last 20 battles)
- Stats saved automatically after every completed battle

---

### 8. 🎨 Design System — Dark Green Cyberpunk Theme

Complete custom design system in `index.css`:

| Token | Value | Purpose |
|---|---|---|
| `--bg` | `#0a0f0a` | Very dark green-black background |
| `--surface` | `#111811` | Card/panel surface |
| `--accent` | `#00e676` | Primary green accent |
| `--red` | `#ff1744` | Danger actions only |
| `--blue` | `#40c4ff` | Secondary info |
| `--gold` | `#ffd740` | Rewards / rank |
| `--purple` | `#e040fb` | Edge case badges |

**Visual Features:**
- Dark green **grid/checkered background** (CSS linear-gradient lines)
- **Text glow effects** — `.text-glow-green`, `.text-glow-blue`, `.text-glow-gold`, `.text-glow-red`, `.text-glow-subtle`
- Smooth Framer Motion animations on every panel and card
- Skeleton loading states throughout the app
- Fully responsive design (mobile → desktop)

---

### 9. 🔔 Notification System
- Real-time bell notifications in TopNav
- Unread count badge
- Dropdown with notification history
- Pushed from server via Socket.IO

---

### 10. 👁️ Spectator Mode
- Join any active room as a spectator
- Watch live without participating

---

### 11. 🛠️ Admin Panel (`/admin`)
- View all active rooms
- Force-end battles
- Manage problem bank
- Push global notifications

---

## 🗂️ Project Architecture

```
codearena/
├── frontend/                    # React + Vite
│   ├── src/
│   │   ├── pages/
│   │   │   ├── LandingPage.jsx      # Home, room creation/join
│   │   │   ├── AuthPage.jsx         # Login / Sign up
│   │   │   ├── LobbyPage.jsx        # Pre-battle lobby
│   │   │   ├── BattlePage.jsx       # Live coding arena
│   │   │   ├── ResultPage.jsx       # Post-battle leaderboard
│   │   │   ├── ProfilePage.jsx      # User stats & history
│   │   │   ├── LeaderboardPage.jsx  # Global rankings
│   │   │   ├── PracticePage.jsx     # Practice with edge cases
│   │   │   ├── AdminPage.jsx        # Admin controls
│   │   │   └── VotingOverlay.jsx    # Problem vote overlay
│   │   ├── components/
│   │   │   ├── practice/
│   │   │   │   ├── CodeEditor.jsx       # Monaco wrapper
│   │   │   │   ├── TestCasesPanel.jsx   # Test case viewer
│   │   │   │   └── ResultDisplay.jsx    # Results UI
│   │   │   └── ProtectedRoute.jsx
│   │   ├── services/
│   │   │   ├── firebase.js          # Firebase Auth + Firestore
│   │   │   ├── socket.js            # Socket.IO client
│   │   │   └── judge0.js            # Judge0 code execution API
│   │   ├── utils/
│   │   │   └── edgeCaseEngine.js    # Edge case generator + analyzer
│   │   ├── context/
│   │   │   └── AuthContext.jsx      # Auth state provider
│   │   ├── store/
│   │   │   └── gameStore.js         # Zustand global state
│   │   ├── hooks/
│   │   │   └── useGame.js           # Socket event hooks
│   │   └── index.css                # Design system tokens
│
└── backend/                     # Node.js + Express
    └── src/
        ├── server.js                # Express + Socket.IO setup
        ├── socket/
        │   └── gameSocket.js        # All game socket events
        ├── routes/
        │   ├── roomRoutes.js        # Room REST API
        │   ├── profileRoutes.js     # Profile + Leaderboard API
        │   └── adminRoutes.js       # Admin REST API
        └── services/
            └── firebase.js          # Firestore (rooms, users, leaderboard)
```

---

## 📡 API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Server health check |
| `GET` | `/api/profile/:uid` | User profile + battle history |
| `GET` | `/api/profile/leaderboard` | Top 100 global players |
| `GET` | `/api/room/:roomId` | Room details |
| `POST` | `/api/admin/notify` | Push global notification |

---

## 🔌 Socket Events

| Event | Direction | Description |
|---|---|---|
| `joinRoom` | Client → Server | Join a battle room |
| `startBattle` | Client → Server | Host starts the battle |
| `codeSubmit` | Client → Server | Submit code solution |
| `battleEnd` | Server → Client | Battle finished broadcast |
| `leaderboardUpdate` | Server → Client | Live scoreboard update |
| `voteForProblem` | Client → Server | Cast a problem vote |
| `warningIssued` | Server → Client | Anti-cheat warning |

---

## 🔮 Future Roadmap

### 🚀 Phase 2 — Advanced Battle Modes

#### 🤝 Team Duel (2v2 / 3v3) — Collaborative Editor
- Teams share a **single Monaco editor instance**, synced in real time via Socket.IO
- Each keystroke is broadcast using `codeSync` events with OT (Operational Transform) or CRDT
- Team members see each other's **live cursors** with colored labels
- Team score = combined correct submissions within time limit
- Feasibility: **High** — Socket.IO already handles rooms; Monaco has a cursor API

#### 🏟️ Knockout Tournament Mode
- Bracket-style 1v1 elimination rounds
- Auto-matchmaking fills bracket slots
- Winners advance; losers are spectators for remaining rounds
- Final round is streamed live to all eliminated players
- Feasibility: **High** — needs bracket state machine on backend

#### 🔄 Real-Time Code Editor Sync
- Every player's code changes broadcast to team members live
- Uses Socket.IO `codeChange` events with debouncing (50ms)
- Monaco Editor's `onDidChangeModelContent` feeds the sync pipe
- Feasibility: **High** — this is exactly what Socket.IO is designed for

### 🤖 Phase 3 — AI Integration
- [ ] **AI Code Review** — GPT-4 analyzes submitted code and suggests improvements
- [ ] **Smart Edge Case Generator** — LLM-powered edge case suggestions from problem semantics
- [ ] **AI Commentary** — Real-time battle commentary like a sports broadcaster
- [ ] **Hint System** — AI-powered progressive hints (costs score points to unlock)
- [ ] **Code Plagiarism Detection** — Similarity check between submissions

### 📊 Phase 4 — Analytics & Social
- [ ] **Detailed Analytics Dashboard** — Win rate trends, language breakdown, category heatmap
- [ ] **Friends & Follow System** — Follow players, see their recent battles
- [ ] **Clan / Guild System** — Teams compete for clan rankings across seasons
- [ ] **Replay System** — Watch any past battle replay step by step
- [ ] **Discord Bot Integration** — Post battle results to Discord channels

### 🏅 Phase 5 — Platform Maturity
- [ ] **Season System** — Monthly resets with season rewards and badges
- [ ] **Achievements & Badges** — Speed Demon, Bug Hunter, Streak Master, etc.
- [ ] **Mobile App** — React Native companion for mobile battles
- [ ] **University / Company Mode** — Private instances for hiring assessments and classroom use

---

## 📌 Key Engineering Takeaways

1. **Real-time state sync** — Socket.IO + Zustand kept all clients perfectly in sync during live battles
2. **Code execution pipeline** — Async polling with exponential backoff handles Judge0's queue delays
3. **Edge cases matter** — Our automated engine catches the bugs that manual testing misses every time
4. **Production auth** — `signInWithRedirect` works everywhere; `signInWithPopup` fails on mobile/production
5. **Design drives engagement** — The dark green cyberpunk theme made users *want* to compete

---

*CodeArena — Season 1 is Live. ⚡*
