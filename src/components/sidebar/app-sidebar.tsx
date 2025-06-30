"use client"

import * as React from "react"
import {
  ChartSpline,
  NotebookText,
} from "lucide-react"

import { NavMain } from "@/components/sidebar/nav-main"
import { NavUser } from "@/components/sidebar/nav-user"
import { TeamSwitcher } from "@/components/sidebar/team-switcher"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar"
import { useAuth } from "@/context/AuthContext"

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { userData } = useAuth()
  // Only show "Quizzes" for students, otherwise show all
  const navItems =
    userData?.role === "student"
      ? [
          {
            title: "Quizzes",
            url: "/user/quiz",
            icon: NotebookText,
          },
        ]
      : [
          {
            title: "Dashboard",
            url: "/admin/dashboard",
            icon: ChartSpline,
          },
          {
            title: "Manage Quizzes",
            url: "/admin/quiz",
            icon: NotebookText,
          },
        ]

  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher />
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser />
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
