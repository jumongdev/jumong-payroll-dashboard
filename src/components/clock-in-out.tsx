"use client"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { checkIn, checkOut } from "@/lib/actions/attendance"
import { Button } from "@/components/ui/button"
import { Camera, LogIn, LogOut, MapPin } from "lucide-react"

function getDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

export default function ClockInOut({ userId, companyLat, companyLng, todayRecord }: {
  userId: string
  companyLat: number | null
  companyLng: number | null
  todayRecord: { checkIn: string | null; checkOut: string | null; checkInPhoto: string | null; checkOutPhoto: string | null; checkInLat: number | null } | null
}) {
  const router = useRouter()
  const [loading, setLoading] = useState<"in" | "out" | null>(null)
  const [error, setError] = useState("")
  const [photo, setPhoto] = useState<string | null>(null)
  const [capturedLoc, setCapturedLoc] = useState<{ lat: number; lng: number } | null>(null)
  const [showPhotoInput, setShowPhotoInput] = useState(true)
  const fileRef = useRef<HTMLInputElement>(null)

  const couldCheckIn = !todayRecord?.checkIn
  const couldCheckOut = !!todayRecord?.checkIn && !todayRecord?.checkOut
  const noStorePin = companyLat == null || companyLng == null

  function compressPhoto(file: File): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image()
      img.onload = () => {
        const max = 600
        let w = img.width, h = img.height
        if (w > h) { if (w > max) { h = h * max / w; w = max } }
        else { if (h > max) { w = w * max / h; h = max } }
        const canvas = document.createElement("canvas")
        canvas.width = w
        canvas.height = h
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h)
        resolve(canvas.toDataURL("image/jpeg", 0.6))
      }
      img.src = URL.createObjectURL(file)
    })
  }

  async function getLocation(): Promise<{ lat: number; lng: number }> {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) return reject({ code: 0, message: "Walang GPS" })
      navigator.geolocation.getCurrentPosition(
        (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 10000 }
      )
    })
  }

  function getLocationError(err: { code: number }): string {
    if (err.code === 1) return "Naka-block ang location. Pumunta sa Settings ng phone > Apps > JumongDev > Permissions > Location > Allow"
    if (err.code === 2) return "Hindi makuha ang lokasyon. Subukan sa labas o i-on/off ang GPS."
    if (err.code === 3) return "Matagal makuha ang lokasyon. Subukan muli."
    return "Hindi pinayagan ang location. I-check ang phone settings."
  }

  async function handleFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setError("")
    try {
      const compressed = await compressPhoto(file)
      setPhoto(compressed)
      setShowPhotoInput(false)
    } catch {
      setError("Hindi ma-process ang litrato")
    }
  }

  function clearPhoto() {
    setPhoto(null)
    setShowPhotoInput(true)
    if (fileRef.current) fileRef.current.value = ""
  }

  async function verifyLocation(): Promise<{ lat: number; lng: number } | null> {
    if (noStorePin) return getLocation()
    try {
      const loc = await getLocation()
      const dist = getDistance(loc.lat, loc.lng, companyLat!, companyLng!)
      if (dist > 200) {
        setError(`Ikaw ay ${Math.round(dist)}m ang layo sa store. Dapat nasa loob ng 200m.`)
        return null
      }
      return loc
    } catch (err: any) {
      setError(getLocationError(err))
      return null
    }
  }

  async function doCheckIn() {
    if (!photo) return
    setLoading("in")
    setError("")
    const loc = await verifyLocation()
    if (!loc) { setLoading(null); return }

    try {
      setCapturedLoc(loc)
      const result = await checkIn(userId, new Date(), photo, loc.lat, loc.lng)
      if (result?.error) { setError(result.error); setLoading(null); return }
      router.refresh()
    } catch {
      setError("Hindi makapag-check in. Subukan muli.")
    } finally {
      setLoading(null)
    }
  }

  async function doCheckOut() {
    if (!photo) return
    setLoading("out")
    setError("")
    const loc = await verifyLocation()
    if (!loc) { setLoading(null); return }

    try {
      setCapturedLoc(loc)
      const result = await checkOut(userId, new Date(), photo, loc.lat, loc.lng)
      if (result?.error) { setError(result.error); setLoading(null); return }
      router.refresh()
    } catch {
      setError("Hindi makapag-check out. Subukan muli.")
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="space-y-3">
      {noStorePin && (
        <p className="text-xs text-amber-600 flex items-center gap-1">
          <MapPin size={12} /> Store location not set. Ask admin to pin the store.
        </p>
      )}

      {(couldCheckIn || couldCheckOut) && (
        <div>
          {showPhotoInput ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <div className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-sm font-medium">
                <Camera size={14} />
                Take photo
              </div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileSelected}
                className="hidden"
              />
              {!photo && <span className="text-xs text-amber-600 font-medium">* Required</span>}
            </label>
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 rounded-lg overflow-hidden border">
                <img src={photo || todayRecord?.checkInPhoto || ""} alt="Preview" className="w-full h-full object-cover" />
              </div>
              <button onClick={clearPhoto} className="text-xs text-zinc-500 hover:text-red-500">Retake</button>
            </div>
          )}
        </div>
      )}

      {error && (
        <p className="text-xs text-red-500 flex items-center gap-1">
          <MapPin size={12} /> {error}
        </p>
      )}

      <div className="flex gap-2">
        <Button
          onClick={doCheckIn}
          disabled={!couldCheckIn || !photo || loading !== null}
          className="flex-1 h-10"
          size="sm"
        >
          <LogIn size={14} className="mr-1" />
          {loading === "in" ? "Saving..." : todayRecord?.checkIn ? `In: ${new Date(todayRecord.checkIn).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : !photo ? "Take photo first" : "Clock In"}
        </Button>
        <Button
          onClick={doCheckOut}
          disabled={!couldCheckOut || !photo || loading !== null}
          variant="outline"
          className="flex-1 h-10"
          size="sm"
        >
          <LogOut size={14} className="mr-1" />
          {loading === "out" ? "Saving..." : todayRecord?.checkOut ? `Out: ${new Date(todayRecord.checkOut).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}` : !photo ? "Take photo first" : "Clock Out"}
        </Button>
      </div>

      {capturedLoc && (
        <p className="text-xs text-zinc-500 flex items-center gap-1">
          <MapPin size={12} className="text-emerald-600" />
          {capturedLoc.lat.toFixed(5)}, {capturedLoc.lng.toFixed(5)}
        </p>
      )}

      {todayRecord?.checkInPhoto && couldCheckOut && (
        <img src={todayRecord.checkInPhoto} alt="Check-in" className="w-24 h-24 rounded-lg object-cover border" />
      )}
    </div>
  )
}
