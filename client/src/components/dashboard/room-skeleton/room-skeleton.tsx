import { Skeleton } from "@/components/ui/skeleton"

export function RoomSkeleton() {
  return (
    <div className="flex flex-col bg-white rounded-[12px] border border-[#E5E5E5] overflow-hidden">
      {/* Thumbnail Area */}
      <div className="relative aspect-video bg-[#FAFAFA] border-b border-[#E5E5E5] flex items-center justify-center">
        {/* Top-left Badge */}
        <div className="absolute top-3 left-3">
          <Skeleton className="h-[22px] w-16 rounded-full bg-[#D4D4D4]" />
        </div>
        {/* Center Icon Placeholder */}
        <Skeleton className="h-12 w-12 rounded-full bg-[#E5E5E5]" />
      </div>

      {/* Content Area */}
      <div className="flex flex-col p-4 gap-3">
        <div className="flex items-start justify-between">
          <div className="flex flex-col gap-2 w-full">
            {/* Title */}
            <Skeleton className="h-5 w-[60%] bg-[#D4D4D4]" />
            {/* Description */}
            <Skeleton className="h-3 w-[90%] bg-[#E5E5E5]" />
          </div>
          {/* Dropdown Icon Placeholder */}
          <Skeleton className="h-8 w-8 rounded-md bg-[#E5E5E5]" />
        </div>

        {/* Footer */}
        <div className="mt-auto pt-2 border-t border-[#F5F5F5]">
          <Skeleton className="h-3 w-24 bg-[#E5E5E5]" />
        </div>
      </div>
    </div>
  )
}