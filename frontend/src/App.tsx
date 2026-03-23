import React, { useEffect, useState } from 'react'
import DriverPage from './pages/DriverPage'
import AdminDashboard from './AdminDashboard'
import ProfilePage from './pages/ProfilePage'
import RidesPage from './pages/RidesPage'
import RideDetails from './pages/RideDetails'
import RiderRegister from './pages/RiderRegister'
import HomePage from './pages/HomePage'
import { readJwtPayload } from './authToken'
import { clearAuthToken } from './api'

type Role = 'guest' | 'rider' | 'driver' | 'admin'
type Panel = 'home' | 'driver-home' | 'rider-auth' | 'rider-account' | 'ride-details' | 'admin-home'
type AccountTab = 'profile' | 'rides'

function readRoleFromToken(): Role {
  const token = localStorage.getItem('oijaba_token')
  if (!token) return 'guest'

  const payload = readJwtPayload(token)
  if (!payload) return 'guest'

  const role = payload?.role
  if (role === 'rider' || role === 'driver' || role === 'admin') return role

  return 'guest'
}

export default function App(): JSX.Element {
  const [role, setRole] = useState<Role>('guest')
  const [panel, setPanel] = useState<Panel>('home')
  const [accountTab, setAccountTab] = useState<AccountTab>('rides')
  const [selectedRide, setSelectedRide] = useState<string | undefined>(undefined)
  const [isScrolled, setIsScrolled] = useState(false)
  const [language, setLanguage] = useState<'en' | 'bn'>('bn')
  const [userProfileOpen, setUserProfileOpen] = useState(false)
  const [userName, setUserName] = useState('User')
  const [userPhone, setUserPhone] = useState('--')

  function goHomeSection(hash: string): void {
    setPanel('home')
    window.location.hash = hash
  }

  function syncUserProfileFromStorage(): void {
    try {
      const profile = localStorage.getItem('userProfile')
      if (!profile) {
        setUserName('User')
        setUserPhone('--')
        return
      }
      const data = JSON.parse(profile)
      setUserName(data.name || 'User')
      setUserPhone(data.phone || '--')
    } catch (_) {
      setUserName('User')
      setUserPhone('--')
    }
  }

  function handleRiderLogout(): void {
    clearAuthToken()
    localStorage.removeItem('userProfile')
    setUserProfileOpen(false)
    setPanel('home')
    window.location.hash = 'home'
  }

  useEffect(() => {
    const applyHashPanel = () => {
      const hashPanel = window.location.hash.replace('#', '')

      if (hashPanel === 'home') {
        setPanel('home')
        return
      }

      if (hashPanel === 'driver-home' || hashPanel === 'driver') {
        setPanel('driver-home')
        return
      }

      if (hashPanel === 'admin') {
        setPanel('admin-home')
        return
      }

      if (hashPanel === 'rider-account') {
        setPanel('rider-account')
        setAccountTab('rides')
        return
      }

      if (hashPanel === 'rider-profile' || hashPanel === 'profile') {
        setPanel('rider-account')
        setAccountTab('profile')
        return
      }

      if (hashPanel === 'rider-auth' || hashPanel === 'register' || hashPanel === 'login') {
        setPanel('rider-auth')
        return
      }

      if (hashPanel === 'rider-rides' || hashPanel === 'rides') {
        setPanel('rider-account')
        setAccountTab('rides')
        return
      }

      if (hashPanel === 'ride-details') {
        setPanel('ride-details')
        return
      }

      setPanel('home')
    }

    const syncRoleAndPanel = () => {
      const userRole = readRoleFromToken()
      setRole(userRole)

      if (userRole === 'driver') {
        setPanel('driver-home')
        return
      }

      if (userRole === 'admin') {
        setPanel('admin-home')
        return
      }

      if (userRole === 'rider') {
        const hashPanel = window.location.hash.replace('#', '')
        const blockedPanels = ['driver-home', 'driver', 'admin', 'rider-auth', 'register', 'login']
        if (blockedPanels.includes(hashPanel)) {
          setPanel('home')
          window.location.hash = 'home'
          return
        }

        applyHashPanel()
        return
      }

      if (userRole === 'guest') {
        applyHashPanel()
        return
      }

      applyHashPanel()
    }

    syncRoleAndPanel()
    window.addEventListener('hashchange', syncRoleAndPanel)
    window.addEventListener('storage', syncRoleAndPanel)
    window.addEventListener('oijaba-auth-changed', syncRoleAndPanel)

    return () => {
      window.removeEventListener('hashchange', syncRoleAndPanel)
      window.removeEventListener('storage', syncRoleAndPanel)
      window.removeEventListener('oijaba-auth-changed', syncRoleAndPanel)
    }
  }, [])

  useEffect(() => {
    if (role !== 'rider') return

    syncUserProfileFromStorage()
    const onAuthChange = () => syncUserProfileFromStorage()
    window.addEventListener('oijaba-auth-changed', onAuthChange)
    window.addEventListener('storage', onAuthChange)

    return () => {
      window.removeEventListener('oijaba-auth-changed', onAuthChange)
      window.removeEventListener('storage', onAuthChange)
    }
  }, [role])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function openRide(id?: string) {
    setSelectedRide(id)
    setPanel('ride-details')
    window.location.hash = 'ride-details'
  }

  if (role === 'driver') {
    return <DriverPage />
  }

  if (role === 'admin') {
    return <AdminDashboard />
  }

  if (panel === 'home') {
    return <HomePage />
  }

  if (role === 'guest' && panel === 'driver-home') {
    return <DriverPage />
  }

  if (role === 'guest' && panel === 'admin-home') {
    return <AdminDashboard />
  }

  return (
    <div style={{ minHeight: '100vh', background: '#F4F7F6' }}>
      {role === 'rider' && (
        <style>{`
          .hp-nav-link:hover { color: #006a4e !important; background: rgba(0,106,78,0.1) !important; }
          .hp-nav-link-scrolled:hover { color: #fff !important; background: rgba(255,255,255,0.15) !important; }
        `}</style>
      )}

      {role === 'rider' && (
        <nav style={{ position: 'fixed', top: 0, width: '100%', zIndex: 1000, padding: isScrolled ? '12px 0' : '16px 0', background: isScrolled ? 'rgba(0, 106, 78, 0.95)' : 'rgba(0, 106, 78, 0.05)', backdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)', borderBottom: isScrolled ? '1px solid rgba(0,0,0,0.12)' : 'none', boxShadow: isScrolled ? '0 8px 24px rgba(0,0,0,0.15)' : 'none', transition: '0.3s cubic-bezier(0.4, 0, 0.2, 1)' }}>
          <div
            style={{
              maxWidth: 1200,
              margin: '0 auto',
              padding: '0 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16
            }}
          >
            <a href="/" onClick={(event) => { event.preventDefault(); goHomeSection('home') }} style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
              <div style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 10, boxShadow: 'rgba(0, 0, 0, 0.1) 0px 4px 12px', flexShrink: 0 }}>
                <img src="/assets/vehicles/easybike.jpg" alt="Oijaba" style={{ width: 28, height: 28, objectFit: 'contain', mixBlendMode: 'multiply' }} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
                <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, background: isScrolled ? 'none' : 'linear-gradient(135deg, rgb(0, 106, 78), rgb(0, 76, 56))', WebkitBackgroundClip: isScrolled ? 'unset' : 'text', WebkitTextFillColor: isScrolled ? '#fff' : 'transparent', backgroundClip: isScrolled ? 'unset' : 'text', color: isScrolled ? '#fff' : 'transparent' }}>oijaba</span>
                <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', color: isScrolled ? 'rgba(255,255,255,0.8)' : 'rgb(107, 143, 118)', WebkitTextFillColor: isScrolled ? 'rgba(255,255,255,0.8)' : 'rgb(107, 143, 118)' }}>ওইযাবা</span>
              </div>
            </a>

            <ul style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'nowrap', flex: '1 1 0%' }}>
              <li><a href="#features" className={isScrolled ? 'hp-nav-link-scrolled' : 'hp-nav-link'} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: isScrolled ? 'rgba(255,255,255,0.9)' : 'rgb(61, 90, 71)', textDecoration: 'none', transition: '0.15s', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); goHomeSection('features') }}>{language === 'en' ? 'Features' : 'বৈশিষ্ট্য'}</a></li>
              <li><a href="#vehicles" className={isScrolled ? 'hp-nav-link-scrolled' : 'hp-nav-link'} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: isScrolled ? 'rgba(255,255,255,0.9)' : 'rgb(61, 90, 71)', textDecoration: 'none', transition: '0.15s', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); goHomeSection('vehicles') }}>{language === 'en' ? 'Vehicles' : 'যানবাহন'}</a></li>
              <li><a href="#how-it-works" className={isScrolled ? 'hp-nav-link-scrolled' : 'hp-nav-link'} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: isScrolled ? 'rgba(255,255,255,0.9)' : 'rgb(61, 90, 71)', textDecoration: 'none', transition: '0.15s', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); goHomeSection('how-it-works') }}>{language === 'en' ? 'How it works' : 'কীভাবে কাজ করে'}</a></li>
              <li><a href="#driver-home" className={isScrolled ? 'hp-nav-link-scrolled' : 'hp-nav-link'} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: isScrolled ? 'rgba(255,255,255,0.9)' : 'rgb(61, 90, 71)', textDecoration: 'none', transition: '0.15s', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); setPanel('driver-home'); window.location.hash = 'driver-home' }}>{language === 'en' ? 'Drive with us' : 'আমাদের সাথে চালান'}</a></li>
              <li><a href="#rider-rides" className={isScrolled ? 'hp-nav-link-scrolled' : 'hp-nav-link'} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: isScrolled ? 'rgba(255,255,255,0.9)' : 'rgb(61, 90, 71)', textDecoration: 'none', transition: '0.15s', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); setPanel('rider-account'); setAccountTab('rides'); window.location.hash = 'rider-rides' }}>{language === 'en' ? 'Parcel' : 'পার্সেল'}</a></li>
              <li><a href="#" className={isScrolled ? 'hp-nav-link-scrolled' : 'hp-nav-link'} style={{ padding: '6px 12px', borderRadius: 8, fontSize: 13, fontWeight: 500, color: isScrolled ? 'rgba(255,255,255,0.9)' : 'rgb(61, 90, 71)', textDecoration: 'none', transition: '0.15s', whiteSpace: 'nowrap', cursor: 'pointer' }} onClick={(e) => { e.preventDefault(); setPanel('admin-home'); window.location.hash = 'admin' }}>{language === 'en' ? 'Admin' : 'অ্যাডমিন'}</a></li>
            </ul>

            <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
              <button style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'rgba(0, 0, 0, 0.05)', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 100, fontSize: 13, fontWeight: 600, color: isScrolled ? 'rgba(255,255,255,0.9)' : 'rgb(61, 90, 71)', cursor: 'pointer', transition: '0.15s', whiteSpace: 'nowrap' }} onClick={() => setLanguage((current) => (current === 'en' ? 'bn' : 'en'))}>🌐 {language === 'en' ? 'English' : 'Bangla'}</button>
              <div style={{ position: 'relative' }}>
                <button style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: isScrolled ? 'rgba(255,255,255,0.15)' : 'rgba(0, 200, 83, 0.1)', border: isScrolled ? '1px solid rgba(255,255,255,0.2)' : '1px solid rgba(0, 200, 83, 0.2)', borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: 'rgb(0, 106, 78)', transition: '0.15s' }} onClick={() => setUserProfileOpen((open) => !open)}><span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg, rgb(0, 106, 78), rgb(0, 76, 56))', color: 'rgb(255, 255, 255)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{userName[0]?.toUpperCase() || 'U'}</span>{userName}<span style={{ fontSize: 10 }}>▼</span></button>
                {userProfileOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 200, background: '#fff', border: '1px solid rgba(0, 0, 0, 0.12)', borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', zIndex: 1000, padding: 8 }}>
                    <div style={{ padding: '8px 12px 10px', borderBottom: '1px solid rgba(0,0,0,0.12)', marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#1A2920' }}>{userName}</div>
                      <div style={{ fontSize: 11, color: '#6B8F76', marginTop: 2 }}>{userPhone}</div>
                    </div>
                    <button onClick={() => { setUserProfileOpen(false); setPanel('rider-account'); setAccountTab('rides'); window.location.hash = 'rider-rides' }} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'transparent', border: 'none', textAlign: 'left', color: '#1A2920', fontSize: 13, cursor: 'pointer' }}>{language === 'en' ? 'Account' : 'অ্যাকাউন্ট'}</button>
                    <button onClick={handleRiderLogout} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'transparent', border: 'none', textAlign: 'left', color: '#1A2920', fontSize: 13, cursor: 'pointer' }}>{language === 'en' ? 'Logout' : 'লগআউট'}</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </nav>
      )}

      <section id="home" style={{ paddingTop: 132, minHeight: '100vh' }}>
      <div className="app-panel" style={{ marginTop: 18 }}>
        <div className="app-panel-top">
          <div className="app-header">
            <h1 className="app-title">
              {role === 'rider' && (language === 'en' ? 'My Account' : 'আমার অ্যাকাউন্ট')}
              {role === 'guest' && panel === 'driver-home' && 'Driver Login'}
              {role === 'guest' && panel !== 'driver-home' && 'Rider Login'}
            </h1>
            <p className="app-subtitle">
              {role === 'guest' && panel === 'driver-home' && 'Login as driver to access your driver dashboard.'}
              {role === 'guest' && panel !== 'driver-home' && 'Use OTP to login/register as a rider.'}
            </p>
          </div>

          {role === 'guest' && panel !== 'driver-home' && (
            <div className="app-nav">
              <button className="app-nav-btn active" onClick={() => (window.location.hash = 'rider-auth')}>
                Rider Login
              </button>
            </div>
          )}

          {role === 'rider' && (
            <div className="app-nav">
              <button
                className={`app-nav-btn ${accountTab === 'rides' ? 'active' : ''}`}
                onClick={() => {
                  setPanel('rider-account')
                  setAccountTab('rides')
                  window.location.hash = 'rider-rides'
                }}
              >
                {language === 'en' ? 'Rides' : 'রাইড'}
              </button>
              <button
                className={`app-nav-btn ${accountTab === 'profile' ? 'active' : ''}`}
                onClick={() => {
                  setPanel('rider-account')
                  setAccountTab('profile')
                  window.location.hash = 'rider-profile'
                }}
              >
                {language === 'en' ? 'Profile' : 'প্রোফাইল'}
              </button>
            </div>
          )}
        </div>

        <div className="app-panel-body">
          {role === 'guest' && panel === 'rider-auth' && <RiderRegister />}
          {role === 'rider' && panel === 'rider-account' && accountTab === 'profile' && <ProfilePage language={language} />}
          {role === 'rider' && panel === 'rider-account' && accountTab === 'rides' && <RidesPage onOpenRide={openRide} language={language} />}
          {role === 'rider' && panel === 'ride-details' && <RideDetails rideId={selectedRide} />}
        </div>
      </div>
      </section>
    </div>
  )
}
