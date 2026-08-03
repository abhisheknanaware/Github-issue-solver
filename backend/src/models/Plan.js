import mongoose from "mongoose";

const PlanSchema = new mongoose.Schema({
  issueId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Issue",
    required: true,
  },
  repositoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Repository",
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  goal: {
    type: String,
    default: "",
  },
  changes: [
    {
      path: { type: String, required: true },
      action: { type: String, default: "modify" },
      targetContent: { type: String, default: "" },
      replacementContent: { type: String, default: "" },
    },
  ],
  status: {
    type: String,
    enum: ["pending", "approved", "completed"],
    default: "pending",
  },
  testStatus: {
    type: String,
    enum: ["idle", "running", "passed", "failed"],
    default: "idle",
  },
  branchName: {
    type: String,
    default: "",
  },
  prUrl: {
    type: String,
    default: "",
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Plan = mongoose.model("Plan", PlanSchema);
export default Plan;
