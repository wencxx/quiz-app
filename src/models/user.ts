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
  subject: string
}

const UserSchema = new mongoose.Schema<IUser>({
  name: { type: String, required: true },
  gender: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  role: { type: String, required: true, enum: ["student", "teacher"], default: "student" },

  grade: {
    type: String,
    validate: {
      validator: function (this: IUser, v: string) {
        return this.role !== "student" || !!v
      },
      message: "Grade is required for students",
    },
  },
  section: {
    type: String,
    validate: {
      validator: function (this: IUser, v: string) {
        return this.role !== "student" || !!v
      },
      message: "Section is required for students",
    },
  },
  subject: {
    type: String,
    validate: {
      validator: function (this: IUser, v: string) {
        return this.role !== "teacher" || !!v
      },
      message: "Subject is required for teachers",
    },
  },
}, { timestamps: true, strict: false })

UserSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next()
  this.password = await bcrypt.hash(this.password, 10)
  next()
})

export const User = mongoose.models.User || mongoose.model("User", UserSchema)