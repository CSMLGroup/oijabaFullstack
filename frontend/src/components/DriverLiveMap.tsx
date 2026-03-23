import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { Circle, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon, type LatLngTuple } from 'leaflet'

type Props = {
  isOnline: boolean
  serviceRadiusMeters: number
  onPositionChange?: (lat: number, lng: number) => void
}

const DEFAULT_CENTER: LatLngTuple = [23.8103, 90.4125]

function RecenterOnPosition({ position }: { position: LatLngTuple | null }): null {
  const map = useMap()

  useEffect(() => {
    if (!position) return
    map.setView(position)
  }, [map, position])

  return null
}

export default function DriverLiveMap({ isOnline, serviceRadiusMeters, onPositionChange }: Props): JSX.Element {
  const [position, setPosition] = useState<LatLngTuple | null>(null)
  const [path, setPath] = useState<LatLngTuple[]>([])
  const [locationError, setLocationError] = useState<string>('')
  const [isBangla, setIsBangla] = useState(() => localStorage.getItem('oijaba_lang') === 'bn')

  const t = useCallback((en: string, bn: string) => (isBangla ? bn : en), [isBangla])

  const driverIcon = useMemo(
    () =>
      divIcon({
        className: 'driver-live-marker',
        html: `<div style="width:24px;height:24px;background:${isOnline ? '#16a34a' : '#f59e0b'};border:3px solid #ffffff;border-radius:999px;box-shadow:0 3px 12px rgba(0,0,0,0.35)"></div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      }),
    [isOnline]
  )

  useEffect(() => {
    const syncLanguage = () => setIsBangla(localStorage.getItem('oijaba_lang') === 'bn')

    window.addEventListener('oijaba-language-changed', syncLanguage)

    return () => window.removeEventListener('oijaba-language-changed', syncLanguage)
  }, [])

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationError(t('Geolocation is not supported in this browser.', 'এই ব্রাউজারে জিওলোকেশন সমর্থিত নয়।'))
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (geo) => {
        const nextPos: LatLngTuple = [geo.coords.latitude, geo.coords.longitude]
        setPosition(nextPos)
        setPath((prev) => {
          const updated = [...prev, nextPos]
          return updated.length > 40 ? updated.slice(updated.length - 40) : updated
        })
        setLocationError('')
        if (isOnline && onPositionChange) onPositionChange(nextPos[0], nextPos[1])
      },
      (error) => {
        if (error.code === 1) setLocationError(t('Location permission denied.', 'লোকেশন অনুমতি দেওয়া হয়নি।'))
        else setLocationError(t('Unable to fetch current location.', 'বর্তমান অবস্থান আনা যাচ্ছে না।'))
      },
      { enableHighAccuracy: true, maximumAge: 3000, timeout: 10000 }
    )

    return () => {
      navigator.geolocation.clearWatch(watchId)
    }
  }, [isOnline, onPositionChange, t])

  return (
    <div style={{ display: 'grid', gap: 8 }}>
      <MapContainer
        center={position || DEFAULT_CENTER}
        zoom={13}
        style={{ height: 360, width: '100%', borderRadius: 12, border: '1px solid var(--border)' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
        />
        <RecenterOnPosition position={position} />

        {position && (
          <>
            <Marker position={position} icon={driverIcon}>
              <Popup>
                <strong>{isOnline ? t('Online', 'অনলাইন') : t('Offline', 'অফলাইন')}</strong>
                <br />
                {t('Lat', 'অক্ষাংশ')}: {position[0].toFixed(5)}
                <br />
                {t('Lng', 'দ্রাঘিমাংশ')}: {position[1].toFixed(5)}
              </Popup>
            </Marker>

            <Circle
              center={position}
              radius={serviceRadiusMeters}
              pathOptions={{ color: '#16a34a', fillColor: '#16a34a', fillOpacity: 0.1 }}
            />

            {path.length > 1 && <Polyline positions={path} pathOptions={{ color: '#2563eb', weight: 3 }} />}
          </>
        )}
      </MapContainer>

      <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
        {locationError || t('Map updates in real time as your location changes.', 'আপনার অবস্থান পরিবর্তনের সাথে সাথে মানচিত্রটি রিয়েল টাইমে আপডেট হয়।')}
      </div>
    </div>
  )
}
