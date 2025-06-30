"use client"

import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ChartContainer, ChartTooltip, ChartLegend } from "@/components/ui/chart";
import * as RechartsPrimitive from "recharts";
import { User, ListChecks, FileBarChart2 } from "lucide-react";

export default function Page() {
  const { userData } = useAuth();
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboard() {
      setLoading(true);
      const res = await fetch("/api/dashboard");
      const data = await res.json();
      setDashboard(data);
      setLoading(false);
    }
    fetchDashboard();
  }, []);

  if (loading) return <div>Loading dashboard...</div>;
  if (!dashboard) return <div>Failed to load dashboard data.</div>;

  // Prepare chart data
  const totalStudents = dashboard.roles.find((role: any) => role._id === "student")?.count || 0;
  const quizScoresData = dashboard.avgScores.map((quiz: any) => ({ name: quiz.quizName, avgScore: quiz.avgScore ?? 0 }));
  const chartConfig = {
    users: { label: "Users", color: "#8884d8" },
    quizzes: { label: "Quizzes", color: "#82ca9d" },
    answers: { label: "Answers", color: "#ffc658" },
    avgScore: { label: "Average Score", color: "#8884d8" },
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold mb-4">Dashboard {userData?.role}</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="flex flex-row items-center gap-4 p-4">
          <div className="rounded-full bg-blue-100 p-3 text-blue-600">
            <User size={28} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Total Students</div>
            <div className="text-2xl font-bold">{totalStudents}</div>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-4 p-4">
          <div className="rounded-full bg-green-100 p-3 text-green-600">
            <ListChecks size={28} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Total Quizzes</div>
            <div className="text-2xl font-bold">{dashboard.totalQuizzes}</div>
          </div>
        </Card>
        <Card className="flex flex-row items-center gap-4 p-4">
          <div className="rounded-full bg-yellow-100 p-3 text-yellow-600">
            <FileBarChart2 size={28} />
          </div>
          <div>
            <div className="text-sm text-muted-foreground font-medium">Total Answers</div>
            <div className="text-2xl font-bold">{dashboard.totalAnswers}</div>
          </div>
        </Card>
      </div>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Average Score per Quiz</CardTitle>
        </CardHeader>
        <CardContent>
          <ChartContainer config={{ avgScore: { label: "Average Score", color: "#8884d8" } }} className="w-full h-64">
            <RechartsPrimitive.BarChart data={quizScoresData} margin={{ top: 10, right: 30, left: 0, bottom: 5 }}>
              <RechartsPrimitive.XAxis dataKey="name" />
              <RechartsPrimitive.YAxis />
              <ChartTooltip />
              <ChartLegend />
              <RechartsPrimitive.Bar dataKey="avgScore" fill="#8884d8" />
            </RechartsPrimitive.BarChart>
          </ChartContainer>
        </CardContent>
      </Card>
      <Card className="mt-4">
        <CardHeader>
          <CardTitle>Recent Answers</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="px-2 py-1 text-left font-semibold">#</th>
                  <th className="px-2 py-1 text-left font-semibold">Student</th>
                  <th className="px-2 py-1 text-left font-semibold">Quiz</th>
                  <th className="px-2 py-1 text-left font-semibold">Score</th>
                  <th className="px-2 py-1 text-left font-semibold">Time</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentAnswers.map((ans: any, idx: number) => (
                  <tr key={ans._id || idx} className="border-b hover:bg-muted/50">
                    <td className="px-2 py-1">{idx + 1}</td>
                    <td className="px-2 py-1">{ans.userId?.name}</td>
                    <td className="px-2 py-1">{ans.quizId?.name}</td>
                    <td className="px-2 py-1">{ans.score}</td>
                    <td className="px-2 py-1">{new Date(ans.createdAt).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}