import React, { useEffect, useMemo, useState } from 'react'
import { CircleMarker, MapContainer, Marker, Polyline, Popup, TileLayer, useMap } from 'react-leaflet'
import { divIcon, latLngBounds, type LatLngTuple } from 'leaflet'
import api from '../api'
import DriverDetail from './DriverDetail'

type Driver = {
  id: string
  name?: string
  phone?: string
  status?: string
  is_online?: boolean
  current_lat?: number | null
  current_lng?: number | null
  vehicle_type?: string
}

type Ride = {
  id: string
  ride_ref?: string
  status?: string
  driver_id?: string | null
  pickup_name?: string
  destination_name?: string
  pickup_lat?: number | null
  pickup_lng?: number | null
  destination_lat?: number | null
  destination_lng?: number | null
}

const DEFAULT_CENTER: LatLngTuple = [23.8103, 90.4125]

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
    return ((value as { data: T[] }).data) || []
  }
  return []
}

function num(v: unknown): number | null {
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

function activeRideStatus(status?: string): boolean {
  return ['searching', 'accepted', 'pickup', 'started'].includes(String(status || '').toLowerCase())
}

function colorForDriver(driver: Driver): string {
  const status = String(driver.status || '').toLowerCase()
  if (status === 'rejected' || status === 'suspended') return '#dc2626'
  if (status === 'pending') return '#f59e0b'
  if (driver.is_online) return '#16a34a'
  return '#6b7280'
}

function driverLabelStatus(driver: Driver): string {
  const status = String(driver.status || 'unknown')
  if (driver.is_online && status === 'active') return 'active/online'
  if (!driver.is_online && status === 'active') return 'active/offline'
  return status
}

function FitToBounds({ points }: { points: LatLngTuple[] }): null {
  const map = useMap()

  useEffect(() => {
    if (points.length === 0) return
    if (points.length === 1) {
      map.setView(points[0], 13)
      return
    }
    const bounds = latLngBounds(points)
    map.fitBounds(bounds, { padding: [40, 40] })
  }, [map, points])

  return null
}

export default function AdminMap(): JSX.Element {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [lastSync, setLastSync] = useState<string>('')
  const [selectedDriverId, setSelectedDriverId] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const [driversRes, ridesRes] = await Promise.all([api.drivers.list('all'), api.rides.list()])
        if (cancelled) return
        setDrivers(asArray<Driver>(driversRes))
        setRides(asArray<Ride>(ridesRes))
        setLastSync(new Date().toLocaleTimeString())
      } catch {
        if (!cancelled) {
          setDrivers([])
          setRides([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    const timer = window.setInterval(load, 10000)

    return () => {
      cancelled = true
      window.clearInterval(timer)
    }
  }, [])

  const mappedDrivers = drivers
    .map((d) => {
      const lat = num(d.current_lat)
      const lng = num(d.current_lng)
      return lat != null && lng != null ? { ...d, lat, lng } : null
    })
    .filter((d): d is Driver & { lat: number; lng: number } => Boolean(d))

  const activeRides = rides.filter((r) => activeRideStatus(r.status))

  const fitPoints: LatLngTuple[] = [
    ...mappedDrivers.map((d) => [d.lat, d.lng] as LatLngTuple),
    ...activeRides.flatMap((ride) => {
      const pLat = num(ride.pickup_lat)
      const pLng = num(ride.pickup_lng)
      const dLat = num(ride.destination_lat)
      const dLng = num(ride.destination_lng)
      const pts: LatLngTuple[] = []
      if (pLat != null && pLng != null) pts.push([pLat, pLng])
      if (dLat != null && dLng != null) pts.push([dLat, dLng])
      return pts
    })
  ]

  return (
    <div style={{ padding: 12 }}>
      <h3>Live Operations Map</h3>

      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10, fontSize: 13 }}>
        <span style={{ background: '#e5e7eb', padding: '6px 10px', borderRadius: 999 }}>Drivers: {drivers.length}</span>
        <span style={{ background: '#dcfce7', padding: '6px 10px', borderRadius: 999 }}>
          Online drivers: {drivers.filter((d) => d.is_online).length}
        </span>
        <span style={{ background: '#ffedd5', padding: '6px 10px', borderRadius: 999 }}>Active rides: {activeRides.length}</span>
        <span style={{ background: '#dbeafe', padding: '6px 10px', borderRadius: 999 }}>
          Last sync: {lastSync || '...'}
        </span>
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 8, overflow: 'hidden' }}>
        <MapContainer center={DEFAULT_CENTER} zoom={12} style={{ width: '100%', height: '70vh' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url='https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
          />

          <FitToBounds points={fitPoints} />

          {mappedDrivers.map((driver) => {
            const icon = divIcon({
              className: 'admin-driver-pin',
              html: `<div style="width:18px;height:18px;background:${colorForDriver(driver)};border:2px solid #fff;border-radius:999px;box-shadow:0 2px 10px rgba(0,0,0,.35)"></div>`,
              iconSize: [18, 18],
              iconAnchor: [9, 9]
            })

            return (
              <Marker
                key={`driver-${driver.id}`}
                position={[driver.lat, driver.lng]}
                icon={icon}
                eventHandlers={{ click: () => setSelectedDriverId(driver.id) }}
              >
                <Popup>
                  <strong>{driver.name || driver.phone || driver.id}</strong>
                  <br />
                  {driver.vehicle_type || 'vehicle unknown'}
                  <br />
                  Status: {driverLabelStatus(driver)}
                  <br />
                  <button
                    style={{ marginTop: 6, fontSize: 12, cursor: 'pointer' }}
                    onClick={() => setSelectedDriverId(driver.id)}
                  >
                    Open driver details
                  </button>
                </Popup>
              </Marker>
            )
          })}

          {activeRides.map((ride) => {
            const pLat = num(ride.pickup_lat)
            const pLng = num(ride.pickup_lng)
            const dLat = num(ride.destination_lat)
            const dLng = num(ride.destination_lng)
            const hasRoute = pLat != null && pLng != null && dLat != null && dLng != null

            if (!hasRoute) return null

            const pickup: LatLngTuple = [pLat as number, pLng as number]
            const destination: LatLngTuple = [dLat as number, dLng as number]

            return (
              <React.Fragment key={`ride-${ride.id}`}>
                <CircleMarker center={pickup} radius={6} pathOptions={{ color: '#2563eb', fillColor: '#2563eb' }}>
                  <Popup>
                    Pickup: {ride.pickup_name || 'Unknown'}
                    <br />
                    Ride: {ride.ride_ref || ride.id}
                  </Popup>
                </CircleMarker>
                <CircleMarker center={destination} radius={6} pathOptions={{ color: '#f97316', fillColor: '#f97316' }}>
                  <Popup>Destination: {ride.destination_name || 'Unknown'}</Popup>
                </CircleMarker>
                <Polyline positions={[pickup, destination]} pathOptions={{ color: '#7c3aed', weight: 3, opacity: 0.75 }} />
              </React.Fragment>
            )
          })}
        </MapContainer>
      </div>

      {!loading && mappedDrivers.length === 0 && activeRides.length === 0 && (
        <div style={{ marginTop: 8, color: '#666', fontSize: 13 }}>
          No live coordinates available yet. Driver coordinates appear when `/drivers/location` updates are received.
        </div>
      )}

      {selectedDriverId && (
        <div style={{ marginTop: 12, background: '#f9fafb', border: '1px solid #e5e7eb', padding: 12, borderRadius: 6 }}>
          <DriverDetail id={selectedDriverId} onClose={() => setSelectedDriverId(null)} />
        </div>
      )}
    </div>
  )
}
