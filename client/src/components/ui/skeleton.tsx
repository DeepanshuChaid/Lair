import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <>
      <style>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .shimmer-overlay::before {
          content: '';
          position: absolute;
          inset: 0;
          transform: translateX(-100%);
          animation: shimmer 2s infinite;
          background: linear-gradient(
            90deg,
            transparent,
            rgba(255, 255, 255, 0.4),
            transparent
          );
        }
      `}</style>
      <div
        className={cn(
          "relative overflow-hidden rounded-md bg-[#D4D4D4] shimmer-overlay", 
          className
        )}
        {...props}
      />
    </>
  )
}

export { Skeleton }