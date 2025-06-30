import { NextRequest, NextResponse } from "next/server";
import { Answer } from "@/models/answers";

export async function POST(req: NextRequest) {
  try {
    const { quizId, userId, answers, timeSpent, score } = await req.json();

    if (!quizId || !userId || !Array.isArray(answers) || typeof timeSpent !== "number") {
      return NextResponse.json({ error: "Missing fields" }, { status: 400 });
    }

    // Check if already submitted
    const existing = await Answer.findOne({ quizId, userId });
    if (existing) {
      return NextResponse.json({ message: "Quiz already taken", result: existing }, { status: 200 });
    }

    // Save new answer
    const newAnswer = await Answer.create({ quizId, userId, answers, timeSpent, score });

    return NextResponse.json({ message: "Submission successful", result: newAnswer }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const quizId = searchParams.get("quizId");
    const userId = searchParams.get("userId");

    if (!quizId || !userId) {
      return NextResponse.json({ error: "Missing quizId or userId" }, { status: 400 });
    }

    const answer = await Answer.findOne({ quizId, userId });
    if (!answer) {
      return NextResponse.json({ error: "No submission found" }, { status: 404 });
    }

    return NextResponse.json({ result: answer }, { status: 200 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}