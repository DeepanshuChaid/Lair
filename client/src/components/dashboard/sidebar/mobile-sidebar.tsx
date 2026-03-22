"use client"

import { Menu } from "lucide-react"
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet"
import { Sidebar } from "./sidebar"
import { Button } from "@/components/ui/button"

export const MobileSidebar = () => {
  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant={"ghost"} size={"icon"} className="md:hidden p-0 h-auto font-normal text-[#171717] hover:bg-transparent">
          <Menu className="h-6 w-6" />
        </Button>
      </SheetTrigger>
      <SheetContent side={"left"} className="p-0 bg-white min-w-[280px] w-[280px]">
        <Sidebar />
      </SheetContent>
    </Sheet>
  )
}
