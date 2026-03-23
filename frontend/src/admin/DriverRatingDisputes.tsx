import React, { useEffect, useMemo, useState } from 'react'
import api from '../api'

type Dispute = {
  id: string
  driver_name?: string
  driver_phone?: string
  ride_ref?: string
  current_rating?: number | null
  reason?: string
  status?: string
  admin_note?: string | null
  created_at?: string
}

const STATUS_OPTIONS: Array<'open' | 'under_review' | 'resolved' | 'rejected'> = [
  'open',
  'under_review',
  'resolved',
  'rejected'
]

export default function DriverRatingDisputes(): JSX.Element {
  const [rows, setRows] = useState<Dispute[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'under_review' | 'resolved' | 'rejected'>('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [statusDraft, setStatusDraft] = useState<Record<string, string>>({})
  const [noteDraft, setNoteDraft] = useState<Record<string, string>>({})
  const [message, setMessage] = useState('')

  const statusCounts = useMemo(() => {
    const counts: Record<'open' | 'under_review' | 'resolved' | 'rejected', number> = {
      open: 0,
      under_review: 0,
      resolved: 0,
      rejected: 0
    }

    rows.forEach((row) => {
      const status = String(statusDraft[row.id] || row.status || 'open').toLowerCase()
      if (status === 'open' || status === 'under_review' || status === 'resolved' || status === 'rejected') {
        counts[status] += 1
      }
    })

    return counts
  }, [rows, statusDraft])

  const filteredRows = useMemo(() => {
    const normalizedSearch = searchQuery.trim().toLowerCase()

    return rows.filter((row) => {
      const effectiveStatus = String(statusDraft[row.id] || row.status || 'open').toLowerCase()
      const matchStatus = statusFilter === 'all' || effectiveStatus === statusFilter

      if (!matchStatus) return false
      if (!normalizedSearch) return true

      const haystack = [
        row.ride_ref || '',
        row.driver_name || '',
        row.driver_phone || '',
        row.reason || '',
        row.admin_note || ''
      ]
        .join(' ')
        .toLowerCase()

      return haystack.includes(normalizedSearch)
    })
  }, [rows, searchQuery, statusFilter, statusDraft])

  useEffect(() => {
    loadDisputes()
  }, [])

  async function loadDisputes() {
    setLoading(true)
    try {
      const data = await api.drivers.listRatingDisputes()
      const disputes = Array.isArray((data as any)?.disputes) ? (data as any).disputes : []
      setRows(disputes)
      setStatusDraft(
        disputes.reduce((acc: Record<string, string>, d: Dispute) => {
          acc[d.id] = d.status || 'open'
          return acc
        }, {})
      )
      setNoteDraft(
        disputes.reduce((acc: Record<string, string>, d: Dispute) => {
          acc[d.id] = d.admin_note || ''
          return acc
        }, {})
      )
    } catch {
      setRows([])
    } finally {
      setLoading(false)
    }
  }

  async function saveDispute(id: string) {
    const status = (statusDraft[id] || 'open') as 'open' | 'under_review' | 'resolved' | 'rejected'
    const admin_note = (noteDraft[id] || '').trim()

    setMessage('Saving dispute update...')
    try {
      await api.drivers.updateRatingDispute(id, { status, admin_note })
      setMessage('Dispute updated.')
      await loadDisputes()
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not update dispute.'
      setMessage(msg)
    }
  }

  if (loading) return <div className="admin-loading">Loading rating disputes...</div>

  return (
    <div className="admin-section">
      <h3 className="admin-heading">Driver Rating Disputes</h3>
      {message && <p className="admin-muted">{message}</p>}

      <div className="admin-toolbar" style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="admin-search"
          placeholder="Search by ride ref, driver, phone, reason"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          style={{ minWidth: 320 }}
        />
        <select
          className="admin-search"
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'all' | 'open' | 'under_review' | 'resolved' | 'rejected')}
          style={{ minWidth: 170 }}
        >
          <option value="all">All statuses</option>
          {STATUS_OPTIONS.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <span className="admin-muted">Showing {filteredRows.length} of {rows.length}</span>
      </div>

      <div className="admin-filter-chips" role="group" aria-label="Quick status filters">
        <button
          type="button"
          className={`admin-filter-chip ${statusFilter === 'all' ? 'active' : ''}`}
          onClick={() => setStatusFilter('all')}
        >
          All ({rows.length})
        </button>
        <button
          type="button"
          className={`admin-filter-chip ${statusFilter === 'open' ? 'active' : ''}`}
          onClick={() => setStatusFilter('open')}
        >
          Open ({statusCounts.open})
        </button>
        <button
          type="button"
          className={`admin-filter-chip ${statusFilter === 'under_review' ? 'active' : ''}`}
          onClick={() => setStatusFilter('under_review')}
        >
          Under Review ({statusCounts.under_review})
        </button>
        <button
          type="button"
          className={`admin-filter-chip ${statusFilter === 'resolved' ? 'active' : ''}`}
          onClick={() => setStatusFilter('resolved')}
        >
          Resolved ({statusCounts.resolved})
        </button>
        <button
          type="button"
          className={`admin-filter-chip ${statusFilter === 'rejected' ? 'active' : ''}`}
          onClick={() => setStatusFilter('rejected')}
        >
          Rejected ({statusCounts.rejected})
        </button>
      </div>

      {rows.length === 0 ? (
        <p className="admin-muted">No rating disputes yet.</p>
      ) : filteredRows.length === 0 ? (
        <p className="admin-muted">No disputes match this filter.</p>
      ) : (
        <table className="admin-table">
          <thead>
            <tr>
              <th>Ride Ref</th>
              <th>Driver</th>
              <th>Current Rating</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Admin Note</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filteredRows.map((row) => (
              <tr key={row.id}>
                <td>{row.ride_ref || '—'}</td>
                <td>
                  <div>{row.driver_name || '—'}</div>
                  <div className="admin-muted">{row.driver_phone || '—'}</div>
                </td>
                <td>{row.current_rating ?? '—'}</td>
                <td style={{ minWidth: 220 }}>{row.reason || '—'}</td>
                <td>
                  <select
                    className="admin-search"
                    style={{ minWidth: 130 }}
                    value={statusDraft[row.id] || row.status || 'open'}
                    onChange={(e) => setStatusDraft((prev) => ({ ...prev, [row.id]: e.target.value }))}
                  >
                    {STATUS_OPTIONS.map((status) => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
                <td>
                  <input
                    className="admin-search"
                    value={noteDraft[row.id] || ''}
                    onChange={(e) => setNoteDraft((prev) => ({ ...prev, [row.id]: e.target.value }))}
                    placeholder="Optional admin note"
                  />
                </td>
                <td>
                  <button className="admin-btn success" onClick={() => void saveDispute(row.id)}>Save</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  )
}
