import React, { useEffect, useState } from 'react'
import api from '../api'
import { readJwtPayload } from '../authToken'

interface Props {
  rideId: string
  onBack: () => void
}

export default function AdminRideDetail({ rideId, onBack }: Props): JSX.Element {
  const [ride, setRide] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userRole, setUserRole] = useState<string>('rider')
  // Driver rating form (for drivers to rate riders) - overall is calculated as average
  const [driverRatingForm, setDriverRatingForm] = useState({ behavior: 0, wait_time: 0, comment: '' })
  const [driverRatingSubmitting, setDriverRatingSubmitting] = useState(false)
  const [driverRatingMsg, setDriverRatingMsg] = useState('')
  // Rider rating form (for riders to rate drivers) - overall is calculated as average
  const [riderRatingForm, setRiderRatingForm] = useState({ driving: 0, behavior: 0, cleanliness: 0, comment: '' })
  const [riderRatingSubmitting, setRiderRatingSubmitting] = useState(false)
  const [riderRatingMsg, setRiderRatingMsg] = useState('')

  const backButtonStyle: React.CSSProperties = {
    marginBottom: 12,
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #0f6b4f',
    background: 'linear-gradient(135deg, #0f8a64, #0f6b4f)',
    color: '#ffffff',
    fontWeight: 700,
    boxShadow: '0 6px 16px rgba(15, 107, 79, 0.35)'
  }

  // Get user role from JWT token
  useEffect(() => {
    const token = localStorage.getItem('oijaba_token')
    const payload = readJwtPayload(token)
    if (payload?.role) {
      setUserRole(payload.role)
      console.log('User role detected:', payload.role)
    } else {
      console.log('No role found in JWT, defaulting to:', userRole)
    }
  }, [])

  useEffect(() => {
    setLoading(true)
    setError('')
    api.rides
      .get(rideId)
      .then((data: any) => {
        const rideData = data?.ride || data?.data || data
        setRide(rideData)
        console.log('Ride data loaded:', { 
          ride_id: rideData?.id,
          status: rideData?.status,
          driver_id: rideData?.driver_id,
          rider_id: rideData?.rider_id,
          rider_rating: rideData?.rider_rating,
          driver_rating: rideData?.driver_rating,
          has_rating_driving: !!rideData?.rating_driving,
          has_rating_behavior: !!rideData?.rating_behavior,
          has_rating_cleanliness: !!rideData?.rating_cleanliness,
          has_rating_rider_behavior: !!rideData?.rating_rider_behavior,
          has_rating_rider_wait_time: !!rideData?.rating_rider_wait_time,
          all_rating_fields: Object.keys(rideData || {}).filter(k => k.includes('rating'))
        })
      })
      .catch((err: any) => setError(err?.message || 'Failed to load ride details'))
      .finally(() => setLoading(false))
  }, [rideId])

  // Reset rating forms when ride changes
  useEffect(() => {
    setDriverRatingForm({ behavior: 0, wait_time: 0, comment: '' })
    setDriverRatingMsg('')
    setRiderRatingForm({ driving: 0, behavior: 0, cleanliness: 0, comment: '' })
    setRiderRatingMsg('')
  }, [ride?.id])

  async function submitDriverRating() {
    // Calculate overall as average of behavior and wait_time
    const hasRatings = driverRatingForm.behavior > 0 || driverRatingForm.wait_time > 0
    if (!ride || !hasRatings) return
    
    const ratings = [driverRatingForm.behavior, driverRatingForm.wait_time].filter(r => r > 0)
    const overall = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0
    
    setDriverRatingSubmitting(true)
    setDriverRatingMsg('')
    try {
      const res = await api.rides.rate(ride.id, {
        rating: overall,
        rating_rider_behavior: driverRatingForm.behavior || null,
        rating_rider_wait_time: driverRatingForm.wait_time || null,
        rating_rider_comment: driverRatingForm.comment.trim() || null,
      })
      const updated = (res as { ride?: any })?.ride
      if (updated) {
        setRide((prev: any) => ({ ...prev, ...updated }))
      }
      setDriverRatingMsg('✅ Rating submitted!')
    } catch (e) {
      setDriverRatingMsg(e instanceof Error ? e.message : 'Failed to submit.')
    }
    setDriverRatingSubmitting(false)
  }

  async function submitRiderRating() {
    // Calculate overall as average of driving, behavior, and cleanliness
    const hasRatings = riderRatingForm.driving > 0 || riderRatingForm.behavior > 0 || riderRatingForm.cleanliness > 0
    if (!ride || !hasRatings) return
    
    const ratings = [riderRatingForm.driving, riderRatingForm.behavior, riderRatingForm.cleanliness].filter(r => r > 0)
    const overall = ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0
    
    setRiderRatingSubmitting(true)
    setRiderRatingMsg('')
    try {
      const res = await api.rides.rate(ride.id, {
        rating: overall,
        rating_driving: riderRatingForm.driving || null,
        rating_behavior: riderRatingForm.behavior || null,
        rating_cleanliness: riderRatingForm.cleanliness || null,
        rating_comment: riderRatingForm.comment.trim() || null,
      })
      const updated = (res as { ride?: any })?.ride
      if (updated) {
        setRide((prev: any) => ({ ...prev, ...updated }))
      }
      setRiderRatingMsg('✅ Rating submitted!')
    } catch (e) {
      setRiderRatingMsg(e instanceof Error ? e.message : 'Failed to submit.')
    }
    setRiderRatingSubmitting(false)
  }

  const downloadRideInfo = () => {
    if (!ride) return
    const rideInfo = {
      'Ride ID': ride.id,
      'Ride Reference': ride.ride_ref,
      'Status': ride.status,
      'Date & Time': ride.created_at ? new Date(ride.created_at).toLocaleString() : '—',
      'Driver': ride.driver_name || '—',
      'Driver Phone': ride.driver_phone || '—',
      'Rider': ride.rider_name || '—',
      'Rider Phone': ride.rider_phone || '—',
      'Pickup Location': ride.pickup_name || '—',
      'Destination': ride.destination_name || '—',
      'Distance': ride.distance ? `${ride.distance.toFixed(2)} km` : '—',
      'Duration': ride.duration ? `${ride.duration} minutes` : '—',
      'Estimated Fare': ride.fare_estimate ? `৳${ride.fare_estimate}` : '—',
      'Final Fare': ride.fare_final ? `৳${ride.fare_final}` : '—',
      'Payment Method': ride.payment_method || '—',
      'Payment Status': ride.payment_status || '—',
      'Driver Rating': ride.driver_rating ? `⭐ ${(ride.driver_rating).toFixed(1)}` : '—',
      'Rider Rating': ride.rider_rating ? `⭐ ${(ride.rider_rating).toFixed(1)}` : '—',
      'Driver Feedback': ride.driver_comment || '—',
      'Rider Feedback': ride.rating_rider_comment || '—',
    }

    const csvContent = Object.entries(rideInfo)
      .map(([key, value]) => `"${key}","${value}"`)
      .join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ride-${ride.ride_ref || ride.id?.slice(0, 8)}-info.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const downloadRideInfoPDF = () => {
    if (!ride) return

    // Create PDF content as HTML
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
              <span class="detail-value">${ride.driver_rating ? '⭐ ' + (ride.driver_rating).toFixed(1) : '—'}</span>
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
              <span class="detail-value">${ride.rider_rating ? '⭐ ' + (ride.rider_rating).toFixed(1) : '—'}</span>
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

          ${ride.rating_rider_comment ? `
            <div class="section">
              <h2>Feedback</h2>
              <div class="detail-row">
                <span class="detail-label">Comment:</span>
                <span class="detail-value">${ride.rating_rider_comment}</span>
              </div>
            </div>
          ` : ''}

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

  const downloadInvoice = () => {
    if (!ride) return

    // Create a simple HTML invoice
    const invoiceHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Invoice - ${ride.ride_ref || ride.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: white; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 40px; border-bottom: 2px solid #333; padding-bottom: 20px; }
          .header h1 { margin: 0; color: #333; }
          .header p { margin: 5px 0; color: #666; }
          .invoice-details { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 40px; }
          .section { margin-bottom: 30px; }
          .section h3 { margin: 0 0 15px 0; color: #333; border-bottom: 1px solid #ddd; padding-bottom: 8px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
          .detail-label { font-weight: bold; color: #666; }
          .detail-value { text-align: right; }
          .route-section { background: #f9f9f9; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .fare-section { background: #f0f0f0; padding: 20px; border-radius: 8px; }
          .fare-row { display: flex; justify-content: space-between; padding: 10px 0; font-size: 16px; }
          .fare-row.total { border-top: 2px solid #333; font-weight: bold; font-size: 18px; margin-top: 10px; padding-top: 10px; }
          .status-badge { display: inline-block; padding: 4px 12px; border-radius: 20px; font-weight: bold; font-size: 14px; }
          .status-completed { background: #d1fae5; color: #065f46; }
          .status-cancelled { background: #fee2e2; color: #991b1b; }
          .status-ongoing { background: #fef3c7; color: #92400e; }
          .status-pending { background: #dbeafe; color: #0c2d6b; }
          .footer { text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px solid #ddd; color: #999; font-size: 12px; }
          @media print {
            body { margin: 0; }
            .container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🛺 Oijaba Ride Receipt</h1>
            <p>Ride Invoice & Details</p>
          </div>

          <div style="margin-bottom: 20px;">
            <div class="detail-row">
              <div><strong>Ride ID:</strong> ${ride.id?.slice(0, 16)}</div>
              <div><strong>Reference:</strong> ${ride.ride_ref || '—'}</div>
            </div>
            <div class="detail-row">
              <div><strong>Date:</strong> ${ride.created_at ? new Date(ride.created_at).toLocaleString() : '—'}</div>
              <div><strong>Status:</strong> <span class="status-badge status-${ride.status || 'pending'}">${ride.status?.toUpperCase() || '—'}</span></div>
            </div>
          </div>

          <div class="route-section">
            <h3 style="margin-top: 0;">Route Information</h3>
            <div class="detail-row">
              <div><strong>Pickup:</strong></div>
              <div>${ride.pickup_name || '—'}</div>
            </div>
            <div class="detail-row">
              <div><strong>Destination:</strong></div>
              <div>${ride.destination_name || '—'}</div>
            </div>
            <div class="detail-row">
              <div><strong>Distance:</strong></div>
              <div>${ride.distance ? ride.distance.toFixed(2) + ' km' : '—'}</div>
            </div>
            <div class="detail-row">
              <div><strong>Duration:</strong></div>
              <div>${ride.duration ? ride.duration + ' minutes' : '—'}</div>
            </div>
          </div>

          <div class="invoice-details">
            <div class="section">
              <h3>Driver Details</h3>
              <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${ride.driver_name || '—'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Phone:</div>
                <div class="detail-value">${ride.driver_phone || '—'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Rating:</div>
                <div class="detail-value">${ride.driver_rating ? '⭐ ' + (ride.driver_rating).toFixed(1) : '—'}</div>
              </div>
            </div>

            <div class="section">
              <h3>Rider Details</h3>
              <div class="detail-row">
                <div class="detail-label">Name:</div>
                <div class="detail-value">${ride.rider_name || '—'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Phone:</div>
                <div class="detail-value">${ride.rider_phone || '—'}</div>
              </div>
              <div class="detail-row">
                <div class="detail-label">Rating:</div>
                <div class="detail-value">${ride.rider_rating ? '⭐ ' + (ride.rider_rating).toFixed(1) : '—'}</div>
              </div>
            </div>
          </div>

          <div class="fare-section">
            <div class="fare-row">
              <span>Estimated Fare:</span>
              <span>৳${ride.fare_estimate ?? '—'}</span>
            </div>
            <div class="fare-row">
              <span>Final Fare:</span>
              <span>৳${ride.fare_final ?? '—'}</span>
            </div>
            <div class="fare-row">
              <span>Payment Method:</span>
              <span>${ride.payment_method || '—'}</span>
            </div>
            <div class="fare-row">
              <span>Payment Status:</span>
              <span>${ride.payment_status || '—'}</span>
            </div>
            <div class="fare-row total">
              <span>Total Amount:</span>
              <span>৳${ride.fare_final ?? ride.fare_estimate ?? '—'}</span>
            </div>
          </div>

          ${ride.driver_comment || ride.rating_rider_comment ? `
            <div class="section" style="margin-top: 30px;">
              <h3>Feedback & Comments</h3>
              ${ride.driver_comment ? `
                <div class="detail-row">
                  <div><strong>Driver Feedback:</strong></div>
                  <div>${ride.driver_comment}</div>
                </div>
              ` : ''}
              ${ride.rating_rider_comment ? `
                <div class="detail-row">
                  <div><strong>Rider Feedback:</strong></div>
                  <div>${ride.rating_rider_comment}</div>
                </div>
              ` : ''}
            </div>
          ` : ''}

          <div class="footer">
            <p>This is an official receipt from Oijaba Ride Service</p>
            <p>Generated on ${new Date().toLocaleString()}</p>
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

    const blob = new Blob([invoiceHTML], { type: 'text/html;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `invoice-${ride.ride_ref || ride.id?.slice(0, 8)}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading) {
    return (
      <div className="admin-section">
        <button className="admin-btn" onClick={onBack} style={backButtonStyle}>← Back</button>
        <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-sub)' }}>Loading ride details...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="admin-section">
        <button className="admin-btn" onClick={onBack} style={backButtonStyle}>← Back</button>
        <div style={{ padding: 20, color: 'var(--danger)' }}>Error: {error}</div>
      </div>
    )
  }

  if (!ride) {
    return (
      <div className="admin-section">
        <button className="admin-btn" onClick={onBack} style={backButtonStyle}>← Back</button>
        <div style={{ padding: 20, color: 'var(--text-sub)' }}>Ride not found</div>
      </div>
    )
  }

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <button className="admin-btn" onClick={onBack} style={backButtonStyle}>← Back</button>
        <div style={{ display: 'flex', gap: 8 }}>
          {userRole === 'admin' && (
            <button className="admin-btn success" onClick={downloadRideInfoPDF}>📄 Download PDF</button>
          )}
          {(userRole === 'admin' || userRole === 'rider') && (
            <button className="admin-btn success" onClick={downloadInvoice}>📋 Download Invoice</button>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">Ride ID</span><span className="admin-stat-icon">🛺</span></div>
          <div className="admin-stat-value" style={{ fontSize: 12, wordBreak: 'break-all' }}>{ride.ride_ref || ride.id?.slice(0, 12)}</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">Status</span><span className="admin-stat-icon">📍</span></div>
          <div className="admin-stat-value"><span className={`admin-badge ${ride.status || 'neutral'}`}>{ride.status?.toUpperCase() || '—'}</span></div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">Total Fare</span><span className="admin-stat-icon">💰</span></div>
          <div className="admin-stat-value">৳{ride.fare_final ?? ride.fare_estimate ?? '—'}</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">Date</span><span className="admin-stat-icon">📅</span></div>
          <div className="admin-stat-value" style={{ fontSize: 12 }}>{ride.created_at ? new Date(ride.created_at).toLocaleDateString() : '—'}</div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
        {/* Basic Info Card */}
        <div className="admin-card">
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Basic Information</h4>
          {[
            ['Ride ID', ride.id?.slice(0, 12) || '—'],
            ['Ride Ref', ride.ride_ref || '—'],
            ['Status', ride.status?.toUpperCase() || '—'],
            ['Date & Time', ride.created_at ? new Date(ride.created_at).toLocaleString() : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 600, wordBreak: 'break-word', fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Driver Info Card */}
        <div className="admin-card">
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Driver Information</h4>
          {[
            ['Name', ride.driver_name || '—'],
            ['Phone', ride.driver_phone || '—'],
            ['Rating', ride.driver_rating ? `⭐ ${(ride.driver_rating).toFixed(1)}` : '—'],
            ['ID', ride.driver_id?.slice(0, 12) || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 600, wordBreak: 'break-word', fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Rider Info Card */}
        <div className="admin-card">
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Rider Information</h4>
          {[
            ['Name', ride.rider_name || '—'],
            ['Phone', ride.rider_phone || '—'],
            ['Rating', ride.rider_rating ? `⭐ ${(ride.rider_rating).toFixed(1)}` : '—'],
            ['Rides', ride.rider_total_rides || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 600, wordBreak: 'break-word', fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Route Info Card */}
        <div className="admin-card">
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Route Details</h4>
          {[
            ['Pickup Location', ride.pickup_name || '—'],
            ['Destination', ride.destination_name || '—'],
            ['Distance', ride.distance ? `${ride.distance.toFixed(2)} km` : '—'],
            ['Duration', ride.duration ? `${ride.duration} min` : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 600, wordBreak: 'break-word', fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Fare & Payment Card */}
        <div className="admin-card">
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Fare & Payment</h4>
          {[
            ['Estimated Fare', ride.fare_estimate ? `৳${ride.fare_estimate}` : '—'],
            ['Final Fare', ride.fare_final ? `৳${ride.fare_final}` : '—'],
            ['Payment Method', ride.payment_method || '—'],
            ['Payment Status', ride.payment_status || '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 600, wordBreak: 'break-word', fontSize: 14 }}>{value}</div>
            </div>
          ))}
        </div>

        {/* Rating & Feedback Card */}
        <div className="admin-card">
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Rating & Feedback</h4>
          {userRole === 'admin' || (ride.rating_driving && ride.rating_behavior && ride.rating_cleanliness) ? (
            // Admin sees full rating details (or if detailed ratings exist in data)
            <>
              <div style={{ paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 3 }}>Overall Ratings</div>
                <div style={{ display: 'flex', gap: 16 }}>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>Driver Rating</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ride.driver_rating ? `⭐ ${(ride.driver_rating).toFixed(1)}` : '—'}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>Rider Rating</div>
                    <div style={{ fontWeight: 600, fontSize: 14 }}>{ride.rider_rating ? `⭐ ${(ride.rider_rating).toFixed(1)}` : '—'}</div>
                  </div>
                </div>
              </div>
              <div>
                <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 8 }}>Driver Categories (from Rider)</div>
                {[
                  ['Driving Skill', ride.rating_driving ? `${ride.rating_driving}/5` : '—'],
                  ['Behavior', ride.rating_behavior ? `${ride.rating_behavior}/5` : '—'],
                  ['Cleanliness', ride.rating_cleanliness ? `${ride.rating_cleanliness}/5` : '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{value}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 12 }}>
                <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 8 }}>Rider Categories (from Driver)</div>
                {[
                  ['Behavior', ride.rating_rider_behavior ? `${ride.rating_rider_behavior}/5` : '—'],
                  ['Wait Time', ride.rating_rider_wait_time ? `${ride.rating_rider_wait_time}/5` : '—'],
                ].map(([label, value]) => (
                  <div key={label} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 10, color: 'var(--text-sub)' }}>{label}</div>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{value}</div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            // Drivers and riders see only overall rating
            [
              ['Driver Rating', ride.driver_rating ? `⭐ ${(ride.driver_rating).toFixed(1)}` : '—'],
              ['Rider Rating', ride.rider_rating ? `⭐ ${ride.rider_rating}` : '—'],
            ].map(([label, value]) => (
              <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 3 }}>{label}</div>
                <div style={{ fontWeight: 600, wordBreak: 'break-word', fontSize: 14 }}>{value}</div>
              </div>
            ))
          )}
        </div>

        {/* GPS & Tracking Card */}
        <div className="admin-card">
          <h4 style={{ margin: '0 0 12px', fontSize: 15, fontWeight: 600 }}>Tracking Info</h4>
          {[
            ['Pickup Lat', ride.pickup_lat ? ride.pickup_lat.toFixed(6) : '—'],
            ['Pickup Lng', ride.pickup_lng ? ride.pickup_lng.toFixed(6) : '—'],
            ['Dest Lat', ride.destination_lat ? ride.destination_lat.toFixed(6) : '—'],
            ['Dest Lng', ride.destination_lng ? ride.destination_lng.toFixed(6) : '—'],
          ].map(([label, value]) => (
            <div key={label} style={{ padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
              <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontWeight: 600, wordBreak: 'break-all', fontSize: 12 }}>{value}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Driver Rating Form - Drivers can rate passengers */}
      {userRole === 'driver' && ride?.status === 'completed' && ride?.rider_rating == null && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>📝 Rate This Passenger</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)' }}>👤 Passenger Behavior</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setDriverRatingForm((f) => ({ ...f, behavior: i }))}
                    style={{
                      fontSize: 20,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: driverRatingForm.behavior >= i ? 1 : 0.3,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)' }}>⏱️ Wait Time</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setDriverRatingForm((f) => ({ ...f, wait_time: i }))}
                    style={{
                      fontSize: 20,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: driverRatingForm.wait_time >= i ? 1 : 0.3,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)' }}>💬 Comment (Optional)</label>
              <textarea
                placeholder="Share your feedback..."
                value={driverRatingForm.comment}
                onChange={(e) => setDriverRatingForm((f) => ({ ...f, comment: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  minHeight: 80,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="admin-btn success"
                disabled={(driverRatingForm.behavior === 0 && driverRatingForm.wait_time === 0) || driverRatingSubmitting}
                onClick={submitDriverRating}
                style={{ padding: '10px 20px' }}
              >
                {driverRatingSubmitting ? '⏳ Submitting...' : '✓ Submit Rating'}
              </button>
              {driverRatingMsg && (
                <span style={{ fontSize: 13, color: driverRatingMsg.startsWith('✅') ? 'var(--primary)' : 'var(--danger)' }}>
                  {driverRatingMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Already Rated Badge - Drivers */}
      {userRole === 'driver' && ride?.status === 'completed' && ride?.rider_rating != null && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div className="admin-card" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#15803d', fontWeight: 600 }}>✅ You've Already Rated This Passenger</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#22c55e' }}>Rating: {(ride.rider_rating).toFixed(1)}⭐</p>
          </div>
        </div>
      )}

      {/* Cannot Rate - Ride Not Completed */}
      {userRole === 'driver' && ride?.status !== 'completed' && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div className="admin-card" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#991b1b', fontWeight: 600 }}>⚠️ Cannot Rate Yet</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626' }}>This ride hasn't completed yet. Status: {ride?.status}</p>
          </div>
        </div>
      )}

      {/* Cannot Rate - Not Logged in as Driver */}
      {userRole !== 'driver' && userRole !== 'rider' && ride?.status === 'completed' && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div className="admin-card" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#991b1b', fontWeight: 600 }}>⚠️ Drivers Only</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626' }}>You must be logged in as a driver to rate passengers. Current role: {userRole}</p>
          </div>
        </div>
      )}

      {/* Cannot Rate - Not Assigned to This Ride */}
      {userRole === 'driver' && ride?.status === 'completed' && ride?.driver_id && (
        (() => {
          const token = localStorage.getItem('authToken')
          const payload = readJwtPayload(token)
          const currentDriverId = payload?.id
          return currentDriverId && ride.driver_id !== currentDriverId ? (
            <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
              <div className="admin-card" style={{ background: '#fef2f2', borderColor: '#fca5a5' }}>
                <p style={{ margin: 0, fontSize: 14, color: '#991b1b', fontWeight: 600 }}>⚠️ Not Your Ride</p>
                <p style={{ margin: '8px 0 0', fontSize: 12, color: '#dc2626' }}>You are not the driver assigned to this ride. Only the assigned driver can rate passengers.</p>
              </div>
            </div>
          ) : null
        })()
      )}

      {/* Rider Rating Form - Riders can rate drivers */}
      {userRole === 'rider' && ride?.status === 'completed' && ride?.driver_rating == null && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div className="admin-card">
            <h3 style={{ marginTop: 0, marginBottom: 16, fontSize: 16, fontWeight: 600 }}>📝 Rate This Driver</h3>
            
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)' }}>🚗 Driving Quality</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setRiderRatingForm((f) => ({ ...f, driving: i }))}
                    style={{
                      fontSize: 20,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: riderRatingForm.driving >= i ? 1 : 0.3,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)' }}>👤 Behavior</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setRiderRatingForm((f) => ({ ...f, behavior: i }))}
                    style={{
                      fontSize: 20,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: riderRatingForm.behavior >= i ? 1 : 0.3,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)' }}>✨ Cleanliness</label>
              <div style={{ display: 'flex', gap: 6 }}>
                {[1,2,3,4,5].map((i) => (
                  <button
                    key={i}
                    onClick={() => setRiderRatingForm((f) => ({ ...f, cleanliness: i }))}
                    style={{
                      fontSize: 20,
                      background: 'none',
                      border: 'none',
                      cursor: 'pointer',
                      opacity: riderRatingForm.cleanliness >= i ? 1 : 0.3,
                      transition: 'opacity 0.2s'
                    }}
                  >
                    ★
                  </button>
                ))}
              </div>
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)' }}>💬 Comment (Optional)</label>
              <textarea
                placeholder="Share your feedback..."
                value={riderRatingForm.comment}
                onChange={(e) => setRiderRatingForm((f) => ({ ...f, comment: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  fontFamily: 'inherit',
                  fontSize: 13,
                  minHeight: 80,
                  resize: 'vertical'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                className="admin-btn success"
                disabled={(riderRatingForm.driving === 0 && riderRatingForm.behavior === 0 && riderRatingForm.cleanliness === 0) || riderRatingSubmitting}
                onClick={submitRiderRating}
                style={{ padding: '10px 20px' }}
              >
                {riderRatingSubmitting ? '⏳ Submitting...' : '✓ Submit Rating'}
              </button>
              {riderRatingMsg && (
                <span style={{ fontSize: 13, color: riderRatingMsg.startsWith('✅') ? 'var(--primary)' : 'var(--danger)' }}>
                  {riderRatingMsg}
                </span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Already Rated Badge - Riders */}
      {userRole === 'rider' && ride?.status === 'completed' && ride?.driver_rating != null && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <div className="admin-card" style={{ background: '#f0fdf4', borderColor: '#86efac' }}>
            <p style={{ margin: 0, fontSize: 14, color: '#15803d', fontWeight: 600 }}>✅ You've Already Rated This Driver</p>
            <p style={{ margin: '8px 0 0', fontSize: 12, color: '#22c55e' }}>Rating: {(ride.driver_rating).toFixed(1)}⭐</p>
          </div>
        </div>
      )}

      {/* Full Comment Sections - Admin Only */}
      {(userRole === 'admin' || ride.rating_comment || ride.rating_rider_comment) && (ride.rating_comment || ride.rating_rider_comment) && (
        <div style={{ marginTop: 24, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
          <h3 style={{ marginBottom: 16, fontSize: 16, fontWeight: 600 }}>Rating Comments</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 16 }}>
            {ride.rating_comment && (
              <div className="admin-card">
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Rider's Comment (on Driver)</h4>
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-sub)' }}>{ride.rating_comment}</p>
              </div>
            )}
            {ride.rating_rider_comment && (
              <div className="admin-card">
                <h4 style={{ margin: '0 0 12px', fontSize: 14, fontWeight: 600 }}>Driver's Comment (on Rider)</h4>
                <p style={{ margin: 0, lineHeight: 1.6, color: 'var(--text-sub)' }}>{ride.rating_rider_comment}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
