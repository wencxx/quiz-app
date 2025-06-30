"use client"
import { useAuth } from "@/context/AuthContext"
import { usePathname, useRouter } from "next/navigation"
import { useEffect } from "react"

const Loading = () => {
  return <>
    <div className="h-screen w-screen flex items-center justify-center">
      <div className="flex flex-row gap-2">
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.7s]"></div>
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.3s]"></div>
        <div className="w-4 h-4 rounded-full bg-blue-700 animate-bounce [animation-delay:.7s]"></div>
      </div>
    </div>
  </>
}

export default function ProtectedRoute({ children }: { children: React.ReactNode }) {
  // Always call hooks at the top
  const { isAuth, loading, userData } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return

    // If not authenticated and not on login/register, redirect to login
    if (!isAuth && pathname !== "/login" && pathname !== "/register") {
      router.replace("/login")
      return
    }

    // If authenticated and on login/register, redirect based on role
    if (isAuth && (pathname === "/login" || pathname === "/register")) {
      if (userData?.role === "student") {
        router.replace("/user/quiz")
      } else {
        router.replace("/admin/dashboard")
      }
      return
    }

    // If authenticated and role is student, restrict to /user/quiz and /user/result
    if (isAuth && userData?.role === "student") {
      if (pathname !== "/user/quiz" && !pathname.startsWith("/user/result")) {
        router.replace("/user/quiz")
        return
      }
    }

    // If authenticated and role is not student, restrict access to /user/quiz and /user/result
    if (isAuth && userData?.role !== "student") {
      if (pathname.startsWith("/user/quiz") || pathname.startsWith("/user/result")) {
        router.replace("/admin/dashboard")
        return
      }
    }
  }, [isAuth, pathname, router, loading, userData])

  // Show loading indicator while AuthContext is initializing
  if (loading) {
    return <Loading />
  }
  // Prevent rendering children while redirecting
  if (isAuth && (pathname === "/login" || pathname === "/register")) {
    return <Loading />
  }
  if (!isAuth && pathname !== "/login" && pathname !== "/register") {
    return <Loading />
  }
  // Prevent rendering children if student tries to access forbidden routes
  if (isAuth && userData?.role === "student" && pathname !== "/user/quiz" && !pathname.startsWith("/user/result")) {
    return <Loading />
  }
  // Prevent rendering children if non-student tries to access student routes
  if (isAuth && userData?.role !== "student" && (pathname.startsWith("/user/quiz") || pathname.startsWith("/user/result"))) {
    return <Loading />
  }

  return <>{children}</>
}
