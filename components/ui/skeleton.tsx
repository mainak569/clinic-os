import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        // Reads as frosted glass rather than a grey block, so loading states
        // sit on the gradient like the real content does.
        "relative overflow-hidden rounded-2xl bg-white/50 backdrop-blur-sm",
        "after:absolute after:inset-0 after:-translate-x-full after:animate-[shimmer_1.6s_infinite] after:bg-gradient-to-r after:from-transparent after:via-white/70 after:to-transparent",
        className
      )}
      {...props}
    />
  )
}

export { Skeleton }
