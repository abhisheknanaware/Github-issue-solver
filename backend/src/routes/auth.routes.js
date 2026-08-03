import express from 'express';
import passport from 'passport';
import { githubCallback, getMe } from '../controllers/auth.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/github', passport.authenticate('github', { scope: ['user:email', 'repo', 'workflow'] }));

router.get(
  '/github/callback',
  (req, res, next) => {
    passport.authenticate('github', { session: false }, (err, user, info) => {
      if (err) {
        console.error('🔥 GitHub OAuth Authentication Error:', err);
        if (err.oauthError) {
          console.error('Detailed OAuth Error:', err.oauthError);
          if (err.oauthError.data) {
            console.error('GitHub API Response Data:', err.oauthError.data);
          }
        }
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/login?error=github_auth_failed`);
      }
      if (!user) {
        const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
        return res.redirect(`${clientUrl}/login?error=auth_failed`);
      }
      req.user = user;
      next();
    })(req, res, next);
  },
  githubCallback
);

router.get('/me', protect, getMe);

export default router;
