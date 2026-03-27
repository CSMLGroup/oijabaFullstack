import React, { useEffect, useState, useMemo } from 'react'
import api from '../api'
import AdminDriverView from './AdminDriverView'

interface DriversProps {
  isActive?: boolean
  presetStatus?: 'all' | 'online' | 'pending'
  presetSignal?: number
}

type Driver = {
  id: string
  name?: string
  phone?: string
  vehicle?: string
  area?: string
  status?: string
  is_online?: boolean
  rides_count?: number
  total_rides?: number
  earnings?: number
  total_earned?: number
  profile_image?: string
}

type SortKey = 'name' | 'status' | 'vehicle' | 'rides_count' | 'earnings'
type SortDir = 'asc' | 'desc'

export default function Drivers({ isActive = true, presetStatus = 'all', presetSignal = 0 }: DriversProps): JSX.Element {
  const [drivers, setDrivers] = useState<Driver[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'online' | 'pending'>('all')

  // --- Place needsApproval FIRST, before any use ---
  // Only one needsApproval definition should exist, at the top
  // (If you see this block again, it is a duplicate and should be removed)

  const fetchDrivers = async () => {
    setLoading(true)
    try {
      const data: any = await api.drivers.list()
      let arr: any[] = []
      if (Array.isArray(data?.data)) arr = data.data
      else if (Array.isArray(data)) arr = data
      setDrivers(Array.isArray(arr) ? arr.filter(Boolean) : [])
    } catch (err) {
      setDrivers([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isActive) return
    void fetchDrivers()
  }, [isActive])

  useEffect(() => {
    setStatusFilter(presetStatus)
    if (presetStatus !== 'all') {
      setSortKey('status')
      setSortDir('asc')
    }
  }, [presetSignal, presetStatus])

  // --- needsApproval must be defined before any useMemo/render logic ---
  

  // Debug: log drivers and what the pending filter would match.
  // We intentionally avoid calling `needsApproval` here to prevent any
  // possible "access before initialization" errors; replicate the
  // normalization inline for safe logging.
  useEffect(() => {
    if (statusFilter !== 'pending') return
    try {
      console.log('[AdminDrivers] statusFilter=\'pending\' — full drivers:', drivers)
      const pendingMatches = drivers.filter(d => {
        const s = String(d?.status || '').toLowerCase().trim().replace(/[-\s]+/g, '_')
        return [
          'pending',
          'pending_approval',
          'need_approval',
          'needs_approval',
          'awaiting_approval'
        ].includes(s)
      })
      console.log('[AdminDrivers] computed pending matches:', pendingMatches)
    } catch (e) {
      console.error('[AdminDrivers] debug log failed', e)
    }
  }, [statusFilter, drivers])

  // --- needsApproval must be defined before any useMemo/render logic ---
  const needsApproval = (status?: unknown) => {
    if (typeof status !== 'string') return false
    const normalized = String(status || '').toLowerCase().trim().replace(/[\s-]+/g, '_')
    return normalized === 'pending'
      || normalized === 'pending_approval'
      || normalized === 'need_approval'
      || normalized === 'needs_approval'
      || normalized === 'awaiting_approval'
  }


  const filtered = useMemo(() => {
    const searched = drivers.filter(d => {
      if (!search) return true
      const s = search.toLowerCase()
      return ((d.name || '').toLowerCase().includes(s) || (d.phone || '').toLowerCase().includes(s) || d.id.toLowerCase().includes(s))
    })

    const statusMatched = searched.filter(d => {
      if (statusFilter === 'all') return true
      if (statusFilter === 'online') return Boolean(d.is_online) || String(d.status || '').toLowerCase() === 'online'
      if (statusFilter === 'pending') return needsApproval(d.status)
      return true
    })

    return [...statusMatched].sort((a, b) => {
      let av: any, bv: any
      if (sortKey === 'rides_count') {
        av = Number(a.rides_count ?? a.total_rides ?? -1)
        bv = Number(b.rides_count ?? b.total_rides ?? -1)
      } else if (sortKey === 'earnings') {
        av = Number(a.earnings ?? a.total_earned ?? -1)
        bv = Number(b.earnings ?? b.total_earned ?? -1)
      } else {
        av = (a[sortKey] || '').toLowerCase()
        bv = (b[sortKey] || '').toLowerCase()
      }
      if (av < bv) return sortDir === 'asc' ? -1 : 1
      if (av > bv) return sortDir === 'asc' ? 1 : -1
      return 0
    })
  }, [drivers, search, sortKey, sortDir, statusFilter])

  function handleSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => d === 'asc' ? 'desc' : 'asc')
    else { setSortKey(key); setSortDir('asc') }
  }

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <span style={{ opacity: 0.3, marginLeft: 4 }}>⇅</span>
    return <span style={{ marginLeft: 4 }}>{sortDir === 'asc' ? '↑' : '↓'}</span>
  }

  

  const isSuspendedLike = (status?: string) => {
    const normalized = String(status || '').toLowerCase()
    return normalized === 'suspended' || normalized === 'rejected' || normalized === 'banned' || normalized === 'inactive'
  }

  if (loading) return <div className="admin-loading">Loading drivers...</div>

  if (selected) {
    return <AdminDriverView driverId={selected} onBack={() => { setSelected(null); void fetchDrivers() }} />
  }

  const total = drivers.length
  const online = drivers.filter(d => Boolean(d.is_online) || String(d.status || '').toLowerCase() === 'online').length
  const pending = drivers.filter(d => needsApproval(d.status)).length
  const suspended = drivers.filter(d => isSuspendedLike(d.status)).length
  const totalRides = drivers.reduce((s, d) => s + (Number(d.rides_count ?? d.total_rides ?? 0) || 0), 0)
  const totalEarnings = drivers.reduce((s, d) => s + (Number(d.earnings ?? d.total_earned ?? 0) || 0), 0)

  return (
    <div className="admin-section">
      <h3 className="admin-heading">Drivers</h3>

      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Drivers</span>
            <span className="admin-stat-icon">🚗</span>
          </div>
          <div className="admin-stat-value">{total}</div>
          <div className="admin-stat-change">{online} online now</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Online</span>
            <span className="admin-stat-icon">🟢</span>
          </div>
          <div className="admin-stat-value">{online}</div>
          <div className="admin-stat-change positive">{total > 0 ? Math.round((online / total) * 100) : 0}% of fleet</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Pending Approval</span>
            <span className="admin-stat-icon">⏳</span>
          </div>
          <div className="admin-stat-value">{pending}</div>
          <div className="admin-stat-change negative">{suspended} suspended</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Rides</span>
            <span className="admin-stat-icon">🛺</span>
          </div>
          <div className="admin-stat-value">{totalRides.toLocaleString()}</div>
          <div className="admin-stat-change">৳{totalEarnings.toLocaleString()} earned</div>
        </div>
      </div>

      <div className="admin-toolbar">
        <input className="admin-search" placeholder="Search by name, phone or id" value={search} onChange={e => setSearch(e.target.value)} />
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as 'all' | 'online' | 'pending')}
          style={{ padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 8, background: '#fff', fontSize: 13 }}
        >
          <option value="all">All Statuses</option>
          <option value="online">Online</option>
          <option value="pending">Pending Approval</option>
        </select>
      </div>
      <div style={{ maxHeight: '420px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
      {filtered.length === 0 ? (
        <div style={{ padding: 32, textAlign: 'center', color: '#888' }}>
          {statusFilter === 'pending'
            ? 'No drivers are currently pending approval.'
            : 'No drivers found.'}
        </div>
      ) : (
        <table className="admin-table" style={{ border: 'none', borderRadius: 0 }}>
          <thead>
            <tr>
              <th style={{ width: 60 }}>Photo</th>
              <th onClick={() => handleSort('name')} style={{ cursor: 'pointer', userSelect: 'none' }}>Driver<SortIcon col="name" /></th>
              <th>Phone</th>
              <th onClick={() => handleSort('vehicle')} style={{ cursor: 'pointer', userSelect: 'none' }}>Vehicle<SortIcon col="vehicle" /></th>
              <th onClick={() => handleSort('status')} style={{ cursor: 'pointer', userSelect: 'none' }}>Status<SortIcon col="status" /></th>
              <th onClick={() => handleSort('rides_count')} style={{ cursor: 'pointer', userSelect: 'none' }}>Rides<SortIcon col="rides_count" /></th>
              <th onClick={() => handleSort('earnings')} style={{ cursor: 'pointer', userSelect: 'none' }}>Earnings<SortIcon col="earnings" /></th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(d => (
              <tr key={d.id}>
                <td>
                  <div style={{ width: 40, height: 40, borderRadius: 8, overflow: 'hidden', background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <img 
                      src={d.profile_image || '/assets/dummy-avatar.png'} 
                      alt="avatar" 
                      style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                    />
                  </div>
                </td>
                <td>
                  <button
                    type="button"
                    className="admin-link"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    onClick={() => setSelected(d.id)}
                  >
                    {d.name || d.id}
                  </button>
                </td>
                <td>{d.phone || '—'}</td>
                <td>{d.vehicle || '—'}</td>
                <td><span className={`admin-badge ${d.status || 'neutral'}`}>{d.status || '—'}</span></td>
                <td>{d.rides_count ?? d.total_rides ?? '—'}</td>
                <td>{d.earnings ?? d.total_earned ?? '—'}</td>
                <td>
                  {needsApproval(d.status) ? <span className="admin-badge pending">Need Approval</span> : <span className="admin-muted">—</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      </div>
    </div>
  )
}
