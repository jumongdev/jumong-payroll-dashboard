"use client"

import { useState } from "react"

export default function ClickableImage({ src, alt, title }: { src: string; alt: string; title: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="border rounded-lg overflow-hidden bg-white block w-full text-left hover:ring-2 hover:ring-emerald-400 transition-shadow"
      >
        <img src={src} alt={alt} className="w-full h-auto object-contain" />
        <p className="text-xs text-zinc-600 text-center py-1 px-1 bg-zinc-50">{title}</p>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
          onClick={() => setOpen(false)}
        >
          <button
            className="absolute top-4 right-4 text-white text-2xl font-bold"
            onClick={() => setOpen(false)}
          >
            ✕
          </button>
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-[90vh] object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  )
}
