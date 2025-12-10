import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';

import gigsRouter from './src/routes/gigs.js';
import skillExchangeRouter from './src/routes/SkillExchange.js';
import profileRouter from './src/routes/profile.js';
import dashboardRouter from './src/routes/dashboard.js';
import exchangeRequestsRouter from './src/routes/exchangeRequests.js';
import gigApplicationsRouter from './src/routes/gigApplications.js'    // 👈 for gig applications





dotenv.config();

const app = express();

// Middlewares
app.use(
  cors({
    origin: 'http://localhost:5173', // your frontend
    credentials: true,
  })
);
app.use(express.json());

// Test route
app.get('/', (req, res) => {
  res.send('SkillX backend is running ✅');
});

// Routes
app.use('/api/gigs', gigsRouter);
app.use('/api/skill-exchange', skillExchangeRouter);
app.use('/api/profile', profileRouter);
app.use('/api/dashboard', dashboardRouter); 
app.use('/api/exchange-requests', exchangeRequestsRouter)   // now defined ✅
app.use('/api/gig-applications', gigApplicationsRouter)



// DB + server start
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/skillx';

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    app.listen(PORT, () => {
      console.log(`✅ Server running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('❌ MongoDB connection error:', err.message);
  });
