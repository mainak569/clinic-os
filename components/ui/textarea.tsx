import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        // Matches Input: same glass, same radius, same focus ring.
        "flex min-h-[96px] w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm px-4 py-3 text-base leading-relaxed shadow-sm transition-all",
        "placeholder:text-muted-foreground/80",
        "hover:bg-white/60 hover:border-white/80",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#A855F7]/50 focus-visible:border-[#A855F7]/40 focus-visible:bg-white/80",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
