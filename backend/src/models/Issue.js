import mongoose from 'mongoose';

const issueSchema = new mongoose.Schema(
  {
    githubIssueId: { type: Number, required: true },
    number: { type: Number, required: true },
    title: { type: String, required: true },
    body: { type: String, default: '' },
    labels: [{ type: String }],
    state: {
      type: String,
      enum: ['open', 'closed'],
      default: 'open',
    },
    url: { type: String },

    // Triage difficulty classification
    difficulty: {
      type: String,
      enum: ['Easy', 'Medium', 'Hard'],
      default: 'Medium',
    },

    // 0-100 or 0-10 score indicating how beginner friendly or well specified this issue is
    readinessScore: { type: Number, default: 0, min: 0, max: 100 },
    scoreBreakdown: {
      labelClarity: { type: Number, default: 0 },
      issueAge: { type: Number, default: 0 },
      commentCount: { type: Number, default: 0 },
      bodyClarity: { type: Number, default: 0 },
      fileComplexity: { type: Number, default: 0 },
    },

    // AI generated triage suggestions
    advice: { type: String, default: '' },
    hints: [{ type: String }],
    suggestedApproach: { type: String, default: '' },
    relevantFiles: [{ type: String }],

    createdByLogin: { type: String },
    githubCreatedAt: { type: Date },
    commentCount: { type: Number, default: 0 },

    repositoryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Repository',
      required: true,
    },
  },
  { timestamps: true }
);

const Issue = mongoose.model('Issue', issueSchema);
export default Issue;
