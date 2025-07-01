import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import { Quiz } from "@/models/quiz"

export async function GET(req: Request){
    await connectDB()

    // Parse userId from query string
    const { searchParams } = new URL(req.url)
    const userId = searchParams.get("userId")

    let quizzes
    if (userId) {
        quizzes = await Quiz.find({ userId })
    } else {
        quizzes = await Quiz.find()
    }

    if(!quizzes.length) return NextResponse.json({ status: 404, message: 'No quizzes available' }) 

    return NextResponse.json(quizzes, { status: 200 })
}