import React, { useEffect, useState, useCallback, useRef } from 'react'
import api from '../api'

type SearchingRide = {
  id: string
  ride_ref: string
  rider_name?: string
  rider_phone?: string
  pickup_name: string
  destination_name: string
  vehicle_type?: string
  fare_estimate?: number
  payment_method?: string
  created_at?: string
}

type ActiveRide = {
  id: string
  ride_ref: string
  status: string
  rider_name?: string
  rider_phone?: string
  pickup_name: string
  destination_name: string
  fare_estimate?: number
  fare_final?: number
  payment_method?: string
  vehicle_type?: string
  accepted_at?: string
  started_at?: string
}

type Props = {
  isOnline: boolean
  onRideAccepted?: (ride: ActiveRide) => void
  socketOn?: (event: string, handler: (...args: any[]) => void) => (() => void)
  language?: 'en' | 'bn'
}

export default function RideRequests({ isOnline, onRideAccepted, socketOn, language = 'bn' }: Props): JSX.Element | null {
  const bn = language === 'bn'
  const [incomingRides, setIncomingRides] = useState<SearchingRide[]>([])
  const [activeRide, setActiveRide] = useState<ActiveRide | null>(null)
  const [accepting, setAccepting] = useState<string | null>(null)
  const [transitioning, setTransitioning] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  const t = {
    newRequest: bn ? '🔔 নতুন রাইড অনুরোধ!' : '🔔 New Ride Request!',
    noRequests: bn ? 'নতুন রাইড অপেক্ষা করছে...' : 'Waiting for ride requests...',
    accept: bn ? '✅ গ্রহণ করুন' : '✅ Accept',
    skip: bn ? 'পরেরটি' : 'Skip',
    rider: bn ? 'যাত্রী' : 'Rider',
    pickup: bn ? 'পিকআপ' : 'Pickup',
    destination: bn ? 'গন্তব্য' : 'Destination',
    fare: bn ? 'ভাড়া' : 'Fare',
    payment: bn ? 'পেমেন্ট' : 'Payment',
    activeRide: bn ? '🛺 সক্রিয় রাইড' : '🛺 Active Ride',
    arrivedAtPickup: bn ? '📍 পিকআপে পৌঁছেছি' : '📍 Arrived at Pickup',
    startRide: bn ? '▶️ রাইড শুরু করুন' : '▶️ Start Ride',
    completeRide: bn ? '✅ রাইড সম্পন্ন করুন' : '✅ Complete Ride',
    cancelRide: bn ? '❌ বাতিল করুন' : '❌ Cancel',
    status: bn ? 'স্ট্যাটাস' : 'Status',
    accepted: bn ? 'গৃহীত' : 'Accepted',
    atPickup: bn ? 'পিকআপে' : 'At Pickup',
    inProgress: bn ? 'চলমান' : 'In Progress',
  }

  // Fetch searching rides (polling fallback)
  const fetchSearching = useCallback(async () => {
    if (!isOnline || activeRide) return
    try {
      const data: any = await api.rides.searching()
      setIncomingRides(data?.rides || [])
    } catch {}
  }, [isOnline, activeRide])

  // Poll every 5 seconds
  useEffect(() => {
    if (!isOnline || activeRide) return
    fetchSearching()
    const interval = setInterval(fetchSearching, 5000)
    return () => clearInterval(interval)
  }, [isOnline, activeRide, fetchSearching])

  // Check for existing active ride on mount
  useEffect(() => {
    api.rides.active()
      .then((data: any) => {
        if (data?.ride && ['accepted', 'pickup', 'started'].includes(data.ride.status)) {
          setActiveRide(data.ride)
        }
      })
      .catch(() => {})
  }, [])

  // Listen for new rides via socket
  useEffect(() => {
    if (!socketOn || activeRide) return
    const unsub = socketOn('ride:new', (ride: SearchingRide) => {
      setIncomingRides(prev => {
        if (prev.find(r => r.id === ride.id)) return prev
        return [ride, ...prev]
      })
      // Play sound
      try { audioRef.current?.play() } catch {}
    })
    return unsub
  }, [socketOn, activeRide])

  // Listen for ride updates
  useEffect(() => {
    if (!socketOn) return
    const unsub = socketOn('ride:updated', (ride: ActiveRide) => {
      if (ride.status === 'cancelled') {
        setActiveRide(null)
        fetchSearching()
      } else {
        setActiveRide(ride)
      }
    })
    return unsub
  }, [socketOn, fetchSearching])

  // Accept ride
  const handleAccept = async (rideId: string) => {
    setAccepting(rideId)
    try {
      const data: any = await api.rides.updateStatus(rideId, 'accepted')
      if (data?.ride) {
        setActiveRide(data.ride)
        setIncomingRides([])
        onRideAccepted?.(data.ride)
      }
    } catch {
      // Ride may have been taken by another driver
      setIncomingRides(prev => prev.filter(r => r.id !== rideId))
    } finally {
      setAccepting(null)
    }
  }

  // Skip ride
  const handleSkip = (rideId: string) => {
    setIncomingRides(prev => prev.filter(r => r.id !== rideId))
  }

  // Status transitions
  const handleStatusTransition = async (newStatus: string) => {
    if (!activeRide || transitioning) return
    setTransitioning(true)
    try {
      const data: any = await api.rides.updateStatus(activeRide.id, newStatus)
      if (data?.ride) {
        if (newStatus === 'completed' || newStatus === 'cancelled') {
          setActiveRide(null)
          fetchSearching()
        } else {
          setActiveRide(data.ride)
        }
      }
    } catch {}
    finally { setTransitioning(false) }
  }

  if (!isOnline) return null

  const statusLabel = activeRide?.status === 'accepted' ? t.accepted
    : activeRide?.status === 'pickup' ? t.atPickup
    : activeRide?.status === 'started' ? t.inProgress : ''

  const statusColor = activeRide?.status === 'accepted' ? '#16a34a'
    : activeRide?.status === 'pickup' ? '#2563eb'
    : activeRide?.status === 'started' ? '#7c3aed' : '#888'

  return (
    <>
      {/* Notification sound (silent until triggered) */}
      <audio ref={audioRef} src="data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdH2LkI+Gi3x1dnuDjpOQiIV/eHx6goaEiY2Rf3Z1dXuChYaJjIuGgH17e3+ChIOGiYiGg4B+fH5/goOEhYaFhIKBgH9/f4CCg4OEhISDgoGAgH+AgIGCg4OEhISDgoGAgICAf4CBgoKDg4OEg4KBgICAgICBgoKDg4SDgoGAgICAgICBgoKDg4OCgoGAgICAgICBgYKCgoKCgoGBgICAgICBgYKCgoKCgoGBgICAgA==" preload="auto" />

      {/* ── Active Ride Panel ── */}
      {activeRide && (
        <div style={{
          padding: '16px 20px', borderRadius: 14, marginBottom: 16,
          background: `linear-gradient(135deg, ${statusColor}12, ${statusColor}06)`,
          border: `2px solid ${statusColor}40`,
          boxShadow: `0 4px 20px ${statusColor}15`
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h3 style={{ margin: 0, fontSize: 16, fontWeight: 800, color: statusColor }}>{t.activeRide}</h3>
            <span style={{
              padding: '4px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700,
              background: `${statusColor}15`, color: statusColor
            }}>{statusLabel}</span>
          </div>

          {/* Rider info */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
            <img src="/assets/dummy-avatar.png" alt="rider" style={{ width: 40, height: 40, borderRadius: 10, objectFit: 'cover' }} />
            <div>
              <div style={{ fontWeight: 700, fontSize: 14 }}>{activeRide.rider_name || 'Rider'}</div>
              <div style={{ fontSize: 12, color: '#6B8F76' }}>{activeRide.rider_phone}</div>
            </div>
          </div>

          {/* Route */}
          <div style={{ padding: '10px 12px', background: 'rgba(255,255,255,0.7)', borderRadius: 10, marginBottom: 12 }}>
            <div style={{ fontSize: 13 }}>🟢 {activeRide.pickup_name}</div>
            <div style={{ fontSize: 16, textAlign: 'center', color: '#999', margin: '2px 0' }}>↓</div>
            <div style={{ fontSize: 13 }}>🔴 {activeRide.destination_name}</div>
          </div>

          {/* Fare */}
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 14 }}>
            <span style={{ fontSize: 13, color: '#6B8F76' }}>{t.fare}</span>
            <span style={{ fontSize: 18, fontWeight: 900, color: '#006a4e' }}>৳{activeRide.fare_final ?? activeRide.fare_estimate}</span>
          </div>

          {/* Status transition buttons */}
          <div style={{ display: 'flex', gap: 8 }}>
            {activeRide.status === 'accepted' && (
              <button
                onClick={() => handleStatusTransition('pickup')}
                disabled={transitioning}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14, background: '#2563eb', color: '#fff',
                  opacity: transitioning ? 0.6 : 1
                }}
              >{t.arrivedAtPickup}</button>
            )}
            {activeRide.status === 'pickup' && (
              <button
                onClick={() => handleStatusTransition('started')}
                disabled={transitioning}
                style={{
                  flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 700, fontSize: 14, background: '#7c3aed', color: '#fff',
                  opacity: transitioning ? 0.6 : 1
                }}
              >{t.startRide}</button>
            )}
            {activeRide.status === 'started' && (
              <button
                onClick={() => handleStatusTransition('completed')}
                disabled={transitioning}
                style={{
                  flex: 1, padding: '14px', borderRadius: 10, border: 'none', cursor: 'pointer',
                  fontWeight: 800, fontSize: 15,
                  background: 'linear-gradient(135deg, #006a4e, #004c38)', color: '#fff',
                  boxShadow: '0 6px 20px rgba(0,106,78,0.3)',
                  opacity: transitioning ? 0.6 : 1
                }}
              >{t.completeRide}</button>
            )}
            {(activeRide.status === 'accepted' || activeRide.status === 'pickup') && (
              <button
                onClick={() => handleStatusTransition('cancelled')}
                disabled={transitioning}
                style={{
                  padding: '12px 16px', borderRadius: 10, border: '1.5px solid #dc2626',
                  background: '#fff', color: '#dc2626', fontWeight: 700, fontSize: 13,
                  cursor: 'pointer', opacity: transitioning ? 0.6 : 1
                }}
              >{t.cancelRide}</button>
            )}
          </div>
        </div>
      )}

      {/* ── Incoming Ride Requests ── */}
      {!activeRide && incomingRides.length > 0 && (
        <div style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <span style={{ fontSize: 16, fontWeight: 800, color: '#1A2920' }}>{t.newRequest}</span>
            <span style={{
              padding: '2px 8px', borderRadius: 999, fontSize: 11, fontWeight: 700,
              background: '#fef3c7', color: '#92400e', animation: 'pulse 2s infinite'
            }}>{incomingRides.length}</span>
          </div>

          {incomingRides.slice(0, 3).map(ride => (
            <div
              key={ride.id}
              style={{
                padding: '14px 16px', borderRadius: 14, marginBottom: 8,
                background: 'linear-gradient(135deg, #fefce8, #fff)', border: '1.5px solid #fcd34d',
                boxShadow: '0 4px 16px rgba(250,204,21,0.15)',
                animation: 'slideIn 0.3s ease-out'
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 8 }}>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: '#1A2920' }}>{ride.rider_name || 'Rider'}</div>
                  <div style={{ fontSize: 11, color: '#92400e', fontFamily: 'monospace' }}>{ride.ride_ref}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 20, fontWeight: 900, color: '#006a4e' }}>৳{ride.fare_estimate}</div>
                  <div style={{ fontSize: 11, color: '#6B8F76' }}>{ride.payment_method || 'cash'}</div>
                </div>
              </div>

              <div style={{ padding: '8px 10px', background: 'rgba(0,0,0,0.03)', borderRadius: 8, marginBottom: 10, fontSize: 12 }}>
                <div>🟢 {ride.pickup_name}</div>
                <div style={{ textAlign: 'center', color: '#999' }}>↓</div>
                <div>🔴 {ride.destination_name}</div>
              </div>

              <div style={{ display: 'flex', gap: 8 }}>
                <button
                  onClick={() => handleAccept(ride.id)}
                  disabled={accepting === ride.id}
                  style={{
                    flex: 1, padding: '12px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    fontWeight: 700, fontSize: 14,
                    background: accepting === ride.id ? '#6b8f76' : 'linear-gradient(135deg, #006a4e, #004c38)',
                    color: '#fff', boxShadow: '0 4px 12px rgba(0,106,78,0.2)'
                  }}
                >{accepting === ride.id ? '...' : t.accept}</button>
                <button
                  onClick={() => handleSkip(ride.id)}
                  style={{
                    padding: '12px 16px', borderRadius: 10, border: '1px solid #e5e7eb',
                    background: '#fff', color: '#666', fontWeight: 600, fontSize: 13, cursor: 'pointer'
                  }}
                >{t.skip}</button>
              </div>
            </div>
          ))}

          <style>{`
            @keyframes slideIn { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
            @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.6; } }
          `}</style>
        </div>
      )}

      {/* No requests message */}
      {!activeRide && incomingRides.length === 0 && isOnline && (
        <div style={{
          padding: '20px', textAlign: 'center', borderRadius: 14,
          background: 'rgba(0,106,78,0.04)', border: '1px dashed rgba(0,106,78,0.15)',
          marginBottom: 16
        }}>
          <div style={{ fontSize: 28, marginBottom: 8 }}>📡</div>
          <div style={{ fontSize: 14, color: '#6B8F76', fontWeight: 500 }}>{t.noRequests}</div>
        </div>
      )}
    </>
  )
}
