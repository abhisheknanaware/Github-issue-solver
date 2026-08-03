import passport from 'passport';
import { Strategy as GitHubStrategy } from 'passport-github2';
import User from '../models/User.js';

passport.use(
  new GitHubStrategy(
    {
      clientID: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_CALLBACK_URL || 'http://localhost:5000/api/auth/github/callback',
      scope: ['user:email', 'repo', 'workflow'],
    },
    async (accessToken, refreshToken, profile, done) => {
      try {
        let user = await User.findOne({ githubId: profile.id });

        const email = profile.emails && profile.emails[0] ? profile.emails[0].value : '';
        const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : '';

        if (user) {
          user.accessToken = accessToken;
          user.username = profile.username;
          user.avatarUrl = avatarUrl;
          user.email = email;
          await user.save();
        } else {
          user = await User.create({
            githubId: profile.id,
            username: profile.username,
            avatarUrl,
            email,
            accessToken,
          });
        }
        return done(null, user);
      } catch (error) {
        return done(error, null);
      }
    }
  )
);

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});
