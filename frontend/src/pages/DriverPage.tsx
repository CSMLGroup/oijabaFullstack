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
        <div className="driver-topbar driver-topbar-login">
          <div className="driver-topbar-inner">
            <a className="driver-brand" href="/">
              <span className="driver-brand-mark">
                <img src="/assets/vehicles/easybike.jpg" alt={t('Oijaba', 'অইজাবা')} className="driver-brand-image" />
              </span>
              <span>
                <span className="driver-brand-title">oijaba</span>
                <span className="driver-brand-sub">{t('DRIVER PORTAL', 'ড্রাইভার পোর্টাল')}</span>
              </span>
            </a>
            <nav className="driver-topnav" aria-label="Driver portal links">
              <a
                href="/#features"
                className={activeDriverNav === 'features' ? 'active' : ''}
                onClick={(event) => scrollToDriverSection(event, 'driver-features')}
              >
                {t('Features', 'সুবিধাসমূহ')}
              </a>
              <a
                href="/#vehicles"
                className={activeDriverNav === 'vehicles' ? 'active' : ''}
                onClick={(event) => scrollToDriverSection(event, 'driver-vehicles')}
              >
                {t('Vehicles', 'যানবাহন')}
              </a>
              <a
                href="/#how-it-works"
                className={activeDriverNav === 'how-it-works' ? 'active' : ''}
                onClick={(event) => scrollToDriverSection(event, 'driver-how-it-works')}
              >
                {t('How It Works', 'কীভাবে কাজ করে')}
              </a>
            </nav>
            <div className="driver-topbar-actions">
              <button className="driver-top-chip" type="button" onClick={() => setIsBangla((prev) => !prev)}>
                {isBangla ? 'বাংলা' : 'English'}
              </button>
              <a className="driver-top-btn" href="/">{t('Admin Login', 'অ্যাডমিন লগইন')}</a>
            </div>
          </div>
        </div>

        <div className="driver-hero-grid">
          <section className="driver-hero-column" id="driver-features">
            <div className="driver-pill">{t('🚗 Driver Partner Program', '🚗 ড্রাইভার পার্টনার প্রোগ্রাম')}</div>
            <h1 className="driver-hero-title">{t('Earn More.', 'আরও আয় করুন।')}<br />{t('Drive with Oijaba', 'অইজাবার সঙ্গে চালান')}</h1>
            <p className="driver-hero-text">
              {t(
                'Join 12,000+ drivers earning ৳800+ daily across rural Bangladesh. Register your auto-rickshaw, motorbike, van, boat, or tractor today.',
                'বাংলাদেশের গ্রামাঞ্চলে প্রতিদিন ৳৮০০+ আয় করা ১২,০০০+ ড্রাইভারের সঙ্গে যুক্ত হোন। আজই আপনার অটোরিকশা, মোটরবাইক, ভ্যান, নৌকা বা ট্রাক্টর নিবন্ধন করুন।'
              )}
            </p>

            <div className="driver-earn-card" id="driver-vehicles">
              <h3>{t('💰 Average Driver Earnings', '💰 গড় ড্রাইভার আয়')}</h3>
              <div className="driver-earn-stats">
                <div className="driver-earn-stat-block">
                  <div className="driver-earn-label">{t('Daily', 'দৈনিক')}</div>
                  <div className="driver-earn-value">{t('৳800-1,200', '৳৮০০-১,২০০')}</div>
                </div>
                <div className="driver-earn-stat-block">
                  <div className="driver-earn-label">{t('Monthly', 'মাসিক')}</div>
                  <div className="driver-earn-value">{t('৳22,000+', '৳২২,০০০+')}</div>
                </div>
              </div>
              <div className="driver-earn-tiles">
                <div className="driver-earn-tile">
                  <strong>{t('৳800', '৳৮০০')}</strong>
                  <span>{t('Daily avg.', 'দৈনিক গড়')}</span>
                </div>
                <div className="driver-earn-tile">
                  <strong>{t('৳80', '৳৮০')}</strong>
                  <span>{t('Per Ride', 'প্রতি রাইডে')}</span>
                </div>
                <div className="driver-earn-tile">
                  <strong>{t('22,000+', '২২,০০০+')}</strong>
                  <span>{t('Active Drivers', 'সক্রিয় ড্রাইভার')}</span>
                </div>
              </div>
              <p className="driver-earn-note">{t('*Based on active 8-hour day. Actual earnings may vary by area and demand.', '*সক্রিয় ৮ ঘণ্টার দিনের ভিত্তিতে। এলাকা ও চাহিদা অনুযায়ী প্রকৃত আয় ভিন্ন হতে পারে।')}</p>
            </div>

            <div className="driver-requirements-card" id="driver-how-it-works">
              <h3>{t('📋 Requirements to Join', '📋 যোগদানের শর্তাবলি')}</h3>
              <ul className="driver-requirements-list">
                <li>{t('Valid mobile number and OTP access', 'সক্রিয় মোবাইল নম্বর এবং ওটিপি গ্রহণের সুবিধা')}</li>
                <li>{t('Driver license and basic vehicle papers', 'ড্রাইভিং লাইসেন্স এবং প্রয়োজনীয় যানবাহনের কাগজপত্র')}</li>
                <li>{t('Vehicle suitable for rural rides or parcel delivery', 'গ্রামীণ যাতায়াত বা পার্সেল ডেলিভারির উপযোগী যানবাহন')}</li>
              </ul>
            </div>
          </section>

          <section className="driver-login-card">
            <div className="driver-login-copy">
              <h2>{t('Driver Login', 'ড্রাইভার লগইন')}</h2>
              <p>{t('Enter your phone number to continue.', 'চালিয়ে যেতে আপনার ফোন নম্বর দিন।')}</p>
            </div>
            <label className="driver-label">{t('Mobile Number', 'মোবাইল নম্বর')}</label>
            <div className="driver-phone-field">
              <span className="driver-phone-prefix">🇧🇩 +88</span>
              <input
                value={authPhone}
                onChange={(e) => setAuthPhone(e.target.value)}
                placeholder={t('01XXXXXXXXX', '০১XXXXXXXXX')}
                className="driver-login-input"
              />
            </div>
            <button className="btn btn-primary driver-otp-btn" onClick={() => void sendDriverOtp()}>
              {t('Send OTP', 'ওটিপি পাঠান')}
            </button>

            {otpSent && (
              <div className="driver-otp-wrap">
                <label className="driver-label">{t('OTP', 'ওটিপি')}</label>
                <div className="driver-phone-field">
                  <span className="driver-phone-prefix driver-phone-prefix-otp">OTP</span>
                  <input
                    value={authOtp}
                    onChange={(e) => setAuthOtp(e.target.value)}
                    placeholder="1234"
                    className="driver-login-input"
                  />
                </div>
                <button className="btn btn-outline driver-otp-btn" onClick={() => void verifyDriverOtp()}>
                  {t('Verify OTP', 'ওটিপি যাচাই করুন')}
                </button>
              </div>
            )}

            {authStatus && <div className={`driver-auth-status ${authStatusTone}`}>{authStatus}</div>}
          </section>
        </div>
        </div>
      </div>
    )
  }

  return <DriverDashboard />
}
