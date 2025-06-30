import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";
import { Quiz } from "@/models/quiz";
import { Answer } from "@/models/answers";
import { NextResponse } from "next/server";

export async function GET() {
  await connectDB();

  // Total users and breakdown by role
  const totalUsers = await User.countDocuments();
  const roles = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);

  // Total quizzes
  const totalQuizzes = await Quiz.countDocuments();

  // Total answers/submissions
  const totalAnswers = await Answer.countDocuments();

  // Average score per quiz
  const avgScores = await Answer.aggregate([
    { $group: { _id: "$quizId", avgScore: { $avg: "$score" }, submissions: { $sum: 1 } } },
    { $lookup: { from: "quizzes", localField: "_id", foreignField: "_id", as: "quiz" } },
    { $unwind: "$quiz" },
    { $project: { quizName: "$quiz.name", avgScore: 1, submissions: 1 } }
  ]);

  // Optionally: recent activity (last 5 answers)
  const recentAnswers = await Answer.find({})
    .sort({ createdAt: -1 })
    .limit(5)
    .populate("userId", "name email")
    .populate("quizId", "name");

  return NextResponse.json({
    totalUsers,
    roles,
    totalQuizzes,
    totalAnswers,
    avgScores,
    recentAnswers,
  });
}
