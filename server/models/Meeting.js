const mongoose = require("mongoose");

const meetingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    host: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    participants: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        joinedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    scheduledAt: {
      type: Date,
      required: true,
    },
    duration: {
      type: Number,
      default: 60,
    },
    status: {
      type: String,
      enum: ["scheduled", "active", "completed", "cancelled"],
      default: "scheduled",
    },
    meetingCode: {
      type: String,
      unique: true,
    },
    recording: {
      type: String,
      default: "",
    },
    summary: {
      type: String,
      default: "",
    },
    actionItems: [
      {
        text: String,
        assignee: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
        },
        completed: {
          type: Boolean,
          default: false,
        },
      },
    ],
  },
  { timestamps: true },
);

// Auto-generate meeting code before saving
meetingSchema.pre("save", async function () {
  if (!this.meetingCode) {
    this.meetingCode = Math.random().toString(36).substring(2, 8).toUpperCase();
  }
});

module.exports = mongoose.model("Meeting", meetingSchema);
