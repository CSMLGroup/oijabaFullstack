import React, { useEffect, useState } from 'react'
import api from '../api'

interface Props {
  rideId: string
  onBack: () => void
}

interface Ride {
  id: string
  ride_ref?: string
  rider_name?: string
  rider_phone?: string
  rider_id?: string
  driver_id?: string
  driver_name?: string
  driver_phone?: string
  driver_rating?: number
  pickup_name?: string
  pickup_lat?: number
  pickup_lng?: number
  destination_name?: string
  destination_lat?: number
  destination_lng?: number
  fare?: number
  fare_estimate?: number
  fare_final?: number
  distance?: number
  duration?: number
  status?: string
  payment_method?: string
  payment_status?: string
  notes?: string
  created_at?: string
  completed_at?: string
  cancelled_at?: string
  cancellation_reason?: string
  rating_rider_comment?: string
  driver_comment?: string
  rider_rating?: number
}

export default function RideDetailsPage({ rideId, onBack }: Props): JSX.Element {
  const [ride, setRide] = useState<Ride | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    setLoading(true)
    setError('')
    api.rides
      .get(rideId)
      .then((data: any) => setRide(data?.data || data))
      .catch((err: any) => setError(err?.message || 'Failed to load ride details'))
      .finally(() => setLoading(false))
  }, [rideId])

  const downloadRideInfoPDF = () => {
    if (!ride) return

    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ride Information - ${ride.ride_ref || ride.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: white; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 12px; }
          .section { margin-bottom: 25px; }
          .section h2 { margin: 0 0 12px 0; color: #333; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
          .detail-label { font-weight: bold; color: #555; flex: 0 0 40%; }
          .detail-value { text-align: right; flex: 0 0 60%; word-break: break-word; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .badge-completed { background: #d1fae5; color: #065f46; }
          .badge-cancelled { background: #fee2e2; color: #991b1b; }
          .badge-ongoing { background: #fef3c7; color: #92400e; }
          .badge-pending { background: #dbeafe; color: #0c2d6b; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #999; font-size: 11px; }
          @page { margin: 10mm; }
          @media print {
            body { margin: 0; }
            .container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ride Information</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>Basic Details</h2>
            <div class="detail-row">
              <span class="detail-label">Ride ID:</span>
              <span class="detail-value">${ride.id?.slice(0, 16) || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reference:</span>
              <span class="detail-value">${ride.ride_ref || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value"><span class="badge badge-${ride.status || 'pending'}">${ride.status?.toUpperCase() || '—'}</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${ride.created_at ? new Date(ride.created_at).toLocaleString() : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Driver Information</h2>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${ride.driver_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${ride.driver_phone || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rating:</span>
              <span class="detail-value">${ride.driver_rating ? '⭐ ' + ride.driver_rating : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Rider Information</h2>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${ride.rider_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${ride.rider_phone || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rating:</span>
              <span class="detail-value">${ride.rider_rating ? '⭐ ' + ride.rider_rating : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Route Details</h2>
            <div class="detail-row">
              <span class="detail-label">Pickup:</span>
              <span class="detail-value">${ride.pickup_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Destination:</span>
              <span class="detail-value">${ride.destination_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Distance:</span>
              <span class="detail-value">${ride.distance ? ride.distance.toFixed(2) + ' km' : '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${ride.duration ? ride.duration + ' minutes' : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Fare & Payment</h2>
            <div class="detail-row">
              <span class="detail-label">Estimated Fare:</span>
              <span class="detail-value">৳${ride.fare_estimate ?? '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Final Fare:</span>
              <span class="detail-value">৳${ride.fare_final ?? '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${ride.payment_method || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Status:</span>
              <span class="detail-value">${ride.payment_status || '—'}</span>
            </div>
          </div>

          <div class="footer">
            <p>This is an official ride information document from Oijaba</p>
          </div>
        </div>

        <script>
          window.addEventListener('load', () => {
            window.print();
            setTimeout(() => window.close(), 500);
          });
        </script>
      </body>
      </html>
    `

    const blob = new Blob([pdfHTML], { type: 'text/html;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ride-info-${ride.ride_ref || ride.id?.slice(0, 8)}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ marginBottom: 16, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>
          ← Back
        </button>
        <div style={{ color: 'var(--text-sub)', textAlign: 'center', padding: 40 }}>Loading ride details...</div>
      </div>
    )
  }

  if (error || !ride) {
    return (
      <div style={{ padding: 24 }}>
        <button onClick={onBack} style={{ marginBottom: 16, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>
          ← Back
        </button>
        <div style={{ color: 'var(--text-error)', padding: 40, textAlign: 'center' }}>
          {error || 'Ride not found'}
        </div>
      </div>
    )
  }

  return (
    <div style={{ padding: 24, maxWidth: 1000, margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <button onClick={onBack} style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer', fontSize: 14 }}>
          ← Back to Rides
        </button>
        <h1 style={{ margin: 0, fontSize: 24, color: 'var(--text)' }}>Ride #{ride.ride_ref || ride.id?.slice(0, 8)}</h1>
        <button
          onClick={downloadRideInfoPDF}
          style={{ padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--accent)', color: 'white', cursor: 'pointer', fontSize: 14 }}
        >
          📄 Download PDF
        </button>
      </div>

      {/* Status Badge */}
      <div style={{ marginBottom: 24, display: 'flex', gap: 12, alignItems: 'center' }}>
        <span style={{
          display: 'inline-block',
          padding: '6px 12px',
          borderRadius: 20,
          fontSize: 12,
          fontWeight: 600,
          background: ride.status === 'completed' ? '#d1fae5' : ride.status === 'cancelled' ? '#fee2e2' : ride.status === 'ongoing' ? '#fef3c7' : '#dbeafe',
          color: ride.status === 'completed' ? '#065f46' : ride.status === 'cancelled' ? '#991b1b' : ride.status === 'ongoing' ? '#92400e' : '#0c2d6b'
        }}>
          {ride.status?.toUpperCase() || '—'}
        </span>
        <span style={{ fontSize: 12, color: 'var(--text-sub)' }}>
          {ride.created_at ? new Date(ride.created_at).toLocaleString() : '—'}
        </span>
      </div>

      {/* Content Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20, marginBottom: 24 }}>
        {/* Basic Details */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Basic Details</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Ride ID</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.id?.slice(0, 16) || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Reference</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.ride_ref || '—'}</span>
            </div>
          </div>
        </div>

        {/* Driver Info */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Driver</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Name</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.driver_name || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Phone</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.driver_phone || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Rating</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.driver_rating ? `⭐ ${ride.driver_rating}` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Rider Info */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Rider</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Name</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.rider_name || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Phone</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.rider_phone || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Rating</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.rider_rating ? `⭐ ${ride.rider_rating}` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Route Details */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Route</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Pickup</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.pickup_name || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Destination</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.destination_name || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Distance</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.distance ? `${ride.distance.toFixed(2)} km` : '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Duration</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.duration ? `${ride.duration} min` : '—'}</span>
            </div>
          </div>
        </div>

        {/* Fare & Payment */}
        <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 20 }}>
          <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Fare & Payment</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Estimated</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>৳{ride.fare_estimate ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Final Fare</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>৳{ride.fare_final ?? '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Payment Method</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.payment_method || '—'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ color: 'var(--text-sub)', fontSize: 13 }}>Payment Status</span>
              <span style={{ color: 'var(--text)', fontSize: 13, fontWeight: 500 }}>{ride.payment_status || '—'}</span>
            </div>
          </div>
        </div>

        {/* Notes/Feedback */}
        {(ride.notes || ride.rating_rider_comment || ride.driver_comment) && (
          <div style={{ border: '1px solid var(--border)', borderRadius: 10, padding: 20, gridColumn: 'span 2' }}>
            <h2 style={{ margin: '0 0 16px 0', fontSize: 16, fontWeight: 600, color: 'var(--text)' }}>Comments & Feedback</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {ride.notes && (
                <div>
                  <div style={{ color: 'var(--text-sub)', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>Ride Notes</div>
                  <div style={{ color: 'var(--text)', fontSize: 13, padding: '8px 12px', background: 'var(--surface)', borderRadius: 6 }}>{ride.notes}</div>
                </div>
              )}
              {ride.driver_comment && (
                <div>
                  <div style={{ color: 'var(--text-sub)', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>Driver Feedback</div>
                  <div style={{ color: 'var(--text)', fontSize: 13, padding: '8px 12px', background: 'var(--surface)', borderRadius: 6 }}>{ride.driver_comment}</div>
                </div>
              )}
              {ride.rating_rider_comment && (
                <div>
                  <div style={{ color: 'var(--text-sub)', fontSize: 12, marginBottom: 4, fontWeight: 500 }}>Rider Feedback</div>
                  <div style={{ color: 'var(--text)', fontSize: 13, padding: '8px 12px', background: 'var(--surface)', borderRadius: 6 }}>{ride.rating_rider_comment}</div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
