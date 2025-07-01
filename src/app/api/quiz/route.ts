import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Quiz } from "@/models/quiz"

export async function GET(){
    await connectDB()

    const quizzes = await Quiz.find()

    if(!quizzes.length) return NextResponse.json({ status: 404, message: 'No quizzes available' }) 

    return NextResponse.json(quizzes, { status: 200 })
}

export async function POST(request: Request){
    await connectDB()

    const body = await request.json()
    console.log(body)
    type QuestionInput = {
        type: "multiple-choice" | "true-false" | "essay";
        question: string;
        options?: string[];
        correctAnswer?: number | string;
        [key: string]: unknown;
    };

    if (Array.isArray(body.questions)) {
        body.questions = body.questions.map((q: QuestionInput) => {
            // Always set correctAnswer for every question
            if (q.type === "essay") {
                return {
                    ...q,
                    options: [],
                    correctAnswer: ""
                }
            }
            if (q.type === "true-false") {
                return {
                    ...q,
                    options: ["True", "False"],
                    correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0
                }
            }
            if (q.type === "multiple-choice") {
                return {
                    ...q,
                    options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
                    correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0
                }
            }
            // fallback: always set correctAnswer (required by schema)
            return {
                ...q,
                correctAnswer: q.correctAnswer !== undefined ? q.correctAnswer : ""
            }
        })
    }

    try {
        const newQuiz = await Quiz.create(body)
        return NextResponse.json(newQuiz, { status: 200 })
    } catch (err: unknown) {
        const error = err as Error
        console.error("Quiz.create error:", error)
        return NextResponse.json(
            { status: 500, message: error.message || "Unknown server error", error },
            { status: 500 }
        )
    }
}

export async function DELETE(request: Request) {
    await connectDB();

    // Get quizId from query or body
    let quizId: string | null = null;
    if (request.method === 'DELETE') {
        // For fetch with body
        try {
            const body = await request.json();
            quizId = body.quizId;
        } catch {
            // fallback to query
        }
    }
    if (!quizId) {
        // Try to get from searchParams (for DELETE with query string)
        const url = new URL(request.url);
        quizId = url.searchParams.get('quizId');
    }
    if (!quizId) {
        return NextResponse.json({ status: 400, message: 'Quiz ID is required' });
    }

    const deleted = await Quiz.findByIdAndDelete(quizId);
    if (!deleted) {
        return NextResponse.json({ status: 404, message: 'Quiz not found' });
    }
    return NextResponse.json({ status: 200, message: 'Quiz deleted' });
}

export async function PUT(request: Request) {
    await connectDB();
    const body = await request.json();
    const { quizId, name, description, timer, questions } = body;
    if (!quizId) {
        return NextResponse.json({ status: 400, message: 'Quiz ID is required' });
    }
    const updated = await Quiz.findByIdAndUpdate(
        quizId,
        { name, description, timer, questions },
        { new: true }
    );
    if (!updated) {
        return NextResponse.json({ status: 404, message: 'Quiz not found' });
    }
    return NextResponse.json(updated, { status: 200 });
}