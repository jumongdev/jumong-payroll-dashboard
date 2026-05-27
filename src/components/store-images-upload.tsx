"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { addStoreImage, removeStoreImage } from "@/lib/actions/store-images"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ImagePlus, Trash2, X, Check } from "lucide-react"

interface StoreImage {
  id: string
  title: string
  image: string
  order: number
}

function compressImage(file: File): Promise<string> {
  return new Promise((resolve) => {
    const img = document.createElement("img")
    img.onload = () => {
      const max = 600
      let w = img.width, h = img.height
      if (w > h) { if (w > max) { h = h * max / w; w = max } }
      else { if (h > max) { w = w * max / h; h = max } }
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      resolve(canvas.toDataURL("image/jpeg", 0.6))
    }
    img.src = URL.createObjectURL(file)
  })
}

export default function StoreImagesUpload({
  companyId,
  images,
}: {
  companyId: string
  images: StoreImage[]
}) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [showForm, setShowForm] = useState(false)
  const [title, setTitle] = useState("")
  const [preview, setPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const base64 = await compressImage(file)
    setPreview(base64)
  }

  async function handleSave() {
    if (!preview) return
    setUploading(true)
    try {
      await addStoreImage(companyId, title || "Store Image", preview)
      setShowForm(false)
      setTitle("")
      setPreview(null)
      router.refresh()
    } finally {
      setUploading(false)
    }
  }

  function handleCancel() {
    setShowForm(false)
    setTitle("")
    setPreview(null)
  }

  async function handleRemove(id: string) {
    await removeStoreImage(id)
    router.refresh()
  }

  return (
    <div className="mt-3 space-y-2">
      <p className="text-xs font-medium text-zinc-600">Store Images / QR Codes</p>

      {images.length > 0 && (
        <div className="grid grid-cols-2 gap-2">
          {images
            .sort((a, b) => a.order - b.order)
            .map((img) => (
              <div key={img.id} className="relative border rounded-lg overflow-hidden bg-white">
                <img src={img.image} alt={img.title} className="w-full h-auto object-contain" />
                <div className="p-1.5 flex items-center justify-between">
                  <span className="text-xs text-zinc-600 truncate flex-1">{img.title}</span>
                  <button
                    onClick={() => handleRemove(img.id)}
                    className="text-red-400 hover:text-red-600 shrink-0"
                  >
                    <Trash2 size={12} />
                  </button>
                </div>
              </div>
            ))}
        </div>
      )}

      {images.length < 3 && !showForm && (
        <Button
          variant="outline"
          size="sm"
          className="h-8 text-xs w-full"
          onClick={() => setShowForm(true)}
        >
          <ImagePlus size={12} className="mr-1" />
          Add Image
        </Button>
      )}

      {showForm && (
        <div className="border rounded-lg p-3 space-y-2 bg-zinc-50">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title (e.g., Accept only Maya)"
            className="h-8 text-xs"
          />
          <div className="flex items-center gap-2">
            <label className="cursor-pointer flex-1">
              <div className="flex items-center justify-center gap-1 px-3 py-1.5 rounded bg-white border text-zinc-600 text-xs hover:bg-zinc-50">
                <ImagePlus size={12} />
                {preview ? "Change Photo" : "Choose Photo"}
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                onChange={handleFileSelected}
                className="hidden"
              />
            </label>
            <Button
              size="sm"
              className="h-8 text-xs"
              onClick={handleSave}
              disabled={!preview || uploading}
            >
              <Check size={12} className="mr-1" />
              {uploading ? "Saving..." : "Save"}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 text-xs"
              onClick={handleCancel}
            >
              <X size={12} />
            </Button>
          </div>
          {preview && (
            <img src={preview} alt="Preview" className="w-full max-h-24 object-contain rounded border" />
          )}
        </div>
      )}
    </div>
  )
}
