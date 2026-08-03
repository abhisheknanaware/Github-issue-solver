import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    githubId: {
      type: String,
      required: true,
      unique: true,
    },
    username: {
      type: String,
      required: true,
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    email: {
      type: String,
      default: '',
    },
    accessToken: {
      type: String,
      required: true, // Stores the developer's GitHub OAuth token to create issues/PRs
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model('User', userSchema);
export default User;