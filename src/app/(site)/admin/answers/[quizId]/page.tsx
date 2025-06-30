"use client"

  import { useEffect, useState } from "react"
  import { useParams } from "next/navigation"
  import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
  import { ScrollArea } from "@/components/ui/scroll-area"
  import { Skeleton } from "@/components/ui/skeleton"

  interface Answer {
    _id?: string
    user?: { name?: string; email?: string }
    score?: number
    createdAt?: string
  }

  interface Quiz {
    name: string
    description: string
  }

  export default function AnswersPage() {
    const params = useParams()
    const quizId = params?.quizId as string

    const [quiz, setQuiz] = useState<Quiz | null>(null)
    const [answers, setAnswers] = useState<Answer[]>([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
      console.log("quizId param:", quizId) // Already present
      const fetchData = async () => {
        setLoading(true)
        try {
          // Fetch quiz info and answers in one request
          const res = await fetch(`/api/quiz-details?quizId=${quizId}`)
          console.log("API status:", res.status)
          if (res.ok) {
            const data = await res.json()
            console.log("API response:", data) // Already present
            setQuiz(data.quiz || null)
            setAnswers(Array.isArray(data.answers) ? data.answers : [])
          } else {
            const errText = await res.text()
            console.error("API error response:", errText)
            setQuiz(null)
            setAnswers([])
          }
        } catch (err) {
          console.error("Fetch error:", err)
          setQuiz(null)
          setAnswers([])
        } finally {
          setLoading(false)
        }
      }
      if (quizId) fetchData()
      else console.warn("quizId is undefined in useEffect")
    }, [quizId])

    return (
      <div className="max-w-4xl mx-auto py-8">
        <Card>
          <CardHeader>
            <CardTitle>
              {quiz ? quiz.name : <Skeleton className="h-6 w-1/3" />}
            </CardTitle>
            <CardDescription>
              {quiz ? quiz.description : <Skeleton className="h-4 w-1/2" />}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <h3 className="text-lg font-semibold mb-4">Students who took this quiz</h3>
            <ScrollArea className="max-h-[60vh] pr-2">
              {loading ? (
                <div className="py-8 text-center">Loading...</div>
              ) : answers.length === 0 ? (
                <div className="py-8 text-center text-muted-foreground">No students have taken this quiz yet.</div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-2">#</th>
                      <th className="text-left py-2 px-2">Name</th>
                      <th className="text-left py-2 px-2">Email</th>
                      <th className="text-left py-2 px-2">Score</th>
                      <th className="text-left py-2 px-2">Date Taken</th>
                    </tr>
                  </thead>
                  <tbody>
                    {answers.map((ans, idx) => (
                      <tr key={ans._id || idx} className="border-b">
                        <td className="py-2 px-2">{idx + 1}</td>
                        <td className="py-2 px-2">{ans.user?.name || "N/A"}</td>
                        <td className="py-2 px-2">{ans.user?.email || "N/A"}</td>
                        <td className="py-2 px-2">{ans.score ?? "N/A"}</td>
                        <td className="py-2 px-2">{ans.createdAt ? new Date(ans.createdAt).toLocaleString() : "N/A"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    )
  }
