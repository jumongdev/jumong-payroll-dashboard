"use client"

import { type ReactNode } from "react"
import { cn } from "@/lib/utils"

export function Dialog({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <div className="relative z-50 w-full max-w-lg max-h-[85vh] overflow-auto rounded-xl bg-white p-6 shadow-lg">
        {children}
      </div>
    </div>
  )
}

export function Select({ className, children, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        "flex h-10 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-500",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
}
