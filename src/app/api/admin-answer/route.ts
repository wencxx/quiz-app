import { NextRequest, NextResponse } from "next/server";
import { Answer } from "@/models/answers";
import { Quiz } from "@/models/quiz";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");

    if (!quizId) {
      return NextResponse.json({ error: "Missing quizId or userId" }, { status: 400 });
    }

    const answer = await Answer.findOne({ quizId });
    if (!answer) {
      return NextResponse.json({ error: "No submission found" }, { status: 404 });
    }

    return NextResponse.json({ result: answer }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { quizId, userId, questionIndex, points } = await req.json();
    if (!quizId || !userId || typeof questionIndex !== "number" || typeof points !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Get the quiz to check max points for the question
    const quiz = await Quiz.findOne({ $or: [{ _id: quizId }, { id: quizId }] });
    if (!quiz) {
      return NextResponse.json({ error: "Quiz not found" }, { status: 404 });
    }
    const question = quiz.questions[questionIndex];
    if (!question || question.type !== "essay") {
      return NextResponse.json({ error: "Invalid question" }, { status: 400 });
    }
    if (points > question.points) {
      return NextResponse.json({ error: "Points cannot exceed question's max points" }, { status: 400 });
    }

    // Update the answer's points
    const answerDoc = await Answer.findOne({ quizId, userId });
    if (!answerDoc) {
      return NextResponse.json({ error: "Answer not found" }, { status: 404 });
    }
    if (!Array.isArray(answerDoc.answers) || !answerDoc.answers[questionIndex]) {
      return NextResponse.json({ error: "Answer for question not found" }, { status: 404 });
    }
    answerDoc.answers[questionIndex].points = points;

    // Optionally, recalculate total score (sum all points for essay + correct MC/TF)
    let totalScore = 0;
    quiz.questions.forEach((q: any, idx: number) => {
      const ans = answerDoc.answers[idx];
      if (!ans) return;
      if (q.type === "essay") {
        totalScore += typeof ans.points === "number" ? ans.points : 0;
      } else if (
        (q.type === "multiple-choice" || q.type === "true-false") &&
        ans.answer === q.correctAnswer
      ) {
        totalScore += q.points;
      }
    });
    answerDoc.score = totalScore;

    await answerDoc.save();

    return NextResponse.json({ message: "Graded successfully", result: answerDoc }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}