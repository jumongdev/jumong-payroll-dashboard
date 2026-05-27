"use client"

import { useRef } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { QrCode, Trash2 } from "lucide-react"

export default function QrUploadButton({ companyId, currentQr }: { companyId: string; currentQr: string | null }) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const img = new Image()
    img.onload = async () => {
      const max = 400
      let w = img.width, h = img.height
      if (w > h) { if (w > max) { h = h * max / w; w = max } }
      else { if (h > max) { w = w * max / h; h = max } }
      const canvas = document.createElement("canvas")
      canvas.width = w; canvas.height = h
      canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
      const dataUrl = canvas.toDataURL("image/jpeg", 0.7)
      const { updateCompany } = await import("@/lib/actions/companies")
      const form = new FormData()
      form.set("id", companyId)
      form.set("qrCode", dataUrl)
      await updateCompany(form)
      router.refresh()
    }
    img.src = URL.createObjectURL(file)
  }

  async function handleDelete() {
    const { clearQrCode } = await import("@/lib/actions/companies")
    await clearQrCode(companyId)
    router.refresh()
  }

  return (
    <>
      <input ref={fileRef} type="file" accept="image/*" onChange={handleFile} className="hidden" />
      <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => fileRef.current?.click()}>
        <QrCode size={12} className="mr-1" />
        {currentQr ? "Change" : "Upload"}
      </Button>
      {currentQr && (
        <Button variant="ghost" size="sm" className="h-8 text-xs text-red-500" onClick={handleDelete}>
          <Trash2 size={12} />
        </Button>
      )}
    </>
  )
}
