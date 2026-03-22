import Navbar from "@/components/dashboard/navbar/navbar"
import OrgSidebar from "@/components/dashboard/org-sidebar/org-sidebar"
import { Sidebar } from "@/components/dashboard/sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen flex w-full">
      {/* Primary sidebar */}
      <Sidebar />

      {/* Secondary sidebar + content */}
      <div className="pl-[60px] h-full w-full">
        <div className="flex gap-x-3 h-full w-full">

        <OrgSidebar />

        {/* Main content area */}
        <div className="flex flex-col flex-1 w-full">
          <Navbar />
            {children}
        </div>


        </div>
      </div>
    </main>
  )
}
