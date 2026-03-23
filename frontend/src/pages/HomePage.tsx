import React, { useState, useEffect, useCallback } from 'react'
import { readJwtPayload } from '../authToken'
import AuthModal from '../components/AuthModal'
import AdminLoginModal from '../components/AdminLoginModal'

function isUserLoggedIn(): boolean {
  const token = localStorage.getItem('oijaba_token')
  if (!token) return false
  const payload = readJwtPayload(token)
  return !!payload && (payload.role === 'rider' || payload.role === 'driver' || payload.role === 'admin')
}

export default function HomePage(): JSX.Element {
  // Color system matching backend CSS variables
  const primaryGreen = '#006a4e'
  const primaryDark = '#004c38'
  const textPrimary = '#1A2920'
  const textSecondary = '#3D5A47'
  const textMuted = '#6B8F76'
  const bgLight = '#F4F7F6'
  const border = 'rgba(0,0,0,0.12)'

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [language, setLanguage] = useState<'en' | 'bn'>('bn')
  const [userProfileOpen, setUserProfileOpen] = useState(false)
  const [userName, setUserName] = useState('User')
  const [userPhone, setUserPhone] = useState('--')
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [authModalOpen, setAuthModalOpen] = useState(false)
  const [adminModalOpen, setAdminModalOpen] = useState(false)
  const [sosModalOpen, setSosModalOpen] = useState(false)
  const [isScrolled, setIsScrolled] = useState(false)
  const [selectedPhoneVehicle, setSelectedPhoneVehicle] = useState(0)
  const [bookingTab, setBookingTab] = useState<'instant'|'scheduled'|'shared'>('instant')
  const [bookingVehicle, setBookingVehicle] = useState(0)
  const [bookingPayment, setBookingPayment] = useState(0)
  const [pickupValue, setPickupValue] = useState('')
  const [destValue, setDestValue] = useState('')

  const t = useCallback((en: string, bn: string) => (language === 'bn' ? bn : en), [language])
  
  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem('oijaba_token')
      if (token && isUserLoggedIn()) {
        setIsLoggedIn(true)
        try {
          const profile = localStorage.getItem('userProfile')
          if (profile) {
            const data = JSON.parse(profile)
            setUserName(data.name || 'User')
            setUserPhone(data.phone || '--')
          }
        } catch (_) {}
      } else {
        setIsLoggedIn(false)
      }
    }

    syncAuthState()
    window.addEventListener('oijaba-auth-changed', syncAuthState)
    window.addEventListener('storage', syncAuthState)

    return () => {
      window.removeEventListener('oijaba-auth-changed', syncAuthState)
      window.removeEventListener('storage', syncAuthState)
    }
  }, [])

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 50)
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('oijaba_token')
    localStorage.removeItem('userProfile')
    setIsLoggedIn(false)
    setUserProfileOpen(false)
    window.dispatchEvent(new Event('oijaba-auth-changed'))
    window.location.hash = '#home'
  }

  const openAdminAccess = (e: React.MouseEvent) => {
    e.preventDefault()
    setAdminModalOpen(true)
  }

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' })
  }

  // Shared nav link style helper
  const navLinkStyle: React.CSSProperties = {
    padding: '6px 12px',
    borderRadius: 8,
    fontSize: 13,
    fontWeight: 500,
    color: isScrolled ? 'rgba(255,255,255,0.9)' : textSecondary,
    textDecoration: 'none',
    transition: 'all 0.15s ease',
    whiteSpace: 'nowrap',
    cursor: 'pointer',
  }

  const vehicles = [
    { img: '/assets/vehicles/easybike.jpg', name: t('Auto Rickshaw', 'অটো-রিকশা'), desc: t('Fits 3 passengers. Best for town trips.', '৩ জন যাত্রী বসতে পারে। শহরে যাতায়াতের জন্য সেরা।'), fare: t('From ৳ 40', 'শুরু ৳ ৪০ থেকে'), tag: t('Popular', 'জনপ্রিয়') },
    { img: '/assets/vehicles/motorbike.jpg', name: t('Motorbike', 'মোটরবাইক'), desc: t('Fastest. Single passenger. Narrow roads.', 'সবচেয়ে দ্রুত। একজন যাত্রী। সরু রাস্তার জন্য।'), fare: t('From ৳ 20', 'শুরু ৳ ২০ থেকে') },
    { img: '/assets/vehicles/rickshaw.jpg', name: t('Battery Rickshaw', 'ব্যাটারি রিকশা'), desc: t('Eco-friendly, quiet, short distances.', 'পরিবেশবান্ধব, শান্ত, অল্প দূরত্বের জন্য।'), fare: t('From ৳ 25', 'শুরু ৳ ২৫ থেকে') },
    { img: '/assets/vehicles/van.jpg', name: t('Van Rickshaw', 'ভ্যান রিকশা'), desc: t('Up to 5 people or cargo. Shared rides.', '৫ জন পর্যন্ত মানুষ বা মালামাল। শেয়ার্ড রাইড।'), fare: t('From ৳ 15/person', 'জনপ্রতি শুরু ৳ ১৫ থেকে') },
    { emoji: '🚜', name: t('Tractor', 'ট্রাক্টর'), desc: t('Crops, fertilizers, heavy loads.', 'ফসল, সার, ভারী মালামাল।'), fare: t('From ৳ 80', 'শুরু ৳ ৮০ থেকে'), tag: t('Farm', 'খামার') },
    { emoji: '⛵', name: t('Boat / Nouka', 'নৌকা'), desc: t('Flood & river areas. Group transport.', 'বন্যা ও নদী এলাকা। দলগত যাতায়াত।'), fare: t('From ৳ 30', 'শুরু ৳ ৩০ থেকে'), tag: t('River', 'নদী') },
    { img: '/assets/vehicles/easybike.jpg', name: t('Shared Rickshaw', 'শেয়ার্ড অটো-রিকশা'), desc: t('Split fare with co-passengers. Save money.', 'সহযাত্রীদের সাথে ভাড়া ভাগ করুন। টাকা বাঁচান।'), fare: t('From ৳ 15/seat', 'প্রতি আসন শুরু ৳ ১৫ থেকে') },
    { emoji: '🚗', name: t('Private Car', 'প্রাইভেট কার'), desc: t('Comfort ride for hospital, weddings.', 'হাসপাতাল, বিয়ের জন্য আরামদায়ক রাইড।'), fare: t('From ৳ 120', 'শুরু ৳ ১২০ থেকে') },
  ]

  const features = [
    { icon: '📶', color: '#006a4e', title: t('Works on 2G / 3G', '২জি / ৩জি তে কাজ করে'), desc: t('Designed to load fast even on weak rural networks. "Lite Mode" removes all images.', 'দুর্বল গ্রামীণ নেটওয়ার্কেও দ্রুত চালানোর জন্য তৈরি। "লাইট মোড" সমস্ত ছবি রিমুভ করে দেয়।'), tags: [t('Lite Mode', 'লাইট মোড'), t('SMS Fallback', 'এসএমএস ফলব্যাক')] },
    { icon: '💵', color: '#f97316', title: t('Cash First Payments', 'ক্যাশে পেমেন্ট সুবিধা'), desc: t('Pay cash by default. Also accept bKash, Nagad and Rocket.', 'ডিফল্ট হিসেবে ক্যাশ পেমেন্ট করুন। বিকাশ, নগদ এবং রকেটও গ্রহণ করা হয়।'), tags: [t('Cash', 'ক্যাশ'), t('bKash', 'বিকাশ'), t('Nagad', 'নগদ')] },
    { icon: '📍', color: '#3b82f6', title: t('Landmark Locations', 'ল্যান্ডমার্ক লোকেশন'), desc: t('No GPS needed. Use village names, bazaars, mosques, schools as pickup.', 'জিপিএস প্রয়োজন নেই। গ্রামের নাম, বাজার, মসজিদ, স্কুল ব্যবহার করুন।'), tags: [t('Bazaar', 'বাজার'), t('Mosque', 'মসজিদ'), t('School', 'স্কুল')] },
    { icon: '🆘', color: '#8b5cf6', title: t('SOS & Safety', 'এসওএস এবং নিরাপত্তা'), desc: t('One-tap SOS button. Share live location with family. Report unsafe drivers.', 'এক-ট্যাপে এসওএস বোতাম। পরিবারের সাথে লাইভ লোকেশন শেয়ার করুন।'), tags: [t('SOS Alert', 'এসওএস অ্যালার্ট'), t('Driver Rating', 'চালকের রেটিং')] },
    { icon: '🏥', color: '#006a4e', title: t('Emergency Rides', 'জরুরি রাইড'), desc: t('Priority dispatch for hospital, clinics, pharmacies.', 'হাসপাতাল, ক্লিনিক, ফার্মেসির জন্য অগ্রাধিকার ভিত্তিতে রাইড।'), tags: [t('Priority', 'অগ্রাধিকার'), t('Hospital', 'হাসপাতাল'), t('24/7', '২৪/৭')] },
    { icon: '📦', color: '#f97316', title: t('Parcel Delivery', 'পার্সেল ডেলিভারি'), desc: t('Send medicine, groceries, documents via registered drivers across villages.', 'গ্রাম জুড়ে নিবন্ধিত চালকদের মাধ্যমে ওষুধ, মুদি, নথিপত্র পাঠান।'), tags: [t('Medicine', 'ওষুধ'), t('Groceries', 'মুদিখানা')] },
    { icon: '🎓', color: '#3b82f6', title: t('School Transport', 'স্কুল পরিবহন'), desc: t('Scheduled daily rides for students. Parents track their child in real time.', 'শিক্ষার্থীদের জন্য নির্ধারিত প্রতিদিনের রাইড। পিতামাতারা রিয়েল-টাইমে ট্র্যাক করতে পারেন।'), tags: [t('Scheduled', 'নির্ধারিত'), t('Safe', 'নিরাপদ')] },
    { icon: '🚜', color: '#8b5cf6', title: t('Farm Transport Mode', 'ফার্ম পরিবহন মোড'), desc: t('Transport crops, fertilizers via tractors between farms and markets.', 'ফার্ম ও বাজারের মধ্যে ট্র্যাক্টর দিয়ে ফসল, সার পরিবহন করুন।'), tags: [t('Tractor', 'ট্রাক্টর'), t('Crops', 'ফসল')] },
  ]

  const steps = [
    { num: t('01', '০১'), icon: '📱', title: t('Enter Phone Number', 'ফোন নম্বর দিন'), desc: t('Login with your mobile number via OTP. No email or password required.', 'ওটিপির মাধ্যমে আপনার মোবাইল নম্বর দিয়ে লগইন করুন। কোনো ইমেইল বা পাসওয়ার্ডের প্রয়োজন নেই।') },
    { num: t('02', '০২'), icon: '📍', title: t('Pick Your Location', 'আপনার অবস্থান নির্বাচন করুন'), desc: t('Choose village, bazaar, mosque, school or Union Parishad as landmark pickup.', 'পিকআপ পয়েন্ট হিসেবে গ্রাম, বাজার, মসজিদ, স্কুল বা ইউনিয়ন পরিষদ বেছে নিন।') },
    { num: t('03', '০৩'), icon: '🛺', title: t('Choose Vehicle', 'যানবাহন নির্বাচন করুন'), desc: t('Pick from motorbike, Auto Rickshaw, van, battery rickshaw, tractor or boat.', 'আপনার প্রয়োজন অনুযায়ী মোটরবাইক, অটো-রিকশা, ভ্যান, ব্যাটারি রিকশা বা নৌকা বেছে নিন।') },
    { num: t('04', '০৪'), icon: '✅', title: t('Confirm & Ride', 'নিশ্চিত করুন এবং রাইড করুন'), desc: t('Pay cash or bKash/Nagad. Rate your driver after arrival. Safe and tracked.', 'ক্যাশ বা বিকাশ/নগদে পেমেন্ট করুন। গন্তব্যে পৌঁছানোর পর চালককে রেটিং দিন।') },
  ]

  const phoneVehicles = [
    { img: '/assets/vehicles/easybike.jpg', name: t('Auto', 'অটো') },
    { img: '/assets/vehicles/motorbike.jpg', name: t('Bike', 'বাইক') },
    { img: '/assets/vehicles/van.jpg', name: t('Van', 'ভ্যান') },
    { img: '/assets/vehicles/rickshaw.jpg', name: t('Boat', 'নৌকা') },
  ]

  return (
    <div style={{ minHeight: '100vh', background: bgLight, fontFamily: "'Inter', 'Hind Siliguri', sans-serif" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800;900&family=Hind+Siliguri:wght@300;400;500;600;700&display=swap');
        @keyframes phoneFloat { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-16px) rotate(0deg)} }
        .hp-nav-link:hover { color: ${primaryGreen} !important; background: rgba(0,106,78,0.1) !important; }
        .hp-nav-link-scrolled:hover { color: #fff !important; background: rgba(255,255,255,0.15) !important; }
        .hp-vehicle-card:hover { border-color: ${primaryGreen} !important; transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,106,78,0.12) !important; }
        .hp-feature-card:hover { border-color: rgba(0,106,78,0.4) !important; transform: translateY(-4px); box-shadow: 0 0 40px rgba(0,106,78,0.2) !important; }
        .hp-step-card:hover { border-color: rgba(0,106,78,0.4) !important; transform: translateY(-4px); }
        .hp-testi-card:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.12) !important; }
        .hp-phone-vc:hover { border-color: ${primaryGreen} !important; background: rgba(0,106,78,0.1) !important; }
      `}</style>

      {/* ======================== NAVBAR ======================== */}
      <nav style={{
        position: 'fixed', top: 0, width: '100%', zIndex: 1000,
        padding: isScrolled ? '12px 0' : '16px 0',
        background: isScrolled ? 'rgba(0,106,78,0.95)' : 'rgba(0,106,78,0.05)',
        backdropFilter: isScrolled ? 'blur(20px)' : 'blur(0px)',
        borderBottom: isScrolled ? `1px solid ${border}` : 'none',
        boxShadow: isScrolled ? '0 8px 24px rgba(0,0,0,0.15)' : 'none',
        transition: 'all 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16 }}>
          {/* Logo */}
          <a href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0 }}>
            <div style={{ width: 42, height: 42, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'white', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', flexShrink: 0 }}>
              <img src="/assets/vehicles/easybike.jpg" style={{ width: 28, height: 28, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="Oijaba" />
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span style={{ fontSize: 28, fontWeight: 900, letterSpacing: -1, background: isScrolled ? 'none' : 'linear-gradient(135deg,#006a4e,#004c38)', WebkitBackgroundClip: isScrolled ? 'unset' : 'text', WebkitTextFillColor: isScrolled ? '#fff' : 'transparent', backgroundClip: isScrolled ? 'unset' : 'text', color: isScrolled ? '#fff' : 'transparent' }}>oijaba</span>
              <span style={{ fontSize: 11, fontWeight: 500, letterSpacing: 1, textTransform: 'uppercase', color: isScrolled ? 'rgba(255,255,255,0.8)' : textMuted, WebkitTextFillColor: isScrolled ? 'rgba(255,255,255,0.8)' : textMuted }}>ওইযাবা</span>
            </div>
          </a>

          {/* Nav Links - Desktop */}
          <ul style={{ display: 'flex', alignItems: 'center', gap: 2, listStyle: 'none', margin: 0, padding: 0, flexWrap: 'nowrap', flex: 1 }}>
            {[
              { label: t('Features', 'বৈশিষ্ট্য'), href: '#features' },
              { label: t('Vehicles', 'যানবাহন'), href: '#vehicles' },
              { label: t('How It Works', 'কীভাবে কাজ করে'), href: '#how-it-works' },
              { label: t('Drive With Us', 'আমাদের সাথে চালান'), href: '#driver-home', internal: true },
              { label: t('Parcel', 'পার্সেল'), href: '#rider-rides', internal: true },
              { label: t('Admin', 'অ্যাডমিন'), href: '#', admin: true },
            ].map((item) => (
              <li key={item.label}>
                <a
                  href={item.internal ? item.href : item.href}
                  className={isScrolled ? 'hp-nav-link-scrolled' : 'hp-nav-link'}
                  style={{ ...navLinkStyle }}
                  onClick={item.admin ? openAdminAccess : item.internal ? (e) => { e.preventDefault(); window.location.hash = item.href } : undefined}
                >{item.label}</a>
              </li>
            ))}
          </ul>

          {/* Nav Actions */}
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexShrink: 0 }}>
            <button onClick={() => setLanguage(l => l === 'en' ? 'bn' : 'en')} style={{
              display: 'flex', alignItems: 'center', gap: 4, padding: '6px 12px', background: 'rgba(0,0,0,0.05)', border: `1px solid ${border}`, borderRadius: 100, fontSize: 13, fontWeight: 600, color: isScrolled ? 'rgba(255,255,255,0.9)' : textSecondary, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
            }}>🌐 {language === 'en' ? 'English' : 'Bangla'}</button>

            {!isLoggedIn ? (
              <>
                <button onClick={() => setAuthModalOpen(true)} style={{
                  padding: '10px 20px', background: 'rgba(0,0,0,0.05)', border: `1px solid ${border}`, borderRadius: 16, fontSize: 13, fontWeight: 600, color: isScrolled ? '#fff' : textSecondary, cursor: 'pointer', transition: 'all 0.15s', whiteSpace: 'nowrap'
                }}>{t('Sign In', 'লগইন')}</button>
                <button onClick={() => setAuthModalOpen(true)} style={{
                  padding: '10px 20px', background: 'linear-gradient(135deg,#006a4e,#004c38)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 13, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,106,78,0.35)', whiteSpace: 'nowrap', transition: 'all 0.15s'
                }}>{t('Book Now', 'বুক করুন')}</button>
              </>
            ) : (
              <div style={{ position: 'relative' }}>
                <button onClick={() => setUserProfileOpen(!userProfileOpen)} style={{
                  display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', background: isScrolled ? 'rgba(255,255,255,0.15)' : 'rgba(0,200,83,0.1)', border: `1px solid ${isScrolled ? 'rgba(255,255,255,0.2)' : 'rgba(0,200,83,0.2)'}`, borderRadius: 8, cursor: 'pointer', fontSize: 12, fontWeight: 500, color: primaryGreen, transition: 'all 0.15s'
                }}>
                  <span style={{ width: 26, height: 26, borderRadius: '50%', background: 'linear-gradient(135deg,#006a4e,#004c38)', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800 }}>{userName[0].toUpperCase()}</span>
                  {userName}
                  <span style={{ fontSize: 10 }}>▼</span>
                </button>
                {userProfileOpen && (
                  <div style={{ position: 'absolute', top: 'calc(100% + 10px)', right: 0, minWidth: 200, background: '#fff', border: `1px solid ${border}`, borderRadius: 12, boxShadow: '0 20px 60px rgba(0,0,0,0.22)', zIndex: 1000, padding: 8 }}>
                    <div style={{ padding: '8px 12px 10px', borderBottom: `1px solid ${border}`, marginBottom: 4 }}>
                      <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{userName}</div>
                      <div style={{ fontSize: 11, color: textMuted, marginTop: 2 }}>{userPhone}</div>
                    </div>
                    {[{ label: t('Account', 'অ্যাকাউন্ট'), hash: '#rider-account' }].map(link => (
                      <a key={link.hash} href={link.hash} onClick={() => setUserProfileOpen(false)} style={{ display: 'block', padding: '10px 12px', borderRadius: 8, color: textPrimary, textDecoration: 'none', fontSize: 13, cursor: 'pointer' }}>{link.label}</a>
                    ))}
                    <button onClick={handleLogout} style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'transparent', border: 'none', textAlign: 'left', color: textPrimary, fontSize: 13, cursor: 'pointer' }}>{t('Logout', 'লগআউট')}</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </nav>

      {/* ======================== HERO ======================== */}
      <section id="home" style={{
        minHeight: '100vh',
        background: `radial-gradient(ellipse at 20% 50%, rgba(0,106,78,0.1) 0%, transparent 60%), radial-gradient(ellipse at 80% 20%, rgba(244,42,65,0.05) 0%, transparent 50%), linear-gradient(180deg,${bgLight} 0%,#fff 100%)`,
        display: 'flex', alignItems: 'center', padding: '120px 0 80px', position: 'relative', overflow: 'hidden'
      }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', width: '100%', position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 80, alignItems: 'center' }}>
            {/* Left: Content */}
            <div>
              <div style={{ marginBottom: 20 }}>
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, letterSpacing: '0.5px', textTransform: 'uppercase' as const, background: 'rgba(0,200,83,0.15)', color: primaryGreen, border: '1px solid rgba(0,200,83,0.3)' }}>
                  🇧🇩 {t('Made for Rural Bangladesh', 'গ্রামীণ বাংলাদেশের জন্য তৈরি')}
                </span>
              </div>
              <h1 style={{ fontSize: 'clamp(42px,5vw,72px)', fontWeight: 900, lineHeight: 1.05, marginBottom: 24, letterSpacing: -2, color: textPrimary }}>
                <span>{t('Rides from your Village', 'গ্রামের যাত্রা')}</span><br />
                <span style={{ background: 'linear-gradient(135deg,#006a4e,#004c38)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('Simpler & Safer', 'সবচেয়ে সহজ উপায়')}</span>
              </h1>
              <p style={{ fontSize: 18, color: textSecondary, marginBottom: 40, lineHeight: 1.7, maxWidth: 480 }}>
                {t('Book auto-rickshaws, motorbikes, vans and boats from your village to town. Works on 2G. Cash & bKash accepted.', 'আপনার বাড়ি থেকে বাজার পর্যন্ত। মোটরবাইক, অটো-রিকশা, ভ্যান এবং নৌকা বুক করুন। 2G নেটওয়ার্কেও চলে, সাথে ক্যাশ ও বিকাশ সুবিধা।')}
              </p>
              <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap', marginBottom: 56 }}>
                <button onClick={() => setAuthModalOpen(true)} style={{ padding: '18px 40px', background: 'linear-gradient(135deg,#006a4e,#004c38)', color: '#fff', borderRadius: 24, border: 'none', fontSize: 17, fontWeight: 600, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,200,83,0.35)', transition: 'all 0.3s' }}>
                  📱 {t('Book a Ride', 'রাইড বুক করুন')}
                </button>
                <button onClick={() => scrollTo('how-it-works')} style={{ padding: '18px 40px', background: 'transparent', color: primaryGreen, border: `1.5px solid ${primaryGreen}`, borderRadius: 24, fontSize: 17, fontWeight: 600, cursor: 'pointer', transition: 'all 0.3s' }}>
                  {t('How It Works', 'কীভাবে কাজ করে')}
                </button>
              </div>
              {/* Stats */}
              <div style={{ display: 'flex', gap: 40, flexWrap: 'wrap' }}>
                {[
                  { num: t('64+', '৬৪+'), label: t('Districts covered', 'জেলা কভার করা হয়েছে') },
                  { num: t('12K+', '১২ হাজার+'), label: t('Registered drivers', 'নিবন্ধিত চালক') },
                  { num: t('98%', '৯৮%'), label: t('Ride success rate', 'রাইড সফলতার হার') },
                ].map(s => (
                  <div key={s.label}>
                    <div style={{ fontSize: 28, fontWeight: 800, color: primaryGreen }}>{s.num}</div>
                    <div style={{ fontSize: 13, color: textMuted, marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Right: Phone Mockup */}
            <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
              {/* Floating Cards */}
              <div style={{ position: 'absolute', top: '8%', left: -20, background: '#fff', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13, fontWeight: 600, color: textPrimary, zIndex: 3 }}>
                <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>{t('Driver arriving', 'চালক আসছেন')}</div>
                <div style={{ color: primaryGreen }}>🛺 {t('3 min away', '৩ মিনিট দূরে')}</div>
              </div>
              <div style={{ position: 'absolute', bottom: '15%', right: -30, background: '#fff', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13, fontWeight: 600, color: textPrimary, zIndex: 3 }}>
                <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>{t('Fare estimate', 'ভাড়া অনুমান')}</div>
                <div>{t('৳ 45 – 60', '৳ ৪৫ – ৬০')}</div>
              </div>
              <div style={{ position: 'absolute', top: '48%', left: -50, background: '#fff', padding: '12px 16px', borderRadius: 8, boxShadow: '0 4px 12px rgba(0,0,0,0.1)', fontSize: 13, fontWeight: 600, color: textPrimary, zIndex: 3 }}>
                <div style={{ fontSize: 11, color: textMuted, marginBottom: 4 }}>{t('Payment', 'পেমেন্ট')}</div>
                <div>💵 {t('Cash / bKash', 'ক্যাশ / বিকাশ')}</div>
              </div>

              {/* Phone Device */}
              <div style={{ width: 280, background: '#fff', borderRadius: 40, border: `2px solid ${border}`, padding: 20, boxShadow: '0 20px 60px rgba(0,0,0,0.22), 0 0 40px rgba(0,106,78,0.2)', position: 'relative', zIndex: 2, animation: 'phoneFloat 6s ease-in-out infinite' }}>
                {/* Notch */}
                <div style={{ width: 80, height: 8, background: '#F4F7F6', borderRadius: 100, margin: '0 auto 20px' }} />
                {/* Screen header */}
                <div style={{ background: 'linear-gradient(135deg,#006a4e,#004c38)', borderRadius: 20, padding: 16, marginBottom: 12 }}>
                  <div style={{ fontSize: 14, fontWeight: 700, color: '#fff', marginBottom: 4 }}>ওইযাবা</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)' }}>ওইযাবা – গ্রামীণ যাতায়াত সমাধান</div>
                </div>
                {/* Vehicle Grid */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 12 }}>
                  {phoneVehicles.map((v, i) => (
                    <div key={i} className="hp-phone-vc" onClick={() => setSelectedPhoneVehicle(i)} style={{ background: selectedPhoneVehicle === i ? 'rgba(0,106,78,0.1)' : '#F4F7F6', border: `1px solid ${selectedPhoneVehicle === i ? primaryGreen : border}`, borderRadius: 12, padding: '10px 8px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.15s' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 4 }}>
                        <img src={v.img} style={{ width: 32, height: 24, objectFit: 'contain', borderRadius: 4 }} alt={v.name} />
                      </div>
                      <div style={{ fontSize: 10, fontWeight: 600, color: textSecondary }}>{v.name}</div>
                    </div>
                  ))}
                </div>
                {/* Route */}
                <div style={{ background: '#F4F7F6', borderRadius: 12, padding: '10px 12px', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, marginBottom: 8 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: primaryGreen, flexShrink: 0 }} />
                    <span style={{ color: textSecondary }}>{t('Kalibari Bazar, Faridpur', 'কালীবাড়ি বাজার, ফরিদপুর')}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11 }}>
                    <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#dc2626', flexShrink: 0 }} />
                    <span style={{ color: textSecondary }}>{t('Faridpur Sadar Hospital', 'ফরিদপুর সদর হাসপাতাল')}</span>
                  </div>
                </div>
                <button onClick={() => setAuthModalOpen(true)} style={{ width: '100%', padding: '12px', background: 'linear-gradient(135deg,#006a4e,#004c38)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                  {t('Book Now – ৳45', 'এখন বুক করুন – ৳৪৫')}
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ======================== LITE MODE BANNER ======================== */}
      <div style={{ maxWidth: 1200, margin: '-20px auto 0', padding: '0 24px', position: 'relative', zIndex: 2 }}>
        <div style={{ background: 'rgba(0,106,78,0.08)', borderLeft: `4px solid ${primaryGreen}`, padding: '16px 20px', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ fontSize: 20 }}>📶</span>
          <div>
            <strong style={{ color: textPrimary }}>{t('Low Data Mode available', 'লো ডাটা মোড উপলব্ধ')}</strong>
            {' – '}{t('Works on 2G/3G. SMS ride confirmation supported.', '২জি/৩জি নেটওয়ার্কেও চলে। এসএমএস কনফার্মেশন সমর্থিত।')}
          </div>
        </div>
      </div>

      {/* ======================== HOW IT WORKS ======================== */}
      <section id="how-it-works" style={{ padding: '80px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ marginBottom: 16 }}><span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, background: 'rgba(0,200,83,0.15)', color: primaryGreen, border: '1px solid rgba(0,200,83,0.3)' }}>{t('Simple Process', 'সহজ পদ্ধতি')}</span></div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: textPrimary, marginBottom: 16 }}>
              {t('Book a Ride in', 'রাইড বুক করুন')} <span style={{ background: 'linear-gradient(135deg,#006a4e,#004c38)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('3 Steps', '৩ ধাপে')}</span>
            </h2>
            <p style={{ fontSize: 16, color: textSecondary }}>{t('No smartphone needed for confirmation. Works by SMS fallback too.', 'কনফার্মেশনের জন্য স্মার্টফোন প্রয়োজন নেই। এসএমএসেও কাজ করে।')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 24 }}>
            {steps.map((step, i) => (
              <div key={i} className="hp-step-card" style={{ padding: 24, background: '#fff', borderRadius: 16, border: `1px solid ${border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', position: 'relative', transition: 'all 0.3s' }}>
                <div style={{ position: 'absolute', top: -12, left: 24, fontSize: 24, fontWeight: 700, color: 'rgba(0,106,78,0.25)' }}>{step.num}</div>
                <div style={{ fontSize: 32, marginBottom: 16, marginTop: 8 }}>{step.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 600, marginBottom: 8, color: textPrimary }}>{step.title}</h3>
                <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.6, margin: 0 }}>{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== VEHICLES ======================== */}
      <section id="vehicles" style={{ padding: '80px 0', background: `radial-gradient(ellipse at center,rgba(0,200,83,0.04) 0%,transparent 70%)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ marginBottom: 16 }}><span style={{ display: 'inline-flex', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, background: 'rgba(255,109,0,0.15)', color: '#f97316', border: '1px solid rgba(255,109,0,0.3)' }}>{t('8 Vehicle Types', '৮টি গাড়ির ধরন')}</span></div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: textPrimary, marginBottom: 16 }}>
              {t('Every Rural', 'প্রতিটি গ্রামীণ')} <span style={{ background: 'linear-gradient(135deg,#006a4e,#004c38)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('Transport Mode', 'পরিবহন মোড')}</span>
            </h2>
            <p style={{ fontSize: 16, color: textSecondary }}>{t('From flood-area boat rides to farm tractor transport — we cover it all across Bangladesh.', 'বন্যা এলাকার নৌকা ভ্রমণ থেকে শুরু করে কৃষিকাজের ট্রাক্টর পরিবহন - আমরা বাংলাদেশের সর্বত্র সেবা দিই।')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 20 }}>
            {vehicles.map((v, i) => (
              <div key={i} className="hp-vehicle-card" style={{ background: '#fff', borderRadius: 16, border: `1px solid ${border}`, padding: 20, textAlign: 'center', cursor: 'pointer', transition: 'all 0.3s', position: 'relative', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                {v.tag && <div style={{ position: 'absolute', top: 12, right: 12, fontSize: 10, fontWeight: 600, padding: '2px 8px', borderRadius: 100, background: 'rgba(0,200,83,0.15)', color: primaryGreen }}>{v.tag}</div>}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 56, marginBottom: 12 }}>
                  {v.img ? <img src={v.img} style={{ width: 'auto', height: 40, objectFit: 'contain' }} alt={v.name} /> : <span style={{ fontSize: 40 }}>{v.emoji}</span>}
                </div>
                <div style={{ fontSize: 15, fontWeight: 600, color: textPrimary, marginBottom: 6 }}>{v.name}</div>
                <div style={{ fontSize: 12, color: textSecondary, marginBottom: 8, lineHeight: 1.5 }}>{v.desc}</div>
                <div style={{ fontSize: 13, fontWeight: 700, color: primaryGreen }}>{v.fare}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== BOOKING ======================== */}
      <section id="booking" style={{ padding: '80px 0', background: '#fff' }}>
        <div style={{ maxWidth: 800, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 48 }}>
            <div style={{ marginBottom: 16 }}><span style={{ display: 'inline-flex', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, background: 'rgba(0,200,83,0.15)', color: primaryGreen, border: '1px solid rgba(0,200,83,0.3)' }}>{t('Instant Booking', 'তাৎক্ষণিক বুকিং')}</span></div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: textPrimary, marginBottom: 8 }}>
              {t('Book Your', 'আপনার রাইড')} <span style={{ background: 'linear-gradient(135deg,#006a4e,#004c38)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('Ride Now', 'বুক করুন')}</span>
            </h2>
          </div>

          {/* Booking Card */}
          <div style={{ background: '#fff', borderRadius: 24, border: `1px solid ${border}`, padding: '32px 28px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)' }}>
            {/* Tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
              {([['instant', '⚡', t('Instant Ride', 'তাৎক্ষণিক রাইড')], ['scheduled', '📅', t('Schedule', 'শিডিউল')], ['shared', '👥', t('Shared', 'শেয়ার্ড')]] as [string, string, string][]).map(([key, icon, label]) => (
                <button key={key} onClick={() => setBookingTab(key as 'instant'|'scheduled'|'shared')} style={{ padding: '10px 20px', borderRadius: 100, border: `1.5px solid ${bookingTab === key ? primaryGreen : border}`, background: bookingTab === key ? primaryGreen : 'transparent', color: bookingTab === key ? '#fff' : textSecondary, fontSize: 14, fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }}>{icon} {label}</button>
              ))}
            </div>

            {/* Vehicle selector */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 10 }}>{t('Select Vehicle Type', 'যানবাহনের ধরন নির্বাচন করুন')}</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(88px,1fr))', gap: 10 }}>
                {[
                  { img: '/assets/vehicles/easybike.jpg', name: t('Auto Rickshaw', 'অটো-রিকশা'), price: t('৳40+', '৳৪০+') },
                  { img: '/assets/vehicles/motorbike.jpg', name: t('Motorbike', 'মোটরবাইক'), price: t('৳20+', '৳২০+') },
                  { img: '/assets/vehicles/rickshaw.jpg', name: t('Battery', 'ব্যাটারি'), price: t('৳25+', '৳২৫+') },
                  { img: '/assets/vehicles/van.jpg', name: t('Van', 'ভ্যান'), price: t('৳35+', '৳৩৫+') },
                  { emoji: '⛵', name: t('Boat', 'নৌকা'), price: t('৳30+', '৳৩০+') },
                  { emoji: '🚜', name: t('Tractor', 'ট্রাক্টর'), price: t('৳80+', '৳৮০+') },
                  { img: '/assets/vehicles/easybike.jpg', name: t('Shared Auto', 'শেয়ার্ড অটো-রিকশা'), price: t('৳15+', '৳১৫+') },
                  { emoji: '🚗', name: t('Car', 'প্রাইভেট কার'), price: t('৳120+', '৳১২০+') },
                ].map((v, i) => (
                  <div key={i} onClick={() => setBookingVehicle(i)} style={{ border: `1.5px solid ${bookingVehicle === i ? primaryGreen : border}`, borderRadius: 12, padding: '10px 6px', textAlign: 'center', cursor: 'pointer', background: bookingVehicle === i ? 'rgba(0,106,78,0.08)' : '#fff', transition: 'all 0.15s' }}>
                    {v.img ? <img src={v.img} style={{ width: 36, height: 28, objectFit: 'contain', display: 'block', margin: '0 auto 4px' }} alt={v.name} /> : <div style={{ fontSize: 28, marginBottom: 4 }}>{v.emoji}</div>}
                    <div style={{ fontSize: 11, fontWeight: 600, color: textSecondary, lineHeight: 1.3, marginBottom: 2 }}>{v.name}</div>
                    <div style={{ fontSize: 11, color: primaryGreen, fontWeight: 700 }}>{v.price}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Pickup */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>📍 {t('Pickup Location (Village / Landmark)', 'পিকআপ লোকেশন (গ্রাম / চিহ্নিত স্থান)')}</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, fontSize: 14 }}>🟢</span>
                <input type="text" value={pickupValue} onChange={e => setPickupValue(e.target.value)} list="bk-locations" placeholder={t('e.g. Kalibari Bazar, Faridpur', 'যেমন: কালীবাড়ি বাজার, ফরিদপুর')} style={{ width: '100%', padding: '12px 16px 12px 36px', border: `1.5px solid ${border}`, borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
              <datalist id="bk-locations">
                <option value="Kalibari Bazar, Faridpur" /><option value="Boalmari Bazaar, Faridpur" /><option value="Goalanda Ghat, Rajbari" /><option value="Sirajganj Sadar Bazaar" /><option value="Jamalpur Railway Gate" /><option value="Netrokona Bazar" />
              </datalist>
            </div>

            {/* Destination */}
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>🏁 {t('Destination', 'গন্তব্য')}</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <span style={{ position: 'absolute', left: 12, fontSize: 14 }}>🔴</span>
                <input type="text" value={destValue} onChange={e => setDestValue(e.target.value)} list="bk-locations" placeholder={t('e.g. Faridpur Sadar Hospital', 'যেমন: ফরিদপুর সদর হাসপাতাল')} style={{ width: '100%', padding: '12px 16px 12px 36px', border: `1.5px solid ${border}`, borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
            </div>

            {/* Scheduled datetime */}
            {bookingTab === 'scheduled' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>📅 {t('Schedule Date & Time', 'তারিখ ও সময় শিডিউল করুন')}</label>
                <input type="datetime-local" style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${border}`, borderRadius: 12, fontSize: 14, outline: 'none', boxSizing: 'border-box' as const }} />
              </div>
            )}

            {/* Passengers */}
            {bookingTab === 'shared' && (
              <div style={{ marginBottom: 16 }}>
                <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 8 }}>👥 {t('Number of Passengers', 'যাত্রীর সংখ্যা')}</label>
                <select style={{ width: '100%', padding: '12px 16px', border: `1.5px solid ${border}`, borderRadius: 12, fontSize: 14, outline: 'none', background: '#fff', boxSizing: 'border-box' as const }}>
                  <option>{t('1 passenger', '১ জন যাত্রী')}</option>
                  <option>{t('2 passengers', '২ জন যাত্রী')}</option>
                  <option>{t('3 passengers', '৩ জন যাত্রী')}</option>
                </select>
              </div>
            )}

            {/* Map placeholder (OpenStreetMap embed) */}
            <div style={{ marginBottom: 8, borderRadius: 12, overflow: 'hidden', height: 300, border: `1px solid ${border}`, boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
              <iframe
                title="Landmark Map"
                src="https://www.openstreetmap.org/export/embed.html?bbox=89.5%2C22.5%2C91.5%2C24.5&layer=mapnik"
                style={{ width: '100%', height: '100%', border: 'none' }}
                loading="lazy"
              />
            </div>
            <div style={{ textAlign: 'center', color: textMuted, fontSize: 13, marginBottom: 20 }}>🗺️ {t('Landmark-based map (OpenStreetMap)', 'ল্যান্ডমার্ক ভিত্তিক ম্যাপ (ওপেনস্ট্রিটম্যাপ)')}</div>

            {/* Fare estimate */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: bgLight, borderRadius: 12, padding: '16px 20px', marginBottom: 20 }}>
              <div>
                <div style={{ fontSize: 13, fontWeight: 600, color: textSecondary }}>{t('Estimated fare', 'আনুমানিক ভাড়া')}</div>
                <div style={{ fontSize: 12, color: textMuted }}>{t('Based on vehicle & distance', 'যানবাহন এবং দূরত্বের উপর ভিত্তি করে')}</div>
              </div>
              <div style={{ fontSize: 22, fontWeight: 800, color: primaryGreen }}>{t('৳ 45 – 65', '৳ ৪৫ – ৬৫')}</div>
            </div>

            {/* Payment method */}
            <div style={{ marginBottom: 20 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: textSecondary, marginBottom: 10 }}>💳 {t('Payment Method', 'পেমেন্ট পদ্ধতি')}</label>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 10 }}>
                {[t('💵 Cash','💵 ক্যাশ'), t('bKash','বিকাশ'), t('Nagad','নগদ'), t('Rocket','রকেট')].map((label, i) => (
                  <button key={i} onClick={() => setBookingPayment(i)} style={{ padding: '10px 18px', borderRadius: 100, border: `1.5px solid ${bookingPayment === i ? primaryGreen : border}`, background: bookingPayment === i ? primaryGreen : 'transparent', color: bookingPayment === i ? '#fff' : textSecondary, fontSize: 13, fontWeight: 600, cursor: 'pointer', transition: 'all 0.15s' }}>{label}</button>
                ))}
              </div>
              <p style={{ fontSize: 12, color: textMuted, margin: '0 0 20px' }}>{bookingPayment === 0 ? t('Pay with cash at the end of the trip.', 'ট্রিপ শেষে ক্যাশ দিয়ে পেমেন্ট করুন।') : t('You will be redirected to complete payment.', 'পেমেন্ট সম্পন্ন করতে রিডাইরেক্ট করা হবে।')}</p>
            </div>

            <button onClick={() => setAuthModalOpen(true)} style={{ width: '100%', padding: '16px', background: 'linear-gradient(135deg,#006a4e,#004c38)', color: '#fff', border: 'none', borderRadius: 16, fontSize: 16, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(0,106,78,0.35)' }}>
              🛺 {t('Confirm Booking', 'বুকিং নিশ্চিত করুন')}
            </button>
            <p style={{ textAlign: 'center', fontSize: 12, color: textMuted, marginTop: 12, marginBottom: 0 }}>
              📞 {t("Can't find location?", 'লোকেশন পাচ্ছেন না?')} <a href="tel:+8801700000000" style={{ color: primaryGreen }}>{t('Call driver to explain', 'চালককে কল করে বুঝিয়ে বলুন')}</a>
            </p>
          </div>
        </div>
      </section>

      {/* ======================== FEATURES ======================== */}
      <section id="features" style={{ padding: '80px 0', background: bgLight }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ marginBottom: 16 }}><span style={{ display: 'inline-flex', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, background: 'rgba(0,200,83,0.15)', color: primaryGreen, border: '1px solid rgba(0,200,83,0.3)' }}>{t('Built for Villages', 'গ্রামের জন্য তৈরি')}</span></div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: textPrimary, marginBottom: 16 }}>
              {t('Features Built for', 'গ্রামীণ বাংলাদেশের জন্য')} <span style={{ background: 'linear-gradient(135deg,#006a4e,#004c38)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('Rural Bangladesh', 'তৈরি বৈশিষ্ট্যসমূহ')}</span>
            </h2>
            <p style={{ fontSize: 16, color: textSecondary }}>{t('Not just another city ride app. Everything designed for slow internet, cash payments and real rural life.', 'শুধুমাত্র আরেকটি শহরের রাইড অ্যাপ নয়। সবকিছুই ধীর গতির ইন্টারনেট, ক্যাশ পেমেন্ট এবং আসল গ্রামীণ জীবনের জন্য ডিজাইন করা হয়েছে।')}</p>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(260px,1fr))', gap: 24 }}>
            {features.map((f, i) => (
              <div key={i} className="hp-feature-card" style={{ background: '#fff', borderRadius: 24, border: `1px solid ${border}`, padding: 28, transition: 'all 0.3s', position: 'relative', overflow: 'hidden' }}>
                <div style={{ width: 52, height: 52, borderRadius: 16, background: `${f.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 16 }}>{f.icon}</div>
                <h3 style={{ fontSize: 16, fontWeight: 700, color: textPrimary, marginBottom: 10 }}>{f.title}</h3>
                <p style={{ fontSize: 13, color: textSecondary, lineHeight: 1.65, marginBottom: 16 }}>{f.desc}</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {f.tags.map(tag => <span key={tag} style={{ padding: '4px 10px', background: bgLight, borderRadius: 100, fontSize: 11, fontWeight: 600, color: textMuted }}>{tag}</span>)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== PAYMENT METHODS ======================== */}
      <section style={{ padding: '60px 0', background: '#fff' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 13, color: textMuted, letterSpacing: 1, textTransform: 'uppercase', marginBottom: 24 }}>{t('Accepted Payment Methods', 'গৃহীত পেমেন্ট পদ্ধতি')}</p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 16, flexWrap: 'wrap' }}>
            {[{ label: t('Cash', 'ক্যাশ'), icon: '💵', bg: '#f0fdf4', color: '#16a34a' }, { label: t('bKash', 'বিকাশ'), icon: '📱', bg: '#fdf2f8', color: '#e700a4' }, { label: t('Nagad', 'নগদ'), icon: '🏦', bg: '#fff7ed', color: '#ea580c' }, { label: t('Rocket', 'রকেট'), icon: '🚀', bg: '#f5f3ff', color: '#7c3aed' }].map(p => (
              <div key={p.label} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 20px', background: p.bg, border: `1px solid ${border}`, borderRadius: 100, fontSize: 14, fontWeight: 600, color: p.color, minWidth: 100, justifyContent: 'center' }}>{p.icon} {p.label}</div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== TESTIMONIALS ======================== */}
      <section style={{ padding: '80px 0', background: `radial-gradient(ellipse at center,rgba(255,109,0,0.04) 0%,transparent 65%)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: 60 }}>
            <div style={{ marginBottom: 16 }}><span style={{ display: 'inline-flex', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, background: 'rgba(255,109,0,0.15)', color: '#f97316', border: '1px solid rgba(255,109,0,0.3)' }}>{t('Real Stories', 'বাস্তব গল্প')}</span></div>
            <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 700, color: textPrimary }}>
              {t('What People Are', 'মানুষ যা')} <span style={{ background: 'linear-gradient(135deg,#006a4e,#004c38)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('Saying', 'বলছেন')}</span>
            </h2>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: 24 }}>
            {[
              { stars: '★★★★★', text: t('"My mother was sick, I took her to the hospital at 11 PM using oijaba. Got a ride in 5 minutes."', '"আমার মা অসুস্থ ছিলেন, রাত ১১টায় oijaba দিয়ে হাসপাতালে নিয়ে যাই। মাত্র ৫ মিনিটে গাড়ি পেলাম।"'), icon: '👨', name: t('Rafiqul Islam', 'রফিকুল ইসলাম'), loc: t('Madaripur, Dhaka Division', 'মাদারীপুর, ঢাকা বিভাগ') },
              { stars: '★★★★★', text: t('"I drive Auto Rickshaw and oijaba gives me 8–10 rides daily. My income doubled."', '"আমি অটো-রিকশা চালাই এবং ওইযাবা আমাকে প্রতিদিন ৮-১০টি রাইড দেয়। আমার আয় দ্বিগুণ হয়েছে।"'), icon: '🧑', name: t('Karim Mia', 'করিম মিঞা'), loc: t('Driver – Faridpur Sadar', 'চালক – ফরিদপুর সদর') },
              { stars: '★★★★☆', text: t('"The parcel service came in very handy for delivering goods home from the bazaar."', '"বাজার থেকে বাড়িতে মালামাল পৌঁছে দেওয়ার জন্য পার্সেল সার্ভিস অনেক কাজে লেগেছে।"'), icon: '👩', name: t('Fatema Begum', 'ফাতেমা বেগম'), loc: t('Sirajganj, Rajshahi Division', 'সিরাজগঞ্জ, রাজশাহী বিভাগ') },
            ].map((testi, i) => (
              <div key={i} className="hp-testi-card" style={{ background: '#fff', borderRadius: 24, border: `1px solid ${border}`, padding: 28, boxShadow: '0 2px 8px rgba(0,0,0,0.08)', transition: 'all 0.3s' }}>
                <div style={{ color: '#f59e0b', marginBottom: 12, fontSize: 16 }}>{testi.stars}</div>
                <p style={{ fontSize: 14, color: textSecondary, lineHeight: 1.7, marginBottom: 20 }}>{testi.text}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: '50%', background: bgLight, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>{testi.icon}</div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: textPrimary }}>{testi.name}</div>
                    <div style={{ fontSize: 12, color: textMuted }}>{testi.loc}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ======================== DRIVER CTA ======================== */}
      <section id="driver" style={{ padding: '80px 0', background: `radial-gradient(ellipse at 20% 50%,rgba(0,106,78,0.1) 0%,transparent 60%), linear-gradient(180deg,${bgLight} 0%,#fff 100%)` }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 60, alignItems: 'center' }}>
            <div>
              <div style={{ marginBottom: 16 }}><span style={{ display: 'inline-flex', gap: 6, padding: '4px 12px', borderRadius: 100, fontSize: 12, fontWeight: 600, textTransform: 'uppercase' as const, background: 'rgba(0,200,83,0.15)', color: primaryGreen, border: '1px solid rgba(0,200,83,0.3)' }}>{t('Join the Team', 'দলে যোগ দিন')}</span></div>
              <h2 style={{ fontSize: 'clamp(28px,4vw,42px)', fontWeight: 900, color: textPrimary, marginBottom: 16, letterSpacing: -1 }}>
                {t('Earn More.', 'আরও আয় করুন।')}<br />
                <span style={{ background: 'linear-gradient(135deg,#006a4e,#004c38)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>{t('Drive with Oijaba', 'অইজাবার সঙ্গে চালান')}</span>
              </h2>
              <p style={{ fontSize: 18, color: textSecondary, marginBottom: 32, lineHeight: 1.7 }}>
                {t('Join 12,000+ drivers earning ৳800+ daily across rural Bangladesh. Register your auto-rickshaw, motorbike, van, boat, or tractor today.', 'গ্রামীণ বাংলাদেশ জুড়ে প্রতিদিন ৳৮০০+ আয় করা ১২,০০০+ চালকদের সাথে যোগ দিন।')}
              </p>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="#driver-home" onClick={(e) => { e.preventDefault(); window.location.hash = '#driver-home' }} style={{ padding: '16px 32px', background: 'linear-gradient(135deg,#006a4e,#004c38)', color: '#fff', borderRadius: 24, textDecoration: 'none', fontWeight: 600, fontSize: 15, boxShadow: '0 4px 20px rgba(0,200,83,0.35)' }}>
                  🚗 {t('Become a Driver', 'চালক হিসেবে যোগ দিন')}
                </a>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              {[
                { icon: '💰', num: t('৳800+', '৳৮০০+'), label: t('Daily Earnings', 'দৈনিক আয়') },
                { icon: '🛺', num: t('12K+', '১২ হাজার+'), label: t('Active Drivers', 'সক্রিয় চালক') },
                { icon: '📍', num: t('64', '৬৪'), label: t('Districts', 'জেলা') },
                { icon: '⭐', num: t('4.8/5', '৪.৮/৫'), label: t('Avg Rating', 'গড় রেটিং') },
              ].map((stat, i) => (
                <div key={i} style={{ background: '#fff', borderRadius: 16, border: `1px solid ${border}`, padding: 20, textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
                  <div style={{ fontSize: 28, marginBottom: 8 }}>{stat.icon}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: primaryGreen, marginBottom: 4 }}>{stat.num}</div>
                  <div style={{ fontSize: 12, color: textMuted }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ======================== FOOTER ======================== */}
      <footer style={{ background: '#1A2920', color: '#fff', padding: '60px 0 0' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', padding: '0 24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 40, marginBottom: 40 }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{ width: 36, height: 36, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#fff', borderRadius: 10, boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
                  <img src="/assets/vehicles/easybike.jpg" style={{ width: 26, height: 26, objectFit: 'contain', mixBlendMode: 'multiply' }} alt="Oijaba" />
                </div>
                <div>
                  <div style={{ fontSize: 20, fontWeight: 900 }}>oijaba</div>
                  <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', letterSpacing: 1 }}>ওইযাবা</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.7)', lineHeight: 1.7, maxWidth: 280 }}>{t('Rural Bangladesh Ridesharing Platform. Connecting villages to towns safely and affordably.', 'গ্রামীণ বাংলাদেশ রাইডশেয়ারিং প্ল্যাটফর্ম।')}</p>
            </div>
            {[
              { title: t('Quick Links', 'দ্রুত লিংক'), links: [{ label: t('Features', 'বৈশিষ্ট্য'), href: '#features' }, { label: t('Vehicles', 'যানবাহন'), href: '#vehicles' }, { label: t('How It Works', 'কীভাবে কাজ করে'), href: '#how-it-works' }] },
              { title: t('For Drivers', 'চালকদের জন্য'), links: [{ label: t('Drive With Us', 'আমাদের সাথে চালান'), href: '#driver-home' }, { label: t('Earnings', 'আয়'), href: '#driver' }, { label: t('Registration', 'নিবন্ধন'), href: '#driver-home' }] },
              { title: t('Legal', 'আইনি'), links: [{ label: t('Privacy Policy', 'গোপনীয়তা নীতি'), href: '#' }, { label: t('Terms of Service', 'সেবার শর্ত'), href: '#' }, { label: t('Contact', 'যোগাযোগ'), href: '#' }] },
            ].map(col => (
              <div key={col.title}>
                <h4 style={{ fontSize: 14, fontWeight: 700, marginBottom: 16, color: 'rgba(255,255,255,0.9)' }}>{col.title}</h4>
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {col.links.map(link => (
                    <li key={link.label}><a href={link.href} style={{ fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecoration: 'none', transition: 'color 0.15s' }}>{link.label}</a></li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', padding: '24px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 8 }}>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)' }}>{t('© 2025 Oijaba Technologies Ltd. Made with ❤️ in Bangladesh 🇧🇩', '© ২০২৫ ওইযাবা টেকনোলজিস লিমিটেড। বাংলাদেশে ❤️ এর সাথে তৈরি 🇧🇩')}</p>
            <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>{t('BTRC Licensed · bKash Certified · Nagad Partner', 'বিটিআরসি লাইসেন্সপ্রাপ্ত · বিকাশ সার্টিফাইড · নগদ পার্টনার')}</p>
          </div>
        </div>
      </footer>

      {/* ======================== SOS FLOATING BUTTON ======================== */}
      <button onClick={() => setSosModalOpen(true)} style={{ position: 'fixed', bottom: 24, right: 24, padding: '14px 22px', background: 'linear-gradient(135deg,#f42a41,#c22134)', color: '#fff', border: 'none', borderRadius: 100, fontSize: 15, fontWeight: 700, cursor: 'pointer', boxShadow: '0 4px 20px rgba(244,42,65,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', gap: 8 }}>
        🆘 {t('SOS', 'এসওএস')}
      </button>

      {/* SOS Modal */}
      {sosModalOpen && (
        <div onClick={() => setSosModalOpen(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,106,78,0.12)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div onClick={e => e.stopPropagation()} style={{ background: 'linear-gradient(180deg,#fff7f8 0%,#fff 100%)', border: '1px solid rgba(244,42,65,0.2)', borderRadius: 16, padding: '32px 24px', maxWidth: 400, width: '90%', boxShadow: '0 14px 40px rgba(122,18,31,0.18)' }}>
            <button onClick={() => setSosModalOpen(false)} style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', fontSize: 22, color: '#f42a41', cursor: 'pointer' }}>✕</button>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, marginBottom: 16, padding: '8px 12px', background: 'rgba(244,42,65,0.1)', border: '1px solid rgba(244,42,65,0.24)', borderRadius: 999, color: '#9f2033', fontSize: 12, fontWeight: 700, textTransform: 'uppercase' as const }}>🆘 {t('Emergency', 'জরুরি')}</div>
            <h3 style={{ color: '#FF1744', marginBottom: 8, marginTop: 0 }}>{t('Emergency SOS', 'জরুরি এসওএস')}</h3>
            <p style={{ color: '#6e4b50', marginBottom: 20, fontSize: 14 }}>{t('Tap below to alert emergency services:', 'নিচে ট্যাপ করুন জরুরি সেবা সতর্ক করতে:')}</p>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[{ icon: '👮', label: t('Police', 'পুলিশ') }, { icon: '🚑', label: t('Ambulance', 'অ্যাম্বুলেন্স') }, { icon: '👨‍👩‍👧', label: t('Family', 'পরিবার') }, { icon: '🛟', label: t('Oijaba Support', 'ওইযাবা সাপোর্ট') }].map(btn => (
                <button key={btn.label} style={{ padding: '14px 12px', background: 'rgba(244,42,65,0.08)', border: '1px solid rgba(244,42,65,0.2)', borderRadius: 12, fontSize: 14, fontWeight: 600, color: '#9f2033', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
                  <span style={{ fontSize: 20 }}>{btn.icon}</span> {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Auth Modal */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} language={language} />
      {/* Admin Login Modal */}
      <AdminLoginModal isOpen={adminModalOpen} onClose={() => setAdminModalOpen(false)} language={language} />
    </div>
  )
}

