import React, { useEffect, useState } from 'react'
import api from '../api'
import { BD_LOCATIONS, POST_OFFICES } from '../bd-post-office-master'
import { BD_DISTRICTS_BN, BD_LOCATIONS_BN, POST_OFFICES_BN } from '../bd-post-office-master-bn'
import AdminRideDetail from './AdminRideDetail'

type DriverUser = {
  id: string
  name?: string
  name_bn?: string
  phone?: string
  area?: string
  district?: string
  upazilla?: string
  house_no?: string
  road_no?: string
  landmark?: string
  post_office?: string
  vehicle_type?: string
  vehicle_model?: string
  vehicle_plate?: string
  driver_license?: string
  nid_number?: string
  status?: string
  is_online?: boolean
  profile_image?: string
  driver_license_image?: string
  rating_sum?: number
  rating_count?: number
  total_rides?: number
  total_earned?: number
  today_rides?: number
  today_earned?: number
  rides_count?: number
  earnings?: number
  created_at?: string
}

type Ride = {
  id: string
  ride_ref?: string
  rider_name?: string
  rider_phone?: string
  pickup_name?: string
  destination_name?: string
  fare?: number
  fare_estimate?: number
  fare_final?: number
  status?: string
  created_at?: string
  driver_rating?: number
  rider_rating?: number
}

type Vehicle = {
  id: string
  vehicle_type?: string
  vehicle_model?: string
  vehicle_plate?: string
  year?: string
  color?: string
  capacity?: string
  registration_number?: string
  engine_number?: string
  notes?: string
  is_primary?: boolean
  vehicle_front_image?: string
  vehicle_rear_image?: string
  vehicle_left_image?: string
  vehicle_right_image?: string
  created_at?: string
}

type Tab = 'overview' | 'rides' | 'vehicles' | 'profile' | 'ride-detail'

interface Props {
  driverId: string
  onBack: () => void
}

export default function AdminDriverView({ driverId, onBack }: Props): JSX.Element {
  const [tab, setTab] = useState<Tab>('overview')
  const [driver, setDriver] = useState<DriverUser | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  // Profile editing
  const [editingProfile, setEditingProfile] = useState(false)
  const [profileForm, setProfileForm] = useState<Partial<DriverUser>>({})
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileMsg, setProfileMsg] = useState('')
  const [onlineSaving, setOnlineSaving] = useState(false)
  const [approvalSaving, setApprovalSaving] = useState<'approve' | 'deny' | null>(null)
  const [otpStep, setOtpStep] = useState<'idle' | 'pending'>('idle')
  const [otpCode, setOtpCode] = useState('')
  const [otpSending, setOtpSending] = useState(false)
  const [hasSensitiveChange, setHasSensitiveChange] = useState(false)

  // Language
  const [isBangla, setIsBangla] = useState(() => {
    try { return localStorage.getItem('oijaba_lang') === 'bn' } catch { return false }
  })

  // Vehicle editing
  const [editingVehicleId, setEditingVehicleId] = useState<string | null>(null)
  const [addingVehicle, setAddingVehicle] = useState(false)
  const [vehicleForm, setVehicleForm] = useState<Partial<Vehicle>>({})
  const [vehicleSaving, setVehicleSaving] = useState(false)
  const [vehicleMsg, setVehicleMsg] = useState('')

  // Rides filtering and sorting
  const [ridesSearchQuery, setRidesSearchQuery] = useState('')
  const [ridesSortBy, setRidesSortBy] = useState<'date-desc' | 'date-asc' | 'status'>('date-desc')
  const [ridesStatusFilter, setRidesStatusFilter] = useState<string>('all')

  // Ride detail view
  const [viewingRideId, setViewingRideId] = useState<string | null>(null)

  const loadData = () => {
    setLoading(true)
    setError('')
    Promise.all([
      api.drivers.get(driverId),
      api.rides.listByDriver(driverId),
      api.drivers.getVehicles(driverId)
    ])
      .then(([driverRes, ridesRes, vehiclesRes]: any[]) => {
        setDriver(driverRes?.user || null)
        setRides(Array.isArray(ridesRes?.rides) ? ridesRes.rides : [])
        setVehicles(Array.isArray(vehiclesRes?.vehicles) ? vehiclesRes.vehicles : [])
      })
      .catch((err: any) => setError(err?.message || 'Failed to load driver data'))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadData() }, [driverId])

  const viewRideDetail = (rideId: string) => {
    setViewingRideId(rideId)
    setTab('ride-detail')
  }

  const downloadRideInfoPDF = (rideData: Ride) => {
    // Create PDF content as HTML
    const pdfHTML = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Ride Information - ${rideData.ride_ref || rideData.id}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; background: white; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 15px; }
          .header h1 { margin: 0; color: #333; font-size: 24px; }
          .header p { margin: 5px 0; color: #666; font-size: 12px; }
          .section { margin-bottom: 25px; }
          .section h2 { margin: 0 0 12px 0; color: #333; font-size: 14px; font-weight: bold; border-bottom: 1px solid #ddd; padding-bottom: 6px; }
          .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; font-size: 13px; }
          .detail-label { font-weight: bold; color: #555; flex: 0 0 40%; }
          .detail-value { text-align: right; flex: 0 0 60%; word-break: break-word; }
          .badge { display: inline-block; padding: 2px 8px; border-radius: 12px; font-size: 12px; font-weight: bold; }
          .badge-completed { background: #d1fae5; color: #065f46; }
          .badge-cancelled { background: #fee2e2; color: #991b1b; }
          .badge-ongoing { background: #fef3c7; color: #92400e; }
          .badge-pending { background: #dbeafe; color: #0c2d6b; }
          .footer { text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; color: #999; font-size: 11px; }
          @page { margin: 10mm; }
          @media print {
            body { margin: 0; }
            .container { max-width: 100%; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>Ride Information</h1>
            <p>Generated on ${new Date().toLocaleString()}</p>
          </div>

          <div class="section">
            <h2>Basic Details</h2>
            <div class="detail-row">
              <span class="detail-label">Ride ID:</span>
              <span class="detail-value">${rideData.id?.slice(0, 16) || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Reference:</span>
              <span class="detail-value">${rideData.ride_ref || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Status:</span>
              <span class="detail-value"><span class="badge badge-${rideData.status || 'pending'}">${rideData.status?.toUpperCase() || '—'}</span></span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date & Time:</span>
              <span class="detail-value">${rideData.created_at ? new Date(rideData.created_at).toLocaleString() : '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Rider Information</h2>
            <div class="detail-row">
              <span class="detail-label">Name:</span>
              <span class="detail-value">${rideData.rider_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span class="detail-value">${rideData.rider_phone || '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Route Details</h2>
            <div class="detail-row">
              <span class="detail-label">Pickup:</span>
              <span class="detail-value">${rideData.pickup_name || '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Destination:</span>
              <span class="detail-value">${rideData.destination_name || '—'}</span>
            </div>
          </div>

          <div class="section">
            <h2>Fare & Payment</h2>
            <div class="detail-row">
              <span class="detail-label">Estimated Fare:</span>
              <span class="detail-value">৳${rideData.fare_estimate ?? '—'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Final Fare:</span>
              <span class="detail-value">৳${rideData.fare_final ?? '—'}</span>
            </div>
          </div>

          <div class="footer">
            <p>This is an official ride information document from Oijaba</p>
          </div>
        </div>

        <script>
          window.addEventListener('load', () => {
            window.print();
            setTimeout(() => window.close(), 500);
          });
        </script>
      </body>
      </html>
    `

    const blob = new Blob([pdfHTML], { type: 'text/html;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `ride-info-${rideData.ride_ref || rideData.id?.slice(0, 8)}.html`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  useEffect(() => {
    const syncLang = () => {
      try { setIsBangla(localStorage.getItem('oijaba_lang') === 'bn') } catch {}
    }
    window.addEventListener('oijaba-language-changed', syncLang)
    window.addEventListener('storage', syncLang)
    return () => {
      window.removeEventListener('oijaba-language-changed', syncLang)
      window.removeEventListener('storage', syncLang)
    }
  }, [])

  const startEditProfile = () => {
    if (!driver) return
    setProfileForm({
      name: driver.name || '',
      name_bn: driver.name_bn || '',
      phone: driver.phone || '',
      area: driver.area || '',
      district: driver.district || '',
      upazilla: driver.upazilla || '',
      house_no: driver.house_no || '',
      road_no: driver.road_no || '',
      landmark: driver.landmark || '',
      post_office: driver.post_office || '',
      nid_number: driver.nid_number || '',
      driver_license: driver.driver_license || '',
      status: driver.status || 'active',
    })
    setProfileMsg('')
    setHasSensitiveChange(false)
    setEditingProfile(true)
  }

  const saveProfile = async () => {
    if (hasSensitiveChange) {
      setOtpSending(true)
      setProfileMsg('')
      try {
        await api.auth.sendOtp(driver!.phone!, 'driver')
        setOtpCode('')
        setOtpStep('pending')
        setProfileMsg(`OTP sent to driver's phone (${driver?.phone}). Enter to confirm changes.`)
      } catch (err: any) {
        setProfileMsg(err.message || 'Failed to send OTP')
      } finally {
        setOtpSending(false)
      }
      return
    }

    setProfileSaving(true)
    setProfileMsg('')
    try {
      const res: any = await api.drivers.updateById(driverId, profileForm)
      setDriver(res.user)
      setEditingProfile(false)
      setProfileMsg('Saved successfully')
    } catch (err: any) {
      setProfileMsg(err.message || 'Save failed')
    } finally {
      setProfileSaving(false)
    }
  }

  const verifyAndSave = async () => {
    if (!otpCode || otpCode.trim().length < 4) {
      setProfileMsg('Enter the 4-digit OTP sent to the driver\'s phone')
      return
    }
    setProfileSaving(true)
    setProfileMsg('')
    try {
      await api.auth.verifyOtp(driver!.phone!, otpCode.trim(), 'driver')
      const res: any = await api.drivers.updateById(driverId, profileForm)
      setDriver(res.user)
      setEditingProfile(false)
      setOtpStep('idle')
      setOtpCode('')
      setProfileMsg('Saved successfully')
    } catch (err: any) {
      setProfileMsg(err.message || 'Invalid OTP or save failed')
    } finally {
      setProfileSaving(false)
    }
  }

  const toggleOnlineStatus = async () => {
    if (!driver) return
    const nextOnline = !Boolean(driver.is_online)
    setOnlineSaving(true)
    setProfileMsg('')
    try {
      const res: any = await api.drivers.updateById(driverId, { is_online: nextOnline })
      setDriver(d => d ? { ...d, ...(res?.user || {}), is_online: Boolean(res?.user?.is_online ?? nextOnline) } : d)
      setProfileMsg(nextOnline ? 'Driver set to online' : 'Driver set to offline')
      loadData()
    } catch (err: any) {
      const msg = err?.message || 'Failed to update online status'
      if (String(msg).toLowerCase().includes('no valid fields to update')) {
        setProfileMsg('Failed to update online status: backend needs restart to load latest route changes.')
      } else {
        setProfileMsg(msg)
      }
    } finally {
      setOnlineSaving(false)
    }
  }

  const needsApproval = ['pending', 'need_approval', 'needs_approval', 'awaiting_approval'].includes(String(driver?.status || '').toLowerCase())

  const handleDriverApproval = async (action: 'approve' | 'reject') => {
    if (!driver?.id) return
    setApprovalSaving(action === 'approve' ? 'approve' : 'deny')
    setProfileMsg('')
    try {
      await api.drivers.approve(driver.id, action)
      setProfileMsg(action === 'approve' ? 'Driver approved successfully' : 'Driver denied successfully')
      loadData()
    } catch (err: any) {
      setProfileMsg(err?.message || 'Failed to update driver approval status')
    } finally {
      setApprovalSaving(null)
    }
  }

  const startEditVehicle = (v: Vehicle) => {
    setVehicleForm({
      vehicle_type: v.vehicle_type || '',
      vehicle_model: v.vehicle_model || '',
      vehicle_plate: v.vehicle_plate || '',
      year: v.year || '',
      color: v.color || '',
      capacity: v.capacity || '',
      registration_number: v.registration_number || '',
      engine_number: v.engine_number || '',
      notes: v.notes || '',
      vehicle_front_image: v.vehicle_front_image || '',
      vehicle_rear_image: v.vehicle_rear_image || '',
      vehicle_left_image: v.vehicle_left_image || '',
      vehicle_right_image: v.vehicle_right_image || '',
    })
    setAddingVehicle(false)
    setVehicleMsg('')
    setEditingVehicleId(v.id)
  }

  const startAddVehicle = () => {
    setEditingVehicleId(null)
    setVehicleForm({
      vehicle_type: '',
      vehicle_model: '',
      vehicle_plate: '',
      year: '',
      color: '',
      capacity: '',
      registration_number: '',
      engine_number: '',
      notes: '',
      vehicle_front_image: '',
      vehicle_rear_image: '',
      vehicle_left_image: '',
      vehicle_right_image: '',
    })
    setVehicleMsg('')
    setAddingVehicle(true)
  }

  const toUpdatePayload = () => ({
    vehicle_type: vehicleForm.vehicle_type || '',
    vehicle_model: vehicleForm.vehicle_model || '',
    vehicle_plate: vehicleForm.vehicle_plate || '',
    year: vehicleForm.year || '',
    color: vehicleForm.color || '',
    capacity: vehicleForm.capacity || '',
    registration_number: vehicleForm.registration_number || '',
    engine_number: vehicleForm.engine_number || '',
    notes: vehicleForm.notes || '',
    vehicle_front_image: vehicleForm.vehicle_front_image || '',
    vehicle_rear_image: vehicleForm.vehicle_rear_image || '',
    vehicle_left_image: vehicleForm.vehicle_left_image || '',
    vehicle_right_image: vehicleForm.vehicle_right_image || '',
  })

  const saveVehicle = async () => {
    if (!editingVehicleId) return
    setVehicleSaving(true)
    setVehicleMsg('')
    try {
      const payload = toUpdatePayload()
      if (!payload.vehicle_type || !payload.vehicle_plate) {
        setVehicleMsg('Vehicle type and plate are required')
        return
      }
      const res: any = await api.drivers.updateVehicleById(driverId, editingVehicleId, payload)
      setVehicles(vs => vs.map(v => v.id === editingVehicleId ? { ...v, ...res.vehicle } : v))
      setEditingVehicleId(null)
      setVehicleMsg('Vehicle updated')
    } catch (err: any) {
      setVehicleMsg(err.message || 'Save failed')
    } finally {
      setVehicleSaving(false)
    }
  }

  const addVehicle = async () => {
    setVehicleSaving(true)
    setVehicleMsg('')
    try {
      const payload = toUpdatePayload()
      if (!payload.vehicle_type || !payload.vehicle_plate) {
        setVehicleMsg('Vehicle type and plate are required')
        return
      }
      const res: any = await api.drivers.addVehicleById(driverId, {
        vehicle_type: payload.vehicle_type,
        vehicle_model: payload.vehicle_model,
        vehicle_plate: payload.vehicle_plate,
        year: payload.year,
        color: payload.color,
        capacity: payload.capacity,
        registration_number: payload.registration_number,
        engine_chassis_number: payload.engine_number,
        notes: payload.notes,
        vehicle_front_image: payload.vehicle_front_image || null,
        vehicle_rear_image: payload.vehicle_rear_image || null,
        vehicle_left_image: payload.vehicle_left_image || null,
        vehicle_right_image: payload.vehicle_right_image || null,
      })
      if (Array.isArray(res?.vehicles)) {
        setVehicles(res.vehicles)
      } else if (res?.vehicle) {
        setVehicles(vs => [res.vehicle, ...vs])
      }
      setAddingVehicle(false)
      setVehicleForm({})
      setVehicleMsg('Vehicle added')
    } catch (err: any) {
      setVehicleMsg(err.message || 'Add failed')
    } finally {
      setVehicleSaving(false)
    }
  }

  const handleVehicleImageUpload = (key: keyof Vehicle, file?: File | null) => {
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const dataUrl = String(reader.result || '')
      setVehicleForm(f => ({ ...f, [key]: dataUrl }))
    }
    reader.readAsDataURL(file)
  }

  const deleteVehicle = async (vehicleId: string) => {
    if (!window.confirm('Delete this vehicle? This cannot be undone.')) return
    try {
      await api.drivers.deleteVehicleById(driverId, vehicleId)
      setVehicles(vs => vs.filter(v => v.id !== vehicleId))
    } catch (err: any) {
      alert(err.message || 'Delete failed')
    }
  }

  const setPrimaryVehicle = async (vehicleId: string) => {
    try {
      const res: any = await (api.drivers as any).setVehiclePrimary(driverId, vehicleId)
      setVehicles(Array.isArray(res?.vehicles) ? res.vehicles : vs => vs.map(v => ({ ...v, is_primary: v.id === vehicleId })))
      setVehicleMsg('Primary vehicle updated')
    } catch (err: any) {
      setVehicleMsg(err.message || 'Failed to set primary vehicle')
    }
  }

  const rating = driver?.rating_count ? (driver.rating_sum! / driver.rating_count).toFixed(1) : '—'
  const totalRides = driver?.total_rides ?? driver?.rides_count ?? 0
  const totalEarned = driver?.total_earned ?? driver?.earnings ?? 0
  const todayRides = driver?.today_rides ?? 0
  const todayEarned = driver?.today_earned ?? 0

  const completedRides = rides.filter(r => r.status === 'completed')
  const cancelledRides = rides.filter(r => r.status === 'cancelled')

  // Filter and sort rides based on search and sort preferences
  const filteredAndSortedRides = rides
    .filter(r => {
      // Apply status filter
      if (ridesStatusFilter !== 'all' && r.status !== ridesStatusFilter) {
        return false
      }
      
      // Apply search filter (search by ride ID or rider name)
      if (ridesSearchQuery.trim()) {
        const query = ridesSearchQuery.toLowerCase()
        const rideIdMatch = (r.ride_ref || r.id)?.toLowerCase().includes(query)
        const riderNameMatch = r.rider_name?.toLowerCase().includes(query)
        return rideIdMatch || riderNameMatch
      }
      
      return true
    })
    .sort((a, b) => {
      // Sort by selected preference
      if (ridesSortBy === 'date-desc') {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
      } else if (ridesSortBy === 'date-asc') {
        return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
      } else if (ridesSortBy === 'status') {
        const statusOrder: { [key: string]: number } = { 'completed': 0, 'cancelled': 1, 'ongoing': 2, 'pending': 3 }
        const aOrder = statusOrder[a.status || ''] ?? 99
        const bOrder = statusOrder[b.status || ''] ?? 99
        return aOrder - bOrder
      }
      return 0
    })

  const backButtonStyle: React.CSSProperties = {
    padding: '10px 16px',
    borderRadius: 10,
    border: '1px solid #0f6b4f',
    background: 'linear-gradient(135deg, #0f8a64, #0f6b4f)',
    color: '#ffffff',
    fontWeight: 700,
    boxShadow: '0 6px 16px rgba(15, 107, 79, 0.35)'
  }

  if (loading) return <div className="admin-loading">Loading driver profile...</div>
  if (error) return (
    <div className="admin-section">
      <button className="admin-btn" style={{ ...backButtonStyle, marginBottom: 12 }} onClick={onBack}>← Back to Drivers</button>
      <div style={{ color: 'var(--danger)', padding: 20 }}>{error}</div>
    </div>
  )
  if (!driver) return (
    <div className="admin-section">
      <button className="admin-btn" style={{ ...backButtonStyle, marginBottom: 12 }} onClick={onBack}>← Back to Drivers</button>
      <div style={{ color: 'var(--danger)', padding: 20 }}>Driver not found.</div>
    </div>
  )

  const tabs: { id: Tab; label: string; desc: string }[] = [
    { id: 'overview', label: 'Overview', desc: 'Stats & info' },
    { id: 'rides', label: 'Rides', desc: `${rides.length} total` },
    { id: 'vehicles', label: 'Vehicles', desc: `${vehicles.length} registered` },
    { id: 'profile', label: 'Profile', desc: 'Documents & details' },
  ]

  const fieldStyle: React.CSSProperties = {
    display: 'flex', flexDirection: 'column', gap: 4
  }
  const labelStyle: React.CSSProperties = { fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }
  const inputStyle: React.CSSProperties = { padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }

  return (
    <div className="admin-section">
      {/* Back button + driver header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <button className="admin-btn" style={backButtonStyle} onClick={onBack}>← Drivers</button>
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {driver.profile_image ? (
              <img src={driver.profile_image} alt="profile" style={{ width: 44, height: 44, borderRadius: '50%', objectFit: 'cover', border: '2px solid var(--primary)' }} />
            ) : (
              <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 20 }}>🧑</div>
            )}
            <div>
              <div style={{ fontWeight: 700, fontSize: 18 }}>{driver.name || 'No name'}</div>
              <div style={{ color: 'var(--text-sub)', fontSize: 13 }}>{driver.phone} · <span className={`admin-badge ${driver.status || 'neutral'}`} style={{ fontSize: 11 }}>{driver.is_online ? '🟢 Online' : '⚫ Offline'} · {driver.status}</span></div>
            </div>
          </div>
        </div>
        {needsApproval && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              className="admin-btn success"
              style={{ padding: '8px 14px', fontWeight: 700 }}
              onClick={() => void handleDriverApproval('approve')}
              disabled={approvalSaving !== null}
            >
              {approvalSaving === 'approve' ? 'Approving...' : 'Approve Driver'}
            </button>
            <button
              className="admin-btn"
              style={{ padding: '8px 14px', background: '#b91c1c', borderColor: '#b91c1c', color: '#fff', fontWeight: 700 }}
              onClick={() => void handleDriverApproval('reject')}
              disabled={approvalSaving !== null}
            >
              {approvalSaving === 'deny' ? 'Denying...' : 'Deny Driver'}
            </button>
          </div>
        )}
        <button
          className={`admin-btn ${driver.is_online ? 'danger' : 'success'}`}
          style={{ padding: '8px 14px', marginRight: 0 }}
          onClick={toggleOnlineStatus}
          disabled={onlineSaving}
          title={driver.is_online ? 'Set driver offline' : 'Set driver online'}
        >
          {onlineSaving
            ? 'Updating...'
            : driver.is_online
              ? 'Make Offline'
              : 'Make Online'}
        </button>
      </div>

      {profileMsg ? (
        <div
          style={{
            marginTop: -8,
            marginBottom: 14,
            padding: '8px 10px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            background: profileMsg.toLowerCase().includes('failed') ? '#fff0f0' : '#f0faf5',
            color: profileMsg.toLowerCase().includes('failed') ? 'var(--danger)' : 'var(--primary)'
          }}
        >
          {profileMsg}
        </div>
      ) : null}

      {/* Horizontal tabs */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {tabs.map(t => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            style={{
              padding: '8px 18px',
              borderRadius: 20,
              border: tab === t.id ? 'none' : '1px solid var(--border)',
              background: tab === t.id ? 'var(--primary)' : '#fff',
              color: tab === t.id ? '#fff' : 'var(--text)',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
              transition: 'all 0.15s',
            }}
          >
            {t.label}
            <span style={{ fontWeight: 400, fontSize: 12, marginLeft: 6, opacity: 0.75 }}>{t.desc}</span>
          </button>
        ))}
      </div>

      {/* Tab: Overview */}
      {tab === 'overview' && (
        <div>
          <div className="admin-stat-grid">
            <div className="admin-stat-card">
              <div className="admin-stat-header"><span className="admin-stat-label">Total Rides</span><span className="admin-stat-icon">🛺</span></div>
              <div className="admin-stat-value">{totalRides.toLocaleString()}</div>
              <div className="admin-stat-change">{completedRides.length} completed this fetch</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-header"><span className="admin-stat-label">Total Earned</span><span className="admin-stat-icon">💰</span></div>
              <div className="admin-stat-value">৳{Number(totalEarned).toLocaleString()}</div>
              <div className="admin-stat-change positive">৳{Number(todayEarned).toLocaleString()} today</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-header"><span className="admin-stat-label">Rating</span><span className="admin-stat-icon">⭐</span></div>
              <div className="admin-stat-value">{rating}</div>
              <div className="admin-stat-change">{driver.rating_count ?? 0} ratings</div>
            </div>
            <div className="admin-stat-card">
              <div className="admin-stat-header"><span className="admin-stat-label">Today</span><span className="admin-stat-icon">📅</span></div>
              <div className="admin-stat-value">{todayRides}</div>
              <div className="admin-stat-change">rides today</div>
            </div>
          </div>

          <div className="admin-card" style={{ marginBottom: 16 }}>
            <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Driver Info</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 24px' }}>
              {[
                ['Phone', driver.phone],
                ['Area', driver.area],
                ['District', driver.district],
                ['Vehicle Type', driver.vehicle_type],
                ['Vehicle Model', driver.vehicle_model],
                ['Plate', driver.vehicle_plate],
                ['NID', driver.nid_number],
                ['License No.', driver.driver_license],
                ['Member Since', driver.created_at ? new Date(driver.created_at).toLocaleDateString() : '—'],
              ].map(([label, value]) => (
                <div key={label as string} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 2 }}>{label}</div>
                  <div style={{ fontWeight: 600 }}>{value || '—'}</div>
                </div>
              ))}
            </div>
          </div>

          {rides.length > 0 && (
            <div className="admin-card">
              <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Recent Rides</h4>
              <div style={{ maxHeight: 280, overflowY: 'auto' }}>
                <table className="admin-table" style={{ border: 'none', borderRadius: 0 }}>
                  <thead><tr><th>Ref</th><th>Rider</th><th>Route</th><th>Fare</th><th>Status</th><th>Date</th></tr></thead>
                  <tbody>
                    {rides.slice(0, 10).map(r => (
                      <tr key={r.id}>
                        <td>{r.ride_ref || r.id?.slice(0, 8)}</td>
                        <td>{r.rider_name || '—'}</td>
                        <td style={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {r.pickup_name ? `${r.pickup_name} → ${r.destination_name}` : '—'}
                        </td>
                        <td>৳{r.fare_final ?? r.fare_estimate ?? '—'}</td>
                        <td><span className={`admin-badge ${r.status || 'neutral'}`}>{r.status || '—'}</span></td>
                        <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab: Rides */}
      {tab === 'rides' && (
        <div>
          <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
            <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
              <div className="admin-stat-header"><span className="admin-stat-label">Total</span><span className="admin-stat-icon">🛺</span></div>
              <div className="admin-stat-value">{rides.length}</div>
            </div>
            <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
              <div className="admin-stat-header"><span className="admin-stat-label">Completed</span><span className="admin-stat-icon">✅</span></div>
              <div className="admin-stat-value">{completedRides.length}</div>
            </div>
            <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
              <div className="admin-stat-header"><span className="admin-stat-label">Cancelled</span><span className="admin-stat-icon">❌</span></div>
              <div className="admin-stat-value">{cancelledRides.length}</div>
            </div>
            <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
              <div className="admin-stat-header"><span className="admin-stat-label">Revenue</span><span className="admin-stat-icon">💰</span></div>
              <div className="admin-stat-value">৳{completedRides.reduce((s, r) => s + (r.fare_final ?? r.fare_estimate ?? 0), 0).toLocaleString()}</div>
            </div>
          </div>

          {/* Filters and Sort Controls */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Search</label>
              <input
                type="text"
                placeholder="Search by ride ID or rider name..."
                value={ridesSearchQuery}
                onChange={(e) => setRidesSearchQuery(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Status Filter</label>
              <select
                value={ridesStatusFilter}
                onChange={(e) => setRidesStatusFilter(e.target.value)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
              >
                <option value="all">All Statuses</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
                <option value="ongoing">Ongoing</option>
                <option value="pending">Pending</option>
              </select>
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>Sort By</label>
              <select
                value={ridesSortBy}
                onChange={(e) => setRidesSortBy(e.target.value as any)}
                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
              >
                <option value="date-desc">Newest First</option>
                <option value="date-asc">Oldest First</option>
                <option value="status">By Status</option>
              </select>
            </div>
          </div>

          <div style={{ maxHeight: 480, overflowY: 'auto', borderRadius: 10, border: '1px solid var(--border)' }}>
            <table className="admin-table" style={{ border: 'none', borderRadius: 0 }}>
              <thead>
                <tr><th>Ref</th><th>Rider</th><th>Pickup</th><th>Destination</th><th>Fare</th><th>Driver⭐</th><th>Rider⭐</th><th>Status</th><th>Date</th><th>Docs</th></tr>
              </thead>
              <tbody>
                {filteredAndSortedRides.length === 0 ? (
                  <tr><td colSpan={10} style={{ textAlign: 'center', padding: 24, color: 'var(--text-sub)' }}>
                    {rides.length === 0 ? 'No rides found' : 'No rides match your filters'}
                  </td></tr>
                ) : filteredAndSortedRides.map(r => (
                  <tr key={r.id} onClick={() => viewRideDetail(r.id)} style={{ cursor: 'pointer' }}>
                    <td>{r.ride_ref || r.id?.slice(0, 8)}</td>
                    <td>{r.rider_name || '—'}</td>
                    <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.pickup_name || '—'}</td>
                    <td style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.destination_name || '—'}</td>
                    <td>৳{r.fare_final ?? r.fare_estimate ?? '—'}</td>
                    <td>{r.driver_rating ? `⭐ ${(r.driver_rating).toFixed(1)}` : '—'}</td>
                    <td>{r.rider_rating ? `⭐ ${(r.rider_rating).toFixed(1)}` : '—'}</td>
                    <td><span className={`admin-badge ${r.status || 'neutral'}`}>{r.status || '—'}</span></td>
                    <td>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                    <td style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
                      <button
                        className="admin-btn info"
                        onClick={() => downloadRideInfoPDF(r)}
                        style={{ padding: '4px 8px', fontSize: 12 }}
                        title="Download as PDF"
                      >
                        📄 PDF
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab: Ride Detail */}
      {tab === 'ride-detail' && viewingRideId && (
        <AdminRideDetail
          rideId={viewingRideId}
          onBack={() => setTab('rides')}
        />
      )}

      {/* Tab: Vehicles */}
      {tab === 'vehicles' && (
        <div>
          {loading && <div style={{ padding: 20, textAlign: 'center', color: 'var(--text-sub)' }}>Loading vehicles...</div>}
          {!loading && (
            <>
              {vehicleMsg && <div style={{ marginBottom: 12, padding: 12, borderRadius: 6, background: vehicleMsg.includes('failed') || vehicleMsg.includes('fail') ? '#fee2e2' : '#dbeafe', color: vehicleMsg.includes('failed') || vehicleMsg.includes('fail') ? 'var(--danger)' : 'var(--primary)', fontWeight: 600 }}>{vehicleMsg}</div>}
              {error && <div style={{ marginBottom: 12, padding: 12, borderRadius: 6, background: '#fee2e2', color: 'var(--danger)', fontWeight: 600 }}>Error: {error}</div>}
              
              <div style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ margin: 0, fontSize: 18, fontWeight: 600 }}>Vehicles ({vehicles.length})</h3>
                {!addingVehicle ? (
                  <button className="admin-btn success" onClick={startAddVehicle}>+ Add Vehicle</button>
                ) : (
                  <button className="admin-btn" onClick={() => { setAddingVehicle(false); setVehicleForm({}) }}>Cancel Add</button>
                )}
              </div>

          {addingVehicle && (
            <div className="admin-card" style={{ marginBottom: 16 }}>
              <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Add Vehicle</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16 }}>
                {([
                  ['vehicle_type', 'Type'],
                  ['vehicle_model', 'Model'],
                  ['vehicle_plate', 'Plate No.'],
                  ['year', 'Year'],
                  ['color', 'Color'],
                  ['capacity', 'Capacity'],
                  ['registration_number', 'Reg. No.'],
                  ['engine_number', 'Engine/Chassis'],
                ] as [keyof Vehicle, string][]).map(([key, label]) => (
                  <div key={key} style={fieldStyle}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      style={inputStyle}
                      value={(vehicleForm[key] as string) || ''}
                      onChange={e => setVehicleForm(f => ({ ...f, [key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>

              <div style={{ ...fieldStyle, marginBottom: 16 }}>
                <label style={labelStyle}>Notes</label>
                <textarea
                  style={{ ...inputStyle, minHeight: 72, resize: 'vertical' }}
                  value={(vehicleForm.notes as string) || ''}
                  onChange={e => setVehicleForm(f => ({ ...f, notes: e.target.value }))}
                />
              </div>

              <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 0.5 }}>Vehicle Photos</h5>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                {([
                  ['vehicle_front_image', 'Front Photo'],
                  ['vehicle_rear_image', 'Rear Photo'],
                  ['vehicle_left_image', 'Left Photo'],
                  ['vehicle_right_image', 'Right Photo'],
                ] as [keyof Vehicle, string][]).map(([key, label]) => (
                  <div key={key} style={fieldStyle}>
                    <label style={labelStyle}>{label}</label>
                    {(vehicleForm[key] as string) ? (
                      <img src={vehicleForm[key] as string} alt={label} style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                    ) : (
                      <div style={{ height: 96, borderRadius: 8, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontSize: 12 }}>No photo</div>
                    )}
                    <label className="admin-btn" style={{ padding: '6px 10px', fontSize: 12, textAlign: 'center', margin: '4px 0 0 0' }}>
                      📸 Upload
                      <input
                        type="file"
                        accept="image/*"
                        style={{ display: 'none' }}
                        onChange={e => {
                          handleVehicleImageUpload(key, e.target.files?.[0])
                          e.currentTarget.value = ''
                        }}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button className="admin-btn success" disabled={vehicleSaving} onClick={addVehicle} style={{ width: '100%' }}>
                {vehicleSaving ? 'Adding…' : '✓ Add Vehicle'}
              </button>
            </div>
          )}

          {vehicles.length === 0 ? (
            <div className="admin-card" style={{ color: 'var(--text-sub)', textAlign: 'center', padding: 40, background: '#f9fafb' }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🚗</div>
              <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>No vehicles registered</div>
              <div style={{ fontSize: 13, opacity: 0.7 }}>Click "Add Vehicle" to register a vehicle for this driver</div>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
              {vehicles && vehicles.length > 0 && vehicles.map(v => (
                <div key={v.id} className="admin-card">
                  {/* Card header — title/badge + action buttons */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10, gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{v.vehicle_model || 'Vehicle'}</span>
                      {v.is_primary && (
                        <span className="admin-badge active" style={{ fontSize: 11 }}>Primary</span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      {!v.is_primary && (
                        <button className="admin-btn" style={{ padding: '4px 10px', fontSize: 12, background: 'var(--primary)', color: '#fff' }}
                          onClick={() => setPrimaryVehicle(v.id)}>
                          ★ Set Active
                        </button>
                      )}
                      <button className="admin-btn" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => editingVehicleId === v.id ? setEditingVehicleId(null) : startEditVehicle(v)}>
                        {editingVehicleId === v.id ? 'Cancel' : '✏️ Edit'}
                      </button>
                      <button className="admin-btn danger" style={{ padding: '4px 10px', fontSize: 12 }}
                        onClick={() => deleteVehicle(v.id)}>
                        🗑️
                      </button>
                    </div>
                  </div>

                  {editingVehicleId !== v.id && (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                      {([
                        ['Front', v.vehicle_front_image],
                        ['Rear', v.vehicle_rear_image],
                        ['Left', v.vehicle_left_image],
                        ['Right', v.vehicle_right_image],
                      ] as [string, string | undefined][]).map(([label, src]) => src ? (
                        <div key={label} style={{ display: 'grid', gap: 4 }}>
                          <img src={src} alt={`${label} view`} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
                          <div style={{ fontSize: 11, color: 'var(--text-sub)', textAlign: 'center' }}>{label}</div>
                        </div>
                      ) : null)}
                    </div>
                  )}

                  {editingVehicleId === v.id ? (
                    <div style={{ backgroundColor: '#fafbfc', padding: 16, borderRadius: 8, border: '2px solid var(--primary)', marginTop: 12 }}>
                      <h4 style={{ margin: '0 0 16px 0', fontSize: 15, fontWeight: 700, color: '#000' }}>✏️ Edit Vehicle</h4>
                      
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 20 }}>
                        {(['vehicle_type', 'vehicle_model', 'vehicle_plate', 'year', 'color', 'capacity', 'registration_number', 'engine_number'] as const).map((key) => {
                          const labels: Record<string, string> = {
                            vehicle_type: 'Type',
                            vehicle_model: 'Model',
                            vehicle_plate: 'Plate No.',
                            year: 'Year',
                            color: 'Color',
                            capacity: 'Capacity',
                            registration_number: 'Reg. No.',
                            engine_number: 'Engine/Chassis',
                          }
                          return (
                            <div key={key}>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: 4 }}>{labels[key]}</label>
                              <input
                                style={inputStyle}
                                value={(vehicleForm[key as keyof typeof vehicleForm] as string) || ''}
                                onChange={e => setVehicleForm(f => ({ ...f, [key]: e.target.value }))}
                              />
                            </div>
                          )
                        })}
                      </div>

                      <div style={{ marginBottom: 20 }}>
                        <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: 4 }}>Notes</label>
                        <textarea
                          style={{ ...inputStyle, minHeight: 80, resize: 'vertical', width: '100%' }}
                          value={(vehicleForm.notes as string) || ''}
                          onChange={e => setVehicleForm(f => ({ ...f, notes: e.target.value }))}
                        />
                      </div>

                      <h5 style={{ margin: '0 0 12px 0', fontSize: 12, fontWeight: 600, color: '#000', textTransform: 'uppercase' }}>Vehicle Photos</h5>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: 12, marginBottom: 20 }}>
                        {(['vehicle_front_image', 'vehicle_rear_image', 'vehicle_left_image', 'vehicle_right_image'] as const).map((key) => {
                          const labels: Record<string, string> = {
                            vehicle_front_image: 'Front',
                            vehicle_rear_image: 'Rear',
                            vehicle_left_image: 'Left',
                            vehicle_right_image: 'Right',
                          }
                          return (
                            <div key={key}>
                              <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: 4 }}>{labels[key]}</label>
                              {(vehicleForm[key as keyof typeof vehicleForm] as string) ? (
                                <img src={vehicleForm[key as keyof typeof vehicleForm] as string} alt={`${labels[key]} view`} style={{ width: '100%', height: 80, objectFit: 'cover', borderRadius: 6, border: '1px solid var(--border)' }} />
                              ) : (
                                <div style={{ height: 80, borderRadius: 6, border: '2px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontSize: 11 }}>No photo</div>
                              )}
                              <label style={{ display: 'block', padding: '6px 8px', fontSize: 11, textAlign: 'center', borderRadius: 4, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500, marginTop: 4 }}>
                                📸 Upload
                                <input
                                  type="file"
                                  accept="image/*"
                                  style={{ display: 'none' }}
                                  onChange={e => {
                                    handleVehicleImageUpload(key as keyof Vehicle, e.target.files?.[0])
                                    e.currentTarget.value = ''
                                  }}
                                />
                              </label>
                            </div>
                          )
                        })}
                      </div>

                      <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
                        <button style={{ flex: 1, padding: '10px 16px', background: 'var(--primary)', color: '#fff', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }} disabled={vehicleSaving} onClick={saveVehicle}>
                          {vehicleSaving ? '⏳ Saving…' : '✓ Save Changes'}
                        </button>
                        <button style={{ flex: 1, padding: '10px 16px', background: '#e5e7eb', color: '#374151', border: 'none', borderRadius: 6, fontWeight: 600, cursor: 'pointer' }} onClick={() => setEditingVehicleId(null)}>
                          Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gap: 6 }}>
                      {([
                        ['Type', v.vehicle_type],
                        ['Model', v.vehicle_model],
                        ['Plate', v.vehicle_plate],
                        ['Color', v.color],
                        ['Capacity', v.capacity],
                        ['Reg. No.', v.registration_number],
                        ['Year', v.year],
                        ['Engine/Chassis', v.engine_number],
                        ['Notes', v.notes],
                      ] as [string, string | undefined][]).map(([label, val]) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, padding: '3px 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ color: 'var(--text-sub)' }}>{label}</span>
                          <span style={{ fontWeight: 600 }}>{val || '—'}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
            </>
          )}
        </div>
      )}

      {/* Tab: Profile */}
      {tab === 'profile' && (
        <div>
          {/* Profile images */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 16, marginBottom: 16 }}>
            <div className="admin-card">
              <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Profile Photo</h4>
              {driver.profile_image ? (
                <img src={driver.profile_image} alt="profile" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10 }} />
              ) : (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: 10, color: 'var(--text-sub)' }}>No photo</div>
              )}
              <label style={{ display: 'block', marginTop: 10, cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = async () => {
                      const dataUrl = String(reader.result)
                      try {
                        const res: any = await api.drivers.updateById(driverId, { profile_image: dataUrl })
                        setDriver(d => d ? { ...d, profile_image: res.user?.profile_image || dataUrl } : d)
                        setProfileMsg('Photo updated')
                      } catch (err: any) {
                        setProfileMsg(err.message || 'Photo upload failed')
                      }
                    }
                    reader.readAsDataURL(file)
                    e.target.value = ''
                  }}
                />
                <span
                  className="admin-btn"
                  style={{
                    padding: '9px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    transition: 'transform 140ms ease, filter 140ms ease, box-shadow 140ms ease',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.filter = 'brightness(1.03)'
                    e.currentTarget.style.boxShadow = '0 7px 16px rgba(15, 23, 42, 0.18)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.filter = 'none'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.12)'
                  }}
                >
                  <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 16V5" />
                      <path d="m7 10 5-5 5 5" />
                      <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
                    </svg>
                  </span>
                  {driver.profile_image ? 'Change Profile Photo' : 'Upload Profile Photo'}
                </span>
              </label>
            </div>
            <div className="admin-card">
              <h4 style={{ margin: '0 0 12px', fontSize: 15 }}>Driver License Image</h4>
              {driver.driver_license_image ? (
                <img src={driver.driver_license_image} alt="license" style={{ width: '100%', maxHeight: 240, objectFit: 'cover', borderRadius: 10 }} />
              ) : (
                <div style={{ height: 120, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--surface)', borderRadius: 10, color: 'var(--text-sub)' }}>No license image</div>
              )}
              <label style={{ display: 'block', marginTop: 10, cursor: 'pointer' }}>
                <input
                  type="file"
                  accept="image/*"
                  style={{ display: 'none' }}
                  onChange={async e => {
                    const file = e.target.files?.[0]
                    if (!file) return
                    const reader = new FileReader()
                    reader.onload = async () => {
                      const dataUrl = String(reader.result)
                      try {
                        const res: any = await api.drivers.updateById(driverId, { driver_license_image: dataUrl })
                        setDriver(d => d ? { ...d, driver_license_image: res.user?.driver_license_image || dataUrl } : d)
                        setProfileMsg('License image updated')
                      } catch (err: any) {
                        setProfileMsg(err.message || 'Image upload failed')
                      }
                    }
                    reader.readAsDataURL(file)
                    e.target.value = ''
                  }}
                />
                <span
                  className="admin-btn"
                  style={{
                    padding: '9px 14px',
                    fontSize: 12,
                    fontWeight: 700,
                    background: 'var(--primary)',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    width: '100%',
                    boxSizing: 'border-box',
                    textTransform: 'uppercase',
                    letterSpacing: 0.4,
                    transition: 'transform 140ms ease, filter 140ms ease, box-shadow 140ms ease',
                    boxShadow: '0 2px 6px rgba(15, 23, 42, 0.12)',
                  }}
                  onMouseEnter={e => {
                    e.currentTarget.style.transform = 'translateY(-1px)'
                    e.currentTarget.style.filter = 'brightness(1.03)'
                    e.currentTarget.style.boxShadow = '0 7px 16px rgba(15, 23, 42, 0.18)'
                  }}
                  onMouseLeave={e => {
                    e.currentTarget.style.transform = 'translateY(0)'
                    e.currentTarget.style.filter = 'none'
                    e.currentTarget.style.boxShadow = '0 2px 6px rgba(15, 23, 42, 0.12)'
                  }}
                >
                  <span aria-hidden="true" style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 22, height: 22, borderRadius: 999, background: 'rgba(255,255,255,0.18)', border: '1px solid rgba(255,255,255,0.28)', flexShrink: 0 }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 16V5" />
                      <path d="m7 10 5-5 5 5" />
                      <path d="M20 16.5v2a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 18.5v-2" />
                    </svg>
                  </span>
                  {driver.driver_license_image ? 'Change License Image' : 'Upload License Image'}
                </span>
              </label>
            </div>
          </div>

          {/* Edit form */}
          <div className="admin-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
              <h4 style={{ margin: 0, fontSize: 15 }}>Profile Details</h4>
              {!editingProfile ? (
                <button className="admin-btn" style={{ padding: '6px 16px' }} onClick={startEditProfile}>✏️ Edit</button>
              ) : (
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <button className="admin-btn" style={{ padding: '6px 16px' }} onClick={() => { setEditingProfile(false); setOtpStep('idle'); setOtpCode(''); setHasSensitiveChange(false) }}>Cancel</button>
                  <button className="admin-btn success" style={{ padding: '6px 16px' }} disabled={profileSaving || otpSending} onClick={saveProfile}>
                    {otpSending ? 'Sending OTP…' : profileSaving ? 'Saving…' : 'Save Changes'}
                  </button>
                </div>
              )}
            </div>

            {profileMsg && (
              <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: profileMsg.includes('ailed') ? '#fff0f0' : '#f0faf5', color: profileMsg.includes('ailed') ? 'var(--danger)' : 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
                {profileMsg}
              </div>
            )}

            {!editingProfile ? (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px 24px' }}>
                {[
                  ['Phone', driver.phone],
                  ['Name (EN)', driver.name],
                  ['Name (BN)', driver.name_bn],
                  ['NID No.', driver.nid_number],
                  ['License No.', driver.driver_license],
                  ['Area', driver.area],
                  ['District', driver.district],
                  ['Upazilla', driver.upazilla],
                  ['House No.', driver.house_no],
                  ['Road No.', driver.road_no],
                  ['Landmark', driver.landmark],
                  ['Post Office', driver.post_office],
                  ['Status', driver.status],
                  ['Online', driver.is_online ? 'Yes' : 'No'],
                  ['Member Since', driver.created_at ? new Date(driver.created_at).toLocaleDateString() : '—'],
                ].map(([label, value]) => (
                  <div key={label as string} style={{ padding: '6px 0', borderBottom: '1px solid var(--border)' }}>
                    <div style={{ fontSize: 11, color: 'var(--text-sub)', marginBottom: 2 }}>{label}</div>
                    <div style={{ fontWeight: 600 }}>{value || '—'}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12 }}>
                {([
                  ['name', 'Name (EN)', 'text'],
                  ['name_bn', 'Name (BN)', 'text'],
                  ['phone', 'Phone', 'text'],
                  ['nid_number', 'NID No.', 'text'],
                  ['driver_license', 'License No.', 'text'],
                  ['area', 'Area', 'text'],
                  ['house_no', 'House No.', 'text'],
                  ['road_no', 'Road No.', 'text'],
                  ['landmark', 'Landmark', 'text'],
                ] as [keyof DriverUser, string, string][]).map(([key, label]) => (
                  <div key={key} style={fieldStyle}>
                    <label style={labelStyle}>{label}</label>
                    <input
                      style={inputStyle}
                      value={(profileForm[key] as string) || ''}
                      onChange={e => {
                        setProfileForm(f => ({ ...f, [key]: e.target.value }))
                        if (['name', 'phone', 'nid_number'].includes(key as string)) setHasSensitiveChange(true)
                      }}
                    />
                  </div>
                ))}
                <div style={fieldStyle}>
                  <label style={labelStyle}>{isBangla ? 'জেলা (District)' : 'District'}</label>
                  <select
                    style={inputStyle}
                    value={profileForm.district || ''}
                    onChange={e => setProfileForm(f => ({ ...f, district: e.target.value, upazilla: '', post_office: '' }))}
                  >
                    <option value=''>{isBangla ? 'জেলা নির্বাচন করুন' : 'Select District'}</option>
                    {isBangla
                      ? BD_DISTRICTS_BN.map(d => <option key={d.value} value={d.value}>{d.label} ({d.value})</option>)
                      : Object.keys(BD_LOCATIONS).sort().map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{isBangla ? 'উপজেলা (Upazilla)' : 'Upazilla'}</label>
                  <select
                    style={inputStyle}
                    value={profileForm.upazilla || ''}
                    onChange={e => setProfileForm(f => ({ ...f, upazilla: e.target.value, post_office: '' }))}
                    disabled={!profileForm.district}
                  >
                    <option value=''>{isBangla ? 'উপজেলা নির্বাচন করুন' : 'Select Upazilla'}</option>
                    {isBangla
                      ? (profileForm.district ? (BD_LOCATIONS_BN[profileForm.district] || []) : []).map(u => <option key={u.value} value={u.value}>{u.label} ({u.value})</option>)
                      : (profileForm.district ? (BD_LOCATIONS[profileForm.district] || []) : []).map(u => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>{isBangla ? 'পোস্ট অফিস (Post Office)' : 'Post Office'}</label>
                  <select
                    style={inputStyle}
                    value={profileForm.post_office || ''}
                    onChange={e => setProfileForm(f => ({ ...f, post_office: e.target.value }))}
                    disabled={!profileForm.upazilla}
                  >
                    <option value=''>{isBangla ? 'পোস্ট অফিস নির্বাচন করুন' : 'Select Post Office'}</option>
                    {isBangla
                      ? (profileForm.upazilla ? (POST_OFFICES_BN[profileForm.upazilla] || []) : []).map(po => <option key={po.value} value={po.value}>{po.label}</option>)
                      : (profileForm.upazilla ? (POST_OFFICES[profileForm.upazilla] || []) : []).map(po => <option key={`${po.name} (${po.code})`} value={`${po.name} (${po.code})`}>{po.name} ({po.code})</option>)}
                  </select>
                </div>
                <div style={fieldStyle}>
                  <label style={labelStyle}>Status</label>
                  <select
                    style={inputStyle}
                    value={profileForm.status || 'active'}
                    onChange={e => setProfileForm(f => ({ ...f, status: e.target.value }))}
                  >
                    <option value="pending">Pending</option>
                    <option value="active">Active</option>
                    <option value="suspended">Suspended</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OTP Modal */}
      {otpStep === 'pending' && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <div className="admin-card" style={{ width: 340, padding: 32, borderRadius: 16, boxShadow: '0 8px 40px rgba(0,0,0,0.22)', textAlign: 'center' }}>
            <div style={{ fontSize: 36, marginBottom: 8 }}>🔒</div>
            <h3 style={{ margin: '0 0 6px', fontSize: 18 }}>Verify Identity</h3>
            <p style={{ margin: '0 0 20px', color: 'var(--text-sub)', fontSize: 13 }}>
              An OTP has been sent to the driver's phone<br />
              <strong>{driver?.phone}</strong>. Enter it below to confirm changes.
            </p>
            <input
              style={{ width: '100%', boxSizing: 'border-box', padding: '12px 16px', fontSize: 22, letterSpacing: 8, textAlign: 'center', fontWeight: 700, border: '2px solid var(--primary)', borderRadius: 10, outline: 'none', marginBottom: 16 }}
              placeholder="• • • •"
              maxLength={6}
              value={otpCode}
              onChange={e => setOtpCode(e.target.value.replace(/\D/g, ''))}
              onKeyDown={e => e.key === 'Enter' && verifyAndSave()}
              autoFocus
            />
            {profileMsg && (
              <div style={{ marginBottom: 14, padding: '8px 12px', borderRadius: 8, background: profileMsg.includes('ailed') || profileMsg.includes('nvalid') ? '#fff0f0' : '#f0faf5', color: profileMsg.includes('ailed') || profileMsg.includes('nvalid') ? 'var(--danger)' : 'var(--primary)', fontWeight: 600, fontSize: 13 }}>
                {profileMsg}
              </div>
            )}
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <button className="admin-btn" style={{ flex: 1, padding: '10px 0' }} onClick={() => { setOtpStep('idle'); setOtpCode(''); setProfileMsg('') }}>
                Cancel
              </button>
              <button className="admin-btn success" style={{ flex: 1, padding: '10px 0' }} disabled={profileSaving} onClick={verifyAndSave}>
                {profileSaving ? 'Saving…' : '✓ Confirm'}
              </button>
            </div>
            <button
              style={{ marginTop: 14, background: 'none', border: 'none', color: 'var(--primary)', fontSize: 13, cursor: 'pointer', textDecoration: 'underline' }}
              onClick={async () => {
                setOtpSending(true)
                try {
                  await api.auth.sendOtp(driver!.phone!, 'driver')
                  setOtpCode('')
                  setProfileMsg('OTP resent.')
                } catch (e: any) {
                  setProfileMsg(e.message || 'Failed to resend OTP')
                } finally {
                  setOtpSending(false)
                }
              }}
              disabled={otpSending}
            >
              {otpSending ? 'Sending…' : 'Resend OTP'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

