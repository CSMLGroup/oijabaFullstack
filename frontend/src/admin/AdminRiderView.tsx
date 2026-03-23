import React, { useEffect, useState } from 'react'
import api from '../api'
import { BD_LOCATIONS, POST_OFFICES } from '../bd-post-office-master'
import { BD_DISTRICTS_BN, BD_LOCATIONS_BN, POST_OFFICES_BN } from '../bd-post-office-master-bn'
import AdminRideDetail from './AdminRideDetail'

type RiderUser = {
  id: string
  name?: string
  name_bn?: string
  phone?: string
  area?: string
  district?: string
  upazilla?: string
  house_no?: string
  road_no?: string
  landmark?: string
  post_office?: string
  nid_number?: string
  status?: string
  membership?: string
  profile_image?: string
  rating_sum?: number
  rating_count?: number
  total_rides?: number
  rides_count?: number
  rides_completed?: number
  created_at?: string
}

type Ride = {
  id: string
  ride_ref?: string
  driver_name?: string
  driver_phone?: string
  pickup_name?: string
  destination_name?: string
  fare?: number
  fare_estimate?: number
  fare_final?: number
  status?: string
  created_at?: string
  rider_rating?: number
}

type Tab = 'overview' | 'rides' | 'profile' | 'ride-detail'

interface Props {
  riderId: string
  onBack: () => void
}

export default function AdminRiderView({ riderId, onBack }: Props): JSX.Element {
  const [tab, setTab] = useState<Tab>('overview')
  const [rider, setRider] = useState<RiderUser | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<Partial<RiderUser>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [approving, setApproving] = useState(false)
  const [denying, setDenying] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [otpStep, setOtpStep] = useState<'idle' | 'pending'>('idle')
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [hasSensitiveChange, setHasSensitiveChange] = useState(false)

  // Language
  const [isBangla, setIsBangla] = useState(() => {
    try { return localStorage.getItem('oijaba_lang') === 'bn' } catch { return false }
  })

  // Rides filtering and sorting
  const [ridesSearchQuery, setRidesSearchQuery] = useState('')
  const [ridesSortBy, setRidesSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc')
  const [ridesStatusFilter, setRidesStatusFilter] = useState<string>('all')

  // Ride detail view
  const [viewingRideId, setViewingRideId] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    setError('')
    Promise.all([
      api.riders.get(riderId),
      api.rides.listByRider(riderId),
    ])
      .then(([riderRes, ridesRes]: any[]) => {
        setRider(riderRes?.user || riderRes?.rider || riderRes || null)
        setRides(Array.isArray(ridesRes?.rides) ? ridesRes.rides : [])
      })
      .catch((err: any) => setError(err?.message || 'Failed to load rider data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [riderId])

  useEffect(() => {
    const syncLang = () => {
      try { setIsBangla(localStorage.getItem('oijaba_lang') === 'bn') } catch {}
    }
    window.addEventListener('oijaba-language-changed', syncLang)
    window.addEventListener('storage', syncLang)
    return () => {
      window.removeEventListener('oijaba-language-changed', syncLang)
      window.removeEventListener('storage', syncLang)
    }
  }, [])

  const startEditProfile = () => {
    if (!rider) return
    setProfileForm({
      name: rider.name || '',
      name_bn: rider.name_bn || '',
      phone: rider.phone || '',
      nid_number: rider.nid_number || '',
      area: rider.area || '',
      district: rider.district || '',
      upazilla: rider.upazilla || '',
      house_no: rider.house_no || '',
      road_no: rider.road_no || '',
      landmark: rider.landmark || '',
      post_office: rider.post_office || '',
      membership: rider.membership || 'new',
      status: rider.status || 'active',
    })
    setProfileMsg('')
    setHasSensitiveChange(false)
    setEditingProfile(true)
  }

  const saveProfile = async () => {
    if (hasSensitiveChange) {
      setOtpSending(true)
      setProfileMsg('')
      try {
        await api.auth.sendOtp(rider!.phone!, 'rider')
        setOtpCode('')
        setOtpStep('pending')
        setProfileMsg(`OTP sent to rider's phone (${rider?.phone}). Enter to confirm changes.`)
      } catch (err: any) {
        setProfileMsg(err.message || 'Failed to send OTP')
      } finally {
        setOtpSending(false)
      }
      return
    }

    setProfileSaving(true)
    setProfileMsg('')
    try {
      const res: any = await api.riders.updateById(riderId, profileForm)
      setRider(res.user || res.rider || res)
      setEditingProfile(false)
      setProfileMsg('Saved successfully')
    } catch (err: any) {
      setProfileMsg(err.message || 'Save failed')
    } finally {
      setProfileSaving(false)
    }
  }

  const verifyAndSave = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setProfileMsg("Enter the 4-digit OTP sent to the rider's phone")
      return
    }
    setProfileSaving(true)
    setProfileMsg('')
    try {
      await api.auth.verifyOtp(rider!.phone!, otpCode.trim(), 'rider')
      const res: any = await api.riders.updateById(riderId, profileForm)
      setRider(res.user || res.rider || res)
      setEditingProfile(false)
      setOtpStep('idle')
      setOtpCode('')
      setProfileMsg('Saved successfully')
    } catch (err: any) {
      setProfileMsg(err.message || 'Invalid OTP or save failed')
    } finally {
      setProfileSaving(false)
    }
  }

  const approveRider = async () => {
    setApproving(true)
    setProfileMsg('')
    try {
      const res: any = await api.riders.updateById(riderId, { status: 'active' })
      setRider(res.user || res.rider || res)
      setProfileMsg('Rider approved successfully')
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to approve rider')
    } finally {
      setApproving(false)
    }
  }

  const denyRider = async () => {
    setDenying(true)
    setProfileMsg('')
    try {
      const res: any = await api.riders.updateById(riderId, { status: 'suspended' })
      setRider(res.user || res.rider || res)
      setProfileMsg('Rider request denied')
    } catch (err: any) {
      setProfileMsg(err.message || 'Failed to deny rider')
    } finally {
      setDenying(false)
    }
  }

  const riderNeedsApproval = ['pending', 'need_approval', 'needs_approval', 'awaiting_approval'].includes(String(rider?.status || '').toLowerCase())

  const totalRides = rider?.total_rides ?? rider?.rides_count ?? rider?.rides_completed ?? 0
  const rating = rider?.rating_count ? (rider.rating_sum! / rider.rating_count).toFixed(1) : '—'
  const completedRides = rides.filter(r => r.status === 'completed')
  const cancelledRides = rides.filter(r => r.status === 'cancelled')

  const filteredAndSortedRides = rides
    .filter(r => {
      if (ridesStatusFilter !== 'all' && r.status !== ridesStatusFilter) return false
      if (ridesSearchQuery.trim()) {
        const q = ridesSearchQuery.toLowerCase()
        return (r.ride_ref || r.id)?.toLowerCase().includes(q) || r.driver_name?.toLowerCase().includes(q)
      }
      return true
    })
    .sort((a, b) => {
      if (ridesSortBy === 'date-desc') return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      if (ridesSortBy === 'date-asc') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      if (ridesSortBy === 'status') {
        const order: Record<string, number> = { completed: 0, cancelled: 1, ongoing: 2, pending: 3 }
        return (order[a.status || ''] ?? 99) - (order[b.status || ''] ?? 99)
      }
      return 0
    })

  const backButtonStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #0f6b4f',
    background: 'linear-gradient(135deg, #0f8a64, #0f6b4f)',
    color: '#ffffff',
    fontWeight: 700,
    boxShadow: '0 6px 16px rgba(15, 107, 79, 0.35)'
  }

  if (loading) return <div className="admin-loading">Loading rider profile...</div>
  if (error) return (
    <div className="admin-section">
      <button className="admin-btn" style={{ ...backButtonStyle, marginBottom: 12 }} onClick={onBack}>← Back to Riders</button>
      <div style={{ color: 'var(--danger)', padding: 20 }}>{error}</div>
    </div>
  )
  if (!rider) return (
    <div className="admin-section">
      <button className="admin-btn" style={{ ...backButtonStyle, marginBottom: 12 }} onClick={onBack}>← Back to Riders</button>
      <div style={{ color: 'var(--danger)', padding: 20 }}>Rider not found.</div>
    </div>
  )

  if (tab === 'ride-detail' && viewingRideId) {
    return (
      <AdminRideDetail
        rideId={viewingRideId}
        onBack={() => { setViewingRideId(null); setTab('rides') }}
      />
    )
  }

  const tabs: { id: Tab; label: string; desc: string }[] = [
    { id: 'overview', label: 'Overview', desc: 'Stats & info' },
    { id: 'rides', label: 'Rides', desc: `${rides.length} total` },
    { id: 'profile', label: 'Profile', desc: 'Details & documents' },
  ]

  const fieldStyle: React.CSSProperties = { display: 'flex', flexDirection: 'column', gap: 4 }
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }
  const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }

  return (
    <div className="admin-section">
      {/* Back button + rider header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="admin-btn" style={backButtonStyle} onClick={onBack}>← Riders</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {rider.profile_image ? (
              <img src={rider.profile_image} alt="profile" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>🧑</div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{rider.name || 'No name'}</div>
              <div style={{ color: 'var(--text-sub)', fontSize: 13 }}>
                {rider.phone} · <span className={`admin-badge ${rider.status || 'neutral'}`} style={{ fontSize: 11 }}>{rider.status || 'active'}</span>
                {rider.membership && <span style={{ marginLeft: 6, fontSize: 11, fontWeight: 600, background: '#f0f4ff', color: '#3b5bdb', padding: '1px 7px', borderRadius: 10, textTransform: 'capitalize' }}>{rider.membership}</span>}
              </div>
            </div>
          </div>
        </div>
        {riderNeedsApproval && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="admin-btn success"
              onClick={() => void approveRider()}
              disabled={approving || denying}
              style={{ fontWeight: 700 }}
            >
              {approving ? 'Approving...' : 'Approve Rider'}
            </button>
            <button
              className="admin-btn"
              onClick={() => void denyRider()}
              disabled={approving || denying}
              style={{ fontWeight: 700, background: '#b91c1c', borderColor: '#b91c1c', color: '#fff' }}
            >
              {denying ? 'Denying...' : 'Deny Rider'}
            </button>
          </div>
        )}
      </div>

      {profileMsg ? (
        <div style={{ marginTop: -8, marginBottom: 14, padding: '8px 10px', borderRadius: 8, fontSize: 13, fontWeight: 600, background: profileMsg.toLowerCase().includes('failed') || profileMsg.toLowerCase().includes('invalid') ? '#fff0f0' : '#f0faf5', color: profileMsg.toLowerCase().includes('failed') || profileMsg.toLowerCase().includes('invalid') ? 'var(--danger)' : 'var(--primary)' }}>
          {profileMsg}
        </div>
      ) : null}

      {/* Horizontal tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              border: tab === t.id ? 'none' : '1px solid var(--border)',
              background: tab === t.id ? 'var(--primary)' : '#fff',
              color: tab === t.id ? '#fff' : 'var(--text)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
            <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 6, opacity: 0.75 }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-header"><span className="admin-stat-label">Total Rides</span><span className="admin-stat-icon">🛺</span></div>
              <div className="admin-stat-value">{totalRides.toLocaleString()}</div>
              <div className="admin-stat-change">{completedRides.length} completed this fetch</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-header"><span className="admin-stat-label">Rating</span><span className="admin-stat-icon">⭐</span></div>
              <div className="admin-stat-value">{rating}</div>
              <div className="admin-stat-change">{rider.rating_count ?? 0} ratings</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-header"><span className="admin-stat-label">Completed</span><span className="admin-stat-icon">✅</span></div>
              <div className="admin-stat-value">{completedRides.length}</div>
              <div className="admin-stat-change">{cancelledRides.length} cancelled</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-header"><span className="admin-stat-label">Member Since</span><span className="admin-stat-icon">📅</span></div>
              <div className="admin-stat-value" style={{ fontSize: 16 }}>{rider.created_at ? new Date(rider.created_at).toLocaleDateString() : '—'}</div>
              <div className="admin-stat-change">joined</div>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Rider Info</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 24px' }}>
              {[
                ['Phone', rider.phone],
                ['Area', rider.area],
                ['District', rider.district],
                ['Upazilla', rider.upazilla],
                ['NID', rider.nid_number],
                ['Membership', rider.membership],
                ['Status', rider.status],
              ].map(([label, value]) => (
                <div key={label as string} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="admin-card">
            <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Recent Rides</h4>
            {rides.length === 0 ? (
              <div style={{ color: 'var(--text-sub)', textAlign: 'center', padding: 20 }}>No rides yet</div>
            ) : (
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)' }}>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Ref</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Route</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Fare</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '6px 8px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {rides.slice(0, 5).map(r => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => { setViewingRideId(r.id); setTab('ride-detail') }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '7px 8px', fontFamily: 'monospace', fontSize: 12 }}>{r.ride_ref || r.id?.slice(0, 8)}</td>
                      <td style={{ padding: '7px 8px' }}>
                        <div style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.pickup_name || '—'} → {r.destination_name || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '7px 8px' }}>৳{r.fare_final ?? r.fare_estimate ?? r.fare ?? '—'}</td>
                      <td style={{ padding: '7px 8px' }}>
                        <span className={`admin-badge ${r.status || 'neutral'}`} style={{ fontSize: 11 }}>{r.status || '—'}</span>
                      </td>
                      <td style={{ padding: '7px 8px', color: 'var(--text-sub)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
            {rides.length > 5 && (
              <button className="admin-btn" style={{ marginTop: 12, width: '100%' }} onClick={() => setTab('rides')}>
                View all {rides.length} rides →
              </button>
            )}
          </div>
        </div>
      )}

      {/* Tab: Rides */}
      {tab === 'rides' && (
        <div>
          {/* Search and filter */}
          <div style={{ display: 'flex', gap: 10, marginBottom: 16, flexWrap: 'wrap' }}>
            <input
              style={{ flex: 1, minWidth: 160, padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
              placeholder="Search by Ride ID or driver name..."
              value={ridesSearchQuery}
              onChange={e => setRidesSearchQuery(e.target.value)}
            />
            <select
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
              value={ridesStatusFilter}
              onChange={e => setRidesStatusFilter(e.target.value)}
            >
              <option value="all">All Statuses</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
              <option value="ongoing">Ongoing</option>
              <option value="pending">Pending</option>
            </select>
            <select
              style={{ padding: '8px 12px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14 }}
              value={ridesSortBy}
              onChange={e => setRidesSortBy(e.target.value as typeof ridesSortBy)}
            >
              <option value="date-desc">Newest First</option>
              <option value="date-asc">Oldest First</option>
              <option value="status">By Status</option>
            </select>
          </div>

          <div style={{ fontSize: 13, color: 'var(--text-sub)', marginBottom: 10 }}>
            Showing {filteredAndSortedRides.length} of {rides.length} rides
          </div>

          {filteredAndSortedRides.length === 0 ? (
            <div className="admin-card" style={{ textAlign: 'center', padding: 40, color: 'var(--text-sub)' }}>No rides found</div>
          ) : (
            <div className="admin-card" style={{ padding: 0, overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--border)', background: 'var(--surface)' }}>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Ride Ref</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Route</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Driver</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Fare</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Status</th>
                    <th style={{ textAlign: 'left', padding: '10px 12px', color: 'var(--text-sub)', fontWeight: 600, fontSize: 11, textTransform: 'uppercase' }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredAndSortedRides.map(r => (
                    <tr
                      key={r.id}
                      style={{ borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                      onClick={() => { setViewingRideId(r.id); setTab('ride-detail') }}
                      onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface)')}
                      onMouseLeave={e => (e.currentTarget.style.background = '')}
                    >
                      <td style={{ padding: '9px 12px', fontFamily: 'monospace', fontSize: 12 }}>{r.ride_ref || r.id?.slice(0, 8)}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <div style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.pickup_name || '—'} → {r.destination_name || '—'}
                        </div>
                      </td>
                      <td style={{ padding: '9px 12px' }}>{r.driver_name || '—'}<br /><span style={{ color: 'var(--text-sub)', fontSize: 11 }}>{r.driver_phone || ''}</span></td>
                      <td style={{ padding: '9px 12px' }}>৳{r.fare_final ?? r.fare_estimate ?? r.fare ?? '—'}</td>
                      <td style={{ padding: '9px 12px' }}>
                        <span className={`admin-badge ${r.status || 'neutral'}`} style={{ fontSize: 11 }}>{r.status || '—'}</span>
                      </td>
                      <td style={{ padding: '9px 12px', color: 'var(--text-sub)' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {tab === 'profile' && (
        <div>
          {/* Profile Photo */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="admin-card">
              <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Profile Photo</h4>
              {rider.profile_image ? (
                <img src={rider.profile_image} alt="profile" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10 }} />
              ) : (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: 10, color: 'var(--text-sub)' }}>No photo</div>
              )}
              <label style={{ display: 'block', marginTop: 10, cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = async () => {
                      const dataUrl = String(reader.result)
                      try {
                        const res: any = await api.riders.updateById(riderId, { profile_image: dataUrl })
                        setRider(d => d ? { ...d, profile_image: res.user?.profile_image || res.rider?.profile_image || dataUrl } : d)
                        setProfileMsg('Photo updated')
                      } catch (err: any) {
                        setProfileMsg(err.message || 'Photo upload failed')
                      }
                    }
                    reader.readAsDataURL(file)
                    e.target.value = ''
                  }}
                />
                <span
                  className="admin-btn"
                  style={{
                    padding: '9px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    transition: 'transform 140ms ease, filter 140ms ease, box-shadow 140ms ease',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.filter = 'brightness(1.03)'
                    e.currentTarget.style.boxShadow = '0 7px 16px rgba(15, 23, 42, 0.18)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.filter = 'none'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.12)'
                  }}
                >
                  <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 16V5" />
                      <path d="m7 10 5-5 5 5" />
                      <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
                    </svg>
                  </span>
                  {rider.profile_image ? 'Change Profile Photo' : 'Upload Profile Photo'}
                </span>
              </label>
            </div>
          </div>

          {/* Edit form */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15 }}>Profile Details</h4>
              {!editingProfile ? (
                <button className="admin-btn" style={{ padding: '6px 16px' }} onClick={startEditProfile}>✏️ Edit</button>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="admin-btn" style={{ padding: '6px 16px' }} onClick={() => { setEditingProfile(false); setOtpStep('idle'); setOtpCode(''); setHasSensitiveChange(false) }}>Cancel</button>
                  <button className="admin-btn success" style={{ padding: '6px 16px' }} disabled={profileSaving || otpSending} onClick={saveProfile}>
                    {otpSending ? 'Sending OTP…' : profileSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {profileMsg && (
              <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: profileMsg.includes('ailed') || profileMsg.includes('nvalid') ? '#fff0f0' : '#f0faf5', color: profileMsg.includes('ailed') || profileMsg.includes('nvalid') ? 'var(--danger)' : 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
                {profileMsg}
              </div>
            )}

            {!editingProfile ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 24px' }}>
                {[
                  ['Phone', rider.phone],
                  ['Name (EN)', rider.name],
                  ['Name (BN)', rider.name_bn],
                  ['NID No.', rider.nid_number],
                  ['Area', rider.area],
                  ['District', rider.district],
                  ['Upazilla', rider.upazilla],
                  ['House No.', rider.house_no],
                  ['Road No.', rider.road_no],
                  ['Landmark', rider.landmark],
                  ['Post Office', rider.post_office],
                  ['Membership', rider.membership],
                  ['Status', rider.status],
                  ['Member Since', rider.created_at ? new Date(rider.created_at).toLocaleDateString() : '—'],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div>
                {hasSensitiveChange && (
                  <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: '#fffbeb', border: '1px solid #fbbf24', color: '#92400e', fontSize: 13 }}>
                    🔒 You are changing a sensitive field (name, phone, or NID). An OTP will be sent to the rider's current phone number to confirm.
                  </div>
                )}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                  {([
                    ['name', 'Name (EN)', false],
                    ['name_bn', 'Name (BN)', false],
                    ['phone', 'Phone', true],
                    ['nid_number', 'NID No.', true],
                    ['area', 'Area', false],
                    ['house_no', 'House No.', false],
                    ['road_no', 'Road No.', false],
                    ['landmark', 'Landmark', false],
                  ] as [keyof RiderUser, string, boolean][]).map(([key, label, sensitive]) => (
                    <div key={key} style={fieldStyle}>
                      <label style={labelStyle}>
                        {label}
                        {sensitive && <span style={{ marginLeft: 4, color: '#f59e0b' }}>🔒</span>}
                        {key === 'name' && <span style={{ marginLeft: 4, color: '#f59e0b' }}>🔒</span>}
                      </label>
                      <input
                        style={inputStyle}
                        value={(profileForm[key] as string) || ''}
                        onChange={e => {
                          setProfileForm(f => ({ ...f, [key]: e.target.value }))
                          if (sensitive || key === 'name') setHasSensitiveChange(true)
                        }}
                      />
                    </div>
                  ))}

                  {/* District */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{isBangla ? 'জেলা (District)' : 'District'}</label>
                    <select
                      style={inputStyle}
                      value={profileForm.district || ''}
                      onChange={e => setProfileForm(f => ({ ...f, district: e.target.value, upazilla: '', post_office: '' }))}
                    >
                      <option value=''>{isBangla ? 'জেলা নির্বাচন করুন' : 'Select District'}</option>
                      {isBangla
                        ? BD_DISTRICTS_BN.map(d => <option key={d.value} value={d.value}>{d.label} ({d.value})</option>)
                        : Object.keys(BD_LOCATIONS).sort().map(d => <option key={d} value={d}>{d}</option>)}
                    </select>
                  </div>

                  {/* Upazilla */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{isBangla ? 'উপজেলা (Upazilla)' : 'Upazilla'}</label>
                    <select
                      style={inputStyle}
                      value={profileForm.upazilla || ''}
                      onChange={e => setProfileForm(f => ({ ...f, upazilla: e.target.value, post_office: '' }))}
                      disabled={!profileForm.district}
                    >
                      <option value=''>{isBangla ? 'উপজেলা নির্বাচন করুন' : 'Select Upazilla'}</option>
                      {isBangla
                        ? (profileForm.district ? (BD_LOCATIONS_BN[profileForm.district] || []) : []).map(u => <option key={u.value} value={u.value}>{u.label} ({u.value})</option>)
                        : (profileForm.district ? (BD_LOCATIONS[profileForm.district] || []) : []).map(u => <option key={u} value={u}>{u}</option>)}
                    </select>
                  </div>

                  {/* Post Office */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>{isBangla ? 'পোস্ট অফিস (Post Office)' : 'Post Office'}</label>
                    <select
                      style={inputStyle}
                      value={profileForm.post_office || ''}
                      onChange={e => setProfileForm(f => ({ ...f, post_office: e.target.value }))}
                      disabled={!profileForm.upazilla}
                    >
                      <option value=''>{isBangla ? 'পোস্ট অফিস নির্বাচন করুন' : 'Select Post Office'}</option>
                      {isBangla
                        ? (profileForm.upazilla ? (POST_OFFICES_BN[profileForm.upazilla] || []) : []).map(po => <option key={po.value} value={po.value}>{po.label}</option>)
                        : (profileForm.upazilla ? (POST_OFFICES[profileForm.upazilla] || []) : []).map(po => <option key={`${po.name} (${po.code})`} value={`${po.name} (${po.code})`}>{po.name} ({po.code})</option>)}
                    </select>
                  </div>

                  {/* Membership */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Membership</label>
                    <select
                      style={inputStyle}
                      value={profileForm.membership || 'new'}
                      onChange={e => setProfileForm(f => ({ ...f, membership: e.target.value }))}
                    >
                      <option value="new">New</option>
                      <option value="regular">Regular</option>
                      <option value="frequent">Frequent</option>
                      <option value="premium">Premium</option>
                      <option value="vip">VIP</option>
                    </select>
                  </div>

                  {/* Status */}
                  <div style={fieldStyle}>
                    <label style={labelStyle}>Status</label>
                    <select
                      style={inputStyle}
                      value={profileForm.status || 'active'}
                      onChange={e => setProfileForm(f => ({ ...f, status: e.target.value }))}
                    >
                      <option value="active">Active</option>
                      <option value="suspended">Suspended</option>
                      <option value="banned">Banned</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {otpStep === 'pending' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="admin-card" style={{ width: 340, padding: 32, borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.22)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Verify Identity</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-sub)', fontSize: 13 }}>
              An OTP has been sent to the rider's phone<br />
              <strong>{rider?.phone}</strong>. Enter it below to confirm changes.
            </p>
            <input
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', fontSize: 22, letterSpacing: 8, textAlign: 'center', fontWeight: 700, border: '2px solid var(--primary)', borderRadius: 10, outline: 'none', marginBottom: 16 }}
              placeholder="• • • •"
              maxLength={6}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyAndSave()}
              autoFocus
            />
            {profileMsg && (
              <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: profileMsg.includes('ailed') || profileMsg.includes('nvalid') ? '#fff0f0' : '#f0faf5', color: profileMsg.includes('ailed') || profileMsg.includes('nvalid') ? 'var(--danger)' : 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
                {profileMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="admin-btn" style={{ flex: 1, padding: '10px 0' }} onClick={() => { setOtpStep('idle'); setOtpCode(''); setProfileMsg('') }}>
                Cancel
              </button>
              <button className="admin-btn success" style={{ flex: 1, padding: '10px 0' }} disabled={profileSaving} onClick={verifyAndSave}>
                {profileSaving ? 'Saving…' : '✓ Confirm'}
              </button>
            </div>
            <button
              style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={async () => {
                setOtpSending(true)
                try {
                  await api.auth.sendOtp(rider!.phone!, 'rider')
                  setOtpCode('')
                  setProfileMsg('OTP resent.')
                } catch (e: any) {
                  setProfileMsg(e.message || 'Failed to resend OTP')
                } finally {
                  setOtpSending(false)
                }
              }}
              disabled={otpSending}
            >
              {otpSending ? 'Sending…' : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
