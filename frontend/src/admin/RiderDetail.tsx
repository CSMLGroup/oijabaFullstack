import React, { useEffect, useState } from 'react'
import api from '../api'

type RiderFull = {
  id: string
  name?: string
  phone?: string
  area?: string
  rides_count?: number
  profile_image?: string | null
}

export default function RiderDetail({ id, onClose }:
  { id: string, onClose: () => void }
): JSX.Element {
  const [rider, setRider] = useState<RiderFull | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    setLoading(true)
    api.riders.get(id)
      .then((r: any) => setRider(r))
      .catch(() => setRider(null))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) return <div>Loading rider…</div>
  if (!rider) return <div>Rider not found</div>

  return (
    <div style={{ padding: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>{rider.name || rider.id}</h3>
        <div>
          <button onClick={onClose} style={{ marginLeft: 8 }}>Close</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 20, marginTop: 12 }}>
        <div style={{ width: 180 }}>
          <div style={{ fontSize: 12, color: '#666' }}>Profile Photo</div>
          <div style={{ width: 180, height: 180, border: '1px solid #ddd', marginTop: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {rider.profile_image ? (
              <img src={rider.profile_image} alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <img src="/assets/dummy-avatar.png" alt="avatar" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            )}
          </div>
        </div>

        <div style={{ flex: 1 }}>
          <table style={{ width: '100%', fontSize: 14 }}>
            <tbody>
              <tr><td style={{ padding: 6, fontWeight: 600 }}>Phone</td><td style={{ padding: 6 }}>{rider.phone || '—'}</td></tr>
              <tr><td style={{ padding: 6, fontWeight: 600 }}>Area</td><td style={{ padding: 6 }}>{rider.area || '—'}</td></tr>
              <tr><td style={{ padding: 6, fontWeight: 600 }}>Rides</td><td style={{ padding: 6 }}>{rider.rides_count ?? '—'}</td></tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
