import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import { getUserRepos, connectRepo, getRepoIssues, getFileTree, getFileContent, submitPullRequest } from '../controllers/github.controller.js';
import { listRepositories, getRepository } from '../controllers/repocontroller.js';

const router = express.Router();

router.get('/repos', protect, getUserRepos);
router.post('/repos/connect', protect, connectRepo);
router.get('/repos/connected', protect, listRepositories);
router.get('/repos/connected/:id', protect, getRepository);
router.get('/repos/:repoId/issues', protect, getRepoIssues);
router.get('/repos/:repoId/tree', protect, getFileTree);
router.get('/repos/:repoId/file', protect, getFileContent);
router.post('/submit-pr', protect, submitPullRequest);

export default router;
