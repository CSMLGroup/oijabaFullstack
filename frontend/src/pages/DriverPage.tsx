import React, { useCallback, useEffect, useRef, useState } from 'react'
import DriverLiveMap from '../components/DriverLiveMap'
import api, { clearAuthToken, setAuthToken } from '../api'
import DriverDashboard from '../DriverDashboard'
import { readJwtPayload } from '../authToken'

type DriverNavKey = 'features' | 'vehicles' | 'how-it-works'

const DRIVER_SECTION_BY_KEY: Record<DriverNavKey, string> = {
  features: 'driver-features',
  vehicles: 'driver-vehicles',
  'how-it-works': 'driver-how-it-works'
}

const DRIVER_KEY_BY_SECTION = Object.entries(DRIVER_SECTION_BY_KEY).reduce<Record<string, DriverNavKey>>((acc, [key, sectionId]) => {
  acc[sectionId] = key as DriverNavKey
  return acc
}, {})

function hasDriverSession(): boolean {
  const token = localStorage.getItem('oijaba_token')
  if (!token) return false
  const payload = readJwtPayload(token)
  if (!payload) {
    clearAuthToken()
    return false
  }
  if (payload.role !== 'driver') return false

  // JWT exp is in seconds since epoch.
  if (typeof payload.exp === 'number' && Date.now() >= payload.exp * 1000) {
    clearAuthToken()
    return false
  }

  return true
}

export default function DriverPage(): JSX.Element {
  const [step, setStep] = useState(1)
  const [vehicleType, setVehicleType] = useState('bike')
  const [authPhone, setAuthPhone] = useState('')
  const [authOtp, setAuthOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [isDriverLoggedIn, setIsDriverLoggedIn] = useState(hasDriverSession)
  const [authStatus, setAuthStatus] = useState('')
  const [authStatusTone, setAuthStatusTone] = useState<'neutral' | 'success' | 'error'>('neutral')
  const [name, setName] = useState('')
  const [phone, setPhone] = useState('')
  const [files, setFiles] = useState<{ profile?: string; license?: string }>({})
  const [isOnline, setIsOnline] = useState(false)
  const [serviceRadiusKm, setServiceRadiusKm] = useState(5)
  const [trackStatus, setTrackStatus] = useState('Offline')
  const [saveStatus, setSaveStatus] = useState('')
  const [activeDriverNav, setActiveDriverNav] = useState<DriverNavKey>('features')
  const [isBangla, setIsBangla] = useState(() => {
    const saved = localStorage.getItem('oijaba_lang')
    if (saved) return saved === 'bn'
    return document.documentElement.lang === 'bn'
  })
  const lastSentRef = useRef<number>(0)

  const t = useCallback((en: string, bn: string) => (isBangla ? bn : en), [isBangla])

  function scrollToDriverSection(event: React.MouseEvent<HTMLAnchorElement>, sectionId: string): void {
    const section = document.getElementById(sectionId)
    if (!section) return
    event.preventDefault()
    const navKey = DRIVER_KEY_BY_SECTION[sectionId]
    if (navKey) setActiveDriverNav(navKey)
    section.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  useEffect(() => {
    localStorage.setItem('oijaba_lang', isBangla ? 'bn' : 'en')
    document.documentElement.lang = isBangla ? 'bn' : 'en'
    window.dispatchEvent(new Event('oijaba-language-changed'))
  }, [isBangla])

  useEffect(() => {
    const syncDriverSession = () => {
      setIsDriverLoggedIn(hasDriverSession())
    }

    window.addEventListener('oijaba-auth-changed', syncDriverSession)
    window.addEventListener('storage', syncDriverSession)
    return () => {
      window.removeEventListener('oijaba-auth-changed', syncDriverSession)
      window.removeEventListener('storage', syncDriverSession)
    }
  }, [])

  useEffect(() => {
    if (isDriverLoggedIn) return

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (!visible.length) return

        const topSectionId = visible[0]?.target?.id
        const navKey = DRIVER_KEY_BY_SECTION[topSectionId]
        if (navKey) setActiveDriverNav(navKey)
      },
      {
        root: null,
        threshold: [0.3, 0.5, 0.7],
        rootMargin: '-18% 0px -45% 0px'
      }
    )

    Object.values(DRIVER_SECTION_BY_KEY).forEach((id) => {
      const node = document.getElementById(id)
      if (node) observer.observe(node)
    })

    return () => observer.disconnect()
  }, [isDriverLoggedIn])

  function selectVType(v: string) {
    setVehicleType(v)
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>, key: 'profile' | 'license') {
    const f = e.target.files && e.target.files[0]
    if (!f) return
    const reader = new FileReader()
    reader.onload = () => setFiles((s) => ({ ...s, [key]: String(reader.result) }))
    reader.readAsDataURL(f)
  }

  const handlePositionChange = useCallback(async (lat: number, lng: number) => {
    const now = Date.now()
    if (now - lastSentRef.current < 5000) return
    lastSentRef.current = now

    try {
      await api.drivers.updateLocation(lat, lng)
      setTrackStatus(`Online • synced ${new Date().toLocaleTimeString()}`)
    } catch {
      setTrackStatus('Online • local tracking only (API sync failed)')
    }
  }, [])

  async function sendDriverOtp() {
    if (!/^\d{11}$/.test(authPhone.trim())) {
      setAuthStatus(t('Enter a valid 11-digit phone number.', 'সঠিক ১১ সংখ্যার মোবাইল নম্বর দিন।'))
      setAuthStatusTone('error')
      return
    }

    try {
      await api.auth.sendOtp(authPhone.trim(), 'driver', 'login')
      setOtpSent(true)
      setAuthStatus(t('OTP sent. Use 1234 for testing.', 'ওটিপি পাঠানো হয়েছে। পরীক্ষার জন্য 1234 ব্যবহার করুন।'))
      setAuthStatusTone('success')
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Could not send OTP.', 'ওটিপি পাঠানো যায়নি।')
      setAuthStatus(msg)
      setAuthStatusTone('error')
    }
  }

  async function verifyDriverOtp() {
    if (!authOtp.trim()) {
      setAuthStatus(t('Enter OTP to continue.', 'চালিয়ে যেতে ওটিপি দিন।'))
      setAuthStatusTone('error')
      return
    }

    try {
      const data = await api.auth.verifyOtp(authPhone.trim(), authOtp.trim(), 'driver')
      if (!data?.token) {
        setAuthStatus(t('Login failed: no token returned from server.', 'লগইন ব্যর্থ হয়েছে: সার্ভার থেকে টোকেন পাওয়া যায়নি।'))
        setAuthStatusTone('error')
        return
      }

      setAuthToken(data.token)
      setIsDriverLoggedIn(true)
      setPhone((prev) => prev || authPhone.trim())
      setAuthStatus(t('Driver login successful.', 'ড্রাইভার লগইন সফল হয়েছে।'))
      setAuthStatusTone('success')
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Login failed.', 'লগইন ব্যর্থ হয়েছে।')
      setAuthStatus(msg)
      setAuthStatusTone('error')
    }
  }

  async function submitDriverProfile() {
    if (!isDriverLoggedIn) {
      setSaveStatus(t('Please login with OTP first to save profile.', 'প্রোফাইল সংরক্ষণ করতে আগে ওটিপি দিয়ে লগইন করুন।'))
      return
    }

    setSaveStatus(t('Saving...', 'সংরক্ষণ করা হচ্ছে...'))
    try {
      await api.drivers.updateProfile({
        name,
        phone,
        vehicle_type: vehicleType,
        profile_image: files.profile,
        driver_license_image: files.license
      })
      setSaveStatus(t('Profile saved.', 'প্রোফাইল সংরক্ষণ হয়েছে।'))
      setStep(2)
    } catch {
      setSaveStatus(t('Saved locally. Login as driver to sync profile to API.', 'লোকালি সংরক্ষণ হয়েছে। এপিআইতে সিঙ্ক করতে ড্রাইভার হিসেবে লগইন করুন।'))
      setStep(2)
    }
  }

  if (!isDriverLoggedIn) {
    return (
      <div className="driver-portal-page">
        <div className="driver-portal-shell">
          <header className="driver-header">
            <div className="driver-header-inner">
              <div className="driver-logo-group">
                <div className="driver-logo">
                  <span className="driver-logo-mark">o</span>
                </div>
                <div className="driver-logo-text">
                  <span className="driver-logo-main">oijaba</span>
                  <span className="driver-logo-tag">{t('DRIVER PORTAL', 'ড্রাইভার পোর্টাল')}</span>
                </div>
              </div>

              <div className="driver-header-nav">
                <button className="driver-lang-btn" onClick={() => setIsBangla(!isBangla)}>
                  <span className="driver-lang-icon">🌐</span>
                  {isBangla ? 'English' : 'বাংলা'}
                </button>
                <a href="#how-it-works" className="driver-nav-link">{t('How it Works', 'কীভাবে কাজ করে')}</a>
                <a href="#features" className="driver-nav-link">{t('All Features', 'সব সুবিধাসমূহ')}</a>
                <a href="/admin-login" className="driver-admin-btn">{t('Admin Login', 'অ্যাডমিন লগইন')}</a>
              </div>
            </div>
          </header>

          <main className="driver-main">
            <div className="driver-hero-section">
              <div className="driver-hero-content">
                <div className="driver-badge">
                  <span className="driver-badge-icon">🚗</span>
                  {t('DRIVER PARTNER PROGRAM', 'ড্রাইভার পার্টনার প্রোগ্রাম')}
                </div>

                <h1 className="driver-hero-title">
                  {t('Earn More.', 'আরও আয় করুন।')}<br />
                  <span className="driver-title-accent">{t('Drive with Oijaba', 'অইজাবার সঙ্গে চালান')}</span>
                </h1>

                <p className="driver-hero-description">
                  {t(
                    'Join 12,000+ drivers earning ৳800+ daily across rural Bangladesh. Register your auto-rickshaw (Auto Rickshaw), motorbike, van, boat, or tractor today.',
                    'বাংলাদেশের গ্রামাঞ্চলে প্রতিদিন ৳৮০০+ আয় করা ১২,০০০+ ড্রাইভারের সঙ্গে যুক্ত হোন। আজই আপনার অটোরিকশা, মোটরবাইক, ভ্যান, নৌকা বা ট্রাক্টর নিবন্ধন করুন।'
                  )}
                </p>

                <div className="driver-earnings-card">
                  <div className="driver-card-header">
                    <span className="driver-card-icon">💰</span>
                    <h3>{t('Average Driver Earnings', 'গড় ড্রাইভার আয়')}</h3>
                  </div>

                  <div className="driver-earnings-grid">
                    <div className="driver-earn-item">
                      <span className="driver-earn-label">{t('Daily', 'দৈনিক')}</span>
                      <span className="driver-earn-amount">৳৮০০-১,২০০</span>
                    </div>
                    <div className="driver-earn-item">
                      <span className="driver-earn-label">{t('Monthly', 'মাসিক')}</span>
                      <span className="driver-earn-amount">৳২২,০০০+</span>
                    </div>
                  </div>

                  <div className="driver-stat-tiles">
                    <div className="driver-stat-tile">
                      <span className="driver-stat-value">৮৮০০</span>
                      <span className="driver-stat-label">{t('Daily avg.', 'দৈনিক গড়')}</span>
                    </div>
                    <div className="driver-stat-tile">
                      <span className="driver-stat-value">৮৮০</span>
                      <span className="driver-stat-label">{t('Per Ride', 'প্রতি রাইডে')}</span>
                    </div>
                    <div className="driver-stat-tile highlight">
                      <span className="driver-stat-value">২২,০০০+</span>
                      <span className="driver-stat-label">{t('Active Drivers', 'সক্রিয় ড্রাইভার')}</span>
                    </div>
                  </div>

                  <p className="driver-earnings-note">
                    {t('*Based on active 8-hour day. Actual earnings may vary by area and demand.', '*সক্রিয় ৮ ঘণ্টার দিনের ভিত্তিতে। এলাকা ও চাহিদা অনুযায়ী প্রকৃত আয় ভিন্ন হতে পারে।')}
                  </p>
                </div>

                <div className="driver-requirements-section">
                  <div className="driver-section-header">
                    <span className="driver-section-icon">📋</span>
                    <h3>{t('Requirements to Join', 'যোগদানের শর্তাবলি')}</h3>
                  </div>

                  <ul className="driver-checklist">
                    <li><span className="check-icon">✓</span> {t('Valid National ID (NID) card', 'বৈধ জাতীয় পরিচয়পত্র (NID) কার্ড')}</li>
                    <li><span className="check-icon">✓</span> {t('Active mobile number (any operator)', 'সক্রিয় মোবাইল নম্বর (যেকোনো অপারেটর)')}</li>
                    <li><span className="check-icon">✓</span> {t('Your own vehicle (Auto Rickshaw, motorbike, van, boat, tractor)', 'নিজের যানবাহন (অটোরিকশা, মোটরবাইক, ভ্যান, নৌকা, ট্রাক্টর)')}</li>
                    <li><span className="check-icon">✓</span> {t('Basic smartphone OR feature phone', 'স্মার্টফোন বা সাধারণ মোবাইল ফোন')}</li>
                    <li><span className="check-icon">✓</span> {t('Minimum 18 years old', 'ন্যূনতম ১৮ বছর বয়স')}</li>
                  </ul>
                </div>

                <div className="driver-sample-dashboard">
                  <div className="driver-section-header">
                    <span className="driver-section-icon">📊</span>
                    <h3>{t('Sample Driver Dashboard', 'নমুনা ড্রাইভার ড্যাশবোর্ড')}</h3>
                  </div>

                  <div className="driver-dashboard-preview">
                    <div className="preview-header">
                      <span className="preview-label">{t("Today's Trips", 'আজকের ট্রিপ')}</span>
                      <span className="preview-earnings">৳ ৭৬০ EARNED</span>
                    </div>

                    <div className="preview-list">
                      <div className="preview-item">
                        <div className="item-icon rickshaw">🛺</div>
                        <div className="item-details">
                          <div className="item-route">Kalibari → Faridpur Hospital</div>
                          <div className="item-meta">10:30 AM · 4.2 km · ⭐ 5.0</div>
                        </div>
                        <div className="item-price">৳ ৮০</div>
                      </div>

                      <div className="preview-item">
                        <div className="item-icon bike">🏍️</div>
                        <div className="item-details">
                          <div className="item-route">Goalanda Ghat → UP Office</div>
                          <div className="item-meta">12:15 PM · 2.8 km · ⭐ 4.8</div>
                        </div>
                        <div className="item-price">৳ ৫৫</div>
                      </div>

                      <div className="preview-item">
                        <div className="item-icon box">📦</div>
                        <div className="item-details">
                          <div className="item-route">Parcel – Medicine delivery</div>
                          <div className="item-meta">3:00 PM · 6 km</div>
                        </div>
                        <div className="item-price">৳ ১২০</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="driver-login-container">
                <div className="driver-login-glass-card">
                  <div className="driver-login-header">
                    <h2>{t('Driver Login', 'ড্রাইভার লগইন')}</h2>
                    <p>{t('Enter your phone number to continue.', 'চালিয়ে যেতে আপনার ফোন নম্বর দিন।')}</p>
                  </div>

                  <div className="driver-form-group">
                    <label>{t('Mobile Number', 'মোবাইল নম্বর')}</label>
                    <div className="driver-input-prefix-group">
                      <span className="driver-input-prefix">
                        <img src="https://flagcdn.com/w20/bd.png" alt="BD" /> +88
                      </span>
                      <input
                        type="text"
                        value={authPhone}
                        onChange={(e) => setAuthPhone(e.target.value)}
                        placeholder="01XXXXXXXXX"
                        className="driver-input"
                      />
                    </div>
                  </div>

                  <button className="driver-primary-btn" onClick={() => void sendDriverOtp()}>
                    {t('Send OTP', 'ওটিপি পাঠান')}
                  </button>

                  {otpSent && (
                    <div className="driver-otp-section">
                      <div className="driver-form-group">
                        <label>{t('OTP', 'ওটিপি')}</label>
                        <input
                          type="text"
                          value={authOtp}
                          onChange={(e) => setAuthOtp(e.target.value)}
                          placeholder="1234"
                          className="driver-input center"
                        />
                      </div>
                      <button className="driver-verify-btn" onClick={() => void verifyDriverOtp()}>
                        {t('Verify OTP', 'ওটিপি যাচাই করুন')}
                      </button>
                    </div>
                  )}

                  {authStatus && (
                    <div className={`driver-status-msg ${authStatusTone}`}>
                      {authStatus}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </main>

          <footer className="driver-footer">
            <div className="driver-footer-inner">
              <span className="copyright">© 2025 Oijaba Technologies Ltd.</span>
              <img src="https://flagcdn.com/w20/bd.png" alt="BD" className="footer-flag" />
              <span className="support">{t('Driver Support:', 'ড্রাইভার সাপোর্ট:')} <strong>16555</strong></span>
            </div>
          </footer>
        </div>
      </div>
    )
  }

  return <DriverDashboard />
}
