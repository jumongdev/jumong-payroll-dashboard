"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { updateCompanyLocation } from "@/lib/actions/companies"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { MapPin, X, Search, Loader, Navigation } from "lucide-react"

let L: any = null

export default function StorePinButton({ companyId, companyName }: { companyId: string; companyName: string }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState("")
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [saving, setSaving] = useState(false)
  const mapRef = useRef<HTMLDivElement>(null)
  const mapInstance = useRef<any>(null)
  const markerRef = useRef<any>(null)

  useEffect(() => {
    if (!open) return
    if (L) { initMap(); return }

    const link = document.createElement("link")
    link.rel = "stylesheet"
    link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"
    document.head.appendChild(link)

    const script = document.createElement("script")
    script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"
    script.onload = () => {
      L = (window as any).L
      initMap()
    }
    document.head.appendChild(script)
  }, [open])

  function initMap() {
    if (!mapRef.current || !L) return
    if (mapInstance.current) return

    const defaultPos: [number, number] = position
      ? [position.lat, position.lng]
      : [14.3166, 120.7666] // Naic, Cavite

    const map = L.map(mapRef.current).setView(defaultPos, 16)
    mapInstance.current = map

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>',
    }).addTo(map)

    map.on("click", (e: any) => {
      const { lat, lng } = e.latlng
      setPosition({ lat, lng })
      if (markerRef.current) markerRef.current.setLatLng([lat, lng])
      else markerRef.current = L.marker([lat, lng]).addTo(map)
    })

    if (position) {
      markerRef.current = L.marker([position.lat, position.lng]).addTo(map)
    }
  }

  async function searchLocation() {
    if (!search.trim() || !L || !mapInstance.current) return
    setLoading(true)
    try {
      const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(search)}&limit=1`)
      const data = await res.json()
      if (data.length > 0) {
        const lat = parseFloat(data[0].lat)
        const lng = parseFloat(data[0].lon)
        setPosition({ lat, lng })
        mapInstance.current.setView([lat, lng], 18)
        if (markerRef.current) markerRef.current.setLatLng([lat, lng])
        else markerRef.current = L.marker([lat, lng]).addTo(mapInstance.current)
      }
    } catch { }
    setLoading(false)
  }

  async function useMyLocation() {
    if (!L || !mapInstance.current) return
    setLoading(true)
    try {
      const pos = await new Promise<GeolocationPosition>((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, { enableHighAccuracy: true, timeout: 10000 })
      })
      const lat = pos.coords.latitude
      const lng = pos.coords.longitude
      setPosition({ lat, lng })
      mapInstance.current.setView([lat, lng], 18)
      if (markerRef.current) markerRef.current.setLatLng([lat, lng])
      else markerRef.current = L.marker([lat, lng]).addTo(mapInstance.current)
    } catch { }
    setLoading(false)
  }

  async function save() {
    if (!position) return
    setSaving(true)
    const data = new FormData()
    data.set("id", companyId)
    data.set("latitude", position.lat.toString())
    data.set("longitude", position.lng.toString())
    await updateCompanyLocation(data)
    setSaving(false)
    setOpen(false)
    router.refresh()
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50"
        onClick={() => setOpen(true)}
        title="Set store location on map"
      >
        <MapPin size={14} />
      </Button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-lg max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between p-4 border-b">
              <div>
                <p className="font-semibold text-zinc-900">Pin Location</p>
                <p className="text-xs text-zinc-500">{companyName}</p>
              </div>
              <button onClick={() => { setOpen(false); setPosition(null) }} className="p-1 hover:bg-zinc-100 rounded">
                <X size={18} />
              </button>
            </div>

            <div className="p-3 border-b flex gap-2">
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchLocation()}
                placeholder="Search address..."
                className="flex-1 h-9 text-sm"
              />
              <Button size="sm" variant="outline" className="h-9" onClick={searchLocation} disabled={loading}>
                {loading ? <Loader size={14} className="animate-spin" /> : <Search size={14} />}
              </Button>
              <Button size="sm" variant="outline" className="h-9" onClick={useMyLocation} disabled={loading}>
                <Navigation size={14} />
              </Button>
            </div>

            <div ref={mapRef} className="flex-1 min-h-[300px]" />

            <div className="p-4 border-t flex items-center justify-between">
              {position ? (
                <p className="text-xs text-zinc-600">
                  <MapPin size={12} className="inline mr-1 text-emerald-600" />
                  {position.lat.toFixed(5)}, {position.lng.toFixed(5)}
                </p>
              ) : (
                <p className="text-xs text-zinc-400">Click on the map to place a pin</p>
              )}
              <Button size="sm" onClick={save} disabled={!position || saving}>
                {saving ? "Saving..." : "Save Location"}
              </Button>
            </div>
          </div>
        </div>
      )
      }
    </>
  )
}
