"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, FileText, Trophy,  } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"

interface Question {
  id?: string
  type: "multiple-choice" | "true-false" | "essay"
  question: string
  options: string[]
  correctAnswer: number | string
}

interface Quiz {
  _id?: string
  id?: string
  name: string
  subject: string
  description: string
  timer: number // in minutes
  questions: Question[]
  createdAt?: Date | string
}

interface QuizAttempt {
  quizId: string
  answers: (number | string)[]
  score: number
  totalQuestions: number
  timeSpent: number
  completedAt: Date
}

type ViewMode = "list" | "taking"

export default function StudentQuiz() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [loading, setLoading] = useState(true)
  const [currentView, setCurrentView] = useState<ViewMode>("list")
  const [selectedQuiz, setSelectedQuiz] = useState<Quiz | null>(null)
  const [answers, setAnswers] = useState<(number | string)[]>([])
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null)
  const [attempts] = useState<QuizAttempt[]>([])
  const [takenQuizIds, setTakenQuizIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const [showModal, setShowModal] = useState(false)
  const [quizLink, setQuizLink] = useState("")

  const { userData } = useAuth()
  const router = useRouter()

  // Fetch quizzes from backend
  useEffect(() => {
    const fetchQuizzes = async () => {
      setLoading(true)
      try {
        const res = await axios.get("/api/quiz")
        if (Array.isArray(res.data)) {
          setQuizzes(res.data)
        } else {
          setQuizzes([])
        }
      } catch (e) {
        setQuizzes([])
      } finally {
        setLoading(false)
      }
    }
    fetchQuizzes()
  }, [])

  const handleSubmitQuiz = async () => {
    if (!selectedQuiz || !quizStartTime || !userData?._id) return

    setSubmitting(true)
    let score = 0
    selectedQuiz.questions.forEach((question, index) => {
      if (question.type === "multiple-choice" || question.type === "true-false") {
        if (answers[index] === question.correctAnswer) {
          score++
        }
      }
      // Essay questions are not auto-scored
    })

    const timeSpent = Math.floor((new Date().getTime() - quizStartTime.getTime()) / 1000)

    // Save result to backend
    try {
      await axios.post("/api/answer", {
        quizId: selectedQuiz._id || selectedQuiz.id,
        userId: userData._id,
        answers: selectedQuiz.questions.map((q, idx) => ({
          questionIndex: idx,
          answer: answers[idx]
        })),
        timeSpent, // <-- send timeSpent
        score      // <-- send score
      })
    } catch (e) {
      // Optionally handle error (e.g., show notification)
    }

    // Navigate to result page
    const quizId = selectedQuiz._id || selectedQuiz.id
    router.push(`/user/result/${quizId}`)
    setSubmitting(false)
  }

  // Check if user already took a quiz
  useEffect(() => {
    const fetchTakenQuizzes = async () => {
      if (!userData?._id) return
      try {
        const res = await axios.get("/api/quiz") // get all quizzes
        if (Array.isArray(res.data)) {
          const quizIds = res.data.map((q: any) => q._id || q.id)
          // For each quiz, check if user has an answer
          const takenIds: string[] = []
          await Promise.all(
            quizIds.map(async (quizId: string) => {
              try {
                const ansRes = await axios.get(`/api/answer?quizId=${quizId}&userId=${userData._id}`)
                if (ansRes.data && ansRes.data.result) {
                  takenIds.push(quizId)
                }
              } catch {
                // not taken, ignore
              }
            })
          )
          setTakenQuizIds(takenIds)
        }
      } catch {
        setTakenQuizIds([])
      }
    }
    fetchTakenQuizzes()
  }, [userData?._id])

  const startQuiz = async (quiz: Quiz) => {
    // Check if already taken (double check for race condition)
    const quizId = quiz._id || quiz.id || ""
    if (takenQuizIds.includes(quizId)) {
      router.push(`/user/result/${quizId}`)
      return
    }
    // Instead of setting state, redirect to take-quiz page
    router.push(`/user/take-quiz/${quizId}`)
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, "0")}`
  }

  const getScoreColor = (percentage: number) => {
    if (percentage >= 80) return "text-green-600"
    if (percentage >= 60) return "text-yellow-600"
    return "text-red-600"
  }

  // Quiz List View
  if (currentView === "list") {
    // Filter quizzes to only those the user has already taken
    const takenQuizzes = quizzes.filter((quiz) => {
      const quizId = quiz._id || quiz.id || ""
      return takenQuizIds.includes(quizId)
    })

    return (
      <div>
        {/* Enter Quiz Link button at the top */}
        <div className="flex justify-end mb-4">
          <Button
            onClick={() => setShowModal(true)}
            className="bg-green-500 hover:bg-green-600"
          >
            Enter Quiz Link
          </Button>
        </div>

        {/* Modal for entering quiz link */}
        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Enter Quiz Link or Code</DialogTitle>
            </DialogHeader>
            <Input
              placeholder="Paste quiz link or enter code"
              value={quizLink}
              onChange={e => setQuizLink(e.target.value)}
              className="mb-4"
            />
            <DialogFooter>
              <Button
                disabled={!quizLink.trim()}
                onClick={() => {
                  // Extract quiz id from link or use as code
                  let quizId = ""
                  try {
                    // Try to extract from URL
                    const url = new URL(quizLink)
                    // Example: /user/take-quiz/123 or /take-quiz/123
                    const parts = url.pathname.split("/")
                    quizId = parts[parts.length - 1] || ""
                  } catch {
                    // Not a URL, treat as code/id
                    quizId = quizLink.trim()
                  }
                  if (quizId) {
                    setShowModal(false)
                    setQuizLink("")
                    router.push(`/user/take-quiz/${quizId}`)
                  }
                }}
                className="bg-green-500 hover:bg-green-600"
              >
                Take Quiz
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        <div className="mb-8">
          <h1 className="text-3xl font-bold">Taken Quizzes</h1>
          <p className="text-muted-foreground mt-2">These are the quizzes you have already taken.</p>
        </div>

        {loading ? (
          <div>Loading quizzes...</div>
        ) : takenQuizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes taken yet</h3>
              <p className="text-muted-foreground">Take a quiz to see it here.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {takenQuizzes.map((quiz) => {
              const quizId = quiz._id || quiz.id || ""
              const alreadyTaken = takenQuizIds.includes(quizId)
              const previousAttempts = attempts.filter((a) => a.quizId === quizId)
              const bestScore =
                previousAttempts.length > 0
                  ? Math.max(...previousAttempts.map((a) => (a.score / a.totalQuestions) * 100))
                  : null

              return (
                <Card key={quizId} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle className="text-xl">{quiz.name} - {quiz.subject}</CardTitle>
                    <CardDescription>{quiz.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          {quiz.timer} minutes
                        </div>
                        <Badge variant="secondary">{quiz.questions.length} questions</Badge>
                      </div>

                      {bestScore !== null && (
                        <div className="flex items-center gap-2">
                          <Trophy className="w-4 h-4 text-yellow-600" />
                          <span className="text-sm">
                            Best Score: <span className={getScoreColor(bestScore)}>{bestScore.toFixed(0)}%</span>
                          </span>
                        </div>
                      )}

                      {previousAttempts.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          Attempted {previousAttempts.length} time{previousAttempts.length !== 1 ? "s" : ""}
                        </p>
                      )}

                      <div className="flex gap-2">
                        <Button
                          onClick={() => router.push(`/user/result/${quizId}`)}
                          className="flex-1 bg-blue-500 hover:bg-blue-600"
                        >
                          View Results
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>
    )
  }

  return null
}