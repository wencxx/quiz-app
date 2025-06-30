"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Plus, Clock, FileText, Trash2, CheckCircle, Minus, Pencil } from "lucide-react"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Skeleton } from "@/components/ui/skeleton"
import axios from 'axios'
import Link from "next/link"

interface Question {
  id?: string // Make id optional
  type: "multiple-choice" | "true-false" | "essay"
  question: string
  options: string[]
  correctAnswer: number | string
}

interface Quiz {
  _id?: string
  name: string
  description: string
  timer: number
  questions: Question[]
  createdAt?: Date
}

interface QuestionForm {
  type: "multiple-choice" | "true-false" | "essay"
  question: string
  options: string[]
  correctAnswer: number | string
}

export default function QuizComponent() {
  const [quizzes, setQuizzes] = useState<Quiz[]>([])
  const [isAddQuizOpen, setIsAddQuizOpen] = useState(false)
  const [loadingQuizzes, setLoadingQuizzes] = useState(true)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [quizToDelete, setQuizToDelete] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Add quiz state
  const [quizName, setQuizName] = useState("")
  const [quizDescription, setQuizDescription] = useState("")
  const [quizTimer, setQuizTimer] = useState("")
  const [questionsForm, setQuestionsForm] = useState<QuestionForm[]>([
    { type: "multiple-choice", question: "", options: ["", "", "", ""], correctAnswer: 0 },
  ])
  const [loadingAdd, setLoadingAdd] = useState(false)

  // Edit quiz state
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [quizToEdit, setQuizToEdit] = useState<Quiz | null>(null)
  const [editQuizName, setEditQuizName] = useState("")
  const [editQuizDescription, setEditQuizDescription] = useState("")
  const [editQuizTimer, setEditQuizTimer] = useState("")
  const [editQuestionsForm, setEditQuestionsForm] = useState<QuestionForm[]>([])
  const [loadingEdit, setLoadingEdit] = useState(false)

  const getQuizzes = async () => {
    try {
      const res = await axios.get('/api/quiz')
      if (res.status === 200 && Array.isArray(res.data)) {
        setQuizzes(res.data)
      } else {
        setQuizzes([])
      }
    } catch (error) {
      setQuizzes([])
      console.log(error)
    } finally {
      setLoadingQuizzes(false)
    }
  }

  useEffect(() => {
    getQuizzes()
  }, [])

  // adding new quiz
  const handleAddQuiz = async () => {
    if (!quizName.trim() || !quizDescription.trim() || !quizTimer) return

    const validQuestions = questionsForm.filter((q) =>
      q.question.trim() &&
      (
        (q.type === "multiple-choice" && q.options.every((opt) => opt.trim())) ||
        q.type === "true-false" ||
        q.type === "essay"
      )
    )
    if (validQuestions.length === 0) return

    // For frontend state, include id
    const frontendQuestions = validQuestions.map((q, index) => ({
      id: `${Date.now()}-${index}`,
      type: q.type,
      question: q.question,
      options: q.type === "essay" ? [] : [...q.options],
      correctAnswer: q.type === "essay" ? "" : q.correctAnswer,
    }))

    // For backend, always set correctAnswer for all types
    const backendQuestions = validQuestions.map((q) => {
      if (q.type === "essay") {
        return {
          type: q.type,
          question: q.question,
          options: [],
          correctAnswer: "" // Always set for essay
        }
      }
      if (q.type === "true-false") {
        return {
          type: q.type,
          question: q.question,
          options: ["True", "False"],
          correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0
        }
      }
      if (q.type === "multiple-choice") {
        return {
          type: q.type,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
          correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0
        }
      }
      // fallback
      return {
        type: q.type,
        question: q.question,
        options: [],
        correctAnswer: "" // Always set fallback
      }
    })

    const newQuiz: Quiz = {
      name: quizName,
      description: quizDescription,
      timer: Number.parseInt(quizTimer),
      questions: backendQuestions,
    }

    console.log("Quiz payload to backend:", newQuiz) // <-- Add this line

    try {
      setLoadingAdd(true)
      const res = await axios.post('/api/quiz', newQuiz)
      if (res.status === 200) {
        setQuizzes([...quizzes, { ...res.data, questions: frontendQuestions }])
        resetForm()
        setIsAddQuizOpen(false)
      }
      console.log(res.data)
    } catch (error: unknown) {
      // Enhanced backend error logging
      if (axios.isAxiosError(error) && error.response) {
        console.error("Backend error:", error.response.data)
        alert("Backend error: " + JSON.stringify(error.response.data, null, 2))
      } else if (axios.isAxiosError(error) && error.request) {
        console.error("No response from backend:", error.request)
        alert("No response from backend. See console for details.")
      } else if (error instanceof Error) {
        console.error("Error:", error.message)
        alert("Error: " + error.message)
      }
    } finally {
      setLoadingAdd(false)
    }
  }

  const resetForm = () => {
    setQuizName("")
    setQuizDescription("")
    setQuizTimer("")
    setQuestionsForm([{ type: "multiple-choice", question: "", options: ["", "", "", ""], correctAnswer: 0 }])
  }

  const handleDeleteQuiz = async (quizId?: string) => {
    if (!quizId) return
    setQuizToDelete(quizId)
    setDeleteDialogOpen(true)
  }

  const confirmDeleteQuiz = async () => {
    if (!quizToDelete) return
    setDeleting(true)
    try {
      await axios.delete('/api/quiz', { data: { quizId: quizToDelete } })
      setQuizzes(quizzes.filter((quiz) => quiz._id !== quizToDelete))
    } catch (error) {
      console.log(error)
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setQuizToDelete(null)
    }
  }

  const addQuestion = () => {
    setQuestionsForm([
      ...questionsForm,
      { type: "multiple-choice", question: "", options: ["", "", "", ""], correctAnswer: 0 },
    ])
  }

  const removeQuestion = (index: number) => {
    if (questionsForm.length > 1) {
      setQuestionsForm(questionsForm.filter((_, i) => i !== index))
    }
  }

  const updateQuestion = (index: number, field: keyof QuestionForm, value: unknown) => {
    const updated = [...questionsForm]
    if (field === "type") {
      updated[index].type = value as QuestionForm["type"]
      if (value === "multiple-choice") {
        updated[index].options = ["", "", "", ""]
        updated[index].correctAnswer = 0
      } else if (value === "true-false") {
        updated[index].options = ["True", "False"]
        updated[index].correctAnswer = 0
      } else if (value === "essay") {
        updated[index].options = []
        updated[index].correctAnswer = ""
      }
    } else {
      updated[index][field] = value as never
    }
    setQuestionsForm(updated)
  }

  const updateQuestionOption = (questionIndex: number, optionIndex: number, value: string) => {
    const updated = [...questionsForm]
    updated[questionIndex].options[optionIndex] = value
    setQuestionsForm(updated)
  }

  // Open edit dialog and prefill form
  const handleEditQuiz = (quiz: Quiz) => {
    setQuizToEdit(quiz)
    setEditQuizName(quiz.name)
    setEditQuizDescription(quiz.description)
    setEditQuizTimer(quiz.timer.toString())
    setEditQuestionsForm(
      quiz.questions.map(q => ({
        type: q.type,
        question: q.question,
        options: [...q.options],
        correctAnswer: q.correctAnswer
      }))
    )
    setEditDialogOpen(true)
  }

  // Update quiz API call
  const handleUpdateQuiz = async () => {
    if (!quizToEdit || !editQuizName.trim() || !editQuizDescription.trim() || !editQuizTimer) return
    const validQuestions = editQuestionsForm.filter((q) => q.question.trim() && (q.type === "essay" || q.options.every((opt) => opt.trim())))
    if (validQuestions.length === 0) return
    setLoadingEdit(true)
    try {
      const updatedQuiz = {
        name: editQuizName,
        description: editQuizDescription,
        timer: Number.parseInt(editQuizTimer),
        questions: validQuestions.map((q, idx) => {
          if (q.type === "essay") {
            return {
              id: quizToEdit?.questions[idx]?.id || `${Date.now()}-${idx}`,
              type: q.type,
              question: q.question,
              options: [],
              correctAnswer: "" // Always set for essay
            }
          }
          if (q.type === "true-false") {
            return {
              id: quizToEdit?.questions[idx]?.id || `${Date.now()}-${idx}`,
              type: q.type,
              question: q.question,
              options: ["True", "False"],
              correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0
            }
          }
          if (q.type === "multiple-choice") {
            return {
              id: quizToEdit?.questions[idx]?.id || `${Date.now()}-${idx}`,
              type: q.type,
              question: q.question,
              options: Array.isArray(q.options) ? q.options : ["", "", "", ""],
              correctAnswer: typeof q.correctAnswer === "number" ? q.correctAnswer : 0
            }
          }
          // fallback
          return {
            id: quizToEdit?.questions[idx]?.id || `${Date.now()}-${idx}`,
            type: q.type,
            question: q.question,
            options: [],
            correctAnswer: "" // Always set fallback
          }
        })
      }
      const res = await axios.put('/api/quiz', { quizId: quizToEdit._id, ...updatedQuiz })
      if (res.status === 200) {
        setQuizzes(quizzes.map(q => {
          if (q._id === quizToEdit._id) {
            const updatedQuestions = updatedQuiz.questions
            return {
              ...q,
              name: editQuizName,
              description: editQuizDescription,
              timer: Number.parseInt(editQuizTimer),
              questions: updatedQuestions
            }
          }
          return q
        }))
        setEditDialogOpen(false)
        setQuizToEdit(null)
      }
    } catch (error) {
      console.log(error)
    } finally {
      setLoadingEdit(false)
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quiz Management</h1>
          <p className="text-muted-foreground mt-2">Create and manage quizzes for your platform</p>
        </div>

        <Dialog open={isAddQuizOpen} onOpenChange={setIsAddQuizOpen}>
          <DialogTrigger asChild>
            <Button className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              Add New Quiz
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Create New Quiz</DialogTitle>
              <DialogDescription>Create a complete quiz with questions and multiple choice answers.</DialogDescription>
            </DialogHeader>

            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                {/* Basic Quiz Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quiz Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="quiz-name">Quiz Name</Label>
                      <Input
                        id="quiz-name"
                        value={quizName}
                        onChange={(e) => setQuizName(e.target.value)}
                        placeholder="Enter quiz name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="quiz-timer">Timer (minutes)</Label>
                      <Input
                        id="quiz-timer"
                        type="number"
                        value={quizTimer}
                        onChange={(e) => setQuizTimer(e.target.value)}
                        placeholder="Enter time limit"
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="quiz-description">Description</Label>
                    <Textarea
                      id="quiz-description"
                      value={quizDescription}
                      onChange={(e: any) => setQuizDescription(e.target.value)}
                      placeholder="Enter quiz description"
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* Questions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Questions</h3>
                    <Button onClick={addQuestion} variant="outline" size="sm">
                      <Plus className="w-4 h-4 mr-2" />
                      Add Question
                    </Button>
                  </div>

                  {questionsForm.map((questionForm, questionIndex) => (
                    <Card key={questionIndex} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Question {questionIndex + 1}</Label>
                          {questionsForm.length > 1 && (
                            <Button
                              onClick={() => removeQuestion(questionIndex)}
                              variant="ghost"
                              size="sm"
                              className="text-destructive hover:text-destructive"
                            >
                              <Minus className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                        <div className="flex gap-4 items-center">
                          <Label>Type:</Label>
                          <select
                            value={questionForm.type}
                            onChange={e => updateQuestion(questionIndex, "type", e.target.value)}
                            className="border rounded px-2 py-1"
                          >
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True / False</option>
                            <option value="essay">Essay</option>
                          </select>
                        </div>
                        <Textarea
                          value={questionForm.question}
                          onChange={(e: any) => updateQuestion(questionIndex, "question", e.target.value)}
                          placeholder="Enter your question"
                          rows={2}
                        />
                        {questionForm.type === "multiple-choice" && (
                          <div>
                            <Label className="text-sm font-medium">Answer Options</Label>
                            <RadioGroup
                              value={questionForm.correctAnswer.toString()}
                              onValueChange={(value: string) =>
                                updateQuestion(questionIndex, "correctAnswer", Number.parseInt(value))
                              }
                              className="space-y-2 mt-2"
                            >
                              {questionForm.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={optionIndex.toString()}
                                    id={`q${questionIndex}-option-${optionIndex}`}
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => updateQuestionOption(questionIndex, optionIndex, e.target.value)}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-1"
                                  />
                                  {questionForm.correctAnswer === optionIndex && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              ))}
                            </RadioGroup>
                            <p className="text-xs text-muted-foreground mt-2">
                              Select the radio button next to the correct answer
                            </p>
                          </div>
                        )}
                        {questionForm.type === "true-false" && (
                          <div>
                            <Label className="text-sm font-medium">Select the correct answer</Label>
                            <RadioGroup
                              value={questionForm.correctAnswer.toString()}
                              onValueChange={(value: string) => updateQuestion(questionIndex, "correctAnswer", Number.parseInt(value))}
                              className="space-y-2 mt-2"
                            >
                              {["True", "False"].map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={optionIndex.toString()}
                                    id={`q${questionIndex}-tf-option-${optionIndex}`}
                                  />
                                  <span>{option}</span>
                                  {questionForm.correctAnswer === optionIndex && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}
                        {questionForm.type === "essay" && (
                          <div>
                            <Label className="text-sm font-medium">Essay question (no options, open answer)</Label>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>

            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleAddQuiz} className={`flex-1 ${loadingAdd && 'animate-pulse'}`} disabled={loadingAdd}>
                {loadingAdd ? 'Creating' : 'Create'} Quiz (
                {
                  questionsForm.filter(
                    (q) =>
                      q.question.trim() &&
                      (
                        (q.type === "multiple-choice" && q.options.every((opt) => opt.trim())) ||
                        q.type === "true-false" ||
                        q.type === "essay"
                      )
                  ).length
                }{" "}
                questions)
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  resetForm()
                  setIsAddQuizOpen(false)
                }}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Quiz?</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete this quiz? This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <div className="flex gap-2 pt-4">
              <Button onClick={confirmDeleteQuiz} className={deleting ? 'animate-pulse' : ''} disabled={deleting} variant="destructive">
                {deleting ? 'Deleting...' : 'Delete'}
              </Button>
              <Button variant="outline" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
          <DialogContent className="sm:max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>Edit Quiz</DialogTitle>
              <DialogDescription>Edit the quiz details and questions.</DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[70vh] pr-4">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Quiz Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="edit-quiz-name">Quiz Name</Label>
                      <Input
                        id="edit-quiz-name"
                        value={editQuizName}
                        onChange={(e) => setEditQuizName(e.target.value)}
                        placeholder="Enter quiz name"
                      />
                    </div>
                    <div>
                      <Label htmlFor="edit-quiz-timer">Timer (minutes)</Label>
                      <Input
                        id="edit-quiz-timer"
                        type="number"
                        value={editQuizTimer}
                        onChange={(e) => setEditQuizTimer(e.target.value)}
                        placeholder="Enter time limit"
                        min="1"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="edit-quiz-description">Description</Label>
                    <Textarea
                      id="edit-quiz-description"
                      value={editQuizDescription}
                      onChange={(e: any) => setEditQuizDescription(e.target.value)}
                      placeholder="Enter quiz description"
                      rows={3}
                    />
                  </div>
                </div>

                <Separator />

                {/* Questions Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold">Questions</h3>
                  </div>

                  {editQuestionsForm.map((questionForm, questionIndex) => (
                    <Card key={questionIndex} className="p-4">
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <Label className="text-base font-medium">Question {questionIndex + 1}</Label>
                        </div>

                        <div className="flex gap-4 items-center">
                          <Label>Type:</Label>
                          <select
                            value={questionForm.type}
                            onChange={e => {
                              const updated = [...editQuestionsForm]
                              updated[questionIndex].type = e.target.value as QuestionForm["type"]
                              if (e.target.value === "multiple-choice") {
                                updated[questionIndex].options = ["", "", "", ""]
                                updated[questionIndex].correctAnswer = 0
                              } else if (e.target.value === "true-false") {
                                updated[questionIndex].options = ["True", "False"]
                                updated[questionIndex].correctAnswer = 0
                              } else if (e.target.value === "essay") {
                                updated[questionIndex].options = []
                                updated[questionIndex].correctAnswer = ""
                              }
                              setEditQuestionsForm(updated)
                            }}
                            className="border rounded px-2 py-1"
                          >
                            <option value="multiple-choice">Multiple Choice</option>
                            <option value="true-false">True / False</option>
                            <option value="essay">Essay</option>
                          </select>
                        </div>
                        <Textarea
                          value={questionForm.question}
                          onChange={(e: any) => {
                            const updated = [...editQuestionsForm]
                            updated[questionIndex].question = e.target.value
                            setEditQuestionsForm(updated)
                          }}
                          placeholder="Enter your question"
                          rows={2}
                        />
                        {questionForm.type === "multiple-choice" && (
                          <div>
                            <Label className="text-sm font-medium">Answer Options</Label>
                            <RadioGroup
                              value={questionForm.correctAnswer.toString()}
                              onValueChange={(value: string) => {
                                const updated = [...editQuestionsForm]
                                updated[questionIndex].correctAnswer = Number.parseInt(value)
                                setEditQuestionsForm(updated)
                              }}
                              className="space-y-2 mt-2"
                            >
                              {questionForm.options.map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={optionIndex.toString()}
                                    id={`edit-q${questionIndex}-option-${optionIndex}`}
                                  />
                                  <Input
                                    value={option}
                                    onChange={(e) => {
                                      const updated = [...editQuestionsForm]
                                      updated[questionIndex].options[optionIndex] = e.target.value
                                      setEditQuestionsForm(updated)
                                    }}
                                    placeholder={`Option ${optionIndex + 1}`}
                                    className="flex-1"
                                  />
                                  {questionForm.correctAnswer === optionIndex && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              ))}
                            </RadioGroup>
                            <p className="text-xs text-muted-foreground mt-2">
                              Select the radio button next to the correct answer
                            </p>
                          </div>
                        )}
                        {questionForm.type === "true-false" && (
                          <div>
                            <Label className="text-sm font-medium">Select the correct answer</Label>
                            <RadioGroup
                              value={questionForm.correctAnswer.toString()}
                              onValueChange={(value: string) => {
                                const updated = [...editQuestionsForm]
                                updated[questionIndex].correctAnswer = Number.parseInt(value)
                                setEditQuestionsForm(updated)
                              }}
                              className="space-y-2 mt-2"
                            >
                              {["True", "False"].map((option, optionIndex) => (
                                <div key={optionIndex} className="flex items-center space-x-2">
                                  <RadioGroupItem
                                    value={optionIndex.toString()}
                                    id={`edit-q${questionIndex}-tf-option-${optionIndex}`}
                                  />
                                  <span>{option}</span>
                                  {questionForm.correctAnswer === optionIndex && (
                                    <CheckCircle className="w-4 h-4 text-green-600" />
                                  )}
                                </div>
                              ))}
                            </RadioGroup>
                          </div>
                        )}
                        {questionForm.type === "essay" && (
                          <div>
                            <Label className="text-sm font-medium">Essay question (no options, open answer)</Label>
                          </div>
                        )}
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </ScrollArea>
            <div className="flex gap-2 pt-4 border-t">
              <Button onClick={handleUpdateQuiz} className={`flex-1 ${loadingEdit && 'animate-pulse'}`} disabled={loadingEdit}>
                {loadingEdit ? 'Saving...' : 'Save Changes'}
              </Button>
              <Button
                variant="outline"
                onClick={() => setEditDialogOpen(false)}
                disabled={loadingEdit}
              >
                Cancel
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loadingQuizzes ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 3 }).map((_, index) => (
            <Skeleton key={index} className="h-48 rounded-2xl" />
          ))}
        </div>
      ) : (
        quizzes.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent>
              <FileText className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No quizzes yet</h3>
              <p className="text-muted-foreground mb-4">Get started by creating your first quiz</p>
              <Button onClick={() => setIsAddQuizOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create First Quiz
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
            {quizzes.map((quiz) => (
              <Card key={quiz._id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">
                        <Link href={`/admin/answers/${quiz._id}`}>
                          {quiz.name}
                        </Link>
                      </CardTitle>
                      <CardDescription className="mt-1">{quiz.description}</CardDescription>
                    </div>
                    <div className="flex">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleEditQuiz(quiz)}
                        className="text-green-500 hover:text-green-600"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDeleteQuiz(quiz._id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Clock className="w-4 h-4" />
                      {quiz.timer} minutes
                    </div>
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary">{quiz.questions.length} questions</Badge>
                      <span className="text-xs text-muted-foreground">
                        Created {quiz.createdAt ? new Date(quiz.createdAt).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>

            ))}
          </div>
        )
      )}
    </div>
  )
}
