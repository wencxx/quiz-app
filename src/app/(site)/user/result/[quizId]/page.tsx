"use client"

import { useEffect, useState } from "react"
import axios from "axios"
import { useParams, useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Trophy, CheckCircle, XCircle, FileText, RotateCcw } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

function formatTime(seconds: number) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, "0")}`
}

function getScoreColor(percentage: number) {
  if (percentage >= 80) return "text-green-600"
  if (percentage >= 60) return "text-yellow-600"
  return "text-red-600"
}

function getScoreBadgeVariant(percentage: number) {
  if (percentage >= 80) return "default"
  if (percentage >= 60) return "secondary"
  return "destructive"
}

interface Quiz {
  _id?: string
  id?: string
  name: string
  description: string
  questions: Question[]
}

interface Question {
  id?: string
  type: "multiple-choice" | "true-false" | "essay"
  question: string
  options: string[]
  correctAnswer: number | string
}

interface Attempt {
  answers: (number | string)[]
  score: number
  totalQuestions: number
  timeSpent: number
  completedAt: string
}

export default function QuizResultPage() {
  const params = useParams()
  const router = useRouter()
  const { userData } = useAuth()
  const quizId = params.quizId as string

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [attempt, setAttempt] = useState<Attempt | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const [quizRes, answerRes] = await Promise.all([
          axios.get("/api/quiz"),
          userData?._id
            ? axios.get(`/api/answer?quizId=${quizId}&userId=${userData._id}`)
            : Promise.resolve({ data: null })
        ])
        const foundQuiz = Array.isArray(quizRes.data)
          ? quizRes.data.find((q: Quiz) => (q._id || q.id) === quizId)
          : null
        setQuiz(foundQuiz)
        if (answerRes.data && answerRes.data.result && foundQuiz) {
          // Calculate score
          let score = 0
          foundQuiz.questions.forEach((question: Question, idx: number) => {
            if (question.type === "multiple-choice" || question.type === "true-false") {
              if (answerRes.data.result.answers[idx]?.answer === question.correctAnswer) {
                score++
              }
            }
          })
          setAttempt({
            answers: answerRes.data.result.answers.map((a: { answer: number | string }) => a.answer),
            score,
            totalQuestions: foundQuiz.questions.length,
            timeSpent: answerRes.data.result.timeSpent || 0, // use backend value
            completedAt: answerRes.data.result.updatedAt || answerRes.data.result.createdAt,
          })
        } else {
          setAttempt(null)
        }
      } catch {
        setQuiz(null)
        setAttempt(null)
      } finally {
        setLoading(false)
      }
    }
    if (quizId && userData?._id) fetchData()
  }, [quizId, userData?._id])

  if (loading) {
    return <div>Loading result...</div>
  }

  if (!quiz) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Quiz not found</h3>
          <p className="text-muted-foreground mb-4">The quiz does not exist.</p>
          <Button onClick={() => router.push("/user/quiz")}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Back to Quizzes
          </Button>
        </CardContent>
      </Card>
    )
  }

  if (!attempt) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">No attempt found</h3>
          <p className="text-muted-foreground mb-4">You haven&apos;t taken this quiz yet.</p>
          <Button onClick={() => router.push("/user/quiz")}>
            <RotateCcw className="w-4 h-4 mr-2" />
            Back to Quizzes
          </Button>
        </CardContent>
      </Card>
    )
  }

  const percentage = (attempt.score / attempt.totalQuestions) * 100

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <Button
          variant="ghost"
          onClick={() => router.push("/user/quiz")}
          className="mb-4"
        >
          ← Back to Quizzes
        </Button>
        <h1 className="text-3xl font-bold">{quiz.name}</h1>
        <p className="text-muted-foreground mt-2">{quiz.description}</p>
      </div>
      {/* Score Summary */}
      <Card className="mb-8">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            {percentage >= 80 ? (
              <Trophy className="w-16 h-16 text-yellow-600" />
            ) : percentage >= 60 ? (
              <CheckCircle className="w-16 h-16 text-green-600" />
            ) : (
              <XCircle className="w-16 h-16 text-red-600" />
            )}
          </div>
          <CardTitle className="text-4xl mb-2">
            <span className={getScoreColor(percentage)}>{percentage.toFixed(0)}%</span>
          </CardTitle>
          <CardDescription className="text-lg">
            {attempt.score} out of {attempt.totalQuestions} correct
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <p className="text-sm text-muted-foreground">Time Spent</p>
              <p className="text-lg font-semibold">{formatTime(attempt.timeSpent)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Grade</p>
              <Badge variant={getScoreBadgeVariant(percentage)} className="text-sm">
                {percentage >= 80 ? "Excellent" : percentage >= 60 ? "Good" : "Needs Improvement"}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Results */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Question Review</CardTitle>
          <CardDescription>Review your answers and see the correct solutions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {quiz.questions.map((question: any, index: number) => {
              const userAnswer = attempt.answers[index]
              const isCorrect =
                (question.type === "multiple-choice" || question.type === "true-false")
                  ? userAnswer === question.correctAnswer
                  : undefined

              return (
                <div key={question.id || index} className="border rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    {(question.type === "multiple-choice" || question.type === "true-false") ? (
                      isCorrect ? (
                        <CheckCircle className="w-5 h-5 text-green-600 mt-1 flex-shrink-0" />
                      ) : (
                        <XCircle className="w-5 h-5 text-red-600 mt-1 flex-shrink-0" />
                      )
                    ) : (
                      <FileText className="w-5 h-5 text-muted-foreground mt-1 flex-shrink-0" />
                    )}
                    <div className="flex-1">
                      <h4 className="font-medium mb-2">
                        {index + 1}. {question.question}
                      </h4>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="text-muted-foreground">Your answer: </span>
                          {question.type === "multiple-choice" || question.type === "true-false" ? (
                            <span className={isCorrect ? "text-green-600" : "text-red-600"}>
                              {userAnswer !== -1 && typeof userAnswer === "number"
                                ? question.options[userAnswer]
                                : "Not answered"}
                            </span>
                          ) : (
                            <span>
                              {typeof userAnswer === "string" && userAnswer.trim() !== ""
                                ? userAnswer
                                : "Not answered"}
                            </span>
                          )}
                        </p>
                        {(question.type === "multiple-choice" || question.type === "true-false") && !isCorrect && (
                          <p>
                            <span className="text-muted-foreground">Correct answer: </span>
                            <span className="text-green-600">
                              {typeof question.correctAnswer === "number"
                                ? question.options[question.correctAnswer]
                                : ""}
                            </span>
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </CardContent>
      </Card>
      {/* Actions */}
      <div className="flex justify-center">
        <Button onClick={() => router.push("/user/quiz")} variant="outline">
          <RotateCcw className="w-4 h-4 mr-2" />
          Back to Quizzes
        </Button>
      </div>
    </div>
  )
}
