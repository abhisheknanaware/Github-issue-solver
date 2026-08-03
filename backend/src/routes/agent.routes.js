import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { startAgentPipeline, streamPipelineProgress, getContributionStatus, getFullContributionDetails, getRecentContributions } from '../controllers/agent.controller.js';

const router = express.Router();

router.post('/start', protect, startAgentPipeline);
router.get('/recent', protect, getRecentContributions);
router.get('/stream/:contributionId', streamPipelineProgress);
router.get('/status/:contributionId', protect, getContributionStatus);
router.get('/contribution/:id', protect, getFullContributionDetails);

export default router;

