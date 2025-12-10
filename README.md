**🚀 SkillX – Skill Exchange & Gig Collaboration Platform
**
SkillX is a full-stack MERN-based web platform that enables users to exchange skills, post gigs, apply for gigs, and collaborate professionally. It combines real-time interaction, secure authentication, and a scalable backend to create a complete freelancing and skill-sharing ecosystem.

**🌐 Live Concept**

SkillX allows users to:

Exchange skills with others

Post and apply for freelance gigs

Manage profiles with real-time activity stats

Accept/reject skill exchange requests

Accept/reject gig applications

Track completed gigs and collaborations automatically

🧩 Tech Stack
**🔹 Frontend**

React.js (Vite)

Tailwind CSS

React Router DOM

Fetch API

**🔹 Backend**

Node.js

Express.js

MongoDB with Mongoose ODM

🔹 Authentication

Firebase Authentication

**🔹 Database**

MongoDB Atlas / Local MongoDB

**📁 Project Structure**
SkillX/
│
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── auth/
│   │   ├── App.jsx
│   │   └── main.jsx
│   └── package.json
│
├── backend/
│   ├── src/
│   │   ├── models/
│   │   ├── routes/
│   │   └── controllers/
│   ├── index.js
│   ├── seed.js
│   └── package.json
│
└── README.md

✨ Core Features
👤 User Management

Firebase Email/Password Authentication

Secure Sign Up & Sign In

Profile creation & editing

Dynamic user activity tracking

🔄 Skill Exchange System

Create skill exchange profiles

Send skill exchange requests

Accept or reject requests

Auto-update completed exchanges

💼 Gig System

Post gigs with details (title, budget, duration, etc.)

Apply for gigs

Gig owner can accept/reject applications

Only gig owner can delete the gig

Auto-increment completed gigs

📊 Dashboard

Displays:

Total gigs

Total skill exchanges

Total user profiles

Shows:

User activity summary

Exchange requests (sent & received)

Gig applications

📈 Profile Statistics (Auto Updated)

Gigs Posted

Gigs Completed

Skill Exchanges Sent

Skill Exchanges Completed

🔐 Security Features

Firebase authentication protection

Email-based access control

Role-based authorization for gig delete

Secure REST API calls

Data validation at backend

⚙️ Installation Guide
1️⃣ Clone Repository
git clone https://github.com/rai0vishal/SKillX.git
cd SKillX

2️⃣ Backend Setup
cd backend
npm install


Create .env file:

MONGO_URI=mongodb://127.0.0.1:27017/skillx
PORT=5000


Start server:

npm start

3️⃣ Frontend Setup
cd frontend
npm install
npm run dev

🔥 Firebase Setup

Create Firebase project

Enable Email/Password Authentication

Add config in:

src/firebase/firebaseConfig.js


Using:

VITE_APIKEY=
VITE_AUTHDOMAIN=
VITE_PROJECTID=
VITE_STORAGEBUCKET=
VITE_MESSAGINGSENDERID=
VITE_APPID=

🗄 Database Models

UserProfile

Gig

SkillExchange

GigApplication

ExchangeRequest

⚡ System Workflow

User registers via Firebase → Profile created in MongoDB

User posts gig → gigsPosted auto-increments

User applies to gig → owner receives request

Owner accepts application → gigsCompleted increments for both users

Skill exchange behaves similarly

All stats auto-updated in real-time

✅ Testing Performed

Manual unit testing

API Route testing using Postman

Firebase authentication testing

Dashboard data verification

Gig & skill exchange flow testing

🚀 Future Enhancements

In-app real-time chat

Payment gateway for paid gigs

Admin dashboard

Advanced recommendation system

Push notifications

AI-based skill matching

👨‍💻 Developer

Vishal Rai
Final Year Project – SkillX
GitHub:
🔗 https://github.com/rai0vishal/SKillX

📜 License

This project is developed for academic and learning purposes only.
