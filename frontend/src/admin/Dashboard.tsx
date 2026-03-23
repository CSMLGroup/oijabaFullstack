import React, { useEffect, useState } from 'react'
import api from '../api'

interface DashboardProps {
  isActive?: boolean
  onQuickNavigate?: (target: 'online-drivers' | 'pending-drivers' | 'active-rides') => void
  onViewRide?: (rideId: string) => void
}

type Stats = {
  onlineDrivers: number
  activeRides: number
  totalEarnings: number
  pendingDrivers: number
}

type Ride = {
  id: string
  driver_name?: string
  pickup_name?: string
  destination_name?: string
  fare?: number
  fare_estimate?: number
  fare_final?: number
  amount?: number
  status?: string
  created_at?: string
}

export default function Dashboard({ isActive = true, onQuickNavigate, onViewRide }: DashboardProps): JSX.Element {
  const [stats, setStats] = useState<Stats>({ onlineDrivers: 0, activeRides: 0, totalEarnings: 0, pendingDrivers: 0 })
  const [recentRides, setRecentRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)

  const isPendingDriverStatus = (status?: string): boolean => {
    const normalized = String(status || '').toLowerCase().trim().replace(/[\s-]+/g, '_')
    return normalized === 'pending'
      || normalized === 'pending_approval'
      || normalized === 'need_approval'
      || normalized === 'needs_approval'
      || normalized === 'awaiting_approval'
  }

  const isActiveRideStatus = (status?: string): boolean => {
    const normalized = String(status || '').toLowerCase()
    return ['accepted', 'pickup', 'started', 'ongoing', 'in_progress', 'active', 'searching'].includes(normalized)
  }

  const isCompletedRideStatus = (status?: string): boolean => {
    return String(status || '').toLowerCase() === 'completed'
  }

  const rideAmount = (ride: Ride): number => {
    return Number(ride.fare_final ?? ride.fare_estimate ?? ride.fare ?? ride.amount ?? 0) || 0
  }

  const fetchDashboardData = async (): Promise<void> => {
    if (!isActive) return
    setLoading(true)
    try {
      const [driversData, ridesData]: any[] = await Promise.all([api.drivers.list(), api.rides.list()])
      const drivers = Array.isArray(driversData?.data) ? driversData.data : Array.isArray(driversData) ? driversData : []
      const rides = Array.isArray(ridesData?.rides) ? ridesData.rides : Array.isArray(ridesData) ? ridesData : []

      const onlineDrivers = drivers.filter((d: any) => Boolean(d.is_online) || String(d.status || '').toLowerCase() === 'online').length
      const pendingDrivers = drivers.filter((d: any) => isPendingDriverStatus(d.status)).length
      const activeRides = rides.filter((r: any) => isActiveRideStatus(r.status)).length
      const totalEarnings = rides
        .filter((r: any) => isCompletedRideStatus(r.status))
        .reduce((sum: number, r: any) => sum + (Number(r.fare_final ?? r.fare_estimate ?? r.fare ?? r.amount ?? 0) || 0), 0)

      setStats({ onlineDrivers, activeRides, totalEarnings, pendingDrivers })
      setRecentRides(rides.slice(0, 5))
    } catch {
      setStats({ onlineDrivers: 0, activeRides: 0, totalEarnings: 0, pendingDrivers: 0 })
      setRecentRides([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchDashboardData()
  }, [isActive])

  if (loading) return <div className="admin-loading">Loading dashboard...</div>

  return (
    <div className="admin-section">
      <div className="admin-stat-grid">
        <button
          type="button"
          className="admin-stat-card"
          style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
          onClick={() => onQuickNavigate?.('online-drivers')}
          title="Show online drivers"
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Online Drivers</span>
            <span className="admin-stat-icon">🚗</span>
          </div>
          <div className="admin-stat-value">{stats.onlineDrivers}</div>
          <div className="admin-stat-change positive">
            <span className="admin-live-badge"><span className="admin-live-dot" />Live</span>
          </div>
        </button>

        <button
          type="button"
          className="admin-stat-card"
          style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
          onClick={() => onQuickNavigate?.('active-rides')}
          title="Show active rides"
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Active Rides</span>
            <span className="admin-stat-icon">🛺</span>
          </div>
          <div className="admin-stat-value">{stats.activeRides}</div>
          <div className="admin-stat-change positive">
            <span className="admin-live-badge"><span className="admin-live-dot" />Live</span>
          </div>
        </button>

        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Earnings</span>
            <span className="admin-stat-icon">💰</span>
          </div>
          <div className="admin-stat-value">৳{stats.totalEarnings.toLocaleString()}</div>
          <div className="admin-stat-change positive">All time</div>
        </div>

        <button
          type="button"
          className="admin-stat-card"
          style={{ textAlign: 'left', width: '100%', cursor: 'pointer' }}
          onClick={() => onQuickNavigate?.('pending-drivers')}
          title="Show pending drivers"
        >
          <div className="admin-stat-header">
            <span className="admin-stat-label">Pending Drivers</span>
            <span className="admin-stat-icon">⚠️</span>
          </div>
          <div className="admin-stat-value">{stats.pendingDrivers}</div>
          <div className="admin-stat-change negative">Awaiting approval</div>
        </button>
      </div>

      <div className="admin-recent-card">
        <div className="admin-recent-header">
          <span className="admin-recent-title">Recent Rides</span>
        </div>
        <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
          <table className="admin-table" style={{ border: 'none', borderRadius: 0 }}>
            <thead>
              <tr>
                <th>Ride ID</th>
                <th>Driver</th>
                <th>Route</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Time</th>
              </tr>
            </thead>
            <tbody>
              {recentRides.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: '#888', padding: '20px' }}>No rides yet</td></tr>
              ) : recentRides.map(r => (
                <tr key={r.id} style={{ cursor: 'pointer' }} onClick={() => { console.log('[Dashboard] row click', r.id); onViewRide?.(r.id) }}>
                  <td>
                    <button
                      type="button"
                      className="admin-link"
                      onClick={(e) => { e.stopPropagation(); console.log('[Dashboard] id click', r.id); onViewRide?.(r.id) }}
                      style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    >
                      {r.ride_ref || r.id?.slice(0, 8)}
                    </button>
                  </td>
                  <td>{r.driver_name || '—'}</td>
                  <td>{[r.pickup_name, r.destination_name].filter(Boolean).join(' → ') || '—'}</td>
                  <td>৳{rideAmount(r)}</td>
                  <td><span className={`admin-badge ${r.status || 'neutral'}`}>{r.status || '—'}</span></td>
                  <td>{r.created_at ? new Date(r.created_at).toLocaleString() : '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
