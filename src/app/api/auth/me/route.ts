import { NextRequest, NextResponse } from "next/server"
import jwt from "jsonwebtoken"

const JWT_SECRET = 'quizapp2025'

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ error: "No token provided" }, { status: 401 })
    }
    const token = authHeader.split(" ")[1]
    let payload
    try {
      payload = jwt.verify(token, JWT_SECRET)
    } catch {
      return NextResponse.json({ error: "Invalid token" }, { status: 401 })
    }
    // Only return safe user data
    const { userId, email, _id, role, firstname, middlename, lastname } = payload as { userId: string, email: string, _id?: string, role: string, firstname: string, middlename: string, lastname: string }
    return NextResponse.json({ userId, email, _id, role, firstname, middlename, lastname })
  } catch (err) {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
