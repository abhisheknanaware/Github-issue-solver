import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import dns from 'dns';
import passport from 'passport';

import connectDb from './config/db.js';
import './config/passport.js'; // Registers GitHub OAuth strategy

import apiRouter from './routes/apiRouter.js';
import { errorHandler } from './middleware/error.middleware.js';

// Fallback DNS to prevent slow MongoDB queries on certain Windows setups
dns.setServers(['8.8.8.8', '8.8.4.4']);

const app = express();

// Middlewares configuration
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(morgan('dev'));
app.use(passport.initialize());

// API Routes Mounting
app.use('/api', apiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ success: true, status: 'healthy', timestamp: new Date() });
});

app.get('/get-workflow-detail', async (req, res) => {
  try {
    const mongoose = (await import('mongoose')).default;
    const Contribution = mongoose.models.Contribution;
    const User = mongoose.models.User;
    const Repository = mongoose.models.Repository;
    const { getOctokitClient } = await import('./utils/github.util.js');

    const contribution = await Contribution.findOne().sort({ _id: -1 });
    const user = await User.findById(contribution.userId);
    const repo = await Repository.findById(contribution.repositoryId);
    
    const octokit = getOctokitClient(user.accessToken);
    
    const { data: fileData } = await octokit.repos.getContent({
      owner: repo.owner,
      repo: repo.name,
      path: '.github/workflows/pull-request-reviewer.lock.yml'
    });
    const contentStr = Buffer.from(fileData.content, 'base64').toString('utf-8');

    res.type('text/plain').send(contentStr);
  } catch (err) {
    res.status(500).json({ error: err.message, stack: err.stack });
  }
});


// Centralized error handling middleware
app.use(errorHandler);

const port = process.env.PORT || 5000;

connectDb()
  .then(() => {
    app.listen(port, () => {
      console.log(`🚀 Server running on http://localhost:${port}`);
    });
  })
  .catch((err) => {
    console.error('CRITICAL: Server startup failed due to DB error:', err);
  });
