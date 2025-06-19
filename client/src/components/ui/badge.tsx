import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-xl border px-2.5 py-0.5 text-xs font-semibold font-sans transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--arinote-teal)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-[var(--arinote-teal)] text-[var(--arinote-navy)] hover:bg-[var(--arinote-salmon)] hover:text-white",
        secondary:
          "border-transparent bg-white text-[var(--arinote-navy)] hover:bg-[var(--arinote-teal)] hover:text-white",
        destructive:
          "border-transparent bg-[var(--arinote-salmon)] text-white hover:bg-[var(--arinote-teal)] hover:text-[var(--arinote-navy)]",
        outline: "border-[var(--arinote-slate)] text-[var(--arinote-navy)] bg-white",
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
