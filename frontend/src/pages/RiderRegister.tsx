import React, { useState } from 'react'
import api, { setAuthToken } from '../api'

export default function RiderRegister(): JSX.Element {
  const [phone, setPhone] = useState('')
  const [name, setName] = useState('')
  const [userType, setUserType] = useState<'driver' | 'rider'>('rider')
  const [otpSent, setOtpSent] = useState(false)
  const [otp, setOtp] = useState('')
  const [message, setMessage] = useState('')

  async function sendOtp() {
    if (!/^\d{11}$/.test(phone)) {
      setMessage('Enter a valid 11-digit phone number.')
      return
    }
    try {
      console.log('Sending OTP for:', phone, 'as:', userType)
      await api.auth.sendOtp(phone, userType, 'login')
      setMessage(`OTP sent to ${userType}. Use 1234 for testing.`)
      setOtpSent(true)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not send OTP.'
      console.error('sendOtp error:', error)
      setMessage(msg)
    }
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!otp) {
      setMessage('Enter OTP to continue.')
      return
    }
    try {
      console.log('Verifying OTP for:', phone, 'as:', userType)
      const data = await api.auth.verifyOtp(phone, otp, userType)
      console.log('Auth response:', data)
      
      if (!data?.token) {
        setMessage('Login failed: no token returned from server.')
        return
      }

      setAuthToken(data.token)
      console.log('Token set. User role:', data.user?.role)

      if (name.trim() && userType === 'rider') {
        await api.riders.updateProfile({ name: name.trim() })
      }

      setMessage(`${userType === 'driver' ? 'Driver' : 'Rider'} login successful!`)
      setName('')
      setPhone('')
      setOtp('')
      setOtpSent(false)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Login failed.'
      console.error('submit error:', error)
      setMessage(msg)
    }
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>Login / Registration</h2>
      
      {!otpSent ? (
        <form onSubmit={(e) => { e.preventDefault(); sendOtp(); }} style={{ maxWidth: 420 }}>
          {/* Role Selection */}
          <div style={{ marginBottom: 16, padding: 12, background: '#f5f5f5', borderRadius: 6 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 8, color: 'var(--text-sub)' }}>
              I am a:
            </label>
            <div style={{ display: 'flex', gap: 12 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}>
                <input
                  type="radio"
                  name="userType"
                  value="driver"
                  checked={userType === 'driver'}
                  onChange={(e) => setUserType(e.target.value as 'driver')}
                />
                <span style={{ fontWeight: 500 }}>🚗 Driver</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer', flex: 1 }}>
                <input
                  type="radio"
                  name="userType"
                  value="rider"
                  checked={userType === 'rider'}
                  onChange={(e) => setUserType(e.target.value as 'rider')}
                />
                <span style={{ fontWeight: 500 }}>👤 Rider</span>
              </label>
            </div>
          </div>

          {/* Name (only for riders without existing account) */}
          {userType === 'rider' && (
            <div style={{ marginBottom: 8 }}>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Name (optional)</label>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="profile-input"
                placeholder="Your name"
              />
            </div>
          )}

          {/* Phone */}
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Phone</label>
            <input
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="profile-input"
              placeholder="01XXXXXXXXX"
            />
          </div>

          {/* Send OTP Button */}
          <div style={{ marginBottom: 8 }}>
            <button type="submit" className="btn btn-primary">
              Send OTP
            </button>
          </div>
        </form>
      ) : (
        <form onSubmit={submit} style={{ maxWidth: 420 }}>
          <div style={{ marginBottom: 8, padding: 12, background: '#f0f7ff', borderRadius: 6, color: '#0369a1', fontSize: 13 }}>
            ✓ OTP sent to {phone} as <strong>{userType}</strong>
          </div>
          
          <div style={{ marginBottom: 8 }}>
            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 4 }}>Enter OTP</label>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="profile-input"
              placeholder="1234"
              maxLength={6}
            />
          </div>

          <div style={{ marginBottom: 8 }}>
            <button type="submit" className="btn btn-primary">
              Verify & Login
            </button>
          </div>

          <button
            type="button"
            onClick={() => {
              setOtpSent(false)
              setOtp('')
              setPhone('')
              setMessage('')
            }}
            style={{ color: '#0369a1', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, textDecoration: 'underline' }}
          >
            Use different phone?
          </button>
        </form>
      )}

      {message && (
        <div style={{ marginTop: 12, padding: 12, background: '#f5f5f5', borderRadius: 6, color: '#333', fontSize: 13 }}>
          {message}
        </div>
      )}
    </div>
  )
}
