import React, { useEffect, useState } from 'react'
import api from '../api'
import AdminRideDetail from './AdminRideDetail'

interface RidesProps {
  presetStatus?: 'all' | 'ongoing' | 'pending' | 'completed' | 'cancelled'
  presetSignal?: number
}

type Ride = {
  id: string
  ride_ref?: string
  rider_name?: string
  rider_phone?: string
  driver_id?: string
  driver_name?: string
  driver_phone?: string
  pickup_name?: string
  destination_name?: string
  fare?: number
  fare_estimate?: number
  fare_final?: number
  status?: string
  created_at?: string
  driver_rating?: number
  rider_rating?: number
  distance?: number
  duration?: number
  payment_method?: string
  payment_status?: string
}

export default function Rides({ presetStatus = 'all', presetSignal = 0, openRideId }: RidesProps & { openRideId?: string }): JSX.Element {
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  // Filtering and sorting
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc')
  const [statusFilter, setStatusFilter] = useState<string>('all')

  // Ride detail view
  const [viewingRideId, setViewingRideId] = useState<string | null>(null)

  useEffect(() => {
    if (openRideId) setViewingRideId(openRideId)
  }, [openRideId])

  const fetchRides = async (): Promise<void> => {
    setLoading(true)
    try {
      const data: any = await api.rides.list()
      setRides(Array.isArray(data?.rides) ? data.rides : Array.isArray(data) ? data : [])
    } catch {
      setRides([])
    } finally {
      setLoading(false)
    }
  }

  const getStatusGroup = (status?: string): 'completed' | 'cancelled' | 'ongoing' | 'pending' | 'other' => {
    const normalized = String(status || '').toLowerCase()
    if (normalized === 'completed') return 'completed'
    if (normalized === 'cancelled' || normalized === 'canceled') return 'cancelled'
    if (['accepted', 'pickup', 'started', 'in_progress', 'ongoing', 'active'].includes(normalized)) return 'ongoing'
    if (['searching', 'pending', 'requested'].includes(normalized)) return 'pending'
    return 'other'
  }

  const rideFareValue = (ride: Ride): number => Number(ride.fare_final ?? ride.fare_estimate ?? ride.fare ?? 0) || 0

  useEffect(() => {
    void fetchRides()
  }, [])

  useEffect(() => {
    setStatusFilter(presetStatus)
  }, [presetSignal, presetStatus])

  const viewRideDetail = (rideId: string) => {
    setViewingRideId(rideId)
  }

  const downloadRideInfoPDF = (rideData: Ride) => {
    // Create PDF content as HTML
    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ride Information - ${rideData.ride_ref || rideData.id}</title>
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
              <span class="detail-value">${rideData.id?.slice(0, 16) || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reference:</span>
              <span class="detail-value">${rideData.ride_ref || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value"><span class="badge badge-${rideData.status || 'pending'}">${rideData.status?.toUpperCase() || '—'}</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${rideData.created_at ? new Date(rideData.created_at).toLocaleString() : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Driver Information</h2>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${rideData.driver_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${rideData.driver_phone || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rating:</span>
              <span class="detail-value">${rideData.driver_rating ? '⭐ ' + rideData.driver_rating.toFixed(1) : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Rider Information</h2>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${rideData.rider_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${rideData.rider_phone || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Rating:</span>
              <span class="detail-value">${rideData.rider_rating ? '⭐ ' + rideData.rider_rating.toFixed(1) : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Route Details</h2>
            <div class="detail-row">
              <span class="detail-label">Pickup:</span>
              <span class="detail-value">${rideData.pickup_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Destination:</span>
              <span class="detail-value">${rideData.destination_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Distance:</span>
              <span class="detail-value">${rideData.distance ? rideData.distance.toFixed(2) + ' km' : '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Duration:</span>
              <span class="detail-value">${rideData.duration ? rideData.duration + ' minutes' : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Fare & Payment</h2>
            <div class="detail-row">
              <span class="detail-label">Estimated Fare:</span>
              <span class="detail-value">৳${rideData.fare_estimate ?? '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Final Fare:</span>
              <span class="detail-value">৳${rideData.fare_final ?? '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Method:</span>
              <span class="detail-value">${rideData.payment_method || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Status:</span>
              <span class="detail-value">${rideData.payment_status || '—'}</span>
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
    link.setAttribute('download', `ride-info-${rideData.ride_ref || rideData.id?.slice(0, 8)}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }
  const filteredAndSortedRides = rides
    .filter(r => {
      // Apply status filter
      if (statusFilter !== 'all' && getStatusGroup(r.status) !== statusFilter) {
        return false
      }

      // Apply search filter (search by ride ID, rider name, or driver name)
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase()
        const rideIdMatch = (r.ride_ref || r.id)?.toLowerCase().includes(query)
        const riderNameMatch = r.rider_name?.toLowerCase().includes(query)
        const driverNameMatch = r.driver_name?.toLowerCase().includes(query)
        return rideIdMatch || riderNameMatch || driverNameMatch
      }

      return true
    })
    .sort((a, b) => {
      // Sort by selected preference
      if (sortBy === 'date-desc') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      } else if (sortBy === 'date-asc') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      } else if (sortBy === 'status') {
        const statusOrder: { [key: string]: number } = { 'completed': 0, 'cancelled': 1, 'ongoing': 2, 'pending': 3 }
        const aOrder = statusOrder[getStatusGroup(a.status)] ?? 99
        const bOrder = statusOrder[getStatusGroup(b.status)] ?? 99
        return aOrder - bOrder
      }
      return 0
    })

  const completedRides = rides.filter(r => getStatusGroup(r.status) === 'completed')
  const cancelledRides = rides.filter(r => getStatusGroup(r.status) === 'cancelled')

  if (loading) return <div className="admin-loading">Loading rides...</div>

  // Show ride details page when a ride is selected
  if (viewingRideId) {
    return (
      <AdminRideDetail
        rideId={viewingRideId}
        onBack={() => { setViewingRideId(null); void fetchRides() }}
      />
    )
  }

  return (
    <div className="admin-section">
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">Total</span><span className="admin-stat-icon">🛺</span></div>
          <div className="admin-stat-value">{rides.length}</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">Completed</span><span className="admin-stat-icon">✅</span></div>
          <div className="admin-stat-value">{completedRides.length}</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">Cancelled</span><span className="admin-stat-icon">❌</span></div>
          <div className="admin-stat-value">{cancelledRides.length}</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">Revenue</span><span className="admin-stat-icon">💰</span></div>
          <div className="admin-stat-value">৳{completedRides.reduce((s, r) => s + rideFareValue(r), 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Filters and Sort Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Search</label>
          <input
            type="text"
            placeholder="Search by ride ID, rider, or driver..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Status Filter</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
          >
            <option value="all">All Statuses</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
            <option value="ongoing">Ongoing</option>
            <option value="pending">Pending</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Sort By</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
          >
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="status">By Status</option>
          </select>
        </div>
      </div>

      <div style={{ maxHeight: 480, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)', marginBottom: 16 }}>
        <table className="admin-table" style={{ border: 'none', borderRadius: 0 }}>
          <thead>
            <tr><th>Ref</th><th>Driver</th><th>Rider</th><th>Pickup</th><th>Destination</th><th>Fare</th><th>Driver⭐</th><th>Rider⭐</th><th>Status</th><th>Date</th><th>Docs</th></tr>
          </thead>
          <tbody>
            {filteredAndSortedRides.length === 0 ? (
              <tr><td colSpan={11} style={{ textAlign: 'center', padding: 24, color: 'var(--text-sub)' }}>
                {rides.length === 0 ? 'No rides found' : 'No rides match your filters'}
              </td></tr>
            ) : filteredAndSortedRides.map(r => (
              <tr
                key={r.id}
                onClick={() => viewRideDetail(r.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>{r.ride_ref || r.id?.slice(0, 8)}</td>
                <td>{r.driver_name || '—'}</td>
                <td>{r.rider_name || '—'}</td>
                <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.pickup_name || '—'}</td>
                <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.destination_name || '—'}</td>
                <td>৳{r.fare_final ?? r.fare_estimate ?? '—'}</td>
                <td>{r.driver_rating ? `⭐ ${(r.driver_rating).toFixed(1)}` : '—'}</td>
                <td>{r.rider_rating ? `⭐ ${(r.rider_rating).toFixed(1)}` : '—'}</td>
                <td><span className={`admin-badge ${r.status || 'neutral'}`}>{r.status || '—'}</span></td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                <td style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                  <button
                    className="admin-btn info"
                    onClick={() => downloadRideInfoPDF(r)}
                    style={{ padding: '4px 8px', fontSize: 12 }}
                    title="Download as PDF"
                  >
                    📄 PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
