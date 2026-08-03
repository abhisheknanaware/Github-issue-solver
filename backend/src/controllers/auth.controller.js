import jwt from 'jsonwebtoken';

export const githubCallback = (req, res) => {
  if (!req.user) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/login?error=auth_failed`);
  }

  const token = jwt.sign({ id: req.user._id }, process.env.JWT_SECRET, {
    expiresIn: '7d',
  });

  res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/auth/callback?token=${token}`);
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: {
        id: req.user._id,
        username: req.user.username,
        avatarUrl: req.user.avatarUrl,
        email: req.user.email,
      },
    });
  } catch (error) {
    next(error);
  }
};
