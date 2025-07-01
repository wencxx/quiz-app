import { NextRequest, NextResponse } from "next/server";
import { Answer } from "@/models/answers";

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