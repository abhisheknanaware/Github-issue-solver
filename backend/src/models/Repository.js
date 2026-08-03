import mongoose from "mongoose";

const RepositorySchema = new mongoose.Schema({
  owner: {
    type: String,
    required: true,
  },
  name: {
    type: String,
    required: true,
  },
  fullName: {
    type: String,
  },
  description: {
    type: String,
  },
  stars: {
    type: Number,
    default: 0,
  },
  forks: {
    type: Number,
    default: 0,
  },
  openIssuesCount: {
    type: Number,
    default: 0,
  },
  language: {
    type: String,
  },
  githubUrl: {
    type: String,
    required: true,
    unique: true,
  },
  cloneUrl: {
    type: String,
  },
  defaultBranch: {
    type: String,
    default: "main",
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  isIndexed: {
    type: Boolean,
    default: false,
  },
  files: [
    {
      path: { type: String, required: true },
      content: { type: String },
      type: { type: String, default: "file" },
      size: { type: Number, default: 0 },
    },
  ],
  indexedAt: {
    type: Date,
    default: Date.now,
  },
});

const Repository = mongoose.model("Repository", RepositorySchema);
export default Repository;
