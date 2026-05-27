"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { updateEventBanner, removeEventBanner } from "@/lib/actions/advisory"
import { Button } from "@/components/ui/button"
import { Image, Trash2 } from "lucide-react"

function compressBanner(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement("img")
    img.onload = () => {
      const max = 1200
      let w = img.width
      let h = img.height
      if (w > h) {
        if (w > max) { h = h * max / w; w = max }
      } else {
        if (h > max) { w = w * max / h; h = max }
      }
      const canvas = document.createElement("canvas")
      canvas.width = w
      canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/jpeg", 0.5))
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function BannerUpload({ currentBanner }: { currentBanner: string | null }) {
  const router = useRouter()
  const [preview, setPreview] = useState<string | null>(currentBanner)
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const base64 = await compressBanner(file)
      await updateEventBanner(base64)
      setPreview(base64)
      router.refresh()
    } catch {
      //
    } finally {
      setUploading(false)
    }
  }

  async function handleRemove() {
    setUploading(true)
    try {
      await removeEventBanner()
      setPreview(null)
      router.refresh()
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="mt-3 space-y-2">
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-zinc-600">Event Banner</span>
        <label className="cursor-pointer">
          <div className="flex items-center gap-1 px-3 py-1 rounded-lg bg-zinc-50 border text-zinc-600 text-xs font-medium hover:bg-zinc-100">
            <Image size={12} />
            {uploading ? "Uploading..." : preview ? "Change" : "Upload"}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFile}
            className="hidden"
          />
        </label>
        {preview && (
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemove}
            className="h-6 text-xs text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 size={12} className="mr-1" />
            Remove
          </Button>
        )}
      </div>
      {preview && (
        <img
          src={preview}
          alt="Event banner preview"
          className="w-full max-h-32 object-cover rounded-lg border"
        />
      )}
    </div>
  )
}
