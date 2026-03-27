import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMapEvents, useMap } from 'react-leaflet'
import { icon as leafletIcon, type LatLngTuple } from 'leaflet'
import api from '../api'
import useSocket from '../hooks/useSocket'

/* ─── Types ────────────────────────────────── */
type VehicleType = {
  id: string; name: string; name_bn: string; emoji?: string; img?: string
  base_fare: number; per_km_rate: number; min_fare: number; enabled: boolean
  capacity: number; fare_rule_en?: string; fare_rule_bn?: string
}

type Location = { name: string; lat: number; lng: number }

type RideData = {
  id: string; ride_ref: string; status: string
  driver_id?: string; driver_name?: string; driver_phone?: string; driver_plate?: string
  pickup_name: string; destination_name: string
  fare_estimate?: number; fare_final?: number
  vehicle_type?: string; payment_method?: string
  created_at?: string; accepted_at?: string; started_at?: string; completed_at?: string
}

type Step = 'select-locations' | 'select-vehicle' | 'searching' | 'tracking' | 'completed'

/* ─── Helpers ────────────────────────────────── */
const DHAKA_CENTER: LatLngTuple = [23.8103, 90.4125]

function haversineKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371
  const dLat = (lat2 - lat1) * Math.PI / 180
  const dLng = (lng2 - lng1) * Math.PI / 180
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

function estimateFare(distKm: number, v: VehicleType): number {
  const fare = Number(v.base_fare) + distKm * Number(v.per_km_rate)
  return Math.max(fare, Number(v.min_fare))
}

/* ─── Location search with Nominatim ───────── */
function LocationSearch({ placeholder, onSelect, language }: {
  placeholder: string; onSelect: (loc: Location) => void; language: 'en' | 'bn'
}) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const debounceRef = useRef<number | null>(null)

  const search = useCallback(async (q: string) => {
    if (q.length < 3) { setResults([]); return }
    setLoading(true)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(q)}&countrycodes=bd&limit=5&accept-language=${language}`,
        { headers: { 'User-Agent': 'OijabaApp/1.0' } }
      )
      const data = await res.json()
      setResults(data || [])
    } catch { setResults([]) }
    finally { setLoading(false) }
  }, [language])

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value
    setQuery(val)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = window.setTimeout(() => search(val), 400)
  }

  return (
    <div style={{ position: 'relative' }}>
      <input
        value={query}
        onChange={handleChange}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '12px 14px', borderRadius: 10,
          border: '1.5px solid rgba(0,106,78,0.2)', fontSize: 14, fontFamily: 'inherit',
          background: '#fff', outline: 'none', boxSizing: 'border-box',
          transition: 'border-color 0.15s'
        }}
        onFocus={e => e.target.style.borderColor = '#006a4e'}
        onBlur={e => e.target.style.borderColor = 'rgba(0,106,78,0.2)'}
      />
      {loading && <div style={{ position: 'absolute', right: 12, top: 12, fontSize: 12, color: '#6B8F76' }}>⏳</div>}
      {results.length > 0 && (
        <ul style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 1000,
          background: '#fff', border: '1px solid rgba(0,0,0,0.12)', borderRadius: 10,
          boxShadow: '0 12px 40px rgba(0,0,0,0.15)', listStyle: 'none', margin: '4px 0 0', padding: 4,
          maxHeight: 220, overflowY: 'auto'
        }}>
          {results.map((r, i) => (
            <li
              key={i}
              onClick={() => {
                onSelect({ name: r.display_name?.split(',').slice(0, 3).join(', ') || r.display_name, lat: parseFloat(r.lat), lng: parseFloat(r.lon) })
                setQuery(r.display_name?.split(',').slice(0, 3).join(', ') || r.display_name)
                setResults([])
              }}
              style={{
                padding: '10px 12px', cursor: 'pointer', borderRadius: 8,
                fontSize: 13, color: '#1A2920', transition: '0.1s'
              }}
              onMouseEnter={e => (e.currentTarget.style.background = 'rgba(0,106,78,0.06)')}
              onMouseLeave={e => (e.currentTarget.style.background = '')}
            >
              📍 {r.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

/* ─── Map click handler ──────────────────── */
function MapClickHandler({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => onMapClick(e.latlng.lat, e.latlng.lng)
  })
  return null
}

function FlyTo({ center }: { center: LatLngTuple }) {
  const map = useMap()
  useEffect(() => { map.flyTo(center, 14, { duration: 0.8 }) }, [center, map])
  return null
}

/* ─── Reverse geocode ────────────────────── */
async function reverseGeocode(lat: number, lng: number): Promise<string> {
  try {
    const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&accept-language=en`, { headers: { 'User-Agent': 'OijabaApp/1.0' } })
    const data = await res.json()
    return data.display_name?.split(',').slice(0, 3).join(', ') || `${lat.toFixed(4)}, ${lng.toFixed(4)}`
  } catch { return `${lat.toFixed(4)}, ${lng.toFixed(4)}` }
}

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
export default function RideBooking({ language = 'bn', userId }: { language?: 'en' | 'bn'; userId?: string }): JSX.Element {
  const bn = language === 'bn'

  // Location state
  const [pickup, setPickup] = useState<Location | null>(null)
  const [destination, setDestination] = useState<Location | null>(null)
  const [settingWhich, setSettingWhich] = useState<'pickup' | 'destination'>('pickup')

  // Vehicle & fare
  const [vehicles, setVehicles] = useState<VehicleType[]>([])
  const [selectedVehicle, setSelectedVehicle] = useState<string>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('cash')

  // Ride state
  const [step, setStep] = useState<Step>('select-locations')
  const [activeRide, setActiveRide] = useState<RideData | null>(null)
  const [error, setError] = useState('')
  const [requesting, setRequesting] = useState(false)

  // Socket
  const { on, isConnected } = useSocket({ role: 'rider', userId: userId || null, enabled: !!userId })

  // Map center
  const mapCenter = useMemo<LatLngTuple>(() => {
    if (pickup) return [pickup.lat, pickup.lng]
    return DHAKA_CENTER
  }, [pickup])

  const t = {
    title: bn ? 'রাইড বুক করুন' : 'Book a Ride',
    pickupPlaceholder: bn ? 'পিকআপ লোকেশন খুঁজুন...' : 'Search pickup location...',
    destPlaceholder: bn ? 'গন্তব্য খুঁজুন...' : 'Search destination...',
    selectVehicle: bn ? 'যানবাহন নির্বাচন করুন' : 'Select Vehicle',
    fareEstimate: bn ? 'আনুমানিক ভাড়া' : 'Estimated Fare',
    distance: bn ? 'দূরত্ব' : 'Distance',
    paymentMethod: bn ? 'পেমেন্ট পদ্ধতি' : 'Payment Method',
    cash: bn ? 'নগদ' : 'Cash',
    requestRide: bn ? 'রাইড অনুরোধ করুন' : 'Request Ride',
    requesting: bn ? 'অনুরোধ পাঠানো হচ্ছে...' : 'Requesting...',
    searching: bn ? 'চালক খোঁজা হচ্ছে...' : 'Searching for driver...',
    cancelRide: bn ? 'রাইড বাতিল করুন' : 'Cancel Ride',
    rideAccepted: bn ? 'চালক গ্রহণ করেছেন!' : 'Driver Accepted!',
    driverArriving: bn ? 'চালক আসছে' : 'Driver is arriving',
    rideStarted: bn ? 'রাইড শুরু হয়েছে' : 'Ride in Progress',
    rideCompleted: bn ? 'রাইড সম্পন্ন!' : 'Ride Completed!',
    driver: bn ? 'চালক' : 'Driver',
    fare: bn ? 'ভাড়া' : 'Fare',
    bookAnother: bn ? 'আরেকটি রাইড বুক করুন' : 'Book Another Ride',
    setPickup: bn ? 'পিকআপ সেট করুন' : 'Set Pickup',
    setDest: bn ? 'গন্তব্য সেট করুন' : 'Set Destination',
    tapMap: bn ? 'ম্যাপে ট্যাপ করুন বা খুঁজুন' : 'Tap on map or search above',
    next: bn ? 'পরবর্তী' : 'Next',
    back: bn ? 'পেছনে' : 'Back',
    capacity: bn ? 'ধারণক্ষমতা' : 'Capacity',
    perKm: bn ? '/কিমি' : '/km',
    connected: bn ? 'সংযুক্ত' : 'Connected',
    disconnected: bn ? 'সংযোগ বিচ্ছিন্ন' : 'Disconnected',
  }

  // Fetch vehicle types
  useEffect(() => {
    api.vehicles.list()
      .then((data: any) => {
        const list = data?.vehicles || []
        setVehicles(list.filter((v: VehicleType) => v.enabled))
        if (list.length > 0) setSelectedVehicle(list[0].id)
      })
      .catch(() => {})
  }, [])

  // Check for existing active ride on mount
  useEffect(() => {
    if (!userId) return
    api.rides.active()
      .then((data: any) => {
        if (data?.ride) {
          setActiveRide(data.ride)
          const s = data.ride.status
          if (s === 'searching') setStep('searching')
          else if (['accepted', 'pickup', 'started'].includes(s)) setStep('tracking')
          else if (s === 'completed') setStep('completed')
        }
      })
      .catch(() => {})
  }, [userId])

  // Listen for ride updates via socket
  useEffect(() => {
    const unsub = on('ride:updated', (ride: RideData) => {
      setActiveRide(ride)
      if (ride.status === 'accepted' || ride.status === 'pickup') setStep('tracking')
      else if (ride.status === 'started') setStep('tracking')
      else if (ride.status === 'completed') setStep('completed')
      else if (ride.status === 'cancelled') {
        setStep('select-locations')
        setActiveRide(null)
      }
    })
    return unsub
  }, [on])

  // Polling fallback for ride status
  useEffect(() => {
    if (!activeRide || step === 'completed' || step === 'select-locations' || step === 'select-vehicle') return

    const interval = setInterval(async () => {
      try {
        const data: any = await api.rides.get(activeRide.id)
        const ride = data?.ride
        if (ride) {
          setActiveRide(ride)
          if (ride.status === 'accepted' || ride.status === 'pickup') setStep('tracking')
          else if (ride.status === 'started') setStep('tracking')
          else if (ride.status === 'completed') setStep('completed')
          else if (ride.status === 'cancelled') {
            setStep('select-locations')
            setActiveRide(null)
          }
        }
      } catch {}
    }, 5000)

    return () => clearInterval(interval)
  }, [activeRide, step])

  // Map click
  const handleMapClick = async (lat: number, lng: number) => {
    if (step !== 'select-locations') return
    const name = await reverseGeocode(lat, lng)
    if (settingWhich === 'pickup') {
      setPickup({ name, lat, lng })
      setSettingWhich('destination')
    } else {
      setDestination({ name, lat, lng })
    }
  }

  // Distance and fare
  const distanceKm = useMemo(() => {
    if (!pickup || !destination) return 0
    return haversineKm(pickup.lat, pickup.lng, destination.lat, destination.lng)
  }, [pickup, destination])

  const selectedVehicleData = vehicles.find(v => v.id === selectedVehicle)
  const fareEstimate = selectedVehicleData ? estimateFare(distanceKm, selectedVehicleData) : 0

  // Request ride
  const handleRequestRide = async () => {
    if (!pickup || !destination || !selectedVehicle) return
    setRequesting(true)
    setError('')
    try {
      const data: any = await api.rides.create({
        pickup_name: pickup.name,
        pickup_lat: pickup.lat,
        pickup_lng: pickup.lng,
        destination_name: destination.name,
        destination_lat: destination.lat,
        destination_lng: destination.lng,
        vehicle_type: selectedVehicle,
        fare_estimate: Math.round(fareEstimate),
        payment_method: paymentMethod
      })
      if (data?.ride) {
        setActiveRide(data.ride)
        setStep('searching')
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to request ride')
    } finally {
      setRequesting(false)
    }
  }

  // Cancel ride
  const handleCancelRide = async () => {
    if (!activeRide) return
    try {
      await api.rides.updateStatus(activeRide.id, 'cancelled')
      setActiveRide(null)
      setStep('select-locations')
    } catch {}
  }

  // Reset
  const handleBookAnother = () => {
    setActiveRide(null)
    setPickup(null)
    setDestination(null)
    setStep('select-locations')
    setSettingWhich('pickup')
  }

  // Marker icons
  const pickupIcon = leafletIcon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-green.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  })
  const destIcon = leafletIcon({
    iconUrl: 'https://cdn.jsdelivr.net/gh/pointhi/leaflet-color-markers@master/img/marker-icon-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png',
    iconSize: [25, 41], iconAnchor: [12, 41], popupAnchor: [1, -34], shadowSize: [41, 41]
  })

  /* ── Status label + color ── */
  const statusInfo = useMemo(() => {
    switch (activeRide?.status) {
      case 'searching': return { label: t.searching, color: '#f59e0b', icon: '🔍' }
      case 'accepted': return { label: t.rideAccepted, color: '#16a34a', icon: '✅' }
      case 'pickup': return { label: t.driverArriving, color: '#2563eb', icon: '🚗' }
      case 'started': return { label: t.rideStarted, color: '#7c3aed', icon: '🛺' }
      case 'completed': return { label: t.rideCompleted, color: '#006a4e', icon: '🎉' }
      default: return { label: '', color: '#888', icon: '' }
    }
  }, [activeRide?.status, bn])

  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */
  return (
    <div style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{t.title}</h2>
        <span style={{
          fontSize: 11, padding: '3px 8px', borderRadius: 999, fontWeight: 600,
          background: isConnected ? 'rgba(22,163,74,0.12)' : 'rgba(220,38,38,0.08)',
          color: isConnected ? '#16a34a' : '#dc2626'
        }}>
          {isConnected ? `🟢 ${t.connected}` : `⚫ ${t.disconnected}`}
        </span>
      </div>

      {error && (
        <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(220,38,38,0.08)', color: '#b91c1c', fontSize: 13, fontWeight: 600, marginBottom: 12 }}>
          {error}
        </div>
      )}

      {/* ── STEP: Select Locations ── */}
      {step === 'select-locations' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          {/* Left panel: search + controls */}
          <div>
            <div style={{ display: 'grid', gap: 12 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#006a4e', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🟢 {bn ? 'পিকআপ' : 'Pickup'}
                </label>
                <LocationSearch
                  placeholder={t.pickupPlaceholder}
                  onSelect={(loc) => { setPickup(loc); setSettingWhich('destination') }}
                  language={language}
                />
                {pickup && <div style={{ fontSize: 12, color: '#3D5A47', marginTop: 4 }}>📍 {pickup.name}</div>}
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#dc2626', marginBottom: 4, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  🔴 {bn ? 'গন্তব্য' : 'Destination'}
                </label>
                <LocationSearch
                  placeholder={t.destPlaceholder}
                  onSelect={(loc) => setDestination(loc)}
                  language={language}
                />
                {destination && <div style={{ fontSize: 12, color: '#3D5A47', marginTop: 4 }}>📍 {destination.name}</div>}
              </div>
            </div>

            {/* Map click toggle */}
            <div style={{ display: 'flex', gap: 8, marginTop: 12 }}>
              <button
                onClick={() => setSettingWhich('pickup')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13,
                  background: settingWhich === 'pickup' ? '#006a4e' : '#e5e7eb',
                  color: settingWhich === 'pickup' ? '#fff' : '#333',
                  transition: '0.15s'
                }}
              >{t.setPickup}</button>
              <button
                onClick={() => setSettingWhich('destination')}
                style={{
                  flex: 1, padding: '10px', borderRadius: 8, border: 'none', cursor: 'pointer',
                  fontWeight: 600, fontSize: 13,
                  background: settingWhich === 'destination' ? '#dc2626' : '#e5e7eb',
                  color: settingWhich === 'destination' ? '#fff' : '#333',
                  transition: '0.15s'
                }}
              >{t.setDest}</button>
            </div>
            <div style={{ fontSize: 11, color: '#6B8F76', marginTop: 6, textAlign: 'center' }}>{t.tapMap}</div>

            {/* Distance info & Next button */}
            {pickup && destination && (
              <div style={{ marginTop: 16 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(0,106,78,0.06)', borderRadius: 10 }}>
                  <span style={{ fontWeight: 600, color: '#3D5A47' }}>{t.distance}</span>
                  <span style={{ fontWeight: 800, color: '#006a4e' }}>{distanceKm.toFixed(1)} km</span>
                </div>
                <button
                  onClick={() => setStep('select-vehicle')}
                  style={{
                    marginTop: 12, width: '100%', padding: '14px', borderRadius: 12,
                    border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 15,
                    background: 'linear-gradient(135deg, #006a4e, #004c38)', color: '#fff',
                    boxShadow: '0 6px 20px rgba(0,106,78,0.3)', transition: '0.2s'
                  }}
                >{t.next} →</button>
              </div>
            )}
          </div>

          {/* Right: Map */}
          <div style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid rgba(0,0,0,0.1)', minHeight: 400 }}>
            <MapContainer center={mapCenter} zoom={13} style={{ width: '100%', height: 450 }}>
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
              />
              <MapClickHandler onMapClick={handleMapClick} />
              {pickup && <FlyTo center={[pickup.lat, pickup.lng]} />}
              {pickup && <Marker position={[pickup.lat, pickup.lng]} icon={pickupIcon}><Popup>Pickup: {pickup.name}</Popup></Marker>}
              {destination && <Marker position={[destination.lat, destination.lng]} icon={destIcon}><Popup>Destination: {destination.name}</Popup></Marker>}
            </MapContainer>
          </div>
        </div>
      )}

      {/* ── STEP: Select Vehicle ── */}
      {step === 'select-vehicle' && (
        <div>
          <button onClick={() => setStep('select-locations')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, color: '#006a4e', fontWeight: 600, marginBottom: 12, padding: 0 }}>
            ← {t.back}
          </button>

          {/* Route summary */}
          <div style={{ display: 'flex', gap: 12, padding: '14px 16px', background: 'rgba(0,106,78,0.04)', borderRadius: 12, marginBottom: 16, alignItems: 'center' }}>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 12, color: '#6B8F76', fontWeight: 600 }}>🟢 {pickup?.name}</div>
              <div style={{ fontSize: 18, fontWeight: 800, color: '#1A2920', margin: '4px 0' }}>→</div>
              <div style={{ fontSize: 12, color: '#6B8F76', fontWeight: 600 }}>🔴 {destination?.name}</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 22, fontWeight: 900, color: '#006a4e' }}>{distanceKm.toFixed(1)} km</div>
            </div>
          </div>

          <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700 }}>{t.selectVehicle}</h3>

          <div style={{ display: 'grid', gap: 10 }}>
            {vehicles.map(v => {
              const fare = estimateFare(distanceKm, v)
              const isSelected = v.id === selectedVehicle
              return (
                <button
                  key={v.id}
                  onClick={() => setSelectedVehicle(v.id)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 14, width: '100%',
                    padding: '14px 16px', borderRadius: 14, cursor: 'pointer',
                    border: isSelected ? '2px solid #006a4e' : '1.5px solid rgba(0,0,0,0.08)',
                    background: isSelected ? 'rgba(0,106,78,0.06)' : '#fff',
                    boxShadow: isSelected ? '0 4px 16px rgba(0,106,78,0.12)' : '0 1px 4px rgba(0,0,0,0.04)',
                    transition: '0.15s', textAlign: 'left'
                  }}
                >
                  <span style={{ fontSize: 32 }}>{v.emoji || '🚗'}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#1A2920' }}>{bn ? v.name_bn : v.name}</div>
                    <div style={{ fontSize: 12, color: '#6B8F76', marginTop: 2 }}>
                      {t.capacity}: {v.capacity} · ৳{Number(v.per_km_rate).toFixed(0)}{t.perKm}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 20, fontWeight: 900, color: '#006a4e' }}>৳{Math.round(fare)}</div>
                    <div style={{ fontSize: 11, color: '#6B8F76' }}>{t.fareEstimate}</div>
                  </div>
                </button>
              )
            })}
          </div>

          {vehicles.length === 0 && (
            <div style={{ padding: 20, textAlign: 'center', color: '#999' }}>
              {bn ? 'যানবাহন লোড হচ্ছে...' : 'Loading vehicles...'}
            </div>
          )}

          {/* Payment method */}
          <div style={{ marginTop: 16 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: '#3D5A47', marginBottom: 6 }}>{t.paymentMethod}</label>
            <div style={{ display: 'flex', gap: 8 }}>
              {[
                { value: 'cash', label: `💵 ${t.cash}` },
                { value: 'bkash', label: '📱 bKash' },
                { value: 'nagad', label: '📱 Nagad' }
              ].map(pm => (
                <button
                  key={pm.value}
                  onClick={() => setPaymentMethod(pm.value)}
                  style={{
                    flex: 1, padding: '10px', borderRadius: 10, cursor: 'pointer',
                    border: paymentMethod === pm.value ? '2px solid #006a4e' : '1.5px solid rgba(0,0,0,0.08)',
                    background: paymentMethod === pm.value ? 'rgba(0,106,78,0.06)' : '#fff',
                    fontWeight: 600, fontSize: 13, transition: '0.15s'
                  }}
                >{pm.label}</button>
              ))}
            </div>
          </div>

          {/* Request Ride Button */}
          <button
            onClick={handleRequestRide}
            disabled={requesting || !selectedVehicle}
            style={{
              marginTop: 20, width: '100%', padding: '16px', borderRadius: 14,
              border: 'none', cursor: requesting ? 'not-allowed' : 'pointer',
              fontWeight: 800, fontSize: 17,
              background: requesting ? '#6b8f76' : 'linear-gradient(135deg, #006a4e, #004c38)',
              color: '#fff',
              boxShadow: '0 8px 28px rgba(0,106,78,0.3)', transition: '0.2s'
            }}
          >{requesting ? t.requesting : `${t.requestRide} — ৳${Math.round(fareEstimate)}`}</button>
        </div>
      )}

      {/* ── STEP: Searching for driver ── */}
      {step === 'searching' && activeRide && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16, animation: 'pulse 2s infinite' }}>🔍</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 20, fontWeight: 800, color: '#1A2920' }}>{t.searching}</h3>
          <p style={{ color: '#6B8F76', fontSize: 14, margin: 0 }}>
            Ride Ref: <strong>{activeRide.ride_ref}</strong>
          </p>

          <div style={{
            margin: '24px auto', maxWidth: 400, padding: '16px', borderRadius: 12,
            background: 'rgba(0,106,78,0.04)', border: '1px solid rgba(0,106,78,0.12)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
              <span style={{ fontSize: 13, color: '#6B8F76' }}>🟢 {activeRide.pickup_name}</span>
            </div>
            <div style={{ textAlign: 'center', fontSize: 18, fontWeight: 700, color: '#006a4e', margin: '4px 0' }}>↓</div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, color: '#6B8F76' }}>🔴 {activeRide.destination_name}</span>
              <span style={{ fontWeight: 800, color: '#006a4e' }}>৳{activeRide.fare_estimate}</span>
            </div>
          </div>

          <button
            onClick={handleCancelRide}
            style={{
              marginTop: 16, padding: '12px 32px', borderRadius: 10, border: '1.5px solid #dc2626',
              background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer'
            }}
          >{t.cancelRide}</button>

          <style>{`@keyframes pulse { 0%,100% { transform: scale(1); } 50% { transform: scale(1.15); } }`}</style>
        </div>
      )}

      {/* ── STEP: Tracking (accepted / pickup / started) ── */}
      {step === 'tracking' && activeRide && (
        <div>
          {/* Status banner */}
          <div style={{
            padding: '16px 20px', borderRadius: 14, marginBottom: 16,
            background: `linear-gradient(135deg, ${statusInfo.color}15, ${statusInfo.color}08)`,
            border: `1.5px solid ${statusInfo.color}30`
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <span style={{ fontSize: 32 }}>{statusInfo.icon}</span>
              <div>
                <div style={{ fontWeight: 800, fontSize: 18, color: statusInfo.color }}>{statusInfo.label}</div>
                <div style={{ fontSize: 12, color: '#6B8F76' }}>Ref: {activeRide.ride_ref}</div>
              </div>
            </div>
          </div>

          {/* Driver info */}
          {activeRide.driver_name && (
            <div style={{
              padding: '16px', borderRadius: 12, background: '#fff',
              border: '1px solid rgba(0,0,0,0.08)', marginBottom: 16,
              boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
            }}>
              <div style={{ fontSize: 12, color: '#6B8F76', fontWeight: 600, marginBottom: 6 }}>{t.driver}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <img src="/assets/dummy-avatar.png" alt="driver" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover' }} />
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>{activeRide.driver_name}</div>
                  <div style={{ fontSize: 13, color: '#6B8F76' }}>{activeRide.driver_phone} · {activeRide.driver_plate}</div>
                </div>
              </div>
            </div>
          )}

          {/* Ride details */}
          <div style={{
            padding: '16px', borderRadius: 12, background: 'rgba(0,106,78,0.04)',
            border: '1px solid rgba(0,106,78,0.1)'
          }}>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#6B8F76' }}>🟢 Pickup</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{activeRide.pickup_name}</div>
            </div>
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontSize: 12, color: '#6B8F76' }}>🔴 Destination</div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{activeRide.destination_name}</div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 8, borderTop: '1px solid rgba(0,0,0,0.06)' }}>
              <span style={{ fontSize: 13, color: '#6B8F76' }}>{t.fare}</span>
              <span style={{ fontWeight: 800, fontSize: 18, color: '#006a4e' }}>৳{activeRide.fare_final ?? activeRide.fare_estimate}</span>
            </div>
          </div>

          {/* Cancel button (only before started) */}
          {(activeRide.status === 'accepted' || activeRide.status === 'searching') && (
            <button
              onClick={handleCancelRide}
              style={{
                marginTop: 16, width: '100%', padding: '12px', borderRadius: 10,
                border: '1.5px solid #dc2626', background: '#fff',
                color: '#dc2626', fontWeight: 700, fontSize: 14, cursor: 'pointer'
              }}
            >{t.cancelRide}</button>
          )}
        </div>
      )}

      {/* ── STEP: Completed ── */}
      {step === 'completed' && activeRide && (
        <div style={{ textAlign: 'center', padding: '40px 20px' }}>
          <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
          <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 800, color: '#006a4e' }}>{t.rideCompleted}</h3>
          <div style={{ display: 'inline-block', padding: '16px 24px', borderRadius: 14, background: 'rgba(0,106,78,0.06)', marginTop: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 900, color: '#006a4e' }}>৳{activeRide.fare_final ?? activeRide.fare_estimate}</div>
            <div style={{ fontSize: 13, color: '#6B8F76', marginTop: 4 }}>
              {activeRide.pickup_name} → {activeRide.destination_name}
            </div>
          </div>
          <div style={{ marginTop: 24 }}>
            <button
              onClick={handleBookAnother}
              style={{
                padding: '14px 32px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontWeight: 700, fontSize: 15, background: 'linear-gradient(135deg, #006a4e, #004c38)',
                color: '#fff', boxShadow: '0 6px 20px rgba(0,106,78,0.3)'
              }}
            >{t.bookAnother}</button>
          </div>
        </div>
      )}
    </div>
  )
}
