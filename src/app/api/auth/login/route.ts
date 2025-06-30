import { NextRequest, NextResponse } from "next/server";
import {User} from "@/models/user";
import bcrypt from "bcryptjs";
import jwt from 'jsonwebtoken'
import { connectDB } from "@/lib/mongodb"


const JWT_SECRET = 'quizapp2025';

export async function POST(req: NextRequest) {
  try {
    if (!JWT_SECRET) {
      console.error("JWT_SECRET is not defined");
      return NextResponse.json({ error: "Server misconfiguration" }, { status: 500 });
    }
    await connectDB();
    let body;
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }
    const { email, password } = body || {};

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, _id: user._id, role: user.role, name: user.name }, // include _id
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    return NextResponse.json({ token });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
