import * as React from "react"

import { cn } from "@/lib/utils"

const Textarea = React.forwardRef<
  HTMLTextAreaElement,
  React.ComponentProps<"textarea">
>(({ className, ...props }, ref) => {
  return (
    <textarea
      className={cn(
        "flex min-h-[80px] w-full rounded-xl border border-[var(--arinote-slate)] bg-white px-3 py-2 text-base font-sans text-[var(--arinote-navy)] shadow-sm ring-offset-background placeholder:text-[color:rgba(45,55,72,0.4)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--arinote-teal)] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm",
        className
      )}
      ref={ref}
      {...props}
    />
  )
})
Textarea.displayName = "Textarea"

export { Textarea }
