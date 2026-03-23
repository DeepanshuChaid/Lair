import { Sidebar } from "@/components/dashboard/sidebar/sidebar"
import { MobileSidebar } from "@/components/dashboard/sidebar/mobile-sidebar"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen flex w-full bg-[#FAFAFA]">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex h-full w-48 lg:w-56 flex-col fixed inset-y-0 z-50">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="md:pl-48 lg:pl-56 h-full w-full flex flex-col">
        {/* Mobile Header with Sidebar Trigger */}
        <div className="md:hidden flex items-center p-4 border-b border-[#E5E5E5] bg-white">
          <MobileSidebar />
        </div>

        <div className="flex-1 w-full overflow-y-auto justify-start items-start">
          {children}
        </div>
      </div>
    </main>
  )
}
