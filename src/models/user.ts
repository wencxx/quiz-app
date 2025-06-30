import mongoose, { Document } from "mongoose"
import bcrypt from "bcryptjs"

export interface IUser extends Document {
  name: string
  gender: string
  grade: string
  role: string
  section: string
  email: string
  password: string
}

const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  role: { type: String, required: true, default: 'student' },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
})

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

export const User = mongoose.models.User || mongoose.model("User", UserSchema)