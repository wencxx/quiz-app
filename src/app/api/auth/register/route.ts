import { NextRequest, NextResponse } from "next/server"
import mongoose from "mongoose"
import { connectDB } from "@/lib/mongodb"
import { User } from "@/models/user"

export async function POST(req: NextRequest) {
  try {
    await connectDB()

    const body = await req.json()
    const {
      firstname,
      middlename,
      lastname,
      gender,
      email,
      password,
      role,
      grade,
      section,
      subject
    } = body

    // Validate required fields based on role
    if (!firstname || !middlename || !lastname || !gender || !email || !password || !role) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    if (role === "student" && (!grade || !section)) {
      return NextResponse.json({ message: "Grade and section are required for students" }, { status: 400 })
    }

    const existing = await User.findOne({ email })
    if (existing) {
      return NextResponse.json({ message: "Email already registered" }, { status: 400 })
    }

    // Create user with role-specific fields
    const user = new User({
      firstname,
      middlename,
      lastname,
      gender,
      email,
      password, // plain text password if using pre-save hashing
      role,
      grade: role === "student" ? grade : undefined,
      section: role === "student" ? section : undefined,
    })

    await user.save()

    return NextResponse.json({ message: "User registered successfully" }, { status: 201 })
  } catch (err: any) {
    console.error("Registration error:", err)

    if (err.message?.includes("MONGODB_URI")) {
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
