import * as React from "react"
import { cn } from "@/lib/utils"

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link"
  size?: "default" | "sm" | "lg" | "icon"
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "default", size = "default", ...props }, ref) => {
    const variants: Record<string, string> = {
      default: "bg-gradient-to-br from-emerald-600 to-emerald-500 text-white hover:from-emerald-700 hover:to-emerald-600 shadow-md shadow-emerald-500/20 active:scale-[0.98]",
      destructive: "bg-gradient-to-br from-red-600 to-red-500 text-white hover:from-red-700 hover:to-red-600 shadow-md shadow-red-500/20 active:scale-[0.98]",
      outline: "border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-700 shadow-sm active:scale-[0.98]",
      secondary: "bg-zinc-100 text-zinc-700 hover:bg-zinc-200 active:scale-[0.98]",
      ghost: "hover:bg-zinc-100 text-zinc-600 active:scale-[0.98]",
      link: "text-emerald-600 underline-offset-4 hover:underline",
    }
    const sizes: Record<string, string> = {
      default: "h-11 px-5 py-2.5",
      sm: "h-9 px-3.5 text-xs",
      lg: "h-12 px-8",
      icon: "h-10 w-10",
    }

    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button }
