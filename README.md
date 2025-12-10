# SkillX – An  Freelance & Skill-Exchange Platform for University Students
Monetize Skills. Exchange Knowledge. Grow Together.

## 🌐 1. Overview

SkillX is a community-driven platform designed to connect university students through freelance gigs and a unique skill-for-skill barter system.
Unlike traditional freelancing sites (Fiverr, Upwork, Freelancer), SkillX is:

Zero-commission

Campus-exclusive

AI-powered for smart matching



It enables students to either earn money from micro-gigs OR exchange expertise using a time-credit system — building an inclusive, fair, and learning-oriented micro-economy.

## 🚀 2. Key Features
🔥 SkillX Core Features


🔄 Skill-for-Skill Barter System (Time-Credit Economy)

⭐ Reputation & Trust Scores (Weighted Rating System)



📊 User Dashboard & Activity Insights

🏆 Gamification (Badges, Leaderboard, Credits)

🔐 Secure Firebase Authentication

## 🏗 3. System Architecture
React Frontend  →        Node.js Backend            →             MongoDB Database
        ↑                     ↓                                         ↓
        └────────────── Trust, Reputation & Governance Logic ───────────┘


## 🛠 5. Tech Stack
🎨 Frontend

React.js

TailwindCSS / Bootstrap

Axios

Firebase Auth (client)

🖥 Backend

Node.js + Express


REST APIs


## 🗄 Database

MongoDB 

## 🧩 6. Folder Structure
SkillX/
│
├── frontend/          # React UI
├── backend/           # Node.js APIs
├── database/          # Schema & cloud rules
├── docs/              # Report, diagrams, PPT
└── README.md

## 🧪 7. Installation & Setup
Prerequisites

Node.js (v16+)

Firebase Authentication


🔧 Step 1 — Clone Repo
git clone  https://github.com/rai0vishal/SKillX.git
cd SkillX

🎨 Step 2 — Setup Frontend
cd frontend
npm install
npm start

🖥 Step 3 — Setup Backend
cd backend
npm install
npm start



## 🔌 8. API Workflow
Example Matching Request:

POST /api/ai/match

{
  "skills": ["React", "NodeJS"],
  "gigDescription": "Need help building a frontend dashboard"
}

Response:
{
  "matchScore": 0.84,
  "topUsers": [...]
}

## 🛡 9. Security Features


Firebase secure auth



