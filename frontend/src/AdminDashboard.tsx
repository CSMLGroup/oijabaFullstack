import React, { useMemo, useState } from 'react'
import AdminReact from './AdminReact'
import api, { clearAuthToken, setAuthToken } from './api'
import { readJwtPayload } from './authToken'

function readRoleFromToken(): string {
  const token = localStorage.getItem('oijaba_token')
  if (!token) return 'guest'
  const payload = readJwtPayload(token)
  return payload?.role || 'guest'
}

export default function AdminDashboard(): JSX.Element {
  const [phone, setPhone] = useState('')
  const [otp, setOtp] = useState('')
  const [otpSent, setOtpSent] = useState(false)
  const [status, setStatus] = useState('')
  const [loading, setLoading] = useState(false)
  const [refreshTick, setRefreshTick] = useState(0)

  const isAdmin = useMemo(() => readRoleFromToken() === 'admin', [refreshTick])

  async function sendAdminOtp(): Promise<void> {
    if (!/^\d{11}$/.test(phone.trim())) {
      setStatus('Enter a valid 11-digit admin phone number.')
      return
    }

    setLoading(true)
    try {
      await api.auth.sendOtp(phone.trim(), 'admin', 'login')
      setOtpSent(true)
      setStatus('Admin OTP sent. Use 1234 for testing.')
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Could not send admin OTP.'
      setStatus(msg)
    } finally {
      setLoading(false)
    }
  }

  async function verifyAdminOtp(): Promise<void> {
    if (!otp.trim()) {
      setStatus('Enter OTP to continue.')
      return
    }

    setLoading(true)
    try {
      const data = await api.auth.verifyOtp(phone.trim(), otp.trim(), 'admin')
      if (!data?.token) {
        setStatus('Admin login failed: no token returned.')
        return
      }
      setAuthToken(data.token)
      setStatus('Admin login successful.')
      setRefreshTick((v) => v + 1)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Admin login failed.'
      setStatus(msg)
    } finally {
      setLoading(false)
    }
  }

  function logoutAdmin(): void {
    clearAuthToken()
    setPhone('')
    setOtp('')
    setOtpSent(false)
    setStatus('Logged out from admin session.')
    setRefreshTick((v) => v + 1)
  }

  if (!isAdmin) {
    return (
      <div style={{ maxWidth: 420, margin: '24px auto', padding: 20, border: '1px solid var(--border)', borderRadius: 12, background: '#fff' }}>
        <h2 style={{ marginTop: 0 }}>Admin Login</h2>
        <p style={{ color: 'var(--text-sub)' }}>Use an authorized admin phone number to access the admin dashboard.</p>
        <div style={{ display: 'grid', gap: 10 }}>
          <input
            className="profile-input"
            placeholder="Admin phone (11 digits)"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            disabled={loading}
          />
          <button className="btn btn-primary" onClick={() => void sendAdminOtp()} disabled={loading}>
            Send Admin OTP
          </button>
          {otpSent && (
            <>
              <input
                className="profile-input"
                placeholder="Enter OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                disabled={loading}
              />
              <button className="btn btn-outline" onClick={() => void verifyAdminOtp()} disabled={loading}>
                Verify OTP
              </button>
            </>
          )}
          {status && <div style={{ fontSize: 13, color: 'var(--text-sub)' }}>{status}</div>}
        </div>
      </div>
    )
  }

  return <AdminReact onLogout={logoutAdmin} />
}
