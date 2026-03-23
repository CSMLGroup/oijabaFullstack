import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'
import AdminRiderView from './AdminRiderView'

type Rider = {
  id: string
  name?: string
  phone?: string
  area?: string
  rides_completed?: number
  membership?: string
  status?: string
}

export default function Riders(): JSX.Element {
  const [riders, setRiders] = useState<Rider[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string | null>(null)
  const [sortBy, setSortBy] = useState<'name-asc' | 'name-desc' | 'rides-desc' | 'rides-asc' | 'membership' | 'status'>('name-asc')
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'pending' | 'suspended'>('all')

  const fetchRiders = async (): Promise<void> => {
    setLoading(true)
    try {
      const data: any = await api.riders.list()
      setRiders(Array.isArray(data?.data) ? data.data : Array.isArray(data) ? data : [])
    } catch {
      setRiders([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchRiders()
  }, [])

  useEffect(() => {
    console.log('[Riders] mounted, riders count:', riders.length)
  }, [riders])
  const filteredAndSorted = useMemo(() => {
    const qs = (search || '').toLowerCase().trim()
    let out = riders.filter(r => {
      // status filter
      if (statusFilter === 'active') {
        const normalized = (r.status || 'active').toLowerCase()
        if (!(normalized === 'active' || normalized === 'approved')) return false
      } else if (statusFilter === 'pending') {
        const normalized = (r.status || '').toLowerCase()
        if (!(normalized === 'pending' || normalized === 'need_approval' || normalized === 'needs_approval' || normalized === 'awaiting_approval')) return false
      } else if (statusFilter === 'suspended') {
        const normalized = (r.status || '').toLowerCase()
        if (!(normalized === 'suspended' || normalized === 'banned' || normalized === 'rejected' || normalized === 'inactive')) return false
      }

      if (!qs) return true
      return (
        (r.name || '').toLowerCase().includes(qs) ||
        (r.phone || '').toLowerCase().includes(qs) ||
        r.id.toLowerCase().includes(qs)
      )
    })

    out = out.sort((a, b) => {
      if (sortBy === 'name-asc') return (a.name || '').toLowerCase() < (b.name || '').toLowerCase() ? -1 : 1
      if (sortBy === 'name-desc') return (a.name || '').toLowerCase() > (b.name || '').toLowerCase() ? -1 : 1
      if (sortBy === 'rides-desc') return (b.rides_completed || 0) - (a.rides_completed || 0)
      if (sortBy === 'rides-asc') return (a.rides_completed || 0) - (b.rides_completed || 0)
      if (sortBy === 'membership') return (a.membership || '').toLowerCase() < (b.membership || '').toLowerCase() ? -1 : 1
      if (sortBy === 'status') return (a.status || '').toLowerCase() < (b.status || '').toLowerCase() ? -1 : 1
      return 0
    })

    return out
  }, [riders, search, sortBy, statusFilter])

  if (loading) return <div className="admin-loading">Loading riders...</div>

  if (selected) {
    return <AdminRiderView riderId={selected} onBack={() => { setSelected(null); void fetchRiders() }} />
  }

  function isPendingLike(status?: string): boolean {
    const normalized = (status || '').toLowerCase()
    return normalized === 'pending' || normalized === 'need_approval' || normalized === 'needs_approval' || normalized === 'awaiting_approval'
  }

  function isSuspendedLike(status?: string): boolean {
    const normalized = (status || '').toLowerCase()
    return normalized === 'suspended' || normalized === 'banned' || normalized === 'rejected' || normalized === 'inactive'
  }

  const total = riders.length
  const active = riders.filter(r => {
    const normalized = (r.status || 'active').toLowerCase()
    return normalized === 'active' || normalized === 'approved'
  }).length
  const suspended = riders.filter(r => isSuspendedLike(r.status)).length
  const pending = riders.filter(r => isPendingLike(r.status)).length
  const totalRides = riders.reduce((s, r) => s + (r.rides_completed || 0), 0)

  function getStatusLabel(status?: string): string {
    const normalized = (status || '').toLowerCase()
    if (normalized === 'pending' || normalized === 'need_approval' || normalized === 'needs_approval' || normalized === 'awaiting_approval') {
      return 'Need Approval'
    }
    return status || 'active'
  }

  function getStatusClass(status?: string): string {
    const normalized = (status || '').toLowerCase()
    if (normalized === 'pending' || normalized === 'need_approval' || normalized === 'needs_approval' || normalized === 'awaiting_approval') {
      return 'pending'
    }
    return status || 'active'
  }

  return (
    <div className="admin-section">
      <h3 className="admin-heading">Riders</h3>

      <div className="admin-stat-grid" style={{ marginBottom: 20 }}>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Riders</span>
            <span className="admin-stat-icon">👤</span>
          </div>
          <div className="admin-stat-value">{total}</div>
          <div className="admin-stat-change">{active} active</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Active</span>
            <span className="admin-stat-icon">🟢</span>
          </div>
          <div className="admin-stat-value">{active}</div>
          <div className="admin-stat-change positive">{total > 0 ? Math.round((active / total) * 100) : 0}% of riders</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Suspended</span>
            <span className="admin-stat-icon">🚫</span>
          </div>
          <div className="admin-stat-value">{suspended}</div>
          <div className="admin-stat-change negative">{pending} pending approval</div>
        </div>
        <div className="admin-stat-card">
          <div className="admin-stat-header">
            <span className="admin-stat-label">Total Rides</span>
            <span className="admin-stat-icon">🛺</span>
          </div>
          <div className="admin-stat-value">{totalRides.toLocaleString()}</div>
          <div className="admin-stat-change">rides taken</div>
        </div>
      </div>

      <div className="admin-toolbar" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          className="admin-search"
          placeholder="Search by name, phone or id"
          value={search}
          onChange={e => setSearch(e.target.value)}
          style={{ minWidth: 220 }}
        />
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)} style={{ padding: '8px 10px', borderRadius: 8 }}>
          <option value="all">All Statuses</option>
          <option value="active">Active</option>
          <option value="pending">Pending Approval</option>
          <option value="suspended">Suspended</option>
        </select>
        <select value={sortBy} onChange={e => setSortBy(e.target.value as any)} style={{ padding: '8px 10px', borderRadius: 8 }}>
          <option value="name-asc">Name ↑</option>
          <option value="name-desc">Name ↓</option>
          <option value="rides-desc">Rides ↓</option>
          <option value="rides-asc">Rides ↑</option>
          <option value="membership">Membership</option>
          <option value="status">Status</option>
        </select>
      </div>

      <div style={{ maxHeight: '420px', overflowY: 'auto', borderRadius: '10px', border: '1px solid var(--border)' }}>
        <table className="admin-table" style={{ border: 'none', borderRadius: 0 }}>
          <thead>
            <tr>
              <th>Rider</th>
              <th>Phone</th>
              <th>Area</th>
              <th>Rides</th>
              <th>Membership</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredAndSorted.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: 24, color: 'var(--text-sub)' }}>No riders found</td>
              </tr>
            ) : filteredAndSorted.map(r => (
              <tr key={r.id}>
                <td>
                  <button
                    type="button"
                    className="admin-link"
                    style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
                    onClick={() => setSelected(r.id)}
                  >
                    {r.name || r.id}
                  </button>
                </td>
                <td>{r.phone || '—'}</td>
                <td>{r.area || '—'}</td>
                <td>{r.rides_completed ?? '—'}</td>
                <td>{r.membership || 'standard'}</td>
                <td>
                  <span className={`admin-badge ${getStatusClass(r.status)}`}>{getStatusLabel(r.status)}</span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
