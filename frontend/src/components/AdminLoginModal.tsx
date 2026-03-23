import React, { useState } from 'react'
import api, { setAuthToken } from '../api'

interface AdminLoginModalProps {
  isOpen: boolean
  onClose: () => void
  language?: 'en' | 'bn'
}

export default function AdminLoginModal({ isOpen, onClose, language = 'en' }: AdminLoginModalProps): JSX.Element | null {
  const t = (en: string, bn: string) => language === 'bn' ? bn : en

  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [message, setMessage] = useState('')
  const [isError, setIsError] = useState(false)
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const showAlert = (msg: string, error: boolean) => {
    setMessage(msg)
    setIsError(error)
  }

  const clearAlert = () => setMessage('')

  const handleSendOTP = async () => {
    if (!phone || phone.length < 10) {
      showAlert(
        t('Enter a valid 11-digit admin mobile number.', 'সঠিক ১১ সংখ্যার অ্যাডমিন মোবাইল নম্বর লিখুন।'),
        true
      )
      return
    }
    setLoading(true)
    clearAlert()
    try {
      await api.auth.sendOtp(phone, 'admin', 'login')
      setOtpSent(true)
      showAlert(
        t('Admin OTP sent. Enter the OTP below to continue.', 'অ্যাডমিন ওটিপি পাঠানো হয়েছে। চালিয়ে যেতে নিচে ওটিপি লিখুন।'),
        false
      )
    } catch (err: any) {
      showAlert(
        err?.message || t('Could not send admin OTP. Please try again.', 'অ্যাডমিন ওটিপি পাঠানো যায়নি। আবার চেষ্টা করুন।'),
        true
      )
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOTP = async () => {
    if (otp.length < 4) {
      showAlert(
        t('Enter the 4-digit admin OTP to continue.', 'চালিয়ে যেতে ৪ সংখ্যার অ্যাডমিন ওটিপি লিখুন।'),
        true
      )
      return
    }
    setLoading(true)
    clearAlert()
    try {
      const res = await api.auth.verifyOtp(phone, otp, 'admin')
      if (!res.token) throw new Error('No token received')
      setAuthToken(res.token)
      onClose()
      window.location.hash = '#admin'
    } catch (err: any) {
      showAlert(
        err?.message || t('Could not verify admin OTP.', 'অ্যাডমিন ওটিপি ভেরিফাই করা যায়নি।'),
        true
      )
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setPhone('')
    setOtp('')
    setOtpSent(false)
    setMessage('')
    setIsError(false)
    onClose()
  }

  return (
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 1000,
        background: 'rgba(30,0,5,0.55)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '1rem',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose() }}
    >
      <div style={{
        position: 'relative',
        width: '100%', maxWidth: 420,
        background: `radial-gradient(circle at top right, rgba(244,42,65,0.12), transparent 35%),
                     linear-gradient(180deg, #fff7f8 0%, #ffffff 100%)`,
        border: '1px solid rgba(244,42,65,0.2)',
        borderRadius: 16,
        boxShadow: '0 14px 40px rgba(122,18,31,0.18)',
        padding: '2rem',
      }}>
        {/* Close button */}
        <button
          onClick={handleClose}
          style={{
            position: 'absolute', top: 12, right: 16,
            background: 'none', border: 'none',
            fontSize: 24, cursor: 'pointer',
            color: '#9f2033', lineHeight: 1,
          }}
          aria-label="Close"
        >×</button>

        {/* Badge */}
        <div style={{
          display: 'inline-block',
          background: 'rgba(244,42,65,0.1)',
          border: '1px solid rgba(244,42,65,0.24)',
          color: '#9f2033',
          borderRadius: 999,
          padding: '4px 14px',
          fontSize: 13,
          fontWeight: 600,
          marginBottom: 16,
        }}>
          🛡️ {t('Admin Access', 'অ্যাডমিন অ্যাক্সেস')}
        </div>

        {/* Title */}
        <h3 style={{ margin: '0 0 8px', fontSize: 22, fontWeight: 700, color: '#7a1220' }}>
          {t('Admin Sign In', 'অ্যাডমিন লগইন')}
        </h3>
        <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6e4b50' }}>
          {t('Use your authorized admin mobile number to access the dashboard.', 'ড্যাশবোর্ড অ্যাক্সেস করতে আপনার অনুমোদিত অ্যাডমিন মোবাইল নম্বর ব্যবহার করুন।')}
        </p>

        {/* Phone input */}
        <div style={{ marginBottom: 16 }}>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#7a1220', marginBottom: 6 }}>
            {t('Admin Mobile Number', 'অ্যাডমিন মোবাইল নম্বর')}
          </label>
          <input
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder={t('Enter 11-digit admin number', '১১ সংখ্যার অ্যাডমিন নম্বর লিখুন')}
            maxLength={11}
            disabled={otpSent}
            style={{
              width: '100%', boxSizing: 'border-box',
              padding: '10px 14px',
              border: '1.5px solid rgba(244,42,65,0.18)',
              borderRadius: 8,
              fontSize: 15,
              outline: 'none',
              background: otpSent ? '#f9f2f3' : '#fff',
              color: '#1a0305',
            }}
          />
        </div>

        {/* Alert box */}
        {message && (
          <div style={{
            padding: '10px 14px',
            borderRadius: 8,
            marginBottom: 14,
            fontSize: 13,
            background: isError ? 'rgba(244,42,65,0.08)' : 'rgba(122,18,31,0.07)',
            border: `1px solid ${isError ? 'rgba(244,42,65,0.3)' : 'rgba(122,18,31,0.2)'}`,
            color: isError ? '#b11d34' : '#7a1220',
            fontWeight: 500,
          }}>
            {isError ? '⚠️' : '✅'} {message}
          </div>
        )}

        {/* Send OTP button */}
        {!otpSent && (
          <button
            onClick={handleSendOTP}
            disabled={loading}
            style={{
              width: '100%',
              padding: '12px',
              background: 'linear-gradient(135deg, #7a1220 0%, #b11d34 100%)',
              color: '#fff',
              border: 'none',
              borderRadius: 10,
              fontSize: 15,
              fontWeight: 700,
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              transition: 'opacity 0.2s',
            }}
          >
            {loading ? t('Sending…', 'পাঠানো হচ্ছে…') : t('Send Admin OTP', 'অ্যাডমিন ওটিপি পাঠান')}
          </button>
        )}

        {/* OTP section */}
        {otpSent && (
          <div>
            <div style={{ marginBottom: 14 }}>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: '#7a1220', marginBottom: 6 }}>
                {t('Enter Admin OTP', 'অ্যাডমিন ওটিপি লিখুন')}
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={otp}
                onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder={t('4-digit OTP', '৪ সংখ্যার ওটিপি')}
                maxLength={4}
                style={{
                  width: '100%', boxSizing: 'border-box',
                  padding: '10px 14px',
                  border: '1.5px solid rgba(244,42,65,0.18)',
                  borderRadius: 8,
                  fontSize: 18,
                  letterSpacing: 6,
                  outline: 'none',
                  color: '#1a0305',
                  textAlign: 'center',
                }}
              />
            </div>
            <button
              onClick={handleVerifyOTP}
              disabled={loading}
              style={{
                width: '100%',
                padding: '12px',
                background: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
                color: '#fff',
                border: 'none',
                borderRadius: 10,
                fontSize: 15,
                fontWeight: 700,
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.7 : 1,
                transition: 'opacity 0.2s',
                marginBottom: 10,
              }}
            >
              {loading ? t('Verifying…', 'ভেরিফাই হচ্ছে…') : t('Verify & Open Dashboard', 'ভেরিফাই করে ড্যাশবোর্ড খুলুন')}
            </button>
            <button
              onClick={() => { setOtpSent(false); clearAlert() }}
              style={{
                width: '100%',
                padding: '8px',
                background: 'none',
                border: '1px solid rgba(244,42,65,0.2)',
                borderRadius: 8,
                color: '#9f2033',
                fontSize: 13,
                cursor: 'pointer',
              }}
            >
              {t('← Change number', '← নম্বর পরিবর্তন করুন')}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
