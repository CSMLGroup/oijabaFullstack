import React, { useState } from 'react'
import api, { setAuthToken } from '../api'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  language?: 'en' | 'bn'
}

export default function AuthModal({ isOpen, onClose, language = 'en' }: AuthModalProps): JSX.Element {
  const t = (en: string, bn: string) => language === 'bn' ? bn : en
  const [activeTab, setActiveTab] = useState<'signin' | 'register'>('signin')
  
  // Sign In State
  const [signinPhone, setSigninPhone] = useState('')
  const [signinOtp, setSigninOtp] = useState('')
  const [signinOtpSent, setSigninOtpSent] = useState(false)
  const [signinMessage, setSigninMessage] = useState('')
  
  // Register State
  const [riderName, setRiderName] = useState('')
  const [riderPhone, setRiderPhone] = useState('')
  const [riderOtp, setRiderOtp] = useState('')
  const [riderOtpSent, setRiderOtpSent] = useState(false)
  const [riderMessage, setRiderMessage] = useState('')

  const primaryGreen = '#006a4e'
  const primaryDark = '#004c38'
  const textPrimary = '#1A2920'
  const textSecondary = '#3D5A47'

  const handleSendOTP = async (type: 'signin' | 'register') => {
    try {
      const phone = type === 'signin' ? signinPhone : riderPhone
      
      if (!/^\d{11}$/.test(phone)) {
        if (type === 'signin') {
          setSigninMessage(t('Enter a valid 11-digit phone number.', 'সঠিক ১১ সংখ্যার ফোন নম্বর দিন।'))
        } else {
          setRiderMessage(t('Enter a valid 11-digit phone number.', 'সঠিক ১১ সংখ্যার ফোন নম্বর দিন।'))
        }
        return
      }

      if (type === 'register' && !riderName.trim()) {
        setRiderMessage(t('Please enter your name.', 'আপনার নাম লিখুন।'))
        return
      }

      await api.auth.sendOtp(phone, type === 'signin' ? 'rider' : 'rider', 'login')
      
      if (type === 'signin') {
        setSigninOtpSent(true)
        setSigninMessage(t(`OTP sent to ${phone}. Use 1234 for testing.`, `${phone} নম্বরে ওটিপি পাঠানো হয়েছে। পরীক্ষার জন্য ১২৩৪ ব্যবহার করুন।`))
      } else {
        setRiderOtpSent(true)
        setRiderMessage(t(`OTP sent to ${phone}. Use 1234 for testing.`, `${phone} নম্বরে ওটিপি পাঠানো হয়েছে। পরীক্ষার জন্য ১২৩৪ ব্যবহার করুন।`))
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Could not send OTP.', 'ওটিপি পাঠানো সম্ভব হয়নি।')
      if (type === 'signin') {
        setSigninMessage(msg)
      } else {
        setRiderMessage(msg)
      }
    }
  }

  const handleVerifyOTP = async (type: 'signin' | 'register') => {
    try {
      const phone = type === 'signin' ? signinPhone : riderPhone
      const otp = type === 'signin' ? signinOtp : riderOtp

      if (!otp) {
        if (type === 'signin') {
          setSigninMessage(t('Enter OTP to continue.', 'চালিয়ে যেতে ওটিপি দিন।'))
        } else {
          setRiderMessage(t('Enter OTP to continue.', 'চালিয়ে যেতে ওটিপি দিন।'))
        }
        return
      }

      const data = await api.auth.verifyOtp(phone, otp, 'rider')
      
      if (!data?.token) {
        if (type === 'signin') {
          setSigninMessage(t('Login failed: no token returned from server.', 'লগইন ব্যর্থ: সার্ভার থেকে টোকেন পাওয়া যায়নি।'))
        } else {
          setRiderMessage(t('Login failed: no token returned from server.', 'লগইন ব্যর্থ: সার্ভার থেকে টোকেন পাওয়া যায়নি।'))
        }
        return
      }

      setAuthToken(data.token)

      if (type === 'register' && riderName.trim()) {
        await api.riders.updateProfile({ name: riderName.trim() })
      }

      localStorage.setItem('userProfile', JSON.stringify({
        name: type === 'register' ? riderName : data.user?.name || 'User',
        phone: phone
      }))

      // Trigger auth change event
      window.dispatchEvent(new Event('oijaba-auth-changed'))

      if (type === 'signin') {
        setSigninMessage(t('Login successful!', 'লগইন সফল হয়েছে!'))
      } else {
        setRiderMessage(t('Registration successful!', 'নিবন্ধন সফল হয়েছে!'))
      }

      setTimeout(() => {
        onClose()
        // Only redirect to #home if we are NOT already on a specific targeted panel
        // (like #book-ride, #driver-home, etc)
        const currentHash = window.location.hash.replace('#', '')
        const resetPanels = ['', 'home', 'rider-auth', 'register', 'login']
        if (resetPanels.includes(currentHash)) {
          window.location.hash = '#home'
        }
      }, 1000)
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Verification failed.', 'যাচাইকরণ ব্যর্থ হয়েছে।')
      if (type === 'signin') {
        setSigninMessage(msg)
      } else {
        setRiderMessage(msg)
      }
    }
  }

  if (!isOpen) return <></>

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(4px)'
    }}>
      <div style={{
        background: 'white',
        borderRadius: 12,
        boxShadow: '0 10px 40px rgba(0, 0, 0, 0.2)',
        width: '90%',
        maxWidth: 420,
        padding: 32,
        position: 'relative',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: 12,
            right: 12,
            background: 'none',
            border: 'none',
            fontSize: 24,
            cursor: 'pointer',
            color: textSecondary,
            width: 32,
            height: 32,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          ×
        </button>

        {/* Auth Tabs */}
        <div style={{
          display: 'flex',
          gap: 12,
          marginBottom: 24,
          borderBottom: '1px solid rgba(0, 0, 0, 0.1)',
          paddingBottom: 0
        }}>
          <button
            onClick={() => {
              setActiveTab('signin')
              setSigninMessage('')
            }}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'signin' ? `3px solid ${primaryGreen}` : '3px solid transparent',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'signin' ? primaryGreen : textSecondary,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t('Sign In', 'লগইন')}
          </button>
          <button
            onClick={() => {
              setActiveTab('register')
              setRiderMessage('')
            }}
            style={{
              flex: 1,
              padding: '12px 0',
              background: 'none',
              border: 'none',
              borderBottom: activeTab === 'register' ? `3px solid ${primaryGreen}` : '3px solid transparent',
              fontSize: 14,
              fontWeight: 600,
              color: activeTab === 'register' ? primaryGreen : textSecondary,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {t('Register', 'নিবন্ধন')}
          </button>
        </div>

        {/* Sign In Tab */}
        {activeTab === 'signin' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: textPrimary }}>
                {t('Phone Number', 'ফোন নম্বর')}
              </label>
              <input
                type="tel"
                value={signinPhone}
                onChange={(e) => setSigninPhone(e.target.value)}
                placeholder={t('Enter 11-digit number', '১১ সংখ্যার নম্বর দিন')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(0, 0, 0, 0.15)',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {signinMessage && (
              <div style={{
                marginBottom: 16,
                padding: 12,
                background: '#f0f7ff',
                borderRadius: 6,
                fontSize: 12,
                color: signinMessage.includes('Error') || signinMessage.includes('failed') ? '#dc2626' : '#0369a1'
              }}>
                {signinMessage}
              </div>
            )}

            {!signinOtpSent ? (
              <button
                onClick={() => handleSendOTP('signin')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: `linear-gradient(135deg, ${primaryGreen} 0%, ${primaryDark} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 16
                }}
              >
                {t('Send OTP', 'ওটিপি পাঠান')}
              </button>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: textPrimary }}>
                    {t('Enter OTP', 'ওটিপি দিন')}
                  </label>
                  <input
                    type="text"
                    value={signinOtp}
                    onChange={(e) => setSigninOtp(e.target.value.slice(0, 4))}
                    placeholder={t('Enter 4-digit OTP', '৪ সংখ্যার ওটিপি দিন')}
                    maxLength={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      borderRadius: 6,
                      fontSize: 13,
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <button
                  onClick={() => handleVerifyOTP('signin')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: `linear-gradient(135deg, #059669 0%, #047857 100%)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: 16
                  }}
                >
                  {t('Verify & Login', 'যাচাই করুন ও লগইন করুন')}
                </button>
                <button
                  onClick={() => {
                    setSigninOtpSent(false)
                    setSigninOtp('')
                    setSigninMessage('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: primaryGreen,
                    cursor: 'pointer',
                    fontSize: 12,
                    textDecoration: 'underline'
                  }}
                >
                  {t('Use different phone?', 'অন্য নম্বর ব্যবহার করবেন?')}
                </button>
              </>
            )}
          </div>
        )}

        {/* Register Tab */}
        {activeTab === 'register' && (
          <div>
            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: textPrimary }}>
                {t('Full Name', 'পূর্ণ নাম')}
              </label>
              <input
                type="text"
                value={riderName}
                onChange={(e) => setRiderName(e.target.value)}
                placeholder={t('Enter your full name', 'আপনার পূর্ণ নাম লিখুন')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(0, 0, 0, 0.15)',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: 16 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: textPrimary }}>
                {t('Phone Number', 'ফোন নম্বর')}
              </label>
              <input
                type="tel"
                value={riderPhone}
                onChange={(e) => setRiderPhone(e.target.value)}
                placeholder={t('Enter 11-digit number', '১১ সংখ্যার নম্বর দিন')}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  border: '1px solid rgba(0, 0, 0, 0.15)',
                  borderRadius: 6,
                  fontSize: 13,
                  boxSizing: 'border-box',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {riderMessage && (
              <div style={{
                marginBottom: 16,
                padding: 12,
                background: '#f0f7ff',
                borderRadius: 6,
                fontSize: 12,
                color: riderMessage.includes('Error') || riderMessage.includes('failed') ? '#dc2626' : '#0369a1'
              }}>
                {riderMessage}
              </div>
            )}

            {!riderOtpSent ? (
              <button
                onClick={() => handleSendOTP('register')}
                style={{
                  width: '100%',
                  padding: '10px 16px',
                  background: `linear-gradient(135deg, ${primaryGreen} 0%, ${primaryDark} 100%)`,
                  color: 'white',
                  border: 'none',
                  borderRadius: 6,
                  fontSize: 13,
                  fontWeight: 600,
                  cursor: 'pointer',
                  marginBottom: 16
                }}
              >
                {t('Send OTP', 'ওটিপি পাঠান')}
              </button>
            ) : (
              <>
                <div style={{ marginBottom: 16 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: textPrimary }}>
                    {t('Enter OTP', 'ওটিপি দিন')}
                  </label>
                  <input
                    type="text"
                    value={riderOtp}
                    onChange={(e) => setRiderOtp(e.target.value.slice(0, 4))}
                    placeholder={t('Enter 4-digit OTP', '৪ সংখ্যার ওটিপি দিন')}
                    maxLength={4}
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid rgba(0, 0, 0, 0.15)',
                      borderRadius: 6,
                      fontSize: 13,
                      boxSizing: 'border-box',
                      fontFamily: 'inherit'
                    }}
                  />
                </div>
                <button
                  onClick={() => handleVerifyOTP('register')}
                  style={{
                    width: '100%',
                    padding: '10px 16px',
                    background: `linear-gradient(135deg, #059669 0%, #047857 100%)`,
                    color: 'white',
                    border: 'none',
                    borderRadius: 6,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: 'pointer',
                    marginBottom: 16
                  }}
                >
                  {t('Verify & Register', 'যাচাই করুন ও নিবন্ধন করুন')}
                </button>
                <button
                  onClick={() => {
                    setRiderOtpSent(false)
                    setRiderOtp('')
                    setRiderMessage('')
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    color: primaryGreen,
                    cursor: 'pointer',
                    fontSize: 12,
                    textDecoration: 'underline'
                  }}
                >
                  {t('Use different phone?', 'অন্য নম্বর ব্যবহার করবেন?')}
                </button>
              </>
            )}
          </div>
        )}

        {/* Divider */}
        <div style={{
          textAlign: 'center',
          margin: '20px 0',
          position: 'relative'
        }}>
          <div style={{ borderTop: '1px solid rgba(0, 0, 0, 0.1)' }}></div>
          <span style={{
            position: 'absolute',
            top: -10,
            left: '50%',
            transform: 'translateX(-50%)',
            background: 'white',
            padding: '0 10px',
            fontSize: 12,
            color: textSecondary
          }}>
            {t('or', 'অথবা')}
          </span>
        </div>

        {/* Driver Login Link */}
        <a
          href="#driver-home"
          onClick={(e) => {
            e.preventDefault()
            onClose()
            window.location.hash = '#driver-home'
          }}
          style={{
            display: 'block',
            padding: '10px 16px',
            background: 'none',
            border: `1.5px solid ${primaryGreen}`,
            borderRadius: 6,
            textDecoration: 'none',
            fontWeight: 600,
            cursor: 'pointer',
            textAlign: 'center',
            color: primaryGreen,
            transition: 'all 0.2s'
          }}
          onMouseEnter={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'rgba(0, 106, 78, 0.08)'
          }}
          onMouseLeave={(e) => {
            (e.currentTarget as HTMLAnchorElement).style.background = 'none'
          }}
        >
          {t('Login as Driver', 'চালক হিসেবে লগইন করুন')}
        </a>
      </div>
    </div>
  )
}
