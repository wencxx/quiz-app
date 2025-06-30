"use client"

import { useState, useEffect } from "react"
import axios from "axios"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Clock, FileText, Trophy, Play, Timer } from "lucide-react"
import { Textarea } from "@/components/ui/textarea"
import { useAuth } from "@/context/AuthContext"

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
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | string)[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null)
  const [attempts] = useState<QuizAttempt[]>([])
  const [takenQuizIds, setTakenQuizIds] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

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

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout
    if (currentView === "taking" && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            handleSubmitQuiz()
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }
    return () => clearInterval(interval)
  }, [currentView, timeLeft, handleSubmitQuiz])

  const startQuiz = async (quiz: Quiz) => {
    // Check if already taken (double check for race condition)
    const quizId = quiz._id || quiz.id || ""
    if (takenQuizIds.includes(quizId)) {
      router.push(`/user/result/${quizId}`)
      return
    }

    setSelectedQuiz(quiz)
    setCurrentQuestionIndex(0)
    setAnswers(
      quiz.questions.map(q =>
        q.type === "essay" ? "" : -1
      )
    )
    setTimeLeft(quiz.timer * 60)
    setQuizStartTime(new Date())
    setCurrentView("taking")
  }

  // For MCQ/TF
  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  // For essay
  const handleEssayAnswer = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = value
    setAnswers(newAnswers)
  }

  const goToNextQuestion = () => {
    if (selectedQuiz && currentQuestionIndex < selectedQuiz.questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1)
    }
  }

  const goToPreviousQuestion = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1)
    }
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
    return (
      <div>
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Available Quizzes</h1>
          <p className="text-muted-foreground mt-2">Select a quiz to test your knowledge</p>
        </div>

        {loading ? (
          <div>Loading quizzes...</div>
        ) : quizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes available</h3>
              <p className="text-muted-foreground">Check back later for new quizzes</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quizzes.map((quiz) => {
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
                    <CardTitle className="text-xl">{quiz.name}</CardTitle>
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
                        {!alreadyTaken ? (
                          <Button onClick={() => startQuiz(quiz)} className="flex-1">
                            <Play className="w-4 h-4 mr-2" />
                            Start Quiz
                          </Button>
                        ) : (
                          <Button
                            onClick={() => router.push(`/user/result/${quizId}`)}
                            className="flex-1 bg-blue-500 hover:bg-blue-600"
                          >
                            View Results
                          </Button>
                        )}
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

  // Quiz Taking View
  if (currentView === "taking" && selectedQuiz) {
    const currentQuestion = selectedQuiz.questions[currentQuestionIndex]
    const progress = ((currentQuestionIndex + 1) / selectedQuiz.questions.length) * 100
    const answeredQuestions = answers.filter((a, idx) => {
      const q = selectedQuiz.questions[idx]
      if (q.type === "essay") return typeof a === "string" && a.trim() !== ""
      return a !== -1
    }).length

    return (
      <div className="container mx-auto p-6 max-w-3xl">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold">{selectedQuiz.name}</h1>
            <div className="flex items-center gap-2 text-lg font-mono">
              <Timer className="w-5 h-5" />
              <span className={timeLeft < 300 ? "text-red-600" : ""}>{formatTime(timeLeft)}</span>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>
                Question {currentQuestionIndex + 1} of {selectedQuiz.questions.length}
              </span>
              <span>{answeredQuestions} answered</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        </div>

        {/* Question */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg">
              {currentQuestionIndex + 1}. {currentQuestion.question}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {currentQuestion.type === "multiple-choice" && (
              <RadioGroup
                value={answers[currentQuestionIndex]?.toString() || ""}
                onValueChange={(value) => handleAnswerSelect(Number.parseInt(value))}
              >
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {currentQuestion.type === "true-false" && (
              <RadioGroup
                value={answers[currentQuestionIndex]?.toString() || ""}
                onValueChange={(value) => handleAnswerSelect(Number.parseInt(value))}
              >
                {["True", "False"].map((option, index) => (
                  <div key={index} className="flex items-center space-x-2 p-3 rounded-lg hover:bg-muted">
                    <RadioGroupItem value={index.toString()} id={`tf-option-${index}`} />
                    <Label htmlFor={`tf-option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}
            {currentQuestion.type === "essay" && (
              <div>
                <Label htmlFor={`essay-${currentQuestionIndex}`}>Your Answer</Label>
                <Textarea
                  id={`essay-${currentQuestionIndex}`}
                  value={typeof answers[currentQuestionIndex] === "string" ? answers[currentQuestionIndex] : ""}
                  onChange={e => handleEssayAnswer(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={5}
                  className="mt-2"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button variant="outline" onClick={goToPreviousQuestion} disabled={currentQuestionIndex === 0 || submitting}>
            Previous
          </Button>

          <div className="flex gap-2">
            {currentQuestionIndex === selectedQuiz.questions.length - 1 ? (
              <Button
                onClick={handleSubmitQuiz}
                disabled={answeredQuestions === 0 || submitting}
                className={submitting ? "animate-pulse" : ""}
              >
                {submitting ? "Submitting Quiz..." : "Submit Quiz"}
              </Button>
            ) : (
              <Button onClick={goToNextQuestion} disabled={submitting}>Next</Button>
            )}
          </div>
        </div>
      </div>
    )
  }

  return null
}