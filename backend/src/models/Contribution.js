import mongoose from 'mongoose';

const stageSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    output: { type: mongoose.Schema.Types.Mixed, default: null },
    completedAt: { type: Date, default: null },
    error: { type: String, default: null },
  },
  { _id: false }
);

const contributionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository', required: true },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue', required: true },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed'],
      default: 'pending',
    },
    currentStage: { type: String, default: 'issueScout' },

    stages: {
      issueScout: { type: stageSchema, default: () => ({}) },
      codeAnalysis: { type: stageSchema, default: () => ({}) },
      planner: { type: stageSchema, default: () => ({}) },
      coder: { type: stageSchema, default: () => ({}) },
      testGenerator: { type: stageSchema, default: () => ({}) },
      documentation: { type: stageSchema, default: () => ({}) },
      prDraft: { type: stageSchema, default: () => ({}) },
    },

    error: { type: String, default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

const Contribution = mongoose.model('Contribution', contributionSchema);
export default Contribution;