import React, { useEffect, useState, useMemo } from 'react'
import api from '../api'
import AdminRideDetail from '../admin/AdminRideDetail'

type Props = { onOpenRide?: (id: string) => void; language?: 'en' | 'bn' }

export default function RidesPage({ onOpenRide, language = 'bn' }: Props): JSX.Element {
  const [rides, setRides] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [sortBy, setSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewingRideId, setViewingRideId] = useState<string | null>(null)

  const bn = language === 'bn'
  const t = {
    loading: bn ? 'রাইড লোড হচ্ছে...' : 'Loading rides…',
    backToRides: bn ? '← রাইডে ফিরুন' : '← Back to Rides',
    myRides: bn ? 'আমার রাইড' : 'My Rides',
    total: bn ? 'মোট' : 'Total',
    completed: bn ? 'সম্পন্ন' : 'Completed',
    cancelled: bn ? 'বাতিল' : 'Cancelled',
    totalSpent: bn ? 'মোট খরচ' : 'Total Spent',
    rateDrivers: bn ? 'চালকদের রেটিং দিন' : 'Rate Your Drivers',
    search: bn ? 'খুঁজুন' : 'Search',
    searchPlaceholder: bn ? 'রাইড আইডি, লোকেশন, চালক দিয়ে খুঁজুন...' : 'Search by ride ID, location, driver…',
    statusFilter: bn ? 'স্ট্যাটাস ফিল্টার' : 'Status Filter',
    allStatuses: bn ? 'সব স্ট্যাটাস' : 'All Statuses',
    ongoing: bn ? 'চলমান' : 'Ongoing',
    pending: bn ? 'অপেক্ষমাণ' : 'Pending',
    sortBy: bn ? 'সাজান' : 'Sort By',
    newestFirst: bn ? 'সাম্প্রতিক আগে' : 'Newest First',
    oldestFirst: bn ? 'পুরনো আগে' : 'Oldest First',
    byStatus: bn ? 'স্ট্যাটাস অনুযায়ী' : 'By Status',
    noRides: bn ? 'কোনো রাইড পাওয়া যায়নি' : 'No rides found',
    noRidesFilter: bn ? 'আপনার ফিল্টারে কোনো রাইড নেই' : 'No rides match your filters',
    ref: bn ? 'রেফ' : 'Ref',
    driver: bn ? 'চালক' : 'Driver',
    pickup: bn ? 'পিকআপ' : 'Pickup',
    destination: bn ? 'গন্তব্য' : 'Destination',
    fare: bn ? 'ভাড়া' : 'Fare',
    driverRating: bn ? 'চালক রেটিং' : 'Driver Rating',
    status: bn ? 'স্ট্যাটাস' : 'Status',
    date: bn ? 'তারিখ' : 'Date',
    action: bn ? 'কার্যক্রম' : 'Action',
    rate: bn ? '⭐ রেটিং দিন' : '⭐ Rate',
    details: bn ? 'বিবরণ' : 'Details',
    view: bn ? 'দেখুন' : 'View',
  }

  useEffect(() => {
    let mounted = true

    const loadRides = async () => {
      try {
        const meData: any = await api.auth.me()
        const me = meData?.user || meData

        if (me?.id) {
          const riderRides: any = await api.rides.listByRider(me.id)
          if (!mounted) return
          setRides(Array.isArray(riderRides?.rides) ? riderRides.rides : Array.isArray(riderRides) ? riderRides : [])
          return
        }

        const data: any = await api.rides.list()
        if (!mounted) return
        setRides(Array.isArray(data?.rides) ? data.rides : Array.isArray(data) ? data : [])
      } catch {
        if (mounted) setRides([])
      } finally {
        if (mounted) setLoading(false)
      }
    }

    loadRides()
    return () => {
      mounted = false
    }
  }, [])

  const filteredAndSortedRides = useMemo(() => {
    return rides
      .filter(r => {
        // Apply status filter
        if (statusFilter !== 'all' && r.status !== statusFilter) {
          return false
        }

        // Apply search filter
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase()
          const rideIdMatch = (r.ride_ref || r.id)?.toLowerCase().includes(query)
          const riderNameMatch = r.rider_name?.toLowerCase().includes(query)
          const pickupMatch = r.pickup_name?.toLowerCase().includes(query)
          const destMatch = r.destination_name?.toLowerCase().includes(query)
          return rideIdMatch || riderNameMatch || pickupMatch || destMatch
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
          const aOrder = statusOrder[a.status || ''] ?? 99
          const bOrder = statusOrder[b.status || ''] ?? 99
          return aOrder - bOrder
        }
        return 0
      })
  }, [rides, searchQuery, sortBy, statusFilter])

  const completedRides = rides.filter(r => r.status === 'completed')
  const cancelledRides = rides.filter(r => r.status === 'cancelled')

  if (loading) return <div style={{ padding: 20, textAlign: 'center' }}>{t.loading}</div>

  // Show ride details view when a ride is selected
  if (viewingRideId) {
    return (
      <div style={{ padding: 20 }}>
        <button onClick={() => setViewingRideId(null)} style={{ marginBottom: 16, padding: '8px 16px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--surface)', cursor: 'pointer' }}>
          {t.backToRides}
        </button>
        <AdminRideDetail rideId={viewingRideId} onBack={() => setViewingRideId(null)} />
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2 style={{ marginTop: 0 }}>{t.myRides}</h2>

      {/* Stats Cards */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">{t.total}</span><span className="admin-stat-icon">🛺</span></div>
          <div className="admin-stat-value">{rides.length}</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">{t.completed}</span><span className="admin-stat-icon">✅</span></div>
          <div className="admin-stat-value">{completedRides.length}</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">{t.cancelled}</span><span className="admin-stat-icon">❌</span></div>
          <div className="admin-stat-value">{cancelledRides.length}</div>
        </div>
        <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
          <div className="admin-stat-header"><span className="admin-stat-label">{t.totalSpent}</span><span className="admin-stat-icon">💰</span></div>
          <div className="admin-stat-value">৳{rides.reduce((s, r) => s + (r.fare_final ?? r.fare_estimate ?? 0), 0).toLocaleString()}</div>
        </div>
      </div>

      {/* Rating Reminder */}
      {(() => {
        const unratedRides = completedRides.filter(r => !r.driver_rating)
        if (unratedRides.length > 0) {
          return (
            <div style={{ marginBottom: 16, padding: 16, borderRadius: 8, background: '#fef3c7', border: '1px solid #fcd34d', display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ fontSize: 24 }}>⭐</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, color: '#92400e', marginBottom: 4 }}>{t.rateDrivers}</div>
                <div style={{ fontSize: 13, color: '#b45309' }}>
                  {bn
                    ? `আপনার ${unratedRides.length}টি সম্পন্ন রাইড রেটিংয়ের অপেক্ষায় আছে। নিচে রেটিং দিয়ে চালকদের উন্নতিতে সাহায্য করুন!`
                    : `You have ${unratedRides.length} completed ride${unratedRides.length !== 1 ? 's' : ''} waiting for your feedback. Help drivers improve by rating them below!`
                  }
                </div>
              </div>
            </div>
          )
        }
        return null
      })()}

      {/* Filters and Sort Controls */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>{t.search}</label>
          <input
            type="text"
            placeholder={t.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit' }}
          />
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>{t.statusFilter}</label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
          >
            <option value="all">{t.allStatuses}</option>
            <option value="completed">{t.completed}</option>
            <option value="cancelled">{t.cancelled}</option>
            <option value="ongoing">{t.ongoing}</option>
            <option value="pending">{t.pending}</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>{t.sortBy}</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
          >
            <option value="date-desc">{t.newestFirst}</option>
            <option value="date-asc">{t.oldestFirst}</option>
            <option value="status">{t.byStatus}</option>
          </select>
        </div>
      </div>

      {/* Rides Table */}
      <div style={{ maxHeight: 480, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
        <table className="admin-table" style={{ border: 'none', borderRadius: 0 }}>
          <thead>
            <tr><th>{t.ref}</th><th>{t.driver}</th><th>{t.pickup}</th><th>{t.destination}</th><th>{t.fare}</th><th>{t.driverRating}</th><th>{t.status}</th><th>{t.date}</th><th>{t.action}</th></tr>
          </thead>
          <tbody>
            {filteredAndSortedRides.length === 0 ? (
              <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-sub)' }}>
                {rides.length === 0 ? t.noRides : t.noRidesFilter}
              </td></tr>
            ) : filteredAndSortedRides.map(r => (
              <tr
                key={r.id}
                onClick={() => setViewingRideId(r.id)}
                style={{ cursor: 'pointer' }}
              >
                <td>{r.ride_ref || r.id?.slice(0, 8)}</td>
                <td>{r.driver_name || '—'}</td>
                <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.pickup_name || '—'}</td>
                <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.destination_name || '—'}</td>
                <td>৳{r.fare_final ?? r.fare_estimate ?? '—'}</td>
                <td>{r.driver_rating ? `⭐ ${(r.driver_rating).toFixed(1)}` : '—'}</td>
                <td><span className={`admin-badge ${r.status || 'neutral'}`}>{r.status || '—'}</span></td>
                <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                <td onClick={(e) => e.stopPropagation()}>
                  {r.status === 'completed' && !r.driver_rating ? (
                    <button
                      className="admin-btn"
                      onClick={() => setViewingRideId(r.id)}
                      style={{ padding: '4px 8px', fontSize: 12, background: '#fcd34d', color: '#92400e', border: 'none', fontWeight: 600 }}
                    >
                      {t.rate}
                    </button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
