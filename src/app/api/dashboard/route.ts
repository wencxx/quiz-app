import { connectDB } from "@/lib/mongodb";
import { User } from "@/models/user";
import { Quiz } from "@/models/quiz";
import { Answer } from "@/models/answers";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  await connectDB();

  // Get userId from query params
  const { searchParams } = new URL(req.url);
  const userId = searchParams.get("userId");

  // Total users and breakdown by role
  const totalUsers = await User.countDocuments();
  const roles = await User.aggregate([
    { $group: { _id: "$role", count: { $sum: 1 } } }
  ]);

  // Only count quizzes where userId matches (if provided)
  let totalQuizzes = 0;
  let quizIds: any[] = [];
  if (userId) {
    const quizzes = await Quiz.find({ userId });
    totalQuizzes = quizzes.length;
    quizIds = quizzes.map(q => q._id);
  } else {
    totalQuizzes = await Quiz.countDocuments();
    quizIds = (await Quiz.find({})).map(q => q._id);
  }

  // Only count answers for those quizzes
  let totalAnswers = 0;
  let avgScores = [];
  let recentAnswers = [];
  if (quizIds.length > 0) {
    totalAnswers = await Answer.countDocuments({ quizId: { $in: quizIds } });

    avgScores = await Answer.aggregate([
      { $match: { quizId: { $in: quizIds } } },
      { $group: { _id: "$quizId", avgScore: { $avg: "$score" }, submissions: { $sum: 1 } } },
      { $lookup: { from: "quizzes", localField: "_id", foreignField: "_id", as: "quiz" } },
      { $unwind: "$quiz" },
      { $project: { quizName: "$quiz.name", avgScore: 1, submissions: 1 } }
    ]);

    recentAnswers = await Answer.find({ quizId: { $in: quizIds } })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId", "name email")
      .populate("quizId", "name");
  }

  return NextResponse.json({
    totalUsers,
    roles,
    totalQuizzes,
    totalAnswers,
    avgScores,
    recentAnswers,
  });
}
