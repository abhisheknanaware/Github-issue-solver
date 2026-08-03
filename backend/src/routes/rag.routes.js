import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { triggerIndexing, queryRepository, explainFile } from '../controllers/rag.controller.js';

const router = express.Router();

router.post('/index/:repoId', protect, triggerIndexing);
router.post('/query', protect, queryRepository);
router.post('/explain', protect, explainFile);

export default router;
