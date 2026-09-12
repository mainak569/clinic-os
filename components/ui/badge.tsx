import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm transition-colors focus:outline-none focus:ring-2 focus:ring-[#A855F7]/50 focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[#A855F7] text-white shadow-sm hover:bg-[#9333EA]",
        secondary:
          "border-white/60 bg-white/60 text-foreground hover:bg-white/80",
        destructive:
          "border-transparent bg-red-500 text-white shadow-sm hover:bg-red-600",
        outline: "border-white/70 bg-white/40 text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
