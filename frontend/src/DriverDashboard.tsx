import React, { useEffect, useMemo, useRef, useState } from 'react'
import api, { clearAuthToken } from './api'
import AdminRideDetail from './admin/AdminRideDetail'
import { BD_LOCATIONS, POST_OFFICES } from './bd-post-office-master'
import {
  BD_DISTRICTS_BN,
  BD_LOCATIONS_BN,
  POST_OFFICES_BN,
  localizeDistrictName,
  localizeUpazillaName,
  localizePostOfficeLabel
} from './bd-post-office-master-bn'

type DriverTabKey = 'analytics' | 'rides' | 'vehicles' | 'ratings' | 'earnings' | 'profile'

type EarningsSummary = {
  wallet: { balance: number; total_earned: number; total_withdrawn: number }
  tax_breakdown: { gross_earned: number; platform_fee: number; tax_vat: number; net_earned: number; ride_count: number }
}

type DriverTransaction = {
  id: string
  type: string
  amount: string | number
  direction: 'credit' | 'debit'
  gateway?: string | null
  recipient_number?: string | null
  note?: string | null
  status: string
  created_at: string
}

type PaymentRecipient = {
  id: string
  gateway: string
  number: string
  label?: string | null
  verified: boolean
  created_at: string
}

type DriverUser = {
  id: string
  role?: string
  name?: string
  name_bn?: string
  phone?: string
  nid_number?: string
  status?: string
  is_online?: boolean
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
  profile_image?: string | null
  driver_license_image?: string | null
  rating_sum?: number
  rating_count?: number
  total_rides?: number
  total_earned?: number
}

type ChartDataPoint = { label: string; amount: number; rides: number }

type Ride = {
  id: string
  ride_ref?: string
  status?: string
  pickup_name?: string
  pickup_lat?: number | null
  pickup_lng?: number | null
  destination_name?: string
  destination_lat?: number | null
  destination_lng?: number | null
  vehicle_type?: string | null
  fare_final?: number | null
  fare_estimate?: number | null
  payment_method?: string | null
  completed_at?: string | null
  accepted_at?: string | null
  started_at?: string | null
  created_at?: string
  driver_id?: string | null
  rider_id?: string | null
  rider_name?: string | null
  rider_phone?: string | null
  driver_rating?: number | null
  rider_rating?: number | null
  rating_driving?: number | null
  rating_behavior?: number | null
  rating_cleanliness?: number | null
  rating_comment?: string | null
  rating_rider_behavior?: number | null
  rating_rider_wait_time?: number | null
  rating_rider_comment?: string | null
  notes?: string | null
}

type DriverRatingDispute = {
  id: string
  ride_ref?: string
  current_rating?: number | null
  reason?: string
  status?: string
  admin_note?: string | null
  created_at?: string
}

type DriverVehicle = {
  id: string
  vehicle_type: string
  vehicle_model?: string | null
  vehicle_plate: string
  color?: string | null
  capacity?: string | null
  registration_number?: string | null
  engine_number?: string | null
  notes?: string | null
  vehicle_front_image?: string | null
  vehicle_rear_image?: string | null
  vehicle_left_image?: string | null
  vehicle_right_image?: string | null
  is_primary?: boolean
  created_at?: string
}

type VehiclePhotoKey = 'vehicle_front_image' | 'vehicle_rear_image' | 'vehicle_left_image' | 'vehicle_right_image'

type ProfileForm = {
  name_bn: string
  area: string
  district: string
  upazilla: string
  house_no: string
  road_no: string
  landmark: string
  post_office: string
  profile_image: string
  driver_license_image: string
}

type VehicleForm = {
  vehicle_type: string
  vehicle_model: string
  vehicle_plate: string
  driver_license: string
  color: string
  capacity: string
  registration_number: string
  engine_chassis_number: string
  notes: string
  vehicle_front_image: string
  vehicle_rear_image: string
  vehicle_left_image: string
  vehicle_right_image: string
}

function asArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[]
  if (value && typeof value === 'object' && Array.isArray((value as { data?: unknown[] }).data)) {
    return ((value as { data: T[] }).data) || []
  }
  return []
}

function toMoney(value: number | null | undefined): string {
  if (typeof value !== 'number' || Number.isNaN(value)) return '—'
  return `৳${Math.round(value).toLocaleString('en-BD')}`
}

export default function DriverDashboard(): JSX.Element {
  const [tab, setTab] = useState<DriverTabKey>('analytics')
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<DriverUser | null>(null)
  const [rides, setRides] = useState<Ride[]>([])
  const [selectedRide, setSelectedRide] = useState<Ride | null>(null)
  const [ridesFilter, setRidesFilter] = useState<string>('all')
  const [ridesSearch, setRidesSearch] = useState('')
  const [ridesSortBy, setRidesSortBy] = useState<'date-desc' | 'date-asc' | 'fare-desc' | 'fare-asc'>('date-desc')
  const [ratingsSearch, setRatingsSearch] = useState('')
  const [ratingsSortBy, setRatingsSortBy] = useState<'date-desc' | 'date-asc' | 'score-desc' | 'score-asc'>('date-desc')
  const [txnSearch, setTxnSearch] = useState('')
  const [txnSortBy, setTxnSortBy] = useState<'date-desc' | 'date-asc' | 'amount-desc' | 'amount-asc'>('date-desc')
  const [ratingForm, setRatingForm] = useState({ overall: 0, behavior: 0, wait_time: 0, comment: '' })
  const [ratingSubmitting, setRatingSubmitting] = useState(false)
  const [ratingMsg, setRatingMsg] = useState('')
  const [form, setForm] = useState<ProfileForm>({
    name_bn: '',
    area: '',
    district: '',
    upazilla: '',
    house_no: '',
    road_no: '',
    landmark: '',
    post_office: '',
    profile_image: '',
    driver_license_image: ''
  })
  const [vehicleForm, setVehicleForm] = useState<VehicleForm>({
    vehicle_type: '',
    vehicle_model: '',
    vehicle_plate: '',
    driver_license: '',
    color: '',
    capacity: '',
    registration_number: '',
    engine_chassis_number: '',
    notes: '',
    vehicle_front_image: '',
    vehicle_rear_image: '',
    vehicle_left_image: '',
    vehicle_right_image: ''
  })
  const [vehicles, setVehicles] = useState<DriverVehicle[]>([])
  const [showVehicleForm, setShowVehicleForm] = useState(false)
  const [editingVehicle, setEditingVehicle] = useState<DriverVehicle | null>(null)
  const [activatingVehicleId, setActivatingVehicleId] = useState('')
  const [deletingVehicleId, setDeletingVehicleId] = useState('')
  const [pendingDeleteVehicle, setPendingDeleteVehicle] = useState<DriverVehicle | null>(null)
  const [galleryVehicle, setGalleryVehicle] = useState<DriverVehicle | null>(null)
  const [galleryPhotoKey, setGalleryPhotoKey] = useState<VehiclePhotoKey>('vehicle_front_image')
  const [isEditingProfile, setIsEditingProfile] = useState(false)
  const [saveState, setSaveState] = useState('')
  const [photoUploading, setPhotoUploading] = useState(false)
  const [licenseUploading, setLicenseUploading] = useState(false)
  const [ratingDisputeRideRef, setRatingDisputeRideRef] = useState('')
  const [ratingDisputeReason, setRatingDisputeReason] = useState('')
  const [ratingDisputeState, setRatingDisputeState] = useState('')
  const [disputes, setDisputes] = useState<DriverRatingDispute[]>([])

  // Earnings tab state
  const [earningSummary, setEarningSummary] = useState<EarningsSummary | null>(null)
  const [transactions, setTransactions] = useState<DriverTransaction[]>([])
  const [recipients, setRecipients] = useState<PaymentRecipient[]>([])
  const [earningsLoading, setEarningsLoading] = useState(false)
  // Add recipient form
  const [recipientGateway, setRecipientGateway] = useState<'bkash' | 'nagad'>('bkash')
  const [recipientNumber, setRecipientNumber] = useState('')
  const [recipientLabel, setRecipientLabel] = useState('')
  const [recipientOtp, setRecipientOtp] = useState('')
  const [recipientStep, setRecipientStep] = useState<'form' | 'otp' | null>(null)
  const [recipientState, setRecipientState] = useState('')
  const [deletingRecipientId, setDeletingRecipientId] = useState('')
  const [inlineVerifyId, setInlineVerifyId] = useState('')
  const [inlineVerifyOtp, setInlineVerifyOtp] = useState('')
  const [inlineVerifyState, setInlineVerifyState] = useState('')
  const [resendingOtpId, setResendingOtpId] = useState('')
  // Withdraw form
  const [withdrawRecipientId, setWithdrawRecipientId] = useState('')
  const [withdrawAmount, setWithdrawAmount] = useState('')
  const [withdrawState, setWithdrawState] = useState('')
  const [showWithdrawForm, setShowWithdrawForm] = useState(false)
  const [withdrawOtpSent, setWithdrawOtpSent] = useState(false)
  const [withdrawOtp, setWithdrawOtp] = useState('')
  const [withdrawOtpLoading, setWithdrawOtpLoading] = useState(false)
  const [isBangla, setIsBangla] = useState(() => {
    try {
      return localStorage.getItem('oijaba_lang') === 'bn' || document.documentElement.lang === 'bn'
    } catch {
      return false
    }
  })
  const vehicleFormAnchorRef = useRef<HTMLDivElement | null>(null)
  const onlineTimerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  const [isOnline, setIsOnline] = useState(false)
  const [onlineSeconds, setOnlineSeconds] = useState(0)
  const [chartPeriod, setChartPeriod] = useState<'daily' | 'weekly' | 'monthly'>('weekly')
  const [chartData, setChartData] = useState<ChartDataPoint[]>([])

  useEffect(() => {
    function syncLanguage() {
      try {
        setIsBangla(localStorage.getItem('oijaba_lang') === 'bn' || document.documentElement.lang === 'bn')
      } catch {
        setIsBangla(document.documentElement.lang === 'bn')
      }
    }

    window.addEventListener('storage', syncLanguage)
    window.addEventListener('oijaba-language-changed', syncLanguage as EventListener)
    return () => {
      window.removeEventListener('storage', syncLanguage)
      window.removeEventListener('oijaba-language-changed', syncLanguage as EventListener)
    }
  }, [])

  useEffect(() => {
    let mounted = true

    async function loadDashboard() {
      setLoading(true)
      try {
        const [meRes, ridesRes, disputesRes, summaryRes] = await Promise.all([
          api.auth.me(),
          api.rides.list(),
          api.drivers.listRatingDisputes(),
          api.earnings.summary().catch(() => null)
        ])
        if (!mounted) return

        const meUser = (meRes as any)?.user as DriverUser
        const ridesResAny = ridesRes as any
        const allRides: Ride[] = Array.isArray(ridesResAny?.rides)
          ? ridesResAny.rides
          : asArray<Ride>(ridesRes)
        const driverRides = allRides.filter((ride) => ride.driver_id === meUser?.id)
        const driverDisputes = Array.isArray((disputesRes as any)?.disputes) ? (disputesRes as any).disputes : []

        setUser(meUser)
        setIsOnline(!!(meUser as any)?.is_online)
        setRides(driverRides)
        setDisputes(driverDisputes)
        setVehicles([])
        if (summaryRes) setEarningSummary((summaryRes as any) ?? null)
        setForm({
          name_bn: meUser?.name_bn || '',
          area: meUser?.area || '',
          district: meUser?.district || '',
          upazilla: meUser?.upazilla || '',
          house_no: meUser?.house_no || '',
          road_no: meUser?.road_no || '',
          landmark: meUser?.landmark || '',
          post_office: meUser?.post_office || '',
          profile_image: meUser?.profile_image || '',
          driver_license_image: meUser?.driver_license_image || ''
        })
        setVehicleForm({
          vehicle_type: meUser?.vehicle_type || '',
          vehicle_model: meUser?.vehicle_model || '',
          vehicle_plate: meUser?.vehicle_plate || '',
          driver_license: meUser?.driver_license || '',
          color: '',
          capacity: '',
          registration_number: '',
          engine_chassis_number: '',
          notes: '',
          vehicle_front_image: '',
          vehicle_rear_image: '',
          vehicle_left_image: '',
          vehicle_right_image: ''
        })

        // Non-blocking vehicle list load: dashboard should still render if this endpoint is unavailable.
        try {
          const vehiclesRes = await api.drivers.listVehicles()
          if (!mounted) return
          const driverVehicles = asArray<DriverVehicle>((vehiclesRes as any)?.vehicles ?? vehiclesRes)
          setVehicles(driverVehicles)
        } catch {
          if (!mounted) return
          setVehicles([])
        }
      } catch (error) {
        if (mounted) {
          const message = error instanceof Error ? error.message : ''
          const isAuthError =
            message.includes('Invalid or expired token') ||
            message.includes('No token provided') ||
            message.toLowerCase().includes('jwt')

          if (isAuthError) clearAuthToken()
          setUser(null)
          setRides([])
          setVehicles([])
        }
      } finally {
        if (mounted) setLoading(false)
      }
    }

    void loadDashboard()

    return () => {
      mounted = false
    }
  }, [])

  useEffect(() => {
    if (tab !== 'earnings') return
    let mounted = true
    async function loadEarnings() {
      setEarningsLoading(true)
      try {
        const [summaryRes, txnRes, recRes] = await Promise.all([
          api.earnings.summary(),
          api.earnings.transactions(),
          api.earnings.listRecipients()
        ])
        if (!mounted) return
        setEarningSummary((summaryRes as any) ?? null)
        const txArr = (txnRes as any)?.transactions ?? txnRes
        setTransactions(Array.isArray(txArr) ? txArr : [])
        const recArr = (recRes as any)?.recipients ?? recRes
        setRecipients(Array.isArray(recArr) ? recArr : [])
      } catch { /* silent */ } finally {
        if (mounted) setEarningsLoading(false)
      }
    }
    void loadEarnings()
    return () => { mounted = false }
  }, [tab])

  // Online timer
  useEffect(() => {
    if (isOnline) {
      onlineTimerRef.current = setInterval(() => setOnlineSeconds((s) => s + 1), 1000)
    } else {
      if (onlineTimerRef.current) clearInterval(onlineTimerRef.current)
      setOnlineSeconds(0)
    }
    return () => { if (onlineTimerRef.current) clearInterval(onlineTimerRef.current) }
  }, [isOnline])

  // Earnings chart data
  useEffect(() => {
    let mounted = true
    async function loadChart() {
      try {
        const res = await api.earnings.chart(chartPeriod)
        if (!mounted) return
        const data = (res as any)?.data
        setChartData(Array.isArray(data) ? data : [])
      } catch { /* silent */ }
    }
    void loadChart()
    return () => { mounted = false }
  }, [chartPeriod])

  function t(en: string, bn: string): string {
    return isBangla ? bn : en
  }

  function formatOnlineTime(secs: number): string {
    const h = Math.floor(secs / 3600)
    const m = Math.floor((secs % 3600) / 60)
    if (h > 0) return `${h}h ${m}m`
    return `${m}m`
  }

  async function toggleOnlineStatus() {
    const next = !isOnline
    setIsOnline(next) // optimistic
    try {
      await api.drivers.setOnlineStatus(next)
    } catch {
      setIsOnline(!next) // rollback on error
    }
  }

  const menuItems: Array<{ key: DriverTabKey; icon: string; label: string; desc: string }> = [
    { key: 'analytics', icon: '📊', label: t('Dashboard', 'ড্যাশবোর্ড'), desc: t('Performance overview', 'পারফরম্যান্স সারাংশ') },
    { key: 'earnings', icon: '💰', label: t('Wallet', 'ওয়ালেট'), desc: t('Wallet & transactions', 'ওয়ালেট এবং লেনদেন') },
    { key: 'rides', icon: '🚕', label: t('Rides', 'রাইড'), desc: t('Trip history and status', 'ট্রিপ ইতিহাস এবং অবস্থা') },
    { key: 'ratings', icon: '⭐', label: t('Ratings', 'রেটিং'), desc: t('Feedback from riders', 'যাত্রীদের মতামত') },
    { key: 'vehicles', icon: '🚗', label: t('Vehicles', 'গাড়ি'), desc: t('Vehicle details', 'গাড়ির তথ্য') },
    { key: 'profile', icon: '👤', label: t('Profile', 'প্রোফাইল'), desc: t('Profile and documents', 'প্রোফাইল এবং নথি') }
  ]

  const avgRating = useMemo(() => {
    const rated = rides.filter((ride) => typeof ride.driver_rating === 'number')
    if (!rated.length) return null
    const total = rated.reduce((sum, ride) => sum + Number(ride.driver_rating || 0), 0)
    return Number((total / rated.length).toFixed(1))
  }, [rides])

  const completedRides = rides.filter((ride) => String(ride.status || '').toLowerCase() === 'completed')
  const completedToday = completedRides.filter((ride) => {
    if (!ride.completed_at) return false
    return new Date(ride.completed_at).toDateString() === new Date().toDateString()
  })
  const todayEarnings = completedToday.reduce((sum, ride) => {
    const value = typeof ride.fare_final === 'number' ? ride.fare_final : ride.fare_estimate
    return sum + (typeof value === 'number' ? value : 0)
  }, 0)
  const totalEarned = completedRides.reduce((sum, ride) => {
    const value = typeof ride.fare_final === 'number' ? ride.fare_final : ride.fare_estimate
    return sum + (typeof value === 'number' ? value : 0)
  }, 0)
  const ratingsCount = rides.filter((ride) => typeof ride.driver_rating === 'number').length
  const rideStatusCounts = {
    completed: rides.filter((ride) => String(ride.status || '').toLowerCase() === 'completed').length,
    cancelled: rides.filter((ride) => String(ride.status || '').toLowerCase() === 'cancelled').length,
    inProgress: rides.filter((ride) => String(ride.status || '').toLowerCase() === 'started').length,
    accepted: rides.filter((ride) => String(ride.status || '').toLowerCase() === 'accepted').length,
    pickup: rides.filter((ride) => String(ride.status || '').toLowerCase() === 'pickup').length,
    searching: rides.filter((ride) => String(ride.status || '').toLowerCase() === 'searching').length
  }
  const weeklyBars = [58, 42, 74, 64, 46, 68, 36]
  const ratingBars = [4, 5, 3, 5, 4]

  const districtOptions = useMemo(
    () => (isBangla
      ? BD_DISTRICTS_BN
      : Object.keys(BD_LOCATIONS).sort().map((dist) => ({ value: dist, label: dist }))),
    [isBangla]
  )

  const upazillaOptions = useMemo(
    () => {
      if (!form.district) return [] as Array<{ value: string; label: string }>
      if (isBangla) return BD_LOCATIONS_BN[form.district] || []
      return (BD_LOCATIONS[form.district] || []).map((upa) => ({ value: upa, label: upa }))
    },
    [form.district, isBangla]
  )

  const postOfficeOptions = useMemo(
    () => {
      if (!form.upazilla) return [] as Array<{ value: string; label: string }>
      if (isBangla) return POST_OFFICES_BN[form.upazilla] || []
      return (POST_OFFICES[form.upazilla] || []).map((po) => ({
        value: `${po.name} (${po.code})`,
        label: `${po.name} (${po.code})`
      }))
    },
    [form.upazilla, isBangla]
  )

  const localizedDistrict = localizeDistrictName(form.district || '', isBangla)
  const localizedUpazilla = localizeUpazillaName(form.upazilla || '', isBangla)
  const localizedPostOffice = (() => {
    if (!form.post_office) return ''
    const match = form.post_office.match(/^(.*)\s\((\d+)\)$/)
    if (!match) return isBangla ? localizeUpazillaName(form.post_office, true) : form.post_office
    return localizePostOfficeLabel(match[1], match[2], isBangla)
  })()

  const galleryPhotoConfig: Array<{ key: VehiclePhotoKey; label: string; image: string | null | undefined }> = useMemo(
    () => {
      if (!galleryVehicle) return []
      return [
        { key: 'vehicle_front_image', label: t('Front', 'সামনে'), image: galleryVehicle.vehicle_front_image },
        { key: 'vehicle_rear_image', label: t('Rear', 'পেছনে'), image: galleryVehicle.vehicle_rear_image },
        { key: 'vehicle_left_image', label: t('Left Side', 'বাম পাশ'), image: galleryVehicle.vehicle_left_image },
        { key: 'vehicle_right_image', label: t('Right Side', 'ডান পাশ'), image: galleryVehicle.vehicle_right_image }
      ]
    },
    [galleryVehicle, isBangla]
  )

  const activeGalleryPhoto = galleryPhotoConfig.find((item) => item.key === galleryPhotoKey)

  useEffect(() => {
    if (!galleryVehicle) return

    const availableKeys = galleryPhotoConfig.filter((item) => item.image).map((item) => item.key)

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setGalleryVehicle(null)
        return
      }

      if (!availableKeys.length) return
      const currentIndex = Math.max(0, availableKeys.indexOf(galleryPhotoKey))

      if (event.key === 'ArrowRight') {
        event.preventDefault()
        const nextIndex = (currentIndex + 1) % availableKeys.length
        setGalleryPhotoKey(availableKeys[nextIndex])
      }

      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        const prevIndex = (currentIndex - 1 + availableKeys.length) % availableKeys.length
        setGalleryPhotoKey(availableKeys[prevIndex])
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [galleryVehicle, galleryPhotoConfig, galleryPhotoKey])

  useEffect(() => {
    if (!showVehicleForm) return
    vehicleFormAnchorRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }, [showVehicleForm])

  const statusKey = String(user?.status || 'active').trim().toLowerCase()
  const driverStatusTone = (() => {
    if (statusKey === 'active' || statusKey === 'approved') return 'active'
    if (statusKey === 'pending') return 'pending'
    if (statusKey === 'inactive') return 'inactive'
    if (statusKey === 'suspended' || statusKey === 'rejected') return 'blocked'
    return 'unknown'
  })()
  const driverStatusText = (() => {
    if (statusKey === 'active' || statusKey === 'approved') return t('DRIVER STATUS: ACTIVE', 'ড্রাইভার স্ট্যাটাস: সক্রিয়')
    if (statusKey === 'pending') return t('DRIVER STATUS: PENDING', 'ড্রাইভার স্ট্যাটাস: অপেক্ষমাণ')
    if (statusKey === 'inactive') return t('DRIVER STATUS: INACTIVE', 'ড্রাইভার স্ট্যাটাস: নিষ্ক্রিয়')
    if (statusKey === 'suspended') return t('DRIVER STATUS: SUSPENDED', 'ড্রাইভার স্ট্যাটাস: সাময়িক বরখাস্ত')
    if (statusKey === 'rejected') return t('DRIVER STATUS: REJECTED', 'ড্রাইভার স্ট্যাটাস: প্রত্যাখ্যাত')
    return t(`DRIVER STATUS: ${statusKey.toUpperCase()}`, `ড্রাইভার স্ট্যাটাস: ${user?.status || 'অজানা'}`)
  })()

  function toggleLanguage() {
    const nextIsBangla = !isBangla
    try {
      localStorage.setItem('oijaba_lang', nextIsBangla ? 'bn' : 'en')
    } catch {
      // Ignore storage failures and still update the document language.
    }
    document.documentElement.lang = nextIsBangla ? 'bn' : 'en'
    setIsBangla(nextIsBangla)
    window.dispatchEvent(new Event('oijaba-language-changed'))
  }

  function updateForm<K extends keyof ProfileForm>(key: K, value: ProfileForm[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
  }

  function logoutDriver() {
    clearAuthToken()
    window.location.hash = 'driver-home'
    window.dispatchEvent(new Event('oijaba-auth-changed'))
  }

  function openVehicleGallery(vehicle: DriverVehicle) {
    const firstAvailable = (['vehicle_front_image', 'vehicle_rear_image', 'vehicle_left_image', 'vehicle_right_image'] as VehiclePhotoKey[])
      .find((key) => Boolean(vehicle[key])) || 'vehicle_front_image'
    setGalleryVehicle(vehicle)
    setGalleryPhotoKey(firstAvailable)
  }

  function toggleVehicleForm() {
    setShowVehicleForm((prev) => !prev)
    setSaveState('')
  }

  function onProfilePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    setPhotoUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      updateForm('profile_image', String(reader.result || ''))
      setPhotoUploading(false)
    }
    reader.onerror = () => {
      setPhotoUploading(false)
      setSaveState(t('Could not read selected image.', 'নির্বাচিত ছবিটি পড়া যায়নি।'))
    }
    reader.readAsDataURL(file)
  }

  function onLicensePhotoSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    setLicenseUploading(true)
    const reader = new FileReader()
    reader.onload = () => {
      updateForm('driver_license_image', String(reader.result || ''))
      setLicenseUploading(false)
    }
    reader.onerror = () => {
      setLicenseUploading(false)
      setSaveState(t('Could not read license image.', 'লাইসেন্স ছবিটি পড়া যায়নি।'))
    }
    reader.readAsDataURL(file)
  }

  function onVehiclePhotoSelect(
    e: React.ChangeEvent<HTMLInputElement>,
    key: 'vehicle_front_image' | 'vehicle_rear_image' | 'vehicle_left_image' | 'vehicle_right_image'
  ) {
    const file = e.target.files && e.target.files[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setVehicleForm((prev) => ({ ...prev, [key]: String(reader.result || '') }))
    }
    reader.onerror = () => {
      setSaveState(t('Could not read selected vehicle image.', 'নির্বাচিত গাড়ির ছবিটি পড়া যায়নি।'))
    }
    reader.readAsDataURL(file)
  }

  async function saveProfile() {
    setSaveState(t('Saving profile...', 'প্রোফাইল সংরক্ষণ করা হচ্ছে...'))
    try {
      const payload = {
        name_bn: form.name_bn || null,
        area: form.area || null,
        district: form.district || null,
        upazilla: form.upazilla || null,
        house_no: form.house_no || null,
        road_no: form.road_no || null,
        landmark: form.landmark || null,
        post_office: form.post_office || null,
        profile_image: form.profile_image || null,
        driver_license_image: form.driver_license_image || null
      }

      const res = await api.drivers.updateProfile(payload)
      const nextUser = (res as any)?.user as DriverUser
      if (nextUser) {
        setUser((prev) => ({ ...(prev || {}), ...nextUser }))
        setIsEditingProfile(false)
      }
      setSaveState(t('Profile saved successfully.', 'প্রোফাইল সফলভাবে সংরক্ষণ করা হয়েছে।'))
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Could not save profile.', 'প্রোফাইল সংরক্ষণ করা যায়নি।')
      setSaveState(msg)
    }
  }

  async function addVehicle() {
    if (!vehicleForm.vehicle_type.trim() || !vehicleForm.vehicle_plate.trim()) {
      setSaveState(t('Vehicle type and plate are required.', 'গাড়ির ধরন এবং প্লেট নম্বর আবশ্যক।'))
      return
    }

    setSaveState(t('Adding vehicle...', 'গাড়ি যোগ করা হচ্ছে...'))
    try {
      const res = await api.drivers.addVehicle({
        vehicle_type: vehicleForm.vehicle_type.trim(),
        vehicle_model: vehicleForm.vehicle_model.trim(),
        vehicle_plate: vehicleForm.vehicle_plate.trim(),
        driver_license: vehicleForm.driver_license.trim(),
        color: vehicleForm.color.trim(),
        capacity: vehicleForm.capacity.trim(),
        registration_number: vehicleForm.registration_number.trim(),
        engine_chassis_number: vehicleForm.engine_chassis_number.trim(),
        notes: vehicleForm.notes.trim(),
        vehicle_front_image: vehicleForm.vehicle_front_image || null,
        vehicle_rear_image: vehicleForm.vehicle_rear_image || null,
        vehicle_left_image: vehicleForm.vehicle_left_image || null,
        vehicle_right_image: vehicleForm.vehicle_right_image || null
      })

      const nextVehicles = asArray<DriverVehicle>((res as any)?.vehicles ?? res)
      if (nextVehicles.length) {
        setVehicles(nextVehicles)
        const active = nextVehicles.find((item) => item.is_primary)
        if (active) {
          setUser((prev) => ({
            ...(prev || {}),
            vehicle_type: active.vehicle_type || '',
            vehicle_model: active.vehicle_model || '',
            vehicle_plate: active.vehicle_plate || '',
            driver_license: active.registration_number || prev?.driver_license || ''
          }))
        }
      }

      setVehicleForm({
        vehicle_type: '',
        vehicle_model: '',
        vehicle_plate: '',
        driver_license: '',
        color: '',
        capacity: '',
        registration_number: '',
        engine_chassis_number: '',
        notes: '',
        vehicle_front_image: '',
        vehicle_rear_image: '',
        vehicle_left_image: '',
        vehicle_right_image: ''
      })
      setShowVehicleForm(false)
      setSaveState(t('Vehicle added successfully.', 'গাড়ি সফলভাবে যোগ করা হয়েছে।'))
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Could not add vehicle.', 'গাড়ি যোগ করা যায়নি।')
      setSaveState(msg)
    }
  }

  async function setVehicleAsActive(vehicleId: string) {
    setActivatingVehicleId(vehicleId)
    setSaveState(t('Updating active vehicle...', 'সক্রিয় গাড়ি আপডেট করা হচ্ছে...'))
    try {
      const res = await api.drivers.setActiveVehicle(vehicleId)
      const nextVehicles = asArray<DriverVehicle>((res as any)?.vehicles ?? res)
      if (nextVehicles.length) {
        setVehicles(nextVehicles)
        const active = nextVehicles.find((item) => item.is_primary)
        if (active) {
          setUser((prev) => ({
            ...(prev || {}),
            vehicle_type: active.vehicle_type || '',
            vehicle_model: active.vehicle_model || '',
            vehicle_plate: active.vehicle_plate || '',
            driver_license: active.registration_number || prev?.driver_license || ''
          }))
        }
      }
      setSaveState(t('Active vehicle updated.', 'সক্রিয় গাড়ি আপডেট হয়েছে।'))
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Could not set active vehicle.', 'সক্রিয় গাড়ি সেট করা যায়নি।')
      setSaveState(msg)
    } finally {
      setActivatingVehicleId('')
    }
  }

  async function deleteVehicle(vehicleId: string) {
    setDeletingVehicleId(vehicleId)
    setSaveState(t('Deleting vehicle...', 'গাড়ি মুছে ফেলা হচ্ছে...'))
    try {
      const res = await api.drivers.deleteVehicle(vehicleId)
      const nextVehicles = asArray<DriverVehicle>((res as any)?.vehicles ?? res)
      setVehicles(nextVehicles)

      const active = nextVehicles.find((item) => item.is_primary)
      if (active) {
        setUser((prev) => ({
          ...(prev || {}),
          vehicle_type: active.vehicle_type || '',
          vehicle_model: active.vehicle_model || '',
          vehicle_plate: active.vehicle_plate || '',
          driver_license: active.registration_number || prev?.driver_license || ''
        }))
      }

      setSaveState(t('Vehicle deleted successfully.', 'গাড়ি সফলভাবে মুছে ফেলা হয়েছে।'))
      setPendingDeleteVehicle(null)
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Could not delete vehicle.', 'গাড়ি মুছে ফেলা যায়নি।')
      setSaveState(msg)
    } finally {
      setDeletingVehicleId('')
    }
  }

  async function updateVehicle() {
    if (!editingVehicle) return
    if (!vehicleForm.vehicle_type.trim() || !vehicleForm.vehicle_plate.trim()) {
      setSaveState(t('Vehicle type and plate are required.', 'গাড়ির ধরন এবং প্লেট নম্বর আবশ্যক।'))
      return
    }

    setSaveState(t('Updating vehicle...', 'গাড়ি আপডেট করা হচ্ছে...'))
    try {
      const res = await api.drivers.updateVehicle(editingVehicle.id, {
        vehicle_type: vehicleForm.vehicle_type.trim(),
        vehicle_model: vehicleForm.vehicle_model.trim(),
        vehicle_plate: vehicleForm.vehicle_plate.trim(),
        color: vehicleForm.color.trim(),
        capacity: vehicleForm.capacity.trim(),
        registration_number: vehicleForm.registration_number.trim(),
        engine_chassis_number: vehicleForm.engine_chassis_number.trim(),
        notes: vehicleForm.notes.trim(),
        vehicle_front_image: vehicleForm.vehicle_front_image || null,
        vehicle_rear_image: vehicleForm.vehicle_rear_image || null,
        vehicle_left_image: vehicleForm.vehicle_left_image || null,
        vehicle_right_image: vehicleForm.vehicle_right_image || null
      })

      const nextVehicles = asArray<DriverVehicle>((res as any)?.vehicles ?? res)
      if (nextVehicles.length) {
        setVehicles(nextVehicles)
        const active = nextVehicles.find((item) => item.is_primary)
        if (active) {
          setUser((prev) => ({
            ...(prev || {}),
            vehicle_type: active.vehicle_type || '',
            vehicle_model: active.vehicle_model || '',
            vehicle_plate: active.vehicle_plate || '',
            driver_license: active.registration_number || prev?.driver_license || ''
          }))
        }
      }

      setEditingVehicle(null)
      setVehicleForm({
        vehicle_type: '',
        vehicle_model: '',
        vehicle_plate: '',
        driver_license: '',
        color: '',
        capacity: '',
        registration_number: '',
        engine_chassis_number: '',
        notes: '',
        vehicle_front_image: '',
        vehicle_rear_image: '',
        vehicle_left_image: '',
        vehicle_right_image: ''
      })
      setSaveState(t('Vehicle updated successfully.', 'গাড়ি সফলভাবে আপডেট হয়েছে।'))
    } catch (error) {
      const msg = error instanceof Error ? error.message : t('Could not update vehicle.', 'গাড়ি আপডেট করা যায়নি।')
      setSaveState(msg)
    }
  }

  function submitRatingDispute() {
    if (!ratingDisputeRideRef.trim() || !ratingDisputeReason.trim()) {
      setRatingDisputeState(t('Please provide ride reference and dispute reason.', 'অনুগ্রহ করে রাইড রেফারেন্স এবং আপত্তির কারণ দিন।'))
      return
    }

    setRatingDisputeState(t('Submitting dispute...', 'আপত্তি জমা দেওয়া হচ্ছে...'))
    void (async () => {
      try {
        const response = await api.drivers.submitRatingDispute(ratingDisputeRideRef.trim(), ratingDisputeReason.trim())
        const created = (response as any)?.dispute as DriverRatingDispute
        if (created) {
          setDisputes((prev) => [created, ...prev])
        }
        setRatingDisputeState(t('Dispute submitted. Admin review queue updated.', 'আপত্তি জমা দেওয়া হয়েছে। অ্যাডমিন রিভিউ তালিকা আপডেট হয়েছে।'))
        setRatingDisputeRideRef('')
        setRatingDisputeReason('')
      } catch (error) {
        const msg = error instanceof Error ? error.message : t('Failed to submit dispute.', 'আপত্তি জমা দেওয়া যায়নি।')
        setRatingDisputeState(msg)
      }
    })()
  }

  // Reset rating form whenever a different ride is opened
  React.useEffect(() => {
    setRatingForm({ overall: 0, behavior: 0, wait_time: 0, comment: '' })
    setRatingMsg('')
  }, [selectedRide?.id])

  async function submitPassengerRating() {
    if (!selectedRide || ratingForm.overall === 0) return
    setRatingSubmitting(true)
    setRatingMsg('')
    try {
      const res = await api.rides.rate(selectedRide.id, {
        rating: ratingForm.overall,
        rating_rider_behavior: ratingForm.behavior || null,
        rating_rider_wait_time: ratingForm.wait_time || null,
        rating_rider_comment: ratingForm.comment.trim() || null,
      })
      const updated = (res as { ride?: Ride })?.ride
      if (updated) {
        setRides((prev) => prev.map((r) => r.id === updated.id ? { ...r, ...updated } : r))
        setSelectedRide((prev) => prev ? { ...prev, ...updated } : prev)
      }
      setRatingMsg(t('Rating submitted!', 'রেটিং জমা দেওয়া হয়েছে!'))
    } catch (e) {
      setRatingMsg(e instanceof Error ? e.message : t('Failed to submit.', 'জমা দিতে ব্যর্থ।'))
    }
    setRatingSubmitting(false)
  }

  const renderRideDetail = (ride: Ride, onBack: () => void) => {
    const starRow = (val: number | null | undefined, small = true) => (
      <span className={`rt-stars${small ? '' : ' rt-stars-lg'}`}>
        {[1, 2, 3, 4, 5].map((i) => (
          <span key={i} className={`rt-star${i <= Math.round(val ?? 0) ? ' filled' : ''}`}>★</span>
        ))}
      </span>
    )
    return (
      <div className="driver-ride-detail">
        <button className="btn btn-outline driver-ride-back" onClick={onBack}>
          ← {t('Back', 'ফিরে যান')}
        </button>

        <div className="driver-ride-detail-header">
          <div>
            <span className="driver-ride-ref">{ride.ride_ref || ride.id}</span>
            <span className={`admin-badge ${String(ride.status || '').toLowerCase()}`}>
              {ride.status || '—'}
            </span>
          </div>
          <div className="admin-muted" style={{ fontSize: 13 }}>
            {ride.created_at ? new Date(ride.created_at).toLocaleString('en-GB') : '—'}
          </div>
        </div>

        <div className="driver-ride-detail-grid">
          {/* ── Trip Route ── */}
          <div className="driver-ride-detail-card">
            <div className="driver-ride-detail-card-title">🗺️ {t('Trip Route', 'ট্রিপ রুট')}</div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Pickup', 'পিকআপ')}</span>
              <span className="driver-ride-detail-value">{ride.pickup_name || '—'}</span>
            </div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Drop-off', 'গন্তব্য')}</span>
              <span className="driver-ride-detail-value">{ride.destination_name || '—'}</span>
            </div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Vehicle Type', 'যানবাহনের ধরন')}</span>
              <span className="driver-ride-detail-value">{ride.vehicle_type || '—'}</span>
            </div>
          </div>

          {/* ── Passenger ── */}
          <div className="driver-ride-detail-card">
            <div className="driver-ride-detail-card-title">👤 {t('Passenger', 'যাত্রী')}</div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Name', 'নাম')}</span>
              <span className="driver-ride-detail-value">{ride.rider_name || '—'}</span>
            </div>
          </div>

          {/* ── Payment ── */}
          <div className="driver-ride-detail-card">
            <div className="driver-ride-detail-card-title">💰 {t('Payment', 'পেমেন্ট')}</div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Estimated Fare', 'আনুমানিক ভাড়া')}</span>
              <span className="driver-ride-detail-value">{toMoney(ride.fare_estimate)}</span>
            </div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Final Fare', 'চূড়ান্ত ভাড়া')}</span>
              <span className="driver-ride-detail-value driver-ride-fare-final">{toMoney(ride.fare_final ?? ride.fare_estimate)}</span>
            </div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Payment Method', 'পেমেন্ট পদ্ধতি')}</span>
              <span className="driver-ride-detail-value">{ride.payment_method || '—'}</span>
            </div>
          </div>

          {/* ── Timeline ── */}
          <div className="driver-ride-detail-card">
            <div className="driver-ride-detail-card-title">🕐 {t('Timeline', 'সময়রেখা')}</div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Booked', 'বুক করা হয়েছে')}</span>
              <span className="driver-ride-detail-value">{ride.created_at ? new Date(ride.created_at).toLocaleString('en-GB') : '—'}</span>
            </div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Accepted', 'গৃহীত')}</span>
              <span className="driver-ride-detail-value">{ride.accepted_at ? new Date(ride.accepted_at).toLocaleString('en-GB') : '—'}</span>
            </div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Started', 'শুরু হয়েছে')}</span>
              <span className="driver-ride-detail-value">{ride.started_at ? new Date(ride.started_at).toLocaleString('en-GB') : '—'}</span>
            </div>
            <div className="driver-ride-detail-row">
              <span className="driver-ride-detail-label">{t('Completed', 'সম্পন্ন')}</span>
              <span className="driver-ride-detail-value">{ride.completed_at ? new Date(ride.completed_at).toLocaleString('en-GB') : '—'}</span>
            </div>
          </div>

          {/* ── Rating received from passenger ── */}
          {typeof ride.driver_rating === 'number' && (
            <div className="driver-ride-detail-card driver-ride-rating-card">
              <div className="driver-ride-detail-card-title">⭐ {t('Rating from Passenger', 'যাত্রীর কাছ থেকে রেটিং')}</div>
              <div className="driver-ride-rating-stars">
                {starRow(ride.driver_rating)}
                <span className="driver-ride-rating-num">({(ride.driver_rating).toFixed(1)}/5)</span>
              </div>
              {(ride.rating_driving != null || ride.rating_behavior != null || ride.rating_cleanliness != null) && (
                <div className="rt-detail-cat-grid" style={{ marginTop: 10 }}>
                  {ride.rating_driving != null && (
                    <div className="rt-detail-cat-card">
                      <div className="rt-detail-cat-icon">🚗</div>
                      <div className="rt-detail-cat-label">{t('Driving', 'চালনা')}</div>
                      <div className="rt-detail-cat-score">{(ride.rating_driving).toFixed(1)}/5</div>
                    </div>
                  )}
                  {ride.rating_behavior != null && (
                    <div className="rt-detail-cat-card">
                      <div className="rt-detail-cat-icon">🤝</div>
                      <div className="rt-detail-cat-label">{t('Behaviour', 'আচরণ')}</div>
                      <div className="rt-detail-cat-score">{(ride.rating_behavior).toFixed(1)}/5</div>
                    </div>
                  )}
                  {ride.rating_cleanliness != null && (
                    <div className="rt-detail-cat-card">
                      <div className="rt-detail-cat-icon">✨</div>
                      <div className="rt-detail-cat-label">{t('Cleanliness', 'পরিচ্ছন্নতা')}</div>
                      <div className="rt-detail-cat-score">{(ride.rating_cleanliness).toFixed(1)}/5</div>
                    </div>
                  )}
                </div>
              )}
              {ride.rating_comment && (
                <div className="rt-detail-comment" style={{ marginTop: 10 }}>
                  <div className="rt-detail-comment-label">💬 {t("Passenger's comment", 'যাত্রীর মন্তব্য')}</div>
                  <div className="rt-detail-comment-text">"{ride.rating_comment}"</div>
                </div>
              )}
            </div>
          )}

          {/* ── Rate passenger / already rated ── */}
          {ride.status === 'completed' && (
            <div className="driver-ride-detail-card driver-rate-passenger-card">
              {ride.rider_rating == null ? (
                <>
                  <div className="driver-ride-detail-card-title">📝 {t('Rate Passenger', 'যাত্রীকে রেটিং দিন')}</div>
                  <div className="rate-p-row">
                    <div className="rate-p-label">{t('Overall', 'সামগ্রিক')} <span className="rate-p-req">*</span></div>
                    <div className="rate-p-stars">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className={`rate-star${ratingForm.overall >= i ? ' selected' : ''}`}
                          onClick={() => setRatingForm((f) => ({ ...f, overall: i }))}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="rate-p-row">
                    <div className="rate-p-label">👤 {t('Behaviour', 'আচরণ')}</div>
                    <div className="rate-p-stars">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className={`rate-star${ratingForm.behavior >= i ? ' selected' : ''}`}
                          onClick={() => setRatingForm((f) => ({ ...f, behavior: i }))}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="rate-p-row">
                    <div className="rate-p-label">⏱️ {t('Wait Time', 'অপেক্ষার সময়')}</div>
                    <div className="rate-p-stars">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <span key={i} className={`rate-star${ratingForm.wait_time >= i ? ' selected' : ''}`}
                          onClick={() => setRatingForm((f) => ({ ...f, wait_time: i }))}>★</span>
                      ))}
                    </div>
                  </div>
                  <div className="rate-p-row">
                    <div className="rate-p-label">💬 {t('Comment', 'মন্তব্য')}</div>
                    <textarea className="rate-p-comment" rows={3}
                      placeholder={t('Optional comment…', 'ঐচ্ছিক মন্তব্য…')}
                      value={ratingForm.comment}
                      onChange={(e) => setRatingForm((f) => ({ ...f, comment: e.target.value }))} />
                  </div>
                  <div className="rate-p-submit-row">
                    <button className="btn btn-primary"
                      disabled={ratingForm.overall === 0 || ratingSubmitting}
                      onClick={submitPassengerRating}>
                      {ratingSubmitting ? t('Submitting…', 'জমা হচ্ছে…') : t('Submit Rating', 'রেটিং জমা দিন')}
                    </button>
                    {ratingMsg && <span className="admin-muted">{ratingMsg}</span>}
                  </div>
                </>
              ) : (
                <>
                  <div className="driver-ride-detail-card-title">✅ {t('Your Rating for Passenger', 'যাত্রীর জন্য আপনার রেটিং')}</div>
                  <div className="driver-ride-rating-stars">
                    {starRow(ride.rider_rating)}
                    <span className="driver-ride-rating-num">({ride.rider_rating.toFixed(1)}/5)</span>
                  </div>
                  {(ride.rating_rider_behavior != null || ride.rating_rider_wait_time != null) && (
                    <div className="rt-detail-cat-grid" style={{ marginTop: 10 }}>
                      {ride.rating_rider_behavior != null && (
                        <div className="rt-detail-cat-card">
                          <div className="rt-detail-cat-icon">👤</div>
                          <div className="rt-detail-cat-label">{t('Behaviour', 'আচরণ')}</div>
                          <div className="rt-detail-cat-score">{ride.rating_rider_behavior}/5</div>
                        </div>
                      )}
                      {ride.rating_rider_wait_time != null && (
                        <div className="rt-detail-cat-card">
                          <div className="rt-detail-cat-icon">⏱️</div>
                          <div className="rt-detail-cat-label">{t('Wait Time', 'অপেক্ষার সময়')}</div>
                          <div className="rt-detail-cat-score">{ride.rating_rider_wait_time}/5</div>
                        </div>
                      )}
                    </div>
                  )}
                  {ride.rating_rider_comment && (
                    <div className="rt-detail-comment" style={{ marginTop: 10 }}>
                      <div className="rt-detail-comment-label">💬 {t('Your comment', 'আপনার মন্তব্য')}</div>
                      <div className="rt-detail-comment-text">"{ride.rating_rider_comment}"</div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) return <div className="admin-loading">{t('Loading driver dashboard…', 'চালকের ড্যাশবোর্ড লোড হচ্ছে…')}</div>
  if (!user) return <div className="admin-loading">{t('Driver session not found.', 'চালকের সেশন পাওয়া যায়নি।')}</div>

  return (
    <div className="driver-portal-page">
      <div className="driver-portal-shell">
        <div className="driver-topbar driver-topbar-compact">
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
            <button
              className={`driver-online-toggle ${isOnline ? 'online' : 'offline'}`}
              type="button"
              onClick={toggleOnlineStatus}
              aria-label={isOnline ? t('Go Offline', 'অফলাইন হন') : t('Go Online', 'অনলাইন হন')}
            >
              <span className="driver-online-dot" aria-hidden="true" />
              {isOnline ? t('Online', 'অনলাইন') : t('Offline', 'অফলাইন')}
            </button>
            <div className="driver-topbar-actions">
              <button className="driver-top-chip driver-notif-btn" type="button" aria-label={t('Notifications', 'বিজ্ঞপ্তি')}>
                🔔
              </button>
              <button className="driver-top-chip" type="button" onClick={toggleLanguage}>
                {isBangla ? 'বাংলা' : 'English'}
              </button>
              <a
                className="driver-top-chip driver-top-link"
                href="#driver-home"
                onClick={(event) => {
                  event.preventDefault()
                  logoutDriver()
                }}
              >
                {t('Logout', 'লগআউট')}
              </a>
            </div>
          </div>
        </div>

        <div className="driver-dashboard-shell">
          <div className="app-panel driver-dashboard-card driver-app-panel">
            <div className="driver-dashboard-headline">
              <span
                className="driver-dashboard-photo"
                style={user?.profile_image ? { backgroundImage: `url(${user.profile_image})` } : undefined}
                aria-hidden="true"
              >
                {!user?.profile_image ? (user?.name || 'D').slice(0, 1).toUpperCase() : ''}
              </span>
              <div className="driver-dashboard-headline-copy">
                <h2>{t(`Welcome, ${user?.name || 'Driver'}`, `স্বাগতম, ${user?.name_bn || user?.name || 'চালক'}`)}</h2>
                <p>{t('Your live performance dashboard', 'আপনার লাইভ পারফরম্যান্স ড্যাশবোর্ড')}</p>
              </div>
            </div>

            <div className="driver-dashboard-layout">
              <aside className="driver-panel-nav">
                <div className="driver-panel-title">{t('DRIVER PANEL', 'ড্রাইভার প্যানেল')}</div>
                {menuItems.map((item) => (
                  <button
                    key={item.key}
                    className={`driver-panel-item ${tab === item.key ? 'active' : ''}`}
                    onClick={() => setTab(item.key)}
                  >
                    <span className="driver-panel-icon" aria-hidden="true">{item.icon}</span>
                    <span>
                      <span className="driver-panel-label">{item.label}</span>
                      <span className="driver-panel-desc">{item.desc}</span>
                    </span>
                  </button>
                ))}
              </aside>

              <div className="driver-panel-content">
                {tab === 'analytics' && (
                  <section>
                    {/* ── Account status badge ── */}
                    <h3 className={`driver-status-text driver-status-${driverStatusTone}`}>
                      <span className={`driver-status-light driver-status-light-${driverStatusTone}`} aria-hidden="true" />
                      {driverStatusText}
                    </h3>

                    {/* ── Live Status Panel ── */}
                    <div className={`driver-live-status-panel ${isOnline ? 'online' : 'offline'}`}>
                      <div className="driver-live-status-left">
                        <span className="driver-live-status-icon">{isOnline ? '🟢' : '⭕'}</span>
                        <div>
                          <div className="driver-live-status-title">
                            {isOnline ? t('You are Online', 'আপনি অনলাইনে আছেন') : t('You are Offline', 'আপনি অফলাইনে আছেন')}
                          </div>
                          <div className="driver-live-status-sub">
                            {isOnline
                              ? t(`Session: ${formatOnlineTime(onlineSeconds)}`, `সেশন: ${formatOnlineTime(onlineSeconds)}`)
                              : t('Go online to receive ride requests', 'রাইড গ্রহণ করতে অনলাইন হন')}
                          </div>
                        </div>
                      </div>
                      <button
                        className={`driver-live-toggle-btn ${isOnline ? 'online' : 'offline'}`}
                        onClick={toggleOnlineStatus}
                      >
                        {isOnline ? t('Go Offline', 'অফলাইন হন') : t('Go Online', 'অনলাইন হন')}
                      </button>
                    </div>

                    {/* ── Summary stat cards ── */}
                    <div className="driver-analytics-grid driver-analytics-grid-five">
                      <div className="driver-stat-card">
                        <div className="driver-stat-label">💰 {t('Today earnings', 'আজকের আয়')}</div>
                        <div className="driver-stat-value">{toMoney(todayEarnings || 0)}</div>
                        <div className="driver-stat-sub">{t(`${completedToday.length} rides today`, `আজ ${completedToday.length}টি রাইড`)}</div>
                      </div>
                      <div className="driver-stat-card">
                        <div className="driver-stat-label">🚕 {t('Total rides', 'মোট রাইড')}</div>
                        <div className="driver-stat-value">{rides.length}</div>
                        <div className="driver-stat-sub">{t(`${completedRides.length} completed`, `${completedRides.length}টি সম্পন্ন`)}</div>
                      </div>
                      <div className="driver-stat-card">
                        <div className="driver-stat-label">⭐ {t('Rating', 'রেটিং')}</div>
                        <div className="driver-stat-value">{avgRating ?? '0.0'}★</div>
                        <div className="driver-stat-sub">{t(`${ratingsCount} ratings`, `${ratingsCount}টি রেটিং`)}</div>
                      </div>
                      <div className="driver-stat-card">
                        <div className="driver-stat-label">⏱️ {t('Hours Online', 'অনলাইন সময়')}</div>
                        <div className="driver-stat-value">{isOnline ? formatOnlineTime(onlineSeconds) : '—'}</div>
                        <div className="driver-stat-sub">{isOnline ? t('This session', 'এই সেশনে') : t('Currently offline', 'এখন অফলাইন')}</div>
                      </div>
                      <div className="driver-stat-card">
                        <div className="driver-stat-label">💳 {t('Balance', 'ব্যালেন্স')}</div>
                        <div className="driver-stat-value">{toMoney(earningSummary?.wallet?.balance ?? 0)}</div>
                        <div className="driver-stat-sub">
                          <button className="driver-stat-link" onClick={() => setTab('earnings')}>{t('View wallet →', 'ওয়ালেট দেখুন →')}</button>
                        </div>
                      </div>
                    </div>

                    {/* ── Earnings chart with period tabs ── */}
                    <div className="driver-chart-card driver-earnings-chart-card">
                      <div className="driver-chart-card-header">
                        <h4 style={{ margin: 0 }}>{t('Earnings', 'আয়')}</h4>
                        <div className="driver-period-tabs">
                          {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                            <button
                              key={p}
                              className={`driver-period-tab ${chartPeriod === p ? 'active' : ''}`}
                              onClick={() => setChartPeriod(p)}
                            >
                              {p === 'daily' ? t('7 Days', '৭ দিন') : p === 'weekly' ? t('4 Weeks', '৪ সপ্তাহ') : t('6 Months', '৬ মাস')}
                            </button>
                          ))}
                        </div>
                      </div>
                      {chartData.length === 0 ? (
                        <p className="admin-muted" style={{ padding: '16px 0 8px' }}>{t('No earnings data for this period yet.', 'এই সময়ের জন্য কোনো আয়ের তথ্য নেই।')}</p>
                      ) : (
                        <div className="driver-real-chart">
                          {(() => {
                            const maxAmt = Math.max(...chartData.map((d) => d.amount), 1)
                            return chartData.map((d, idx) => (
                              <div key={idx} className="driver-real-chart-col">
                                <div className="driver-real-chart-bar-wrap">
                                  <div
                                    className="driver-real-chart-bar"
                                    style={{ height: `${Math.max(4, (d.amount / maxAmt) * 100)}%` }}
                                    title={`৳${Math.round(d.amount)} (${d.rides} rides)`}
                                  />
                                </div>
                                <div className="driver-real-chart-label">{d.label}</div>
                                <div className="driver-real-chart-amt">{toMoney(d.amount)}</div>
                              </div>
                            ))
                          })()}
                        </div>
                      )}
                    </div>

                    {/* ── Ride Breakdown donut ── */}
                    <div className="driver-chart-grid">
                      <div className="driver-chart-card">
                        <h4>{t('Ride Breakdown', 'রাইড ব্রেকডাউন')}</h4>
                        <div className="driver-breakdown-ring" aria-hidden="true" />
                        <div className="driver-breakdown-legend">
                          <span className="driver-dot green" />{t('Completed', 'সম্পন্ন')} ({rideStatusCounts.completed})
                          <span className="driver-dot red" />{t('Cancelled', 'বাতিল')} ({rideStatusCounts.cancelled})
                          <span className="driver-dot blue" />{t('In Progress', 'চলমান')} ({rideStatusCounts.inProgress})
                          <span className="driver-dot cyan" />{t('Accepted', 'গৃহীত')} ({rideStatusCounts.accepted})
                          <span className="driver-dot purple" />{t('Pickup', 'পিকআপ')} ({rideStatusCounts.pickup})
                          <span className="driver-dot orange" />{t('Searching', 'সার্চিং')} ({rideStatusCounts.searching})
                        </div>
                      </div>

                      <div className="driver-chart-card">
                        <h4>{t('Last 5 Rides Rating', 'শেষ ৫ রাইড রেটিং')}</h4>
                        <div className="driver-bars driver-bars-rating" aria-hidden="true">
                          {ratingBars.map((stars, idx) => (
                            <span key={idx} style={{ height: `${(stars / 5) * 100}%` }} />
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* ── Incentives & Bonuses ── */}
                    <div className="driver-section-card driver-incentives-card">
                      <div className="driver-section-card-header">
                        <span>🎯 {t('Incentives & Bonuses', 'ইনসেন্টিভ এবং বোনাস')}</span>
                      </div>
                      {[
                        { label: t('Bronze Milestone', 'ব্রোঞ্জ মাইলস্টোন'), target: 10, bonus: 100, icon: '🥉' },
                        { label: t('Silver Milestone', 'সিলভার মাইলস্টোন'), target: 25, bonus: 300, icon: '🥈' },
                        { label: t('Gold Milestone', 'গোল্ড মাইলস্টোন'), target: 50, bonus: 700, icon: '🥇' },
                      ].map((milestone) => {
                        const progress = Math.min(100, Math.round((completedRides.length / milestone.target) * 100))
                        const done = completedRides.length >= milestone.target
                        return (
                          <div key={milestone.target} className="driver-incentive-item">
                            <div className="driver-incentive-header">
                              <span>{milestone.icon} {milestone.label}</span>
                              <span className={`driver-incentive-badge ${done ? 'done' : ''}`}>
                                {done
                                  ? t('✅ Earned', '✅ অর্জিত')
                                  : `${completedRides.length}/${milestone.target} ${t('rides', 'রাইড')}`}
                              </span>
                            </div>
                            <div className="driver-incentive-progress-wrap">
                              <div className="driver-incentive-progress-bar" style={{ width: `${progress}%` }} />
                            </div>
                            <div className="driver-incentive-desc">
                              {t(`Complete ${milestone.target} rides → Earn ৳${milestone.bonus} bonus`,
                                `${milestone.target}টি রাইড সম্পন্ন করুন → ৳${milestone.bonus} বোনাস পান`)}
                            </div>
                          </div>
                        )
                      })}
                    </div>

                    {/* ── Safety & Support ── */}
                    <div className="driver-section-card driver-support-card">
                      <div className="driver-section-card-header">
                        <span>🆘 {t('Safety & Support', 'নিরাপত্তা এবং সহায়তা')}</span>
                      </div>
                      <div className="driver-support-grid">
                        <a href="tel:999" className="driver-support-btn sos">
                          <span className="driver-support-btn-icon">🚨</span>
                          <span>{t('Emergency', 'জরুরি')}</span>
                          <span className="driver-support-btn-sub">999</span>
                        </a>
                        <button className="driver-support-btn" onClick={() => setTab('ratings')}>
                          <span className="driver-support-btn-icon">🚩</span>
                          <span>{t('Report Issue', 'সমস্যা জানান')}</span>
                          <span className="driver-support-btn-sub">{t('Dispute a rating', 'রেটিং বিরোধ')}</span>
                        </button>
                        <a href="mailto:support@oijaba.com" className="driver-support-btn">
                          <span className="driver-support-btn-icon">📧</span>
                          <span>{t('Support', 'সহায়তা')}</span>
                          <span className="driver-support-btn-sub">{t('Email us', 'ইমেইল করুন')}</span>
                        </a>
                      </div>
                    </div>

                    <div className="driver-dashboard-actions">
                      <button className="btn btn-primary" onClick={() => setTab('profile')}>{t('Profile', 'প্রোফাইল')}</button>
                      <button className="btn btn-outline" onClick={() => window.location.reload()}>{t('Refresh Dashboard', 'ড্যাশবোর্ড রিফ্রেশ করুন')}</button>
                    </div>
                  </section>
                )}

                {tab === 'rides' && (
                  <section>
                    {selectedRide ? (
                      <AdminRideDetail rideId={selectedRide.id} onBack={() => setSelectedRide(null)} />
                    ) : (
                      <>
                        <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                          <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
                            <div className="admin-stat-header"><span className="admin-stat-label">{t('Total', 'মোট')}</span><span className="admin-stat-icon">🛺</span></div>
                            <div className="admin-stat-value">{rides.length}</div>
                          </div>
                          <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
                            <div className="admin-stat-header"><span className="admin-stat-label">{t('Completed', 'সম্পন্ন')}</span><span className="admin-stat-icon">✅</span></div>
                            <div className="admin-stat-value">{completedRides.length}</div>
                          </div>
                          <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
                            <div className="admin-stat-header"><span className="admin-stat-label">{t('Cancelled', 'বাতিল')}</span><span className="admin-stat-icon">❌</span></div>
                            <div className="admin-stat-value">{rides.filter(r => r.status === 'cancelled').length}</div>
                          </div>
                          <div className="admin-stat-card" style={{ flex: 1, minWidth: 140 }}>
                            <div className="admin-stat-header"><span className="admin-stat-label">{t('Earnings', 'আয়')}</span><span className="admin-stat-icon">💰</span></div>
                            <div className="admin-stat-value">৳{completedRides.reduce((s, r) => s + (r.fare_final ?? r.fare_estimate ?? 0), 0).toLocaleString()}</div>
                          </div>
                        </div>

                        {/* Filters and Sort Controls */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>{t('Search', 'খুঁজুন')}</label>
                            <input
                              type="text"
                              placeholder={t('Search by ride ID, rider name…', 'রেফ বা যাত্রী নাম দিয়ে খুঁজুন…')}
                              value={ridesSearch}
                              onChange={(e) => setRidesSearch(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit' }}
                            />
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>{t('Status Filter', 'স্ট্যাটাস')}</label>
                            <select
                              value={ridesFilter}
                              onChange={(e) => setRidesFilter(e.target.value)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
                            >
                              <option value="all">{t('All Statuses', 'সব স্ট্যাটাস')}</option>
                              <option value="completed">{t('Completed', 'সম্পন্ন')}</option>
                              <option value="cancelled">{t('Cancelled', 'বাতিল')}</option>
                              <option value="started">{t('In Progress', 'চলমান')}</option>
                              <option value="accepted">{t('Accepted', 'গৃহীত')}</option>
                            </select>
                          </div>
                          <div>
                            <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>{t('Sort By', 'সর্ট করুন')}</label>
                            <select
                              value={ridesSortBy}
                              onChange={(e) => setRidesSortBy(e.target.value as any)}
                              style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
                            >
                              <option value="date-desc">{t('Newest First', 'নতুন আগে')}</option>
                              <option value="date-asc">{t('Oldest First', 'পুরনো আগে')}</option>
                              <option value="fare-desc">{t('Fare: High → Low', 'ভাড়া: বেশি → কম')}</option>
                              <option value="fare-asc">{t('Fare: Low → High', 'ভাড়া: কম → বেশি')}</option>
                            </select>
                          </div>
                        </div>

                        {/* Rides Table */}
                        <div style={{ width: '100%', borderRadius: 10, overflow: 'hidden', boxSizing: 'border-box' }}>
                          <div style={{ width: '100%', maxHeight: 480, overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
                            <table className="admin-table" style={{ border: '1px solid var(--border)', borderRadius: 0, tableLayout: 'fixed', width: '100%', boxSizing: 'border-box', margin: 0, padding: 0 }}>
                              <thead>
                                <tr><th style={{ width: '8%', boxSizing: 'border-box' }}>{t('Ref', 'রেফ')}</th><th style={{ width: '10%', boxSizing: 'border-box' }}>{t('Rider', 'যাত্রী')}</th><th style={{ width: '13%', boxSizing: 'border-box' }}>{t('Pickup', 'পিকআপ')}</th><th style={{ width: '13%', boxSizing: 'border-box' }}>{t('Destination', 'গন্তব্য')}</th><th style={{ width: '8%', boxSizing: 'border-box' }}>{t('Fare', 'ভাড়া')}</th><th style={{ width: '8%', boxSizing: 'border-box' }}>{t('Their Rating', 'তাদের রেটিং')}</th><th style={{ width: '10%', boxSizing: 'border-box' }}>{t('Status', 'স্ট্যাটাস')}</th><th style={{ width: '10%', boxSizing: 'border-box' }}>{t('Date', 'তারিখ')}</th><th style={{ width: '12%', boxSizing: 'border-box' }}>{t('Action', 'অ্যাকশন')}</th></tr>
                              </thead>
                              <tbody>
                                {(() => {
                                  const q = ridesSearch.trim().toLowerCase()
                                  const getRiderRatingAvg = (r: Ride) => {
                                    const vals = [r.rating_rider_behavior, r.rating_rider_wait_time].filter(v => typeof v === 'number')
                                    if (vals.length) return Number((vals.reduce((s, v) => s + (v || 0), 0) / vals.length).toFixed(1))
                                    return r.rider_rating
                                  }
                                  let filtered = ridesFilter === 'all'
                                    ? rides
                                    : rides.filter((r) => String(r.status || '').toLowerCase() === ridesFilter)
                                  if (q) {
                                    filtered = filtered.filter((r) =>
                                      (r.ride_ref || '').toLowerCase().includes(q) ||
                                      (r.pickup_name || '').toLowerCase().includes(q) ||
                                      (r.destination_name || '').toLowerCase().includes(q) ||
                                      (r.rider_name || '').toLowerCase().includes(q)
                                    )
                                  }
                                  filtered = filtered.slice().sort((a, b) => {
                                    if (ridesSortBy === 'date-asc') return new Date(a.created_at || 0).getTime() - new Date(b.created_at || 0).getTime()
                                    if (ridesSortBy === 'fare-desc') return (b.fare_final ?? b.fare_estimate ?? 0) - (a.fare_final ?? a.fare_estimate ?? 0)
                                    if (ridesSortBy === 'fare-asc') return (a.fare_final ?? a.fare_estimate ?? 0) - (b.fare_final ?? b.fare_estimate ?? 0)
                                    return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime()
                                  })
                                  return filtered.length === 0 ? (
                                    <tr><td colSpan={9} style={{ textAlign: 'center', padding: 24, color: 'var(--text-sub)', boxSizing: 'border-box' }}>
                                      {rides.length === 0 ? t('No rides found', 'কোনো রাইড পাওয়া যায়নি') : t('No rides match your filters', 'ফিল্টারের সাথে মেলে এমন কোনো রাইড নেই')}
                                    </td></tr>
                                  ) : (
                                    filtered.map(r => {
                                      const riderRatingAvg = getRiderRatingAvg(r)
                                      return (
                                        <tr key={r.id} style={{ cursor: 'pointer' }}>
                                          <td style={{ boxSizing: 'border-box' }}>{r.ride_ref || r.id?.slice(0, 8)}</td>
                                          <td style={{ boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.rider_name || '—'}</td>
                                          <td style={{ boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.pickup_name || '—'}</td>
                                          <td style={{ boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.destination_name || '—'}</td>
                                          <td style={{ boxSizing: 'border-box' }}>৳{r.fare_final ?? r.fare_estimate ?? '—'}</td>
                                          <td style={{ boxSizing: 'border-box' }}>{riderRatingAvg ? `⭐ ${riderRatingAvg}` : '—'}</td>
                                          <td style={{ boxSizing: 'border-box' }}><span className={`admin-badge ${r.status || 'neutral'}`}>{r.status || '—'}</span></td>
                                          <td style={{ boxSizing: 'border-box' }}>{r.created_at ? new Date(r.created_at).toLocaleDateString() : '—'}</td>
                                          <td style={{ boxSizing: 'border-box' }}>
                                            <button
                                              className="admin-btn success"
                                              onClick={() => setSelectedRide(r)}
                                              style={{ padding: '4px 8px', fontSize: 12 }}
                                            >
                                              {t('View Details', 'বিবরণ দেখুন')}
                                            </button>
                                          </td>
                                        </tr>
                                      )
                                    })
                                  )
                                })()}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </>
                    )}
                  </section>
                )}

                {tab === 'vehicles' && (
                  <section>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20, gap: 12 }}>
                      <h3 className="admin-heading" style={{ margin: 0 }}>{t('Vehicles', 'গাড়ি')}</h3>
                      {!showVehicleForm && (
                        <button className="btn driver-add-vehicle-btn" onClick={toggleVehicleForm} style={{ padding: '8px 16px', fontSize: 14 }}>
                          <span style={{ marginRight: 6 }}>+</span>
                          <span>{t('Add Vehicle', 'গাড়ি যোগ করুন')}</span>
                        </button>
                      )}
                    </div>

                    {showVehicleForm && (
                      <div className="admin-modal-overlay driver-modal-overlay">
                        <div className="admin-modal admin-modal-wide driver-modal" style={{ maxWidth: 860, width: '90%', borderRadius: 24 }}>
                          <div className="admin-modal-header" style={{ padding: '24px 32px' }}>
                            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{t('Add a new vehicle', 'নতুন গাড়ি যোগ করুন')}</h3>
                            <button className="admin-modal-close" onClick={toggleVehicleForm} style={{ background: 'rgba(15,23,42,0.06)', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: 'var(--text-sub)' }}>✕</button>
                          </div>
                          <div className="admin-modal-body" style={{ padding: '0 32px 32px', maxHeight: '75vh', overflowY: 'auto' }}>
                            <div ref={vehicleFormAnchorRef} />

                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16, marginTop: 4 }}>
                              {(['vehicle_type', 'vehicle_model', 'vehicle_plate', 'year', 'color', 'capacity', 'registration_number', 'engine_chassis_number'] as const).map((key) => {
                                const labels: Record<string, string> = {
                                  vehicle_type: t('Type', 'ধরন'),
                                  vehicle_model: t('Model', 'মডেল'),
                                  vehicle_plate: t('Plate No.', 'প্লেট নম্বর'),
                                  year: t('Year', 'বছর'),
                                  color: t('Color', 'রং'),
                                  capacity: t('Capacity', 'ধারণক্ষমতা'),
                                  registration_number: t('Reg. No.', 'নিবন্ধন নম্বর'),
                                  engine_chassis_number: t('Engine/Chassis', 'ইঞ্জিন/চ্যাসিস')
                                }
                                return (
                                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      {labels[key]}
                                    </label>
                                    <input
                                      style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}
                                      value={(vehicleForm[key as keyof typeof vehicleForm] as string) || ''}
                                      onChange={(e) => setVehicleForm({ ...vehicleForm, [key]: e.target.value })}
                                    />
                                  </div>
                                )
                              })}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                              <label style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {t('Notes', 'নোট')}
                              </label>
                              <textarea
                                style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', minHeight: 72, resize: 'vertical' }}
                                value={vehicleForm.notes}
                                onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })}
                              />
                            </div>

                            <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {t('Vehicle Photos', 'গাড়ির ছবি')}
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                              {(['vehicle_front_image', 'vehicle_rear_image', 'vehicle_left_image', 'vehicle_right_image'] as const).map((key) => {
                                const labels: Record<string, string> = {
                                  vehicle_front_image: t('Front', 'সামনে'),
                                  vehicle_rear_image: t('Rear', 'পেছনে'),
                                  vehicle_left_image: t('Left', 'বাম'),
                                  vehicle_right_image: t('Right', 'ডান')
                                }
                                return (
                                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      {labels[key]}
                                    </label>
                                    {(vehicleForm[key] as string) ? (
                                      <img src={vehicleForm[key] as string} alt={labels[key]} style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                    ) : (
                                      <img src="/assets/dummy-vehicle.png" alt="no photo" style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                    )}
                                    <label style={{ padding: '6px 10px', fontSize: 12, textAlign: 'center', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
                                      📸 {t('Upload', 'আপলোড')}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => onVehiclePhotoSelect(e, key)}
                                      />
                                    </label>
                                  </div>
                                )
                              })}
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button onClick={toggleVehicleForm} style={{
                                padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b',
                                cursor: 'pointer', transition: 'all 160ms ease',
                              }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                              >
                                {t('Cancel', 'বাতিল')}
                              </button>
                              <button onClick={() => void addVehicle()} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff',
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
                                transition: 'transform 160ms ease, box-shadow 160ms ease',
                              }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(79,70,229,0.35)' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)' }}
                              >
                                {t('✓ Add Vehicle', '✓ গাড়ি যোগ করুন')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {editingVehicle && (
                      <div className="admin-modal-overlay driver-modal-overlay">
                        <div className="admin-modal admin-modal-wide driver-modal" style={{ maxWidth: 860, width: '90%', borderRadius: 24 }}>
                          <div className="admin-modal-header" style={{ padding: '24px 32px' }}>
                            <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{t('Edit Vehicle', 'গাড়ি সম্পাদনা করুন')}</h3>
                            <button className="admin-modal-close" onClick={() => setEditingVehicle(null)} style={{ background: 'rgba(15,23,42,0.06)', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: 'var(--text-sub)' }}>✕</button>
                          </div>
                          <div className="admin-modal-body" style={{ padding: '0 32px 32px', maxHeight: '75vh', overflowY: 'auto' }}>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12, marginBottom: 16, marginTop: 4 }}>
                              {(['vehicle_type', 'vehicle_model', 'vehicle_plate', 'year', 'color', 'capacity', 'registration_number', 'engine_chassis_number'] as const).map((key) => {
                                const labels: Record<string, string> = {
                                  vehicle_type: t('Type', 'ধরন'),
                                  vehicle_model: t('Model', 'মডেল'),
                                  vehicle_plate: t('Plate No.', 'প্লেট নম্বর'),
                                  year: t('Year', 'বছর'),
                                  color: t('Color', 'রং'),
                                  capacity: t('Capacity', 'ধারণক্ষমতা'),
                                  registration_number: t('Reg. No.', 'নিবন্ধন নম্বর'),
                                  engine_chassis_number: t('Engine/Chassis', 'ইঞ্জিন/চ্যাসিস')
                                }
                                return (
                                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      {labels[key]}
                                    </label>
                                    <input
                                      style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff' }}
                                      value={(vehicleForm[key as keyof typeof vehicleForm] as string) || ''}
                                      onChange={(e) => setVehicleForm({ ...vehicleForm, [key]: e.target.value })}
                                    />
                                  </div>
                                )
                              })}
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginBottom: 16 }}>
                              <label style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                {t('Notes', 'নোট')}
                              </label>
                              <textarea
                                style={{ padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, fontSize: 14, background: '#fff', minHeight: 72, resize: 'vertical' }}
                                value={vehicleForm.notes}
                                onChange={(e) => setVehicleForm({ ...vehicleForm, notes: e.target.value })}
                              />
                            </div>

                            <h5 style={{ margin: '0 0 12px', fontSize: 13, fontWeight: 600, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                              {t('Vehicle Photos', 'গাড়ির ছবি')}
                            </h5>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 }}>
                              {(['vehicle_front_image', 'vehicle_rear_image', 'vehicle_left_image', 'vehicle_right_image'] as const).map((key) => {
                                const labels: Record<string, string> = {
                                  vehicle_front_image: t('Front', 'সামনে'),
                                  vehicle_rear_image: t('Rear', 'পেছনে'),
                                  vehicle_left_image: t('Left', 'বাম'),
                                  vehicle_right_image: t('Right', 'ডান')
                                }
                                return (
                                  <div key={key} style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                                    <label style={{ fontSize: 11, color: 'var(--text-sub)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                                      {labels[key]}
                                    </label>
                                    {(vehicleForm[key] as string) ? (
                                      <img src={vehicleForm[key] as string} alt={labels[key]} style={{ width: '100%', height: 96, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--border)' }} />
                                    ) : (
                                      <div style={{ height: 96, borderRadius: 8, border: '1px dashed var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', fontSize: 12 }}>
                                        {t('No photo', 'ছবি নেই')}
                                      </div>
                                    )}
                                    <label style={{ padding: '6px 10px', fontSize: 12, textAlign: 'center', borderRadius: 6, border: '1px solid var(--border)', background: '#fff', cursor: 'pointer', fontWeight: 500, transition: 'all 0.2s' }}>
                                      📸 {t('Upload', 'আপলোড')}
                                      <input
                                        type="file"
                                        accept="image/*"
                                        style={{ display: 'none' }}
                                        onChange={(e) => onVehiclePhotoSelect(e, key)}
                                      />
                                    </label>
                                  </div>
                                )
                              })}
                            </div>

                            <div style={{ display: 'flex', gap: 12, marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', justifyContent: 'flex-end', alignItems: 'center' }}>
                              <button onClick={() => { setEditingVehicle(null); setVehicleForm({ ...vehicleForm, vehicle_type: '', vehicle_model: '', vehicle_plate: '', color: '', capacity: '', registration_number: '', engine_chassis_number: '', notes: '', vehicle_front_image: '', vehicle_rear_image: '', vehicle_left_image: '', vehicle_right_image: '' }); }} style={{
                                padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b',
                                cursor: 'pointer', transition: 'all 160ms ease',
                              }}
                                onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                                onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                              >
                                {t('Cancel', 'বাতিল')}
                              </button>
                              <button onClick={() => void updateVehicle()} style={{
                                display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                                padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff',
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
                                transition: 'transform 160ms ease, box-shadow 160ms ease',
                              }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(79,70,229,0.35)' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)' }}
                              >
                                {t('✓ Save Changes', '✓ পরিবর্তন সংরক্ষণ করুন')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}


                    {vehicles.length === 0 ? (
                      <div className="admin-card" style={{ color: 'var(--text-sub)', textAlign: 'center', padding: 32 }}>
                        {t('No vehicles added yet. Click "Add Vehicle" to get started.', 'এখনও কোনো গাড়ি যোগ করা হয়নি। শুরু করতে "গাড়ি যোগ করুন" ক্লিক করুন।')}
                      </div>
                    ) : (
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 16 }}>
                        {vehicles.map(v => (
                          <div key={v.id} className="admin-card">
                            {/* Card header — title/badge + action buttons */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                                <span style={{ fontWeight: 600, fontSize: 15 }}>{v.vehicle_model || t('Vehicle', 'গাড়ি')}</span>
                                {v.is_primary && (
                                  <span className="admin-badge active" style={{ fontSize: 11 }}>★ {t('Active', 'সক্রিয়')}</span>
                                )}
                              </div>
                              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                                {!v.is_primary && (
                                  <button className="admin-btn" style={{ padding: '4px 10px', fontSize: 12, background: 'var(--primary)', color: '#fff' }}
                                    onClick={() => void setVehicleAsActive(v.id)}>
                                    ★ {t('Set Active', 'সক্রিয় করুন')}
                                  </button>
                                )}
                                <button className="admin-btn" style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => {
                                    setEditingVehicle(v)
                                    setVehicleForm({
                                      vehicle_type: v.vehicle_type,
                                      vehicle_model: v.vehicle_model || '',
                                      vehicle_plate: v.vehicle_plate,
                                      driver_license: '',
                                      color: v.color || '',
                                      capacity: v.capacity || '',
                                      registration_number: v.registration_number || '',
                                      engine_chassis_number: v.engine_number || '',
                                      notes: v.notes || '',
                                      vehicle_front_image: v.vehicle_front_image || '',
                                      vehicle_rear_image: v.vehicle_rear_image || '',
                                      vehicle_left_image: v.vehicle_left_image || '',
                                      vehicle_right_image: v.vehicle_right_image || ''
                                    })
                                  }}>
                                  ✏️ {t('Edit', 'সম্পাদনা')}
                                </button>
                                <button className="admin-btn" style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => openVehicleGallery(v)}>
                                  👁️ {t('View', 'দেখুন')}
                                </button>
                                <button className="admin-btn danger" style={{ padding: '4px 10px', fontSize: 12 }}
                                  onClick={() => setPendingDeleteVehicle(v)}>
                                  🗑️
                                </button>
                              </div>
                            </div>

                            {/* Image gallery */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 }}>
                              {([
                                ['Front', v.vehicle_front_image],
                                ['Rear', v.vehicle_rear_image],
                                ['Left', v.vehicle_left_image],
                                ['Right', v.vehicle_right_image],
                              ] as [string, string | undefined][]).map(([label, src]) => (
                                <div key={label} style={{ display: 'grid', gap: 4 }}>
                                  <img src={src || '/assets/dummy-vehicle.png'} alt={`${label} view`} style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8 }} />
                                  <div style={{ fontSize: 11, color: 'var(--text-sub)', textAlign: 'center' }}>{t(label, label === 'Front' ? 'সামনে' : label === 'Rear' ? 'পেছনে' : label === 'Left' ? 'বাম' : 'ডান')}</div>
                                </div>
                              ))}
                            </div>

                            {/* Vehicle details */}
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
                                  <span style={{ color: 'var(--text-sub)' }}>{t(label, label === 'Type' ? 'ধরন' : label === 'Model' ? 'মডেল' : label === 'Plate' ? 'প্লেট' : label === 'Color' ? 'রং' : label === 'Capacity' ? 'ধারণক্ষমতা' : label === 'Reg. No.' ? 'নিবন্ধন' : label === 'Year' ? 'বছর' : label === 'Engine/Chassis' ? 'ইঞ্জিন' : 'নোট')}</span>
                                  <span style={{ fontWeight: 600 }}>{val || '—'}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {saveState && <div style={{ marginTop: 12, padding: '10px 12px', borderRadius: 8, fontSize: 13, background: saveState.includes('fail') || saveState.includes('error') ? '#fff0f0' : '#f0faf5', color: saveState.includes('fail') || saveState.includes('error') ? 'var(--danger)' : 'var(--primary)', fontWeight: 600 }}>{saveState}</div>}
                  </section>
                )}

                {tab === 'earnings' && (
                  <section>
                    <h3 className="admin-heading">{t('Earnings', 'আয়')}</h3>

                    {earningsLoading
                      ? <div className="driver-loading">{t('Loading wallet…', 'লোড হচ্ছে…')}</div>
                      : (
                        <>
                          {/* Balance overview */}
                          <div className="driver-earnings-grid">
                            <div className="driver-earnings-card driver-earnings-balance">
                              <div className="driver-earnings-card-icon">💰</div>
                              <div className="driver-earnings-card-label">{t('Current Balance', 'বর্তমান ব্যালেন্স')}</div>
                              <div className="driver-earnings-card-value">৳{Number(earningSummary?.wallet?.balance ?? 0).toFixed(2)}</div>
                            </div>
                            <div className="driver-earnings-card">
                              <div className="driver-earnings-card-icon">📈</div>
                              <div className="driver-earnings-card-label">{t('Total Earned', 'মোট আয়')}</div>
                              <div className="driver-earnings-card-value">৳{Number(earningSummary?.wallet?.total_earned ?? 0).toFixed(2)}</div>
                            </div>
                            <div className="driver-earnings-card">
                              <div className="driver-earnings-card-icon">📤</div>
                              <div className="driver-earnings-card-label">{t('Total Withdrawn', 'মোট উত্তোলন')}</div>
                              <div className="driver-earnings-card-value">৳{Number(earningSummary?.wallet?.total_withdrawn ?? 0).toFixed(2)}</div>
                            </div>
                          </div>

                          {/* Tax breakdown */}
                          {earningSummary && (
                            <div className="driver-tax-card">
                              <div className="driver-tax-card-title">📋 {t('Tax & Fee Breakdown', 'কর ও ফি বিশ্লেষণ')}</div>
                              <div className="driver-tax-row">
                                <span>{t('Gross Earnings', 'মোট আয় (পরিষ্কারের আগে)')}</span>
                                <span>৳{Number(earningSummary.tax_breakdown?.gross_earned ?? 0).toFixed(2)}</span>
                              </div>
                              <div className="driver-tax-row driver-tax-deduction">
                                <span>{t('Platform Fee (5%)', 'প্ল্যাটফর্ম ফি (৫%)')}</span>
                                <span>-৳{Number(earningSummary.tax_breakdown?.platform_fee ?? 0).toFixed(2)}</span>
                              </div>
                              <div className="driver-tax-row driver-tax-deduction">
                                <span>{t('VAT (1%)', 'ভ্যাট (১%)')}</span>
                                <span>-৳{Number(earningSummary.tax_breakdown?.tax_vat ?? 0).toFixed(2)}</span>
                              </div>
                              <div className="driver-tax-row driver-tax-net">
                                <span><strong>{t('Net Earned', 'নিট আয়')}</strong></span>
                                <span><strong>৳{Number(earningSummary.tax_breakdown?.net_earned ?? 0).toFixed(2)}</strong></span>
                              </div>
                              <div className="driver-tax-row" style={{ fontSize: 13, color: '#888', marginTop: 4 }}>
                                <span>{t('Based on', 'ভিত্তি')}</span>
                                <span>{earningSummary.tax_breakdown?.ride_count ?? 0} {t('completed rides', 'সম্পন্ন রাইড')}</span>
                              </div>
                            </div>
                          )}

                          {/* Withdraw */}
                          <div className="driver-section-card">
                            <div className="driver-section-card-header">
                              <span>💸 {t('Withdraw Money', 'টাকা তুলুন')}</span>
                              <button
                                className="driver-btn-sm"
                                onClick={() => {
                                  setShowWithdrawForm((prev) => !prev)
                                  setWithdrawOtpSent(false)
                                  setWithdrawOtp('')
                                  setWithdrawState('')
                                }}
                              >
                                {showWithdrawForm ? t('Cancel', 'বাতিল') : t('Withdraw', 'উত্তোলন')}
                              </button>
                            </div>
                            {showWithdrawForm && (
                              <div className="driver-form-block">
                                {!withdrawOtpSent ? (
                                  <>
                                    <div className="driver-form-row">
                                      <label>{t('Select Recipient', 'প্রাপক বেছে নিন')}</label>
                                      <select
                                        value={withdrawRecipientId}
                                        onChange={(e) => setWithdrawRecipientId(e.target.value)}
                                        className="driver-input"
                                      >
                                        <option value="">{t('-- select --', '-- বেছে নিন --')}</option>
                                        {recipients.filter((r) => r.verified).map((r) => (
                                          <option key={r.id} value={r.id}>
                                            {r.gateway.toUpperCase()} – {r.number}{r.label ? ` (${r.label})` : ''}
                                          </option>
                                        ))}
                                      </select>
                                    </div>
                                    <div className="driver-form-row">
                                      <label>{t('Amount (৳)', 'পরিমাণ (৳)')}</label>
                                      <input
                                        type="number"
                                        min={1}
                                        placeholder="0.00"
                                        value={withdrawAmount}
                                        onChange={(e) => setWithdrawAmount(e.target.value)}
                                        className="driver-input"
                                      />
                                    </div>
                                    {withdrawState && (
                                      <div className={`driver-form-msg ${withdrawState.startsWith('✅') ? 'success' : 'error'}`}>
                                        {withdrawState}
                                      </div>
                                    )}
                                    <button
                                      className="driver-btn-primary"
                                      disabled={!withdrawRecipientId || !withdrawAmount || Number(withdrawAmount) <= 0 || withdrawOtpLoading}
                                      onClick={async () => {
                                        setWithdrawState('')
                                        setWithdrawOtpLoading(true)
                                        try {
                                          await api.earnings.withdrawSendOtp()
                                          setWithdrawOtpSent(true)
                                          setWithdrawOtp('')
                                        } catch (err: any) {
                                          setWithdrawState('❌ ' + (err?.message || t('Failed to send OTP', 'OTP পাঠানো ব্যর্থ')))
                                        } finally {
                                          setWithdrawOtpLoading(false)
                                        }
                                      }}
                                    >
                                      {withdrawOtpLoading ? t('Sending OTP…', 'OTP পাঠানো হচ্ছে…') : t('Send OTP', 'OTP পাঠান')}
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <p style={{ fontSize: 14, marginBottom: 8, color: '#555' }}>
                                      {t('Enter the 4-digit OTP sent to your registered phone.', 'আপনার নিবন্ধিত ফোনে পাঠানো ৪-সংখ্যার OTP লিখুন।')}
                                    </p>
                                    <div className="driver-form-row">
                                      <label>{t('OTP', 'OTP')}</label>
                                      <input
                                        type="text"
                                        inputMode="numeric"
                                        pattern="[0-9]*"
                                        maxLength={4}
                                        placeholder="1234"
                                        value={withdrawOtp}
                                        onChange={(e) => setWithdrawOtp(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                        className="driver-input"
                                        autoFocus
                                      />
                                    </div>
                                    {withdrawState && (
                                      <div className={`driver-form-msg ${withdrawState.startsWith('✅') ? 'success' : 'error'}`}>
                                        {withdrawState}
                                      </div>
                                    )}
                                    <div style={{ display: 'flex', gap: 8 }}>
                                      <button
                                        className="driver-btn-sm"
                                        onClick={() => { setWithdrawOtpSent(false); setWithdrawOtp(''); setWithdrawState('') }}
                                      >
                                        {t('← Back', '← পিছনে')}
                                      </button>
                                      <button
                                        className="driver-btn-primary"
                                        disabled={withdrawOtp.length < 4 || withdrawOtpLoading}
                                        onClick={async () => {
                                          setWithdrawState('')
                                          setWithdrawOtpLoading(true)
                                          try {
                                            await api.earnings.withdraw({ recipient_id: withdrawRecipientId, amount: Number(withdrawAmount), otp: withdrawOtp })
                                            setWithdrawState('✅ ' + t('Withdrawal submitted!', 'উত্তোলন সফল হয়েছে!'))
                                            setWithdrawAmount('')
                                            setWithdrawRecipientId('')
                                            setWithdrawOtp('')
                                            setWithdrawOtpSent(false)
                                            setShowWithdrawForm(false)
                                            // Refresh summary
                                            const res = await api.earnings.summary()
                                            setEarningSummary((res as any) ?? null)
                                            const txnRes = await api.earnings.transactions()
                                            const txArr = (txnRes as any)?.transactions ?? txnRes
                                            setTransactions(Array.isArray(txArr) ? txArr : [])
                                          } catch (err: any) {
                                            setWithdrawState('❌ ' + (err?.message || t('Failed', 'ব্যর্থ')))
                                          } finally {
                                            setWithdrawOtpLoading(false)
                                          }
                                        }}
                                      >
                                        {withdrawOtpLoading ? t('Processing…', 'প্রক্রিয়াকরণ…') : t('Confirm Withdrawal', 'উত্তোলন নিশ্চিত করুন')}
                                      </button>
                                    </div>
                                  </>
                                )}
                              </div>
                            )}
                          </div>

                          {/* Payment recipients */}
                          <div className="driver-section-card">
                            <div className="driver-section-card-header">
                              <span>📲 {t('Payment Recipients', 'পেমেন্ট প্রাপক')}</span>
                              {recipientStep === null && (
                                <button className="driver-btn-sm" onClick={() => {
                                  setRecipientStep('form')
                                  setRecipientState('')
                                  setRecipientGateway('bkash')
                                  setRecipientNumber('')
                                  setRecipientLabel('')
                                  setRecipientOtp('')
                                }}>
                                  + {t('Add', 'যোগ করুন')}
                                </button>
                              )}
                            </div>

                            {recipientStep === 'form' && (
                              <div className="driver-form-block">
                                <div className="driver-form-row">
                                  <label>{t('Gateway', 'গেটওয়ে')}</label>
                                  <div className="driver-gateway-toggle">
                                    {(['bkash', 'nagad'] as const).map((gw) => (
                                      <button
                                        key={gw}
                                        className={`driver-gateway-btn ${recipientGateway === gw ? 'active' : ''} driver-gateway-${gw}`}
                                        onClick={() => setRecipientGateway(gw)}
                                      >
                                        {gw === 'bkash' ? '🔴 bKash' : '🟠 Nagad'}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div className="driver-form-row">
                                  <label>{t('Mobile Number', 'মোবাইল নম্বর')}</label>
                                  <input
                                    type="tel"
                                    placeholder="01XXXXXXXXX"
                                    value={recipientNumber}
                                    onChange={(e) => setRecipientNumber(e.target.value)}
                                    className="driver-input"
                                    maxLength={11}
                                  />
                                </div>
                                <div className="driver-form-row">
                                  <label>{t('Label (optional)', 'লেবেল (ঐচ্ছিক)')}</label>
                                  <input
                                    type="text"
                                    placeholder={t('e.g. My bKash', 'যেমন: আমার বিকাশ')}
                                    value={recipientLabel}
                                    onChange={(e) => setRecipientLabel(e.target.value)}
                                    className="driver-input"
                                  />
                                </div>
                                {recipientState && (
                                  <div className={`driver-form-msg ${recipientState.startsWith('✅') ? 'success' : 'error'}`}>
                                    {recipientState}
                                  </div>
                                )}
                                <div className="driver-form-actions">
                                  <button
                                    className="driver-btn-primary"
                                    disabled={recipientNumber.length < 11}
                                    onClick={async () => {
                                      setRecipientState('')
                                      try {
                                        await api.earnings.addRecipient({
                                          gateway: recipientGateway,
                                          number: recipientNumber,
                                          label: recipientLabel || undefined
                                        })
                                        setRecipientStep('otp')
                                        setRecipientState(t('OTP sent to your number. Enter it below.', 'OTP পাঠানো হয়েছে। নিচে লিখুন।'))
                                      } catch (err: any) {
                                        setRecipientState('❌ ' + (err?.message || t('Failed', 'ব্যর্থ')))
                                      }
                                    }}
                                  >
                                    {t('Send OTP', 'OTP পাঠান')}
                                  </button>
                                  <button className="driver-btn-ghost" onClick={() => { setRecipientStep(null); setRecipientState('') }}>
                                    {t('Cancel', 'বাতিল')}
                                  </button>
                                </div>
                              </div>
                            )}

                            {recipientStep === 'otp' && (
                              <div className="driver-form-block">
                                <p className="driver-otp-hint">
                                  {t(`OTP sent to ${recipientGateway.toUpperCase()} ${recipientNumber}`, `${recipientGateway.toUpperCase()} ${recipientNumber}-এ OTP পাঠানো হয়েছে`)}
                                </p>
                                <div className="driver-form-row">
                                  <label>{t('Enter OTP', 'OTP লিখুন')}</label>
                                  <input
                                    type="text"
                                    placeholder="4-digit OTP"
                                    value={recipientOtp}
                                    onChange={(e) => setRecipientOtp(e.target.value)}
                                    className="driver-input driver-otp-input"
                                    maxLength={4}
                                  />
                                </div>
                                {recipientState && (
                                  <div className={`driver-form-msg ${recipientState.startsWith('✅') ? 'success' : 'error'}`}>
                                    {recipientState}
                                  </div>
                                )}
                                <div className="driver-form-actions">
                                  <button
                                    className="driver-btn-primary"
                                    disabled={recipientOtp.length < 4}
                                    onClick={async () => {
                                      setRecipientState('')
                                      try {
                                        await api.earnings.verifyRecipient({
                                          gateway: recipientGateway,
                                          number: recipientNumber,
                                          otp: recipientOtp
                                        })
                                        setRecipientState('✅ ' + t('Recipient added successfully!', 'প্রাপক সফলভাবে যোগ হয়েছে!'))
                                        setRecipientStep(null)
                                        const recRes = await api.earnings.listRecipients()
                                        const recArr = (recRes as any)?.recipients ?? recRes
                                        setRecipients(Array.isArray(recArr) ? recArr : [])
                                      } catch (err: any) {
                                        setRecipientState('❌ ' + (err?.message || t('Invalid OTP', 'ভুল OTP')))
                                      }
                                    }}
                                  >
                                    {t('Verify OTP', 'OTP যাচাই করুন')}
                                  </button>
                                  <button className="driver-btn-ghost" onClick={() => setRecipientStep('form')}>
                                    {t('Back', 'পিছে যান')}
                                  </button>
                                </div>
                              </div>
                            )}

                            <div className="driver-recipient-list">
                              {recipients.length === 0 && recipientStep === null && (
                                <p className="driver-empty-hint">{t('No recipients added yet.', 'এখনও কোনো প্রাপক যোগ করা হয়নি।')}</p>
                              )}
                              {recipients.map((rec) => (
                                <div key={rec.id} className="driver-recipient-item">
                                  <span className={`driver-gateway-badge driver-gateway-badge-${rec.gateway}`}>
                                    {rec.gateway === 'bkash' ? '🔴 bKash' : '🟠 Nagad'}
                                  </span>
                                  <div className="driver-recipient-info">
                                    <span className="driver-recipient-number">{rec.number}</span>
                                    {rec.label && <span className="driver-recipient-label">{rec.label}</span>}
                                  </div>
                                  <div className="driver-recipient-actions">
                                    {rec.verified
                                      ? <span className="driver-verified-badge">✅ {t('Verified', 'যাচাইকৃত')}</span>
                                      : inlineVerifyId === rec.id
                                        ? (
                                          <div className="driver-inline-verify">
                                            <input
                                              type="text"
                                              placeholder="4-digit OTP"
                                              value={inlineVerifyOtp}
                                              onChange={(e) => setInlineVerifyOtp(e.target.value)}
                                              className="driver-input driver-otp-input"
                                              maxLength={4}
                                              style={{ width: 90 }}
                                            />
                                            <button
                                              className="driver-btn-primary"
                                              style={{ padding: '5px 10px', fontSize: 12 }}
                                              disabled={inlineVerifyOtp.length < 4}
                                              onClick={async () => {
                                                setInlineVerifyState('')
                                                try {
                                                  await api.earnings.verifyRecipient({ gateway: rec.gateway, number: rec.number, otp: inlineVerifyOtp })
                                                  setInlineVerifyId('')
                                                  setInlineVerifyOtp('')
                                                  const recRes = await api.earnings.listRecipients()
                                                  const recArr = (recRes as any)?.recipients ?? recRes
                                                  setRecipients(Array.isArray(recArr) ? recArr : [])
                                                } catch (err: any) {
                                                  setInlineVerifyState('❌ ' + (err?.message || t('Invalid OTP', 'ভুল OTP')))
                                                }
                                              }}
                                            >✓</button>
                                            <button
                                              className="driver-btn-ghost"
                                              style={{ padding: '4px 8px', fontSize: 12 }}
                                              onClick={() => { setInlineVerifyId(''); setInlineVerifyOtp(''); setInlineVerifyState('') }}
                                            >✕</button>
                                            {inlineVerifyState && <span style={{ fontSize: 11, color: '#e05252' }}>{inlineVerifyState}</span>}
                                          </div>
                                        )
                                        : (
                                          <button
                                            className="driver-btn-sm"
                                            style={{ fontSize: 11 }}
                                            disabled={resendingOtpId === rec.id}
                                            onClick={async () => {
                                              setResendingOtpId(rec.id)
                                              try {
                                                await api.earnings.addRecipient({ gateway: rec.gateway, number: rec.number })
                                                setInlineVerifyId(rec.id)
                                                setInlineVerifyOtp('')
                                                setInlineVerifyState('')
                                              } catch { /* silent */ } finally { setResendingOtpId('') }
                                            }}
                                          >
                                            {resendingOtpId === rec.id ? '…' : t('Verify Now', 'যাচাই করুন')}
                                          </button>
                                        )
                                    }
                                    <button
                                      className="driver-btn-danger-sm"
                                      disabled={deletingRecipientId === rec.id}
                                      onClick={async () => {
                                        if (!confirm(t('Remove this recipient?', 'এই প্রাপক সরাবেন?'))) return
                                        setDeletingRecipientId(rec.id)
                                        try {
                                          await api.earnings.deleteRecipient(rec.id)
                                          setRecipients((prev) => prev.filter((r) => r.id !== rec.id))
                                        } catch { /* silent */ } finally {
                                          setDeletingRecipientId('')
                                        }
                                      }}
                                    >
                                      {deletingRecipientId === rec.id ? '…' : t('Remove', 'সরান')}
                                    </button>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          {/* Transaction history */}
                          <div className="driver-section-card">
                            <div className="driver-section-card-header">
                              <span>📜 {t('Transaction History', 'লেনদেনের ইতিহাস')}</span>
                            </div>
                            <div className="list-controls" style={{ padding: '0 0 4px' }}>
                              <input
                                className="list-search"
                                placeholder={t('Search by type, note, gateway…', 'ধরন, নোট, গেটওয়ে দিয়ে খুঁজুন…')}
                                value={txnSearch}
                                onChange={(e) => setTxnSearch(e.target.value)}
                              />
                              <select className="list-sort" value={txnSortBy} onChange={(e) => setTxnSortBy(e.target.value as typeof txnSortBy)}>
                                <option value="date-desc">{t('Newest first', 'নতুন আগে')}</option>
                                <option value="date-asc">{t('Oldest first', 'পুরনো আগে')}</option>
                                <option value="amount-desc">{t('Amount: high → low', 'পরিমাণ: বেশি → কম')}</option>
                                <option value="amount-asc">{t('Amount: low → high', 'পরিমাণ: কম → বেশি')}</option>
                              </select>
                            </div>
                            {transactions.length === 0
                              ? <p className="driver-empty-hint">{t('No transactions yet.', 'এখনও কোনো লেনদেন নেই।')}</p>
                              : (() => {
                                const tq = txnSearch.trim().toLowerCase()
                                let txns = tq
                                  ? transactions.filter((txn) =>
                                    (txn.type || '').toLowerCase().replace(/_/g, ' ').includes(tq) ||
                                    (txn.note || '').toLowerCase().includes(tq) ||
                                    (txn.gateway || '').toLowerCase().includes(tq)
                                  )
                                  : transactions
                                txns = txns.slice().sort((a, b) => {
                                  if (txnSortBy === 'date-asc') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
                                  if (txnSortBy === 'amount-desc') return Number(b.amount) - Number(a.amount)
                                  if (txnSortBy === 'amount-asc') return Number(a.amount) - Number(b.amount)
                                  return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
                                })
                                return txns.length === 0
                                  ? <p className="driver-empty-hint">{t('No transactions match your search.', 'কোনো লেনদেন পাওয়া যায়নি।')}</p>
                                  : (
                                    <div className="driver-txn-list">
                                      {txns.map((txn) => (
                                        <div key={txn.id} className={`driver-txn-item driver-txn-${txn.direction}`}>
                                          <div className="driver-txn-left">
                                            <span className="driver-txn-type-badge">{txn.type.replace(/_/g, ' ')}</span>
                                            <span className="driver-txn-note">{txn.note || txn.gateway || '—'}</span>
                                            <span className="driver-txn-date">
                                              {new Date(txn.created_at).toLocaleString('en-BD', { dateStyle: 'medium', timeStyle: 'short' })}
                                            </span>
                                          </div>
                                          <div className={`driver-txn-amount driver-txn-${txn.direction}`}>
                                            {txn.direction === 'credit' ? '+' : '-'}৳{Number(txn.amount).toFixed(2)}
                                          </div>
                                        </div>
                                      ))}
                                    </div>
                                  )
                              })()
                            }
                          </div>
                        </>
                      )}
                  </section>
                )}

                {tab === 'ratings' && (() => {
                  const completedRides = rides.filter((r) => r.status === 'completed')
                  const ratedRides = completedRides.filter((r) => typeof r.driver_rating === 'number')
                  const catAvg = (key: 'rating_driving' | 'rating_behavior' | 'rating_cleanliness') => {
                    const vals = ratedRides.filter((r) => typeof r[key] === 'number')
                    if (!vals.length) return null
                    return Number((vals.reduce((s, r) => s + Number(r[key]), 0) / vals.length).toFixed(1))
                  }
                  const avgDriving = catAvg('rating_driving')
                  const avgBehavior = catAvg('rating_behavior')
                  const avgCleanliness = catAvg('rating_cleanliness')

                  const renderStars = (val: number | null | undefined, size: 'sm' | 'lg' = 'sm') => {
                    if (val == null) return <span className="rt-no-data">—</span>
                    const full = Math.round(val)
                    return (
                      <span className={`rt-stars rt-stars-${size}`}>
                        {[1, 2, 3, 4, 5].map((i) => (
                          <span key={i} className={`rt-star${i <= full ? ' filled' : ''}`}>★</span>
                        ))}
                      </span>
                    )
                  }

                  const sorted = completedRides.slice().sort(
                    (a, b) => new Date(b.completed_at || b.created_at || 0).getTime() - new Date(a.completed_at || a.created_at || 0).getTime()
                  )

                  const rq = ratingsSearch.trim().toLowerCase()
                  let displayedRides = rq
                    ? sorted.filter((r) =>
                      (r.ride_ref || '').toLowerCase().includes(rq) ||
                      (r.pickup_name || '').toLowerCase().includes(rq) ||
                      (r.destination_name || '').toLowerCase().includes(rq) ||
                      (r.rider_name || '').toLowerCase().includes(rq)
                    )
                    : sorted
                  displayedRides = displayedRides.slice().sort((a, b) => {
                    if (ratingsSortBy === 'date-asc') return new Date(a.completed_at || a.created_at || 0).getTime() - new Date(b.completed_at || b.created_at || 0).getTime()
                    if (ratingsSortBy === 'score-desc') return (b.driver_rating ?? -1) - (a.driver_rating ?? -1)
                    if (ratingsSortBy === 'score-asc') return (a.driver_rating ?? 99) - (b.driver_rating ?? 99)
                    return new Date(b.completed_at || b.created_at || 0).getTime() - new Date(a.completed_at || a.created_at || 0).getTime()
                  })

                  return (
                    <section>
                      {selectedRide ? (
                        <AdminRideDetail rideId={selectedRide.id} onBack={() => setSelectedRide(null)} />
                      ) : (
                        <>
                          {/* ── Overall header ── */}
                          <div className="rt-overview-card">
                            <div className="rt-overall-left">
                              <div className="rt-overall-score">{avgRating ?? '—'}</div>
                              {renderStars(avgRating, 'lg')}
                              <div className="rt-overall-count">
                                {ratedRides.length} {t('ratings', 'রেটিং')}
                              </div>
                            </div>
                          </div>

                          {/* ── Category Ratings Grid ── */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 12, marginBottom: 20 }}>
                            <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 8, textTransform: 'uppercase' }}>{t('Driving', 'ড্রাইভিং')}</div>
                              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>{avgDriving ?? '—'}</div>
                              {renderStars(avgDriving, 'sm')}
                            </div>
                            <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 8, textTransform: 'uppercase' }}>{t('Behaviour', 'আচরণ')}</div>
                              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>{avgBehavior ?? '—'}</div>
                              {renderStars(avgBehavior, 'sm')}
                            </div>
                            <div style={{ padding: 16, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border)', textAlign: 'center' }}>
                              <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)', marginBottom: 8, textTransform: 'uppercase' }}>{t('Cleanliness', 'পরিচ্ছন্নতা')}</div>
                              <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--primary)', marginBottom: 6 }}>{avgCleanliness ?? '—'}</div>
                              {renderStars(avgCleanliness, 'sm')}
                            </div>
                          </div>

                          {/* ── Rating Reminder for unrated rides ── */}
                          {(() => {
                            const unratedRides = completedRides.filter(r => r.rider_rating == null)
                            if (unratedRides.length > 0) {
                              return (
                                <div style={{ marginBottom: 16, padding: 16, borderRadius: 8, background: '#dbeafe', border: '1px solid #93c5fd', display: 'flex', gap: 12, alignItems: 'center' }}>
                                  <span style={{ fontSize: 24 }}>⭐</span>
                                  <div style={{ flex: 1 }}>
                                    <div style={{ fontWeight: 600, color: '#0c2d6b', marginBottom: 4 }}>{t('Rate Your Passengers', 'আপনার যাত্রীদের রেটিং দিন')}</div>
                                    <div style={{ fontSize: 13, color: '#0369a1' }}>
                                      {t(`You have ${unratedRides.length} completed ride${unratedRides.length !== 1 ? 's' : ''} waiting for your feedback. Rate your passengers below!`,
                                        `আপনার ${unratedRides.length}টি সম্পন্ন রাইড রেটিং অপেক্ষায়। নিচে আপনার যাত্রীদের রেটিং দিন!`)}
                                    </div>
                                  </div>
                                </div>
                              )
                            }
                            return null
                          })()}

                          {/* ── Filters and Sort Controls ── */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 12, marginBottom: 16 }}>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>{t('Search', 'খুঁজুন')}</label>
                              <input
                                type="text"
                                placeholder={t('Search by ride ID, rider name…', 'রেফ বা যাত্রী নাম দিয়ে খুঁজুন…')}
                                value={ratingsSearch}
                                onChange={(e) => setRatingsSearch(e.target.value)}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit' }}
                              />
                            </div>
                            <div>
                              <label style={{ display: 'block', fontSize: 12, fontWeight: 600, marginBottom: 6, color: 'var(--text-sub)' }}>{t('Sort By', 'সর্ট করুন')}</label>
                              <select
                                value={ratingsSortBy}
                                onChange={(e) => setRatingsSortBy(e.target.value as typeof ratingsSortBy)}
                                style={{ width: '100%', padding: '8px 12px', borderRadius: 6, border: '1px solid var(--border)', fontSize: 13, fontFamily: 'inherit', background: 'var(--surface)' }}
                              >
                                <option value="date-desc">{t('Newest First', 'নতুন আগে')}</option>
                                <option value="date-asc">{t('Oldest First', 'পুরনো আগে')}</option>
                                <option value="score-desc">{t('Rating: High → Low', 'রেটিং: বেশি → কম')}</option>
                                <option value="score-asc">{t('Rating: Low → High', 'রেটিং: কম → বেশি')}</option>
                              </select>
                            </div>
                          </div>

                          {/* ── Ratings Table ── */}
                          <div style={{ width: '100%', borderRadius: 10, overflow: 'hidden', boxSizing: 'border-box' }}>
                            <div style={{ width: '100%', maxHeight: 480, overflowY: 'auto', overflowX: 'hidden', boxSizing: 'border-box' }}>
                              <table className="admin-table" style={{ border: '1px solid var(--border)', borderRadius: 0, tableLayout: 'fixed', width: '100%', boxSizing: 'border-box', margin: 0, padding: 0 }}>
                                <thead>
                                  <tr><th style={{ width: '12%', boxSizing: 'border-box' }}>{t('Ref', 'রেফ')}</th><th style={{ width: '15%', boxSizing: 'border-box' }}>{t('Rider', 'যাত্রী')}</th><th style={{ width: '18%', boxSizing: 'border-box' }}>{t('Pickup', 'পিকআপ')}</th><th style={{ width: '18%', boxSizing: 'border-box' }}>{t('Destination', 'গন্তব্য')}</th><th style={{ width: '15%', boxSizing: 'border-box' }}>{t('Rating', 'রেটিং')}</th><th style={{ width: '15%', boxSizing: 'border-box' }}>{t('Date', 'তারিখ')}</th><th style={{ width: '7%', boxSizing: 'border-box' }}>{t('Action', 'কর্ম')}</th></tr>
                                </thead>
                                <tbody>
                                  {(() => {
                                    const getRatingAvg = (r: Ride) => {
                                      const vals = [r.rating_driving, r.rating_behavior, r.rating_cleanliness].filter(v => typeof v === 'number')
                                      if (!vals.length) return null
                                      return Number((vals.reduce((s, v) => s + (v || 0), 0) / vals.length).toFixed(1))
                                    }
                                    return completedRides.length === 0 ? (
                                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-sub)', boxSizing: 'border-box' }}>
                                        {t('No completed rides yet.', 'এখনও কোনো সম্পন্ন রাইড নেই।')}
                                      </td></tr>
                                    ) : displayedRides.length === 0 ? (
                                      <tr><td colSpan={7} style={{ textAlign: 'center', padding: 24, color: 'var(--text-sub)', boxSizing: 'border-box' }}>
                                        {t('No rides match your search.', 'কোনো রাইড পাওয়া যায়নি।')}
                                      </td></tr>
                                    ) : (
                                      displayedRides.map(r => {
                                        const ratingAvg = getRatingAvg(r)
                                        return (
                                          <tr key={r.id} style={{ cursor: 'default' }}>
                                            <td style={{ boxSizing: 'border-box' }}>{r.ride_ref || r.id?.slice(0, 8)}</td>
                                            <td style={{ boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.rider_name || '—'}</td>
                                            <td style={{ boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.pickup_name || '—'}</td>
                                            <td style={{ boxSizing: 'border-box', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.destination_name || '—'}</td>
                                            <td style={{ boxSizing: 'border-box' }}>{ratingAvg != null ? `⭐ ${ratingAvg}` : '—'}</td>
                                            <td style={{ boxSizing: 'border-box' }}>{r.completed_at ? new Date(r.completed_at).toLocaleDateString() : '—'}</td>
                                            <td style={{ boxSizing: 'border-box' }}>
                                              {r.rider_rating == null ? (
                                                <button
                                                  className="admin-btn"
                                                  onClick={() => setSelectedRide(r)}
                                                  style={{ padding: '4px 8px', fontSize: 12, background: '#fcd34d', color: '#92400e', border: 'none', fontWeight: 600 }}
                                                >
                                                  ⭐ Rate
                                                </button>
                                              ) : (
                                                <button
                                                  className="admin-btn"
                                                  onClick={() => setSelectedRide(r)}
                                                  style={{ padding: '4px 8px', fontSize: 12 }}
                                                >
                                                  View
                                                </button>
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      })
                                    )
                                  })()}
                                </tbody>
                              </table>
                            </div>
                          </div>

                          {/* ── Dispute section ── */}
                          <div className="rt-dispute-section">
                            <div className="driver-list-card">
                              <h4 style={{ marginTop: 0 }}>{t('Dispute a Low Rating', 'কম রেটিংয়ের বিরুদ্ধে আপত্তি জানান')}</h4>
                              <div className="driver-form-grid">
                                <label>
                                  {t('Ride Reference', 'রাইড রেফারেন্স')}
                                  <input className="profile-input" placeholder="OIJ-XXXXX" value={ratingDisputeRideRef} onChange={(e) => setRatingDisputeRideRef(e.target.value)} />
                                </label>
                                <label>
                                  {t('Reason', 'কারণ')}
                                  <input className="profile-input" placeholder={t('Why this rating should be reviewed', 'কেন এই রেটিংটি পুনর্বিবেচনা করা উচিত')} value={ratingDisputeReason} onChange={(e) => setRatingDisputeReason(e.target.value)} />
                                </label>
                              </div>
                              <div style={{ marginTop: 12, display: 'flex', gap: 10, alignItems: 'center' }}>
                                <button className="btn btn-outline" onClick={submitRatingDispute}>{t('Submit Dispute', 'আপত্তি জমা দিন')}</button>
                                {ratingDisputeState && <span className="admin-muted">{ratingDisputeState}</span>}
                              </div>
                            </div>
                            {disputes.length > 0 && (
                              <div className="driver-list-card" style={{ marginTop: 10 }}>
                                <h4 style={{ marginTop: 0 }}>{t('Submitted Disputes', 'জমা দেওয়া আপত্তিসমূহ')}</h4>
                                <div className="driver-list-grid">
                                  {disputes.map((item) => (
                                    <div key={item.id} className="driver-list-card">
                                      <div className="driver-list-top">
                                        <strong>{item.ride_ref || '—'}</strong>
                                        <span className={`admin-badge ${String(item.status || '').toLowerCase()}`}>{item.status || t('open', 'খোলা')}</span>
                                      </div>
                                      <div className="driver-list-meta">{t('Current rating', 'বর্তমান রেটিং')}: {item.current_rating ?? '—'}</div>
                                      <div className="driver-list-route">{t('Reason', 'কারণ')}: {item.reason || '—'}</div>
                                      {item.admin_note && <div className="driver-list-meta">{t('Admin note', 'অ্যাডমিন নোট')}: {item.admin_note}</div>}
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        </>
                      )}
                    </section>
                  )
                })()}

                {tab === 'profile' && (
                  <section>
                    <h3 className="admin-heading">{t('Profile', 'প্রোফাইল')}</h3>

                    <div style={{ position: 'relative' }}>
                      <p className="admin-muted">{t('Most details are editable. Name, mobile number, and NID are locked.', 'বেশিরভাগ তথ্য সম্পাদনাযোগ্য। নাম, মোবাইল নম্বর এবং এনআইডি লক করা আছে।')}</p>

                      <div className="admin-card" style={{ display: 'flex', gap: 24, padding: 24, flexWrap: 'wrap' }}>
                        <div style={{ flex: '0 0 240px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                          <div style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Profile Photo', 'প্রোফাইল ছবি')}</div>
                            <div style={{ width: 140, height: 140, margin: '0 auto', borderRadius: 12, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '4px solid #fff', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {form.profile_image ? (
                                <img src={form.profile_image} alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <img src="/assets/dummy-avatar.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                          </div>

                          <div style={{ textAlign: 'center', marginTop: 8 }}>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Driving License', 'ড্রাইভিং লাইসেন্স')}</div>
                            <div style={{ width: '100%', aspectRatio: '16/9', borderRadius: 12, background: 'linear-gradient(135deg, #f1f5f9, #e2e8f0)', border: '4px solid #fff', boxShadow: '0 8px 24px rgba(15,23,42,0.08)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              {form.driver_license_image ? (
                                <img src={form.driver_license_image} alt="License" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              ) : (
                                <img src="/assets/dummy-license.png" alt="License" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              )}
                            </div>
                          </div>
                        </div>

                        <div style={{ flex: '1 1 400px', display: 'flex', flexDirection: 'column', gap: 20 }}>
                          <div>
                            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 16, textTransform: 'uppercase', letterSpacing: 0.5, borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>{t('Personal Details', 'ব্যক্তিগত তথ্য')}</div>
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '16px 24px', fontSize: 15 }}>
                              <div>
                                <div className="admin-muted">{t('Name', 'নাম')}</div>
                                <div><strong>{user?.name || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('Mobile', 'মোবাইল')}</div>
                                <div><strong>{user?.phone || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">NID</div>
                                <div><strong>{user?.nid_number || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('Name (Bangla)', 'নাম (বাংলা)')}</div>
                                <div><strong>{form.name_bn || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('Area', 'এলাকা')}</div>
                                <div><strong>{form.area || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('District', 'জেলা')}</div>
                                <div><strong>{localizedDistrict || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('Upazilla', 'উপজেলা')}</div>
                                <div><strong>{localizedUpazilla || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('House No', 'বাড়ি নং')}</div>
                                <div><strong>{form.house_no || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('Road No', 'রাস্তা নং')}</div>
                                <div><strong>{form.road_no || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('Landmark', 'ল্যান্ডমার্ক')}</div>
                                <div><strong>{form.landmark || '—'}</strong></div>
                              </div>
                              <div>
                                <div className="admin-muted">{t('Post Office', 'পোস্ট অফিস')}</div>
                                <div><strong>{localizedPostOffice || '—'}</strong></div>
                              </div>
                            </div>
                            <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid var(--border)' }}>
                              <button onClick={() => { setIsEditingProfile(true); setSaveState(''); }} style={{
                                display: 'inline-flex', alignItems: 'center', gap: 8,
                                padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff',
                                border: 'none', cursor: 'pointer',
                                boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
                                transition: 'transform 160ms ease, box-shadow 160ms ease',
                              }}
                                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(79,70,229,0.35)' }}
                                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)' }}
                              >
                                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" /><path d="m15 5 4 4" /></svg>
                                {t('Edit Profile', 'প্রোফাইল সম্পাদনা করুন')}
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>

                      {isEditingProfile && (
                        <div className="admin-modal-overlay driver-modal-overlay">
                          <div className="admin-modal admin-modal-wide driver-modal" style={{ maxWidth: 860, width: '90%', borderRadius: 24 }}>
                            <div className="admin-modal-header" style={{ padding: '24px 32px' }}>
                              <h3 style={{ margin: 0, fontSize: 22, fontWeight: 800 }}>{t('Edit Profile', 'প্রোফাইল সম্পাদনা করুন')}</h3>
                              <button className="admin-modal-close" onClick={() => { setIsEditingProfile(false); setSaveState(''); }} style={{ background: 'rgba(15,23,42,0.06)', border: 'none', width: 36, height: 36, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', fontSize: 20, color: 'var(--text-sub)' }}>✕</button>
                            </div>
                            <div className="admin-modal-body" style={{ padding: '0 32px 32px', maxHeight: '75vh', overflowY: 'auto' }}>
                              {/* Photo upload row — two separate cards side by side */}
                              <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 16, marginBottom: 24, marginTop: 4 }}>
                                {/* Profile Photo */}
                                <div className="driver-photo-card" style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Profile Photo', 'প্রোফাইল ছবি')}</div>
                                  <div className="driver-photo-preview" style={{ width: 120, height: 120, borderRadius: 12, background: '#fff', border: '3px solid #fff', boxShadow: '0 4px 12px rgba(15,23,42,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                                    {form.profile_image ? <img src={form.profile_image} alt={t('Driver profile', 'চালকের প্রোফাইল')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <img src="/assets/dummy-avatar.png" alt="Profile" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                  </div>
                                  <label
                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, width: '100%', boxSizing: 'border-box', marginTop: 16, padding: '10px 16px', background: 'linear-gradient(135deg, var(--primary), #00A878)', color: '#fff', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'transform 140ms ease, box-shadow 140ms ease', boxShadow: '0 4px 12px rgba(0, 106, 78, 0.2)' }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.transform = 'translateY(-2px)'
                                      e.currentTarget.style.boxShadow = '0 6px 16px rgba(0, 106, 78, 0.25)'
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.transform = 'translateY(0)'
                                      e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 106, 78, 0.2)'
                                    }}
                                  >
                                    <span aria-hidden="true" style={{ fontSize: 16 }}>📷</span>
                                    {form.profile_image ? t('Change', 'পরিবর্তন') : t('Upload', 'আপলোড')}
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onProfilePhotoSelect} />
                                  </label>
                                  {photoUploading && <div className="admin-muted" style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>{t('Processing…', 'প্রক্রিয়া হচ্ছে…')}</div>}
                                </div>

                                {/* Driver License Photo */}
                                <div className="driver-photo-card" style={{ background: '#f8fafc', padding: 20, borderRadius: 16, border: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-sub)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 0.5 }}>{t('Driving License', 'ড্রাইভিং লাইসেন্স')}</div>
                                  <div style={{ width: '100%', aspectRatio: '16/9', background: '#fff', borderRadius: 12, border: form.driver_license_image ? '3px solid #fff' : '2px dashed #cbd5e1', boxShadow: form.driver_license_image ? '0 4px 12px rgba(15,23,42,0.08)' : 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', maxHeight: 180 }}>
                                    {form.driver_license_image
                                      ? <img src={form.driver_license_image} alt={t('License', 'লাইসেন্স')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                                      : <img src="/assets/dummy-license.png" alt="License" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />}
                                  </div>
                                  <label
                                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 8, maxWidth: 220, width: '100%', boxSizing: 'border-box', marginTop: 16, padding: '10px 16px', background: form.driver_license_image ? 'linear-gradient(135deg, var(--primary), #00A878)' : '#fff', color: form.driver_license_image ? '#fff' : '#475569', border: form.driver_license_image ? 'none' : '1px solid #cbd5e1', borderRadius: 10, cursor: 'pointer', fontSize: 13, fontWeight: 700, transition: 'all 140ms ease', boxShadow: form.driver_license_image ? '0 4px 12px rgba(0, 106, 78, 0.2)' : '0 2px 4px rgba(15,23,42,0.04)' }}
                                    onMouseEnter={e => {
                                      e.currentTarget.style.transform = 'translateY(-2px)'
                                      e.currentTarget.style.boxShadow = form.driver_license_image ? '0 6px 16px rgba(0, 106, 78, 0.25)' : '0 4px 8px rgba(15,23,42,0.06)'
                                    }}
                                    onMouseLeave={e => {
                                      e.currentTarget.style.transform = 'translateY(0)'
                                      e.currentTarget.style.boxShadow = form.driver_license_image ? '0 4px 12px rgba(0, 106, 78, 0.2)' : '0 2px 4px rgba(15,23,42,0.04)'
                                    }}
                                  >
                                    <span aria-hidden="true" style={{ fontSize: 16 }}>📷</span>
                                    {form.driver_license_image ? t('Change', 'পরিবর্তন') : t('Upload', 'আপলোড')}
                                    <input type="file" accept="image/*" style={{ display: 'none' }} onChange={onLicensePhotoSelect} />
                                  </label>
                                  {licenseUploading && <div className="admin-muted" style={{ marginTop: 8, fontSize: 12, fontWeight: 600 }}>{t('Processing…', 'প্রক্রিয়া হচ্ছে…')}</div>}
                                </div>
                              </div>

                              <div>
                                <div className="driver-form-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 16 }}>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('Name (locked)', 'নাম (লক করা)')}</span>
                                    <input className="profile-input" value={user?.name || ''} readOnly disabled style={{ background: '#f1f5f9', cursor: 'not-allowed', opacity: 0.8 }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('Mobile (locked)', 'মোবাইল (লক করা)')}</span>
                                    <input className="profile-input" value={user?.phone || ''} readOnly disabled style={{ background: '#f1f5f9', cursor: 'not-allowed', opacity: 0.8 }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('NID (locked)', 'এনআইডি (লক করা)')}</span>
                                    <input className="profile-input" value={user?.nid_number || ''} readOnly disabled style={{ background: '#f1f5f9', cursor: 'not-allowed', opacity: 0.8 }} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('Name (Bangla)', 'নাম (বাংলা)')}</span>
                                    <input className="profile-input" value={form.name_bn} onChange={(e) => updateForm('name_bn', e.target.value)} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('Area', 'এলাকা')}</span>
                                    <input className="profile-input" value={form.area} onChange={(e) => updateForm('area', e.target.value)} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('District', 'জেলা')}</span>
                                    <select className="profile-input" value={form.district} onChange={(e) => { updateForm('district', e.target.value); updateForm('upazilla', ''); updateForm('post_office', ''); }}>
                                      <option value="">{isBangla ? 'জেলা নির্বাচন করুন' : 'Select District'}</option>
                                      {districtOptions.map((dist) => (
                                        <option key={dist.value} value={dist.value}>{dist.label}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('Upazilla', 'উপজেলা')}</span>
                                    <select className="profile-input" value={form.upazilla} onChange={(e) => { updateForm('upazilla', e.target.value); updateForm('post_office', ''); }} disabled={!form.district}>
                                      <option value="">{isBangla ? 'উপজেলা/থানা নির্বাচন করুন' : 'Select Upazilla'}</option>
                                      {upazillaOptions.map((upa) => (
                                        <option key={upa.value} value={upa.value}>{upa.label}</option>
                                      ))}
                                    </select>
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('House No', 'বাড়ি নং')}</span>
                                    <input className="profile-input" value={form.house_no} onChange={(e) => updateForm('house_no', e.target.value)} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('Road No', 'রাস্তা নং')}</span>
                                    <input className="profile-input" value={form.road_no} onChange={(e) => updateForm('road_no', e.target.value)} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('Landmark', 'ল্যান্ডমার্ক')}</span>
                                    <input className="profile-input" value={form.landmark} onChange={(e) => updateForm('landmark', e.target.value)} />
                                  </label>
                                  <label style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-sub)' }}>{t('Post Office', 'পোস্ট অফিস')}</span>
                                    <select className="profile-input" value={form.post_office} onChange={(e) => updateForm('post_office', e.target.value)} disabled={!form.upazilla}>
                                      <option value="">{isBangla ? 'পোস্ট অফিস নির্বাচন করুন' : 'Select Post Office'}</option>
                                      {postOfficeOptions.map((po) => (
                                        <option key={po.value} value={po.value}>
                                          {po.label}
                                        </option>
                                      ))}
                                    </select>
                                  </label>
                                </div>

                                <div style={{ marginTop: 24, paddingTop: 16, borderTop: '1px solid #e2e8f0', display: 'flex', gap: 12, alignItems: 'center', justifyContent: 'flex-end' }}>
                                  {saveState && <span className="admin-muted" style={{ marginRight: 'auto', fontWeight: 600, color: '#059669' }}>{saveState}</span>}
                                  <button onClick={() => { setIsEditingProfile(false); setSaveState(''); }} style={{
                                    padding: '10px 22px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                    border: '1.5px solid #e2e8f0', background: '#fff', color: '#64748b',
                                    cursor: 'pointer', transition: 'all 160ms ease',
                                  }}
                                    onMouseEnter={e => { e.currentTarget.style.background = '#f8fafc'; e.currentTarget.style.borderColor = '#cbd5e1' }}
                                    onMouseLeave={e => { e.currentTarget.style.background = '#fff'; e.currentTarget.style.borderColor = '#e2e8f0' }}
                                  >{t('Cancel', 'বাতিল')}</button>
                                  <button onClick={() => void saveProfile()} style={{
                                    display: 'inline-flex', alignItems: 'center', gap: 8,
                                    padding: '10px 28px', borderRadius: 10, fontSize: 14, fontWeight: 700,
                                    background: 'linear-gradient(135deg, #4f46e5, #7c3aed)', color: '#fff',
                                    border: 'none', cursor: 'pointer',
                                    boxShadow: '0 4px 14px rgba(79,70,229,0.25)',
                                    transition: 'transform 160ms ease, box-shadow 160ms ease',
                                  }}
                                    onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 8px 22px rgba(79,70,229,0.35)' }}
                                    onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 14px rgba(79,70,229,0.25)' }}
                                  >{t('Save Profile', 'প্রোফাইল সংরক্ষণ করুন')}</button>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </section>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {pendingDeleteVehicle && (
        <div className="driver-modal-overlay" role="dialog" aria-modal="true" aria-label={t('Delete vehicle confirmation', 'গাড়ি মুছে ফেলার নিশ্চিতকরণ')}>
          <div className="driver-modal-card">
            <h4 className="driver-modal-title">{t('Delete Vehicle?', 'গাড়ি মুছে ফেলবেন?')}</h4>
            <p className="driver-modal-text">
              {t('This action cannot be undone.', 'এই কাজটি পূর্বাবস্থায় ফিরিয়ে আনা যাবে না।')}
              <br />
              <strong>{pendingDeleteVehicle.vehicle_plate || '—'}</strong>
            </p>
            <div className="driver-modal-actions">
              <button
                className="btn btn-outline"
                onClick={() => setPendingDeleteVehicle(null)}
                disabled={deletingVehicleId === pendingDeleteVehicle.id}
              >
                {t('Cancel', 'বাতিল')}
              </button>
              <button
                className="btn btn-primary"
                onClick={() => void deleteVehicle(pendingDeleteVehicle.id)}
                disabled={deletingVehicleId === pendingDeleteVehicle.id}
              >
                {deletingVehicleId === pendingDeleteVehicle.id ? t('Deleting...', 'মুছে ফেলা হচ্ছে...') : t('Yes, Delete', 'হ্যাঁ, মুছুন')}
              </button>
            </div>
          </div>
        </div>
      )}

      {galleryVehicle && (
        <div
          className="driver-modal-overlay"
          role="dialog"
          aria-modal="true"
          aria-label={t('Vehicle photos', 'গাড়ির ছবি')}
          onClick={(event) => {
            if (event.currentTarget === event.target) setGalleryVehicle(null)
          }}
        >
          <div className="driver-modal-card driver-gallery-modal-card">
            <div className="driver-gallery-head">
              <h4 className="driver-modal-title" style={{ marginBottom: 0 }}>
                {t('Vehicle Photos', 'গাড়ির ছবি')} - {galleryVehicle.vehicle_plate || '—'}
              </h4>
              <button className="btn btn-outline" onClick={() => setGalleryVehicle(null)}>
                {t('Close', 'বন্ধ করুন')}
              </button>
            </div>

            <div className="driver-gallery-preview-wrap">
              {activeGalleryPhoto?.image ? (
                <img
                  src={activeGalleryPhoto.image}
                  alt={`${activeGalleryPhoto.label} ${t('view', 'ভিউ')}`}
                  className="driver-gallery-preview"
                />
              ) : (
                <img src="/assets/dummy-vehicle.png" alt="no photo" className="driver-gallery-preview" />
              )}
            </div>

            <div className="driver-gallery-thumbs">
              {galleryPhotoConfig.map((photo) => (
                <button
                  key={photo.key}
                  className={`driver-gallery-thumb-btn ${galleryPhotoKey === photo.key ? 'active' : ''}`}
                  onClick={() => setGalleryPhotoKey(photo.key)}
                  disabled={!photo.image}
                >
                  {photo.image ? (
                    <img src={photo.image} alt={photo.label} />
                  ) : (
                    <img src="/assets/dummy-vehicle.png" alt="no photo" style={{ opacity: 0.5 }} />
                  )}
                  <strong>{photo.label}</strong>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Mobile Bottom Navigation ── */}
      <nav className="driver-mobile-bottom-nav" aria-label={t('Navigation', 'নেভিগেশন')}>
        {([
          { key: 'analytics' as DriverTabKey, icon: '🏠', label: t('Dashboard', 'ড্যাশবোর্ড') },
          { key: 'rides' as DriverTabKey, icon: '🚕', label: t('Rides', 'রাইড') },
          { key: 'earnings' as DriverTabKey, icon: '💰', label: t('Wallet', 'ওয়ালেট') },
          { key: 'ratings' as DriverTabKey, icon: '⭐', label: t('Ratings', 'রেটিং') },
          { key: 'profile' as DriverTabKey, icon: '👤', label: t('Profile', 'প্রোফাইল') },
        ] as const).map((item) => (
          <button
            key={item.key}
            className={`driver-mobile-nav-btn ${tab === item.key ? 'active' : ''}`}
            onClick={() => setTab(item.key)}
          >
            <span className="driver-mobile-nav-icon">{item.icon}</span>
            <span className="driver-mobile-nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
    </div>
  )
}
