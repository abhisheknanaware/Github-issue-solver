import mongoose from 'mongoose';

const prDraftSchema = new mongoose.Schema(
  {
    contributionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Contribution',
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository' },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },

    title: { type: String, required: true },
    body: { type: String, required: true }, // Markdown description of changes
    labels: [{ type: String }],
    branchName: { type: String },
    linkedIssue: { type: String }, // e.g. "Fixes #12"

    codeDiffs: [
      {
        filePath: { type: String },
        originalCode: { type: String },
        modifiedCode: { type: String },
        explanation: { type: String },
        language: { type: String },
      },
    ],

    testFiles: [
      {
        filePath: { type: String },
        content: { type: String },
        testFramework: { type: String }, // jest, pytest, etc.
      },
    ],

    documentation: {
      inlineComments: [
        {
          filePath: { type: String },
          comments: { type: mongoose.Schema.Types.Mixed },
        },
      ],
      readmeSection: { type: String },
    },

    prUrl: { type: String, default: null },
    prNumber: { type: Number, default: null },

    status: {
      type: String,
      enum: ['draft', 'submitted'],
      default: 'draft',
    },
  },
  { timestamps: true }
);

const PRDraft = mongoose.models.PRDraft || mongoose.model('PRDraft', prDraftSchema);
export default PRDraft;
