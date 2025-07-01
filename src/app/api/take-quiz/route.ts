import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Quiz } from "@/models/quiz"
import mongoose from "mongoose"

// GET /api/take-quiz?quizId=xxx
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const quizId = searchParams.get("quizId")
  if (!quizId) {
    return NextResponse.json({ error: "quizId is required" }, { status: 400 })
  }
  await connectDB()
  let quiz = null
  // Try to find by _id if valid ObjectId, else by id
  if (mongoose.Types.ObjectId.isValid(quizId)) {
    quiz = await Quiz.findById(quizId).lean()
  }
  if (!quiz) {
    quiz = await Quiz.findOne({ id: quizId }).lean()
  }
  if (!quiz || Array.isArray(quiz)) {
    return NextResponse.json({ error: "Quiz not found" }, { status: 404 })
  }
  // Remove correct answers before sending to user
  const questions = Array.isArray(quiz.questions)
    ? quiz.questions.map((q: any) => {
        const { correctAnswer, ...rest } = q
        // Ensure options array exists for all question types
        if (rest.type === "true-false") {
          return { ...rest, options: ["True", "False"] }
        }
        if (rest.type === "essay") {
          return { ...rest, options: [] }
        }
        // For multiple-choice, keep options as is
        return rest
      })
    : []
  return NextResponse.json({ ...quiz, questions })
}
