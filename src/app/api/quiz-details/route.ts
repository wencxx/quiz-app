// app/api/quiz-details/answers/route.ts
import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
// import { User } from "@/models/user" // <-- Remove this line
import { Quiz } from "@/models/quiz"
import { Answer } from "@/models/answers"

export async function GET(req: Request) {
  await connectDB()
  const { searchParams } = new URL(req.url)
  const quizId = searchParams.get("quizId")

  if (!quizId) {
    return NextResponse.json({ error: "quizId is required" }, { status: 400 })
  }

  // Fetch quiz info
  const quiz = await Quiz.findById(quizId).lean()
  if (!quiz) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }

  // Safely extract name and description
  const { name = "N/A", description = "N/A" } = quiz as { name?: string; description?: string }

  // Fetch answers
  const answers = await Answer.find({ quizId })
    .populate("userId", "name email")
    .lean()

  // Format answers to match frontend expectations
  const formattedAnswers = answers.map(ans => ({
    _id: ans._id,
    user: ans.userId && typeof ans.userId === 'object' ? {
      name: ans.userId.name ?? "N/A",
      email: ans.userId.email ?? "N/A"
    } : undefined,
    score: ans.score,
    createdAt: ans.createdAt,
  }))

  // Return both quiz and answers
  return NextResponse.json({
    quiz: {
      name,
      description,
    },
    answers: formattedAnswers
  })
}
