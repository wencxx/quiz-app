import mongoose from "mongoose";
import { User } from "./user"; // Ensure User model is registered before Answer schema
import { Quiz } from "./quiz"; // Ensure Quiz model is registered before Answer schema

const answerSchema = new mongoose.Schema({
  quizId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: Quiz,
    required: true,
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: User,
    required: true,
  },
  answers: [
    {
      questionIndex: { type: Number, required: true },
      answer: mongoose.Schema.Types.Mixed, // string or number
    }
  ],
  timeSpent: { type: Number, required: true }, // in seconds
  score: { type: Number, required: true, default: 0 },
}, { timestamps: true });

export const Answer = mongoose.models.Answer || mongoose.model("Answer", answerSchema);
