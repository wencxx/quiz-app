import { NextRequest, NextResponse } from "next/server"
import {User} from "@/models/user"
import mongoose from "mongoose"
import { connectDB } from "@/lib/mongodb"

export async function POST(req: NextRequest) {
  try {
    await connectDB()
    const { name, gender, grade, section, email, password } = await req.json()

    if (!name || !gender || !grade || !section || !email || !password) {
      return NextResponse.json({ message: "All fields are required" }, { status: 400 })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 })
    }

    const user = new User({
      name,
      gender,
      grade,
      section,
      email,
      password, // pass plain password if using pre-save hook
    })
    await user.save()

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (err: any) {
    // Enhanced error logging
    console.error("Registration error:", err)
    if (err.message && err.message.includes("MONGODB_URI")) {
      return NextResponse.json({ message: "Server misconfiguration: MONGODB_URI not set" }, { status: 500 })
    }
    if (err instanceof mongoose.Error.ValidationError) {
      return NextResponse.json({ message: err.message }, { status: 400 })
    }
    if (err.code === 11000) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 })
    }
    return NextResponse.json({ message: "Server error: " + (err.message || "Unknown error") }, { status: 500 })
  }
}
