import React, { useState, useEffect, useCallback, useRef } from 'react'

type Toast = {
  id: string
  message: string
  type: 'success' | 'info' | 'warning' | 'error'
  icon: string
  duration?: number
}

type Props = {
  socketOn?: (event: string, handler: (...args: any[]) => void) => (() => void)
  role?: 'rider' | 'driver'
}

const TYPE_STYLES: Record<Toast['type'], { bg: string; border: string; color: string }> = {
  success: { bg: 'rgba(22,163,74,0.08)', border: '#16a34a', color: '#15803d' },
  info: { bg: 'rgba(37,99,235,0.08)', border: '#2563eb', color: '#1d4ed8' },
  warning: { bg: 'rgba(245,158,11,0.08)', border: '#f59e0b', color: '#d97706' },
  error: { bg: 'rgba(220,38,38,0.08)', border: '#dc2626', color: '#b91c1c' },
}

export default function Notifications({ socketOn, role }: Props): JSX.Element {
  const [toasts, setToasts] = useState<Toast[]>([])
  const idCounter = useRef(0)

  const addToast = useCallback((message: string, type: Toast['type'], icon: string, duration = 5000) => {
    const id = `toast_${++idCounter.current}_${Date.now()}`
    setToasts(prev => [...prev, { id, message, type, icon, duration }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, duration)
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  // Listen for ride events
  useEffect(() => {
    if (!socketOn) return
    const cleanups: (() => void)[] = []

    cleanups.push(socketOn('ride:updated', (ride: any) => {
      if (role === 'rider') {
        if (ride.status === 'accepted') {
          addToast(`${ride.driver_name || 'A driver'} accepted your ride!`, 'success', '✅')
        } else if (ride.status === 'pickup') {
          addToast('Driver has arrived at your pickup location', 'info', '📍')
        } else if (ride.status === 'started') {
          addToast('Your ride has started. Enjoy the journey!', 'info', '🛺')
        } else if (ride.status === 'completed') {
          addToast(`Ride completed! Fare: ৳${ride.fare_final ?? ride.fare_estimate}`, 'success', '🎉')
        } else if (ride.status === 'cancelled') {
          addToast('Your ride has been cancelled', 'warning', '❌')
        }
      } else if (role === 'driver') {
        if (ride.status === 'cancelled') {
          addToast('Ride has been cancelled by the rider', 'warning', '❌')
        } else if (ride.status === 'completed') {
          addToast(`Ride completed! Earned ৳${ride.fare_final ?? ride.fare_estimate}`, 'success', '💰')
        }
      }
    }))

    if (role === 'driver') {
      cleanups.push(socketOn('ride:new', () => {
        addToast('New ride request available!', 'info', '🔔')
      }))
    }

    return () => cleanups.forEach(fn => fn())
  }, [socketOn, role, addToast])

  if (toasts.length === 0) return <></>

  return (
    <div style={{
      position: 'fixed', top: 16, right: 16, zIndex: 99999,
      display: 'flex', flexDirection: 'column', gap: 8,
      pointerEvents: 'none', maxWidth: 380
    }}>
      {toasts.map(toast => {
        const style = TYPE_STYLES[toast.type]
        return (
          <div
            key={toast.id}
            style={{
              pointerEvents: 'auto',
              display: 'flex', gap: 10, alignItems: 'center',
              padding: '12px 16px', borderRadius: 12,
              background: style.bg, border: `1.5px solid ${style.border}30`,
              backdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              animation: 'toastSlide 0.3s ease-out',
              cursor: 'pointer'
            }}
            onClick={() => removeToast(toast.id)}
          >
            <span style={{ fontSize: 20 }}>{toast.icon}</span>
            <span style={{ fontSize: 13, fontWeight: 600, color: style.color, flex: 1 }}>{toast.message}</span>
            <span style={{ fontSize: 14, color: '#999', cursor: 'pointer', lineHeight: 1 }}>✕</span>
          </div>
        )
      })}
      <style>{`@keyframes toastSlide { from { opacity: 0; transform: translateX(40px); } to { opacity: 1; transform: translateX(0); } }`}</style>
    </div>
  )
}
