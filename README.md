# SkillBridge – An AI-Powered Freelance & Skill-Exchange Platform for University Students
Monetize Skills. Exchange Knowledge. Grow Together.

## 🌐 1. Overview

SkillBridge is a community-driven platform designed to connect university students through freelance gigs and a unique skill-for-skill barter system.
Unlike traditional freelancing sites (Fiverr, Upwork, Freelancer), SkillBridge is:

Zero-commission

Campus-exclusive

AI-powered for smart matching

Secure with fraud detection & trust scoring

It enables students to either earn money from micro-gigs OR exchange expertise using a time-credit system — building an inclusive, fair, and learning-oriented micro-economy.

## 🚀 2. Key Features
🔥 SkillBridge Core Features

🧲 AI-based Gig & Skill Matching (BERT + Jaccard Similarity)

🔄 Skill-for-Skill Barter System (Time-Credit Economy)

⭐ Reputation & Trust Scores (Weighted Rating System)

🛡 Fraud & Scam Detection (Isolation Forest + NLP)

💬 Smart Search + Semantic Filtering

📊 User Dashboard & Activity Insights

🏆 Gamification (Badges, Leaderboard, Credits)

🔐 Secure Firebase Authentication

## 🏗 3. System Architecture
React Frontend  →  Node.js Backend  →  Python AI Service  →  Firestore Database
        ↑                     ↓                     ↑                    ↓
        └────────────── Trust, Reputation & Governance Logic ───────────┘

## 🧠 4. AI / NLP Modules

Skill Matching Engine:

Sentence-BERT

Jaccard Similarity

Cosine Similarity

Max-Weight Bipartite Matching

Fraud Detection:

Isolation Forest

NLP Text Classification

Sentiment Analysis (VADER)

Reputation Engine:

Weighted Rating Algorithm

Review Consistency Check

Sentiment-Rating Validation

## 🛠 5. Tech Stack
🎨 Frontend

React.js

TailwindCSS / Bootstrap

Axios

Firebase Auth (client)

🖥 Backend

Node.js + Express

JWT / Firebase Admin SDK

REST APIs

Firestore Integration

## 🤖 AI/NLP Microservice

Python FastAPI

SentenceTransformer (BERT)

Scikit-learn (Isolation Forest)

NLTK / VADER

NumPy / Pandas

## 🗄 Database

Firebase Firestore (NoSQL)

MongoDB / PostgreSQL (optional hybrid)

## 🧩 6. Folder Structure
SkillBridge/
│
├── frontend/          # React UI
├── backend/           # Node.js APIs
├── ai-service/        # FastAPI ML/NLP service
├── database/          # Schema & cloud rules
├── docs/              # Report, diagrams, PPT
└── README.md

## 🧪 7. Installation & Setup
Prerequisites

Node.js (v16+)

Python 3.8+

Firebase Project

Firestore Database

🔧 Step 1 — Clone Repo
git clone  https://github.com/Priyanshu0403/Skill-Bridge.git
cd SkillBridge

🎨 Step 2 — Setup Frontend
cd frontend
npm install
npm start

🖥 Step 3 — Setup Backend
cd backend
npm install
npm start

🤖 Step 4 — Setup AI Microservice
cd ai-service
pip install -r requirements.txt
uvicorn main:app --reload

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

Encrypted JWT tokens

Firebase secure auth

Firestore rules for read/write access

AI-based fraud detection

Admin moderation

## 📘 10. Documentation

All project documents are available under docs/:

Project Report

Literature Review

SRS

Class Diagrams

Sequence Diagrams

DFD

ERD


## 🌱 11. Future Enhancements

Blockchain-based certificates & skill verification

Voice-based gig posting (NLP)

In-platform wallet system

Multi-campus federation

Full mobile app (React Native / Flutter)