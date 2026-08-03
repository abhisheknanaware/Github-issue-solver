import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ['user', 'assistant'], required: true },
    content: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    sourcesUsed: [
      {
        filePath: { type: String },
        chunkIndex: { type: Number },
      },
    ],
  },
  { _id: false }
);

const chatHistorySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    repositoryId: { type: mongoose.Schema.Types.ObjectId, ref: 'Repository' },
    issueId: { type: mongoose.Schema.Types.ObjectId, ref: 'Issue' },
    type: {
      type: String,
      enum: ['repo', 'issue'],
      required: true,
    },
    messages: [messageSchema],
  },
  { timestamps: true }
);

const ChatHistory = mongoose.model('ChatHistory', chatHistorySchema);
export default ChatHistory;