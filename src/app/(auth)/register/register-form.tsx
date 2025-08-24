"use client"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import Link from "next/link"
import { useState } from "react"
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog"

export function RegisterForm({
  className,
  ...props
}: React.ComponentProps<"div">) {
  const [form, setForm] = useState({
    firstname: "",
    middlename: "",
    lastname: "",
    gender: "",
    grade: "",
    section: "",
    email: "",
    password: "",
    confirmPassword: "",
    role: "", // no default, must pick
  })
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [showRoleDialog, setShowRoleDialog] = useState(true) // show on mount

  // Unified handleChange for all fields
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.id]: e.target.value })
  }

  const handleDialogConfirm = () => {
    setShowRoleDialog(false)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match")
      return
    }
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          firstname: form.firstname,
          middlename: form.middlename,
          lastname: form.lastname,
          gender: form.gender,
          grade: form.grade,
          section: form.section,
          email: form.email,
          password: form.password,
          role: form.role, // send role to backend
        }),
      })
      let data
      try {
        data = await res.json()
      } catch (jsonErr) {
        setError("Invalid server response")
        setLoading(false)
        return
      }
      if (!res.ok) {
        // Show backend error message if available
        setError(data.message || "Registration failed")
      } else {
        setSuccess("Registration successful! You can now login.")
      }
    } catch (err: any) {
      setError("Something went wrong: " + (err?.message || "Unknown error"))
      console.error("Fetch error:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className={cn("flex flex-col gap-6", className)} {...props}>
      {/* Role selection dialog, shown on mount if no role */}
      <Dialog open={showRoleDialog} onOpenChange={() => { }}>
        <DialogContent showCloseButton={false}>
          <DialogTitle>Select your role</DialogTitle>
          <DialogDescription>
            Are you registering as a student or a teacher?
          </DialogDescription>
          <div className="flex gap-4 mt-4 justify-center">
            <Button onClick={() => { setForm(f => ({ ...f, role: "student" })); setShowRoleDialog(false); }}>Student</Button>
            <Button onClick={() => { setForm(f => ({ ...f, role: "teacher" })); setShowRoleDialog(false); }}>Teacher</Button>
          </div>
        </DialogContent>
      </Dialog>
      <Card className="max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Enter your email below to login to your account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Remove role dropdown */}
              <div className="grid gap-3">
                <Label htmlFor="firstname">First Name</Label>
                <Input
                  id="firstname"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={form.firstname}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="middlename">Middle Name</Label>
                <Input
                  id="middlename"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={form.middlename}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="lastname">Last Name</Label>
                <Input
                  id="lastname"
                  type="text"
                  placeholder="John Doe"
                  required
                  value={form.lastname}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="gender">Gender</Label>
                <select
                  id="gender"
                  name="gender"
                  required
                  className="border rounded px-3 py-2"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="">Select gender</option>
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                  <option value="other">Other</option>
                </select>
              </div>
              {form.role === "student" && (
                <>
                  <div className="grid gap-3">
                    <Label htmlFor="grade">Grade</Label>
                    <Input
                      id="grade"
                      type="text"
                      placeholder="e.g. 10"
                      required
                      value={form.grade}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="grid gap-3">
                    <Label htmlFor="section">Section</Label>
                    <Input
                      id="section"
                      type="text"
                      placeholder="e.g. A"
                      required
                      value={form.section}
                      onChange={handleChange}
                    />
                  </div>
                </>
              )}
              <div className="grid gap-3">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="m@example.com"
                  required
                  value={form.email}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  required
                  value={form.password}
                  onChange={handleChange}
                />
              </div>
              <div className="grid gap-3">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  required
                  value={form.confirmPassword}
                  onChange={handleChange}
                />
              </div>
              <div className="flex flex-col gap-3 md:col-span-2">
                <Button type="submit" className="w-full" disabled={loading || !form.role}>
                  {loading ? "Registering..." : "Register"}
                </Button>
              </div>
            </div>
            {error && <div className="text-red-500 mt-2">{error}</div>}
            {success && <div className="text-green-600 mt-2">{success}</div>}
            <div className="mt-4 text-center text-sm">
              Already have an account?{" "}
              <Link href="/login" className="underline underline-offset-4">
                Login
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
