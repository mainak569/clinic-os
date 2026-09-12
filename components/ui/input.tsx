import * as React from "react"

import { cn } from "@/lib/utils"

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          // Glass field with a hairline edge — without the border the field was
          // invisible wherever the surface behind it was already white.
          "flex h-11 w-full rounded-2xl border border-white/60 bg-white/50 backdrop-blur-sm px-4 py-2 text-base shadow-sm transition-all",
          "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
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
  }
)
Input.displayName = "Input"

export { Input }
