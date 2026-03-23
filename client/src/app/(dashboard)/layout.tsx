import { TopNav } from "@/components/dashboard/top-nav/top-nav"

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="h-screen flex flex-col w-full bg-[#FAFAFA]">
      <TopNav />
      {/* Main Content */}
      <div className="flex-1 w-full overflow-y-auto flex">
        <div className="flex-1 w-full flex-col justify-start items-start">
          {children}
        </div>
      </div>
    </main>
  )
}
