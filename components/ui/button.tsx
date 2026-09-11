import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[#A855F7] text-white shadow-lg hover:bg-[#9333EA] hover:shadow-xl hover:scale-105",
        destructive:
          "bg-gradient-to-r from-red-500 to-rose-600 text-white shadow-lg hover:shadow-xl hover:scale-105",
        outline:
          "bg-white/70 backdrop-blur-xl text-[#A855F7] shadow-lg hover:bg-white/80 hover:shadow-xl hover:shadow-[0_0_20px_rgba(168,85,247,0.2)]",
        secondary:
          "bg-white/70 backdrop-blur-xl text-[#A855F7] shadow-lg hover:bg-white/80 hover:shadow-xl",
        ghost: "hover:bg-white/50 hover:backdrop-blur-xl hover:shadow-lg text-[#A855F7]",
        link: "text-[#A855F7] underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-6 py-2",
        sm: "h-9 rounded-full px-4",
        lg: "h-12 rounded-full px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
