import { AppSidebar } from "@/components/sidebar/app-sidebar"
import {
    SidebarInset,
    SidebarProvider,
    SidebarTrigger,
} from "@/components/ui/sidebar"
import ProtectedRoute from "@/components/auth/ProtectedRoute"

export default function Page({ children }: { children: React.ReactElement }) {
    return (
        <ProtectedRoute>
            <SidebarProvider>
                <AppSidebar />
                <SidebarInset>
                    <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
                        <div className="flex items-center gap-2 px-4">
                            <SidebarTrigger className="-ml-1" />
                        </div>
                    </header>
                    <div className="p-4">
                        {children}
                    </div>
                </SidebarInset>
            </SidebarProvider>
        </ProtectedRoute>
    )
}
