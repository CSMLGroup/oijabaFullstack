import React, { useState } from 'react'
import Dashboard from './admin/Dashboard'
import Drivers from './admin/Drivers'
import Riders from './admin/Riders'
import Rides from './admin/Rides'
import AdminMap from './admin/AdminMap'
import DriverRatingDisputes from './admin/DriverRatingDisputes'

type AdminTab = 'dashboard' | 'drivers' | 'riders' | 'rides' | 'rating-disputes' | 'map'
type DriversPresetStatus = 'all' | 'online' | 'pending'
type RidesPresetStatus = 'all' | 'ongoing' | 'pending' | 'completed' | 'cancelled'

interface Props {
  onLogout?: () => void
}

const NAV_SECTIONS: Array<{ title: string; items: Array<{ key: AdminTab; icon: string; label: string }> }> = [
  {
    title: 'Overview',
    items: [
      { key: 'dashboard', icon: '📊', label: 'Dashboard' },
    ],
  },
  {
    title: 'Operations',
    items: [
      { key: 'rides', icon: '🛺', label: 'Rides' },
      { key: 'map', icon: '🗺️', label: 'Live Map' },
    ],
  },
  {
    title: 'Accounts',
    items: [
      { key: 'drivers', icon: '🚗', label: 'Drivers' },
      { key: 'riders', icon: '👤', label: 'Riders' },
    ],
  },
  {
    title: 'Support',
    items: [
      { key: 'rating-disputes', icon: '⭐', label: 'Rating Disputes' },
    ],
  },
]

export default function AdminReact({ onLogout }: Props): JSX.Element {
  const [tab, setTab] = useState<AdminTab>('dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [driversPresetStatus, setDriversPresetStatus] = useState<DriversPresetStatus>('all')
  const [ridesPresetStatus, setRidesPresetStatus] = useState<RidesPresetStatus>('all')
  const [presetSignal, setPresetSignal] = useState(0)
  const [selectedRideId, setSelectedRideId] = useState<string | null>(null)
  const [mountedTabs, setMountedTabs] = useState<Record<AdminTab, boolean>>({
    dashboard: true,
    drivers: false,
    riders: false,
    rides: false,
    'rating-disputes': false,
    map: false,
  })

  const currentLabel = NAV_SECTIONS.flatMap(s => s.items).find(i => i.key === tab)?.label ?? 'Dashboard'
  const FilterableRides = Rides as React.ComponentType<{ presetStatus?: RidesPresetStatus; presetSignal?: number }>

  function handleNavClick(key: AdminTab): void {
    console.log('[AdminReact] handleNavClick', key)
    setTab(key)
    setMountedTabs(prev => (prev[key] ? prev : { ...prev, [key]: true }))
    setSidebarOpen(false)
  }

  function handleDashboardQuickNavigate(target: 'online-drivers' | 'pending-drivers' | 'active-rides'): void {
    if (target === 'online-drivers') {
      setDriversPresetStatus('online')
      setPresetSignal(v => v + 1)
      handleNavClick('drivers')
      return
    }
    if (target === 'pending-drivers') {
      setDriversPresetStatus('pending')
      setPresetSignal(v => v + 1)
      handleNavClick('drivers')
      return
    }
    setRidesPresetStatus('ongoing')
    setPresetSignal(v => v + 1)
    handleNavClick('rides')
  }

  function handleViewRideDetail(rideId: string): void {
    setSelectedRideId(rideId)
    setPresetSignal(v => v + 1)
    handleNavClick('rides')
  }

  return (
    <div className="a-shell">
      {sidebarOpen && <div className="a-overlay" onClick={() => setSidebarOpen(false)} />}

      <aside className={`a-sidebar${sidebarOpen ? ' open' : ''}`}>
        <div className="a-logo">
          <div className="a-logo-icon">🌍</div>
          <div className="a-logo-text">
            <span className="a-logo-name">oijaba</span>
            <span className="a-logo-sub">ওইযাবা</span>
          </div>
        </div>

        <nav className="a-nav">
          {NAV_SECTIONS.map(section => (
            <div key={section.title} className="a-nav-section">
              <p className="a-nav-section-title">{section.title}</p>
              {section.items.map(item => (
                <button
                  key={item.key}
                  className={`a-nav-item${tab === item.key ? ' active' : ''}`}
                  onClick={() => handleNavClick(item.key)}
                >
                  <span className="a-nav-icon">{item.icon}</span>
                  <span className="a-nav-label">{item.label}</span>
                </button>
              ))}
            </div>
          ))}
        </nav>
      </aside>

      <div className="a-main">
        <header className="a-navbar">
          <div className="a-navbar-left">
            <button className="a-hamburger" onClick={() => setSidebarOpen(v => !v)}>☰</button>
            <div className="a-navbar-title">{currentLabel}</div>
          </div>
          <div className="a-navbar-right">
            <div className="a-user-chip">
              <div className="a-user-avatar">A</div>
              <div className="a-user-info">
                <span className="a-user-name">Admin</span>
                <span className="a-user-role">Superadmin</span>
              </div>
            </div>
            {onLogout && (
              <button className="a-logout-btn" onClick={onLogout}>Logout</button>
            )}
          </div>
        </header>

        <div className="a-content">
          {mountedTabs.dashboard && (
            <div style={{ display: tab === 'dashboard' ? 'block' : 'none' }}>
              <Dashboard isActive={tab === 'dashboard'} onQuickNavigate={handleDashboardQuickNavigate} onViewRide={handleViewRideDetail} />
            </div>
          )}
          {mountedTabs.drivers && (
            <div style={{ display: tab === 'drivers' ? 'block' : 'none' }}>
              <Drivers
                isActive={tab === 'drivers'}
                presetStatus={driversPresetStatus}
                presetSignal={presetSignal}
              />
            </div>
          )}
          {mountedTabs.riders && (
            <div style={{ display: tab === 'riders' ? 'block' : 'none' }}>
              <Riders />
            </div>
          )}
          {mountedTabs.rides && (
            <div style={{ display: tab === 'rides' ? 'block' : 'none' }}>
              <FilterableRides
                presetStatus={ridesPresetStatus}
                presetSignal={presetSignal}
                openRideId={selectedRideId || undefined}
              />
            </div>
          )}
          {mountedTabs['rating-disputes'] && (
            <div style={{ display: tab === 'rating-disputes' ? 'block' : 'none' }}>
              <DriverRatingDisputes />
            </div>
          )}
          {mountedTabs.map && (
            <div style={{ display: tab === 'map' ? 'block' : 'none' }}>
              <AdminMap />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
