# Koinexa — Next-Gen Social & Competitive Coding Platform

A production-grade educational and competitive programming ecosystem featuring an expandable Hotstar/Disney+ style navigation, high-throughput social learning feed, full-screen JEE Main CBT examination arena, WhatsApp-style study communities, and LeetCode-style Code Lab with 20+ test cases verification.

---

## 1. System Features & Modules

### 🌟 1. Expandable Left Navigation (Streaming / Hotstar Style)
- Left-docked semi-transparent expanding sidebar with brand logo at top.
- Navigation items: **Home**, **Contests**, **Communities**, **Code Lab**, **Search**, **Profile**.
- On hover, smoothly expands with a frosted glass backdrop, detailed subtitles, active indicator pill, and spring animations.

### 📰 2. Home Feed & Course Recommendations
- **~1020px wide rectangular cards** optimized for laptop and desktop displays without boxy borders.
- Top row: User name, avatar, and dynamic **"Studymate" connect button** (Connect / Connected with checkmark).
- **YouTube Course Recommendations**: Input YouTube URL, "Why I am recommending this video" testimonial, course portal link, and preview thumbnail.
- **Hackathons & Contests**: Image posters, registration portals, and team formation callouts.
- **Tweets & Academic Reflections**: Short messages, tips, and insights.
- Engagement row: Likes, comment drawers, reposts, bookmarks, and relative post dates.

### 🎯 3. JEE Main CBT Contest / Exam Arena
- Authentic National Testing Agency (NTA) Computer Based Test simulation.
- **Full Screen Lockdown Mode**: Automatically launches into full screen and alerts if exited before submission.
- **Question Palette Grid**: Numbered grid showing standard NTA color statuses:
  - 🟢 **Green**: Answered
  - 🔴 **Red**: Not Answered
  - ⚪ **Gray**: Not Visited
  - 🟣 **Purple**: Marked for Review
  - 🟣+🟢 **Purple with Green dot**: Answered & Marked for Review
- **Section Tabs**: Switch seamlessly between Physics, Chemistry, and Mathematics.
- **Live Countdown Timer**: e.g., 60:00 with auto-submit when time expires.
- **Auto-Evaluation**: +4 marks for correct, -1 mark for wrong, with accuracy percentage and time taken.
- **Detailed Solutions**: Step-by-step mathematical and conceptual explanation key.
- **1 to 5 Star Quiz Rating**: Post-exam rating on question depth and knowledge tested.
- **Quiz Creator**: Anyone can upload a custom quiz with sections, questions, options, and explanations.

### 💬 4. WhatsApp-Style Study Communities
- WhatsApp Web & Discord hybrid split screen.
- Left panel: Clustered study groups (DSA Grind, Web Dev, JEE 2026, AI/ML) with member counters and active channels.
- Right panel: Live channel room with chat bubbles, timestamps, and syntax-highlighted code snippet cards.

### 💻 5. LeetCode Contest Code Lab
- Split-pane problem solving interface.
- Left pane: Problem description, constraints, and **3 Sample Cases** with Input, Output, and Explanation.
- Right pane: In-browser **Monaco Code Editor** with Python 3 and JavaScript support.
- **Testcase Runner**:
  - **Run Code**: Tests solution against 3 sample cases with latency in milliseconds.
  - **Submit Solution**: Evaluates against **minimum 20 hidden test cases**!
  - Displays verdicts: `Accepted`, `Wrong Answer`, `Time Limit Exceeded`, `Runtime Error` with pass count `20 / 20`.
- **Problem Creator**: Anyone can upload contest problems with 3 sample cases and minimum 20 test cases.

### 👤 6. Student Profile & Studymate Network
- Peer network counter, problem solving statistics, JEE average score, and my published posts.

---

## 2. Quick Start Guide

### Prerequisites
- Python 3.10+ (Available via `quzzify/.venv/Scripts/python.exe` or system Python 3)
- Node.js 18+ and npm

### 1. Run Backend Server (Port 5001)
```bash
cd backend
python app.py
# Running on http://127.0.0.1:5001
```

### 2. Run Frontend Client (Port 5174)
```bash
cd frontend
npm install
npm run dev
# Running on http://localhost:5174
```

Or execute `run.bat` in the root folder to start both services concurrently.
