"use client"

import { useEffect, useState, use as useUnwrap } from "react"
import { useRouter } from "next/navigation"
import axios from "axios"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Timer } from "lucide-react"
import { useAuth } from "@/context/AuthContext"

interface Question {
  type: "multiple-choice" | "true-false" | "essay"
  points: number
  question: string
  options: string[]
}

interface Quiz {
  _id?: string
  id?: string
  name: string
  description: string
  timer: number
  questions: Question[]
}

export default function TakeQuizPage({ params }: { params: Promise<{ quizId: string }> }) {
  // Unwrap params using React.use()
  const { quizId } = useUnwrap(params)

  const [quiz, setQuiz] = useState<Quiz | null>(null)
  const [loading, setLoading] = useState(true)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<(number | string)[]>([])
  const [timeLeft, setTimeLeft] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [quizStartTime, setQuizStartTime] = useState<Date | null>(null)
  const router = useRouter()
  const { userData } = useAuth()

  useEffect(() => {
    const fetchQuiz = async () => {
      setLoading(true)
      try {
        const res = await axios.get(`/api/take-quiz?quizId=${quizId}`)
        setQuiz(res.data)
        setAnswers(res.data.questions.map((q: any) => (q.type === "essay" ? "" : -1)))
        setTimeLeft(res.data.timer * 60)
        setQuizStartTime(new Date())
      } catch {
        setQuiz(null)
      } finally {
        setLoading(false)
      }
    }
    fetchQuiz()
  }, [quizId])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (quiz && timeLeft > 0) {
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
    // eslint-disable-next-line
  }, [quiz, timeLeft])

  const handleAnswerSelect = (answerIndex: number) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = answerIndex
    setAnswers(newAnswers)
  }

  const handleEssayAnswer = (value: string) => {
    const newAnswers = [...answers]
    newAnswers[currentQuestionIndex] = value
    setAnswers(newAnswers)
  }

  const goToNextQuestion = () => {
    if (quiz && currentQuestionIndex < quiz.questions.length - 1) {
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

  const handleSubmitQuiz = async () => {
    if (!quiz || !quizStartTime || !userData?._id) return
    setSubmitting(true)
    const timeSpent = Math.floor((new Date().getTime() - quizStartTime.getTime()) / 1000)
    try {
      await axios.post("/api/answer", {
        quizId: quiz._id || quiz.id,
        userId: userData._id,
        answers: quiz.questions.map((q, idx) => ({
          questionIndex: idx,
          answer: answers[idx]
        })),
        timeSpent,
      })
    } catch {}
    router.push(`/user/result/${quiz._id || quiz.id}`)
    setSubmitting(false)
  }

  if (loading) return <div>Loading quiz...</div>
  if (!quiz) return <div>Quiz not found.</div>

  const currentQuestion = quiz.questions[currentQuestionIndex]
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100
  const answeredQuestions = answers.filter((a, idx) => {
    const q = quiz.questions[idx]
    if (q.type === "essay") return typeof a === "string" && a.trim() !== ""
    return a !== -1
  }).length

  return (
    <div className="container mx-auto p-6 max-w-3xl">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{quiz.name}</h1>
          <div className="flex items-center gap-2 text-lg font-mono">
            <Timer className="w-5 h-5" />
            <span className={timeLeft < 300 ? "text-red-600" : ""}>{formatTime(timeLeft)}</span>
          </div>
        </div>
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>
              Question {currentQuestionIndex + 1} of {quiz.questions.length}
            </span>
            <span>{answeredQuestions} answered</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>
      </div>
      {/* Question */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-lg flex justify-between items-center">
            <span >{currentQuestionIndex + 1}. {currentQuestion.question}</span>
            <span className="text-sm text-green-500 font-medium">{currentQuestion.points} point(s)</span>
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
          {currentQuestionIndex === quiz.questions.length - 1 ? (
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
