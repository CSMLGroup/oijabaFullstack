import React, { useEffect, useState } from 'react'
import api from '../api'

type DriverFull = {
  id: string
  name?: string
  phone?: string
  vehicle?: string
  area?: string
  status?: string
  is_online?: boolean
  profile_image?: string | null
  driver_license_image?: string | null
}

export default function DriverDetail({ id, onClose }:
  { id: string, onClose: () => void }
): JSX.Element {
  const [driver, setDriver] = useState<DriverFull | null>(null)
  const [loading, setLoading] = useState(true)
  const [onlineSaving, setOnlineSaving] = useState(false)
  const [message, setMessage] = useState('')

  useEffect(() => {
    setLoading(true)
    api.drivers.get(id)
      .then((d: any) => setDriver(d?.user || d || null))
      .catch(() => setDriver(null))
      .finally(() => setLoading(false))
  }, [id])

  const toggleOnlineStatus = async () => {
    if (!driver) return
    const nextOnline = !Boolean(driver.is_online)
    setOnlineSaving(true)
    setMessage('')
    try {
      const res: any = await api.drivers.updateById(id, { is_online: nextOnline })
      setDriver((prev) => (prev ? { ...prev, ...(res?.user || {}), is_online: Boolean(res?.user?.is_online ?? nextOnline) } : prev))
      setMessage(nextOnline ? 'Driver is now online' : 'Driver is now offline')
    } catch (err: any) {
      const msg = err?.message || 'Failed to update online status'
      if (String(msg).toLowerCase().includes('no valid fields to update')) {
        setMessage('Failed to update online status: backend needs restart to load latest route changes')
      } else {
        setMessage(msg)
      }
    } finally {
      setOnlineSaving(false)
    }
  }

  if (loading) return <div>Loading driver…</div>
  if (!driver) return <div>Driver not found</div>

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{driver.name || driver.id}</h3>
        <div>
          <button
            onClick={toggleOnlineStatus}
            disabled={onlineSaving}
            style={{
              padding: '6px 10px',
              borderRadius: 8,
              border: 'none',
              cursor: onlineSaving ? 'not-allowed' : 'pointer',
              background: driver.is_online ? '#b91c1c' : '#15803d',
              color: '#fff',
              fontWeight: 600,
            }}
            title={driver.is_online ? 'Set driver offline' : 'Set driver online'}
          >
            {onlineSaving ? 'Updating...' : driver.is_online ? 'Make Offline' : 'Make Online'}
          </button>
          <button onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
        </div>
      </div>

      <div style={{ marginTop: 6, fontSize: 13, color: '#555' }}>
        <span style={{ fontWeight: 600 }}>Live:</span> {driver.is_online ? 'Online' : 'Offline'}
      </div>
      {message ? <div style={{ marginTop: 8, fontSize: 12, color: message.toLowerCase().includes('failed') ? '#b91c1c' : '#15803d' }}>{message}</div> : null}

      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        <div style={{ width: 200 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Profile Photo</div>
          <div style={{ width: 200, height: 200, border: '1px solid #ddd', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {driver.profile_image ? <img src={driver.profile_image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ color: '#888' }}>No image</div>}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              <tr><td style={{ padding: 6, fontWeight: 600 }}>Phone</td><td style={{ padding: 6 }}>{driver.phone || '—'}</td></tr>
              <tr><td style={{ padding: 6, fontWeight: 600 }}>Vehicle</td><td style={{ padding: 6 }}>{driver.vehicle || '—'}</td></tr>
              <tr><td style={{ padding: 6, fontWeight: 600 }}>Area</td><td style={{ padding: 6 }}>{driver.area || '—'}</td></tr>
              <tr><td style={{ padding: 6, fontWeight: 600 }}>Status</td><td style={{ padding: 6 }}>{driver.status || '—'}</td></tr>
              <tr><td style={{ padding: 6, fontWeight: 600 }}>Live</td><td style={{ padding: 6 }}>{driver.is_online ? 'Online' : 'Offline'}</td></tr>
            </tbody>
          </table>

          <div style={{ marginTop: 12 }}>
            <div style={{ fontSize: 12, color: '#666' }}>Driver License</div>
            <div style={{ width: '100%', height: 220, border: '1px solid #ddd', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {driver.driver_license_image ? <img src={driver.driver_license_image} alt="license" style={{ width: '100%', height: '100%', objectFit: 'contain' }} /> : <div style={{ color: '#888' }}>No document</div>}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
