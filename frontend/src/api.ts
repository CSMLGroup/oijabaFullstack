// Determine API URL based on environment
const getApiUrl = (): string => {
  if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
    // Development: connect to local backend
    return 'http://localhost:3001/api'
  }
  // Production: use same host (Vercel will route /api to serverless backend)
  return '/api'
}

const API_URL = getApiUrl()

function getToken(): string | null {
  return localStorage.getItem('oijaba_token')
}

export function setAuthToken(token: string): void {
  localStorage.setItem('oijaba_token', token)
  window.dispatchEvent(new Event('oijaba-auth-changed'))
}

export function clearAuthToken(): void {
  localStorage.removeItem('oijaba_token')
  window.dispatchEvent(new Event('oijaba-auth-changed'))
}

type ApiOptions = {
  headers?: Record<string, string>
  method?: string
  body?: any
}

async function call<T = any>(endpoint: string, options: ApiOptions = {}): Promise<T> {
  const url = `${API_URL}${endpoint}`
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers || {})
  }
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  const config: RequestInit = { ...options, headers }
  if (config.body && typeof config.body === 'object') config.body = JSON.stringify(config.body)
  const res = await fetch(url, config)
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'API error')
  return data as T
}

const api = {
  get: <T = any>(endpoint: string) => call<T>(endpoint, { method: 'GET' }),
  post: <T = any>(endpoint: string, body?: any) => call<T>(endpoint, { method: 'POST', body }),
  patch: <T = any>(endpoint: string, body?: any) => call<T>(endpoint, { method: 'PATCH', body }),
  delete: <T = any>(endpoint: string) => call<T>(endpoint, { method: 'DELETE' }),

  auth: {
    sendOtp: (phone: string, userType: 'rider' | 'driver' | 'admin', mode: 'login' | 'register' = 'login') =>
      call('/auth/send-otp', { method: 'POST', body: { phone, user_type: userType, mode } }),
    verifyOtp: (phone: string, otp: string, userType: 'rider' | 'driver' | 'admin') =>
      call('/auth/verify-otp', { method: 'POST', body: { phone, otp, user_type: userType } }),
    me: () => call('/auth/me', { method: 'GET' })
  },
  drivers: {
    list: (status = 'all') => call(`/drivers?status=${status}`, { method: 'GET' }),
    get: (id: string) => call(`/drivers/${id}`, { method: 'GET' }),
    updateProfile: (data: any) => call('/drivers/profile', { method: 'PATCH', body: data }),
    updateLocation: (lat: number, lng: number) => call('/drivers/location', { method: 'PATCH', body: { lat, lng } }),
    listVehicles: () => call('/drivers/vehicles', { method: 'GET' }),
    addVehicle: (data: {
      vehicle_type: string
      vehicle_model?: string
      vehicle_plate: string
      driver_license?: string
      color?: string
      capacity?: string
      registration_number?: string
      engine_chassis_number?: string
      notes?: string
      vehicle_front_image?: string | null
      vehicle_rear_image?: string | null
      vehicle_left_image?: string | null
      vehicle_right_image?: string | null
    }) =>
      call('/drivers/vehicles', { method: 'POST', body: data }),
    setActiveVehicle: (id: string) => call(`/drivers/vehicles/${id}/active`, { method: 'PATCH' }),
    deleteVehicle: (id: string) => call(`/drivers/vehicles/${id}`, { method: 'DELETE' }),
    submitRatingDispute: (ride_ref: string, reason: string) => call('/drivers/ratings/disputes', { method: 'POST', body: { ride_ref, reason } }),
    listRatingDisputes: () => call('/drivers/ratings/disputes', { method: 'GET' }),
    updateRatingDispute: (id: string, data: { status: 'open' | 'under_review' | 'resolved' | 'rejected'; admin_note?: string }) =>
      call(`/drivers/ratings/disputes/${id}`, { method: 'PATCH', body: data }),
    approve: (id: string, action: 'approve' | 'reject') => call(`/drivers/${id}/approve`, { method: 'PATCH', body: { action } }),
    updateById: (id: string, data: any) => call(`/drivers/${id}`, { method: 'PATCH', body: data }),
    getVehicles: (id: string) => call(`/drivers/${id}/vehicles`, { method: 'GET' }),
    addVehicleById: (driverId: string, data: {
      vehicle_type: string
      vehicle_model?: string
      vehicle_plate: string
      year?: string
      driver_license?: string
      color?: string
      capacity?: string
      registration_number?: string
      engine_chassis_number?: string
      notes?: string
      vehicle_front_image?: string | null
      vehicle_rear_image?: string | null
      vehicle_left_image?: string | null
      vehicle_right_image?: string | null
    }) => call(`/drivers/${driverId}/vehicles`, { method: 'POST', body: data }),
    updateVehicleById: (driverId: string, vehicleId: string, data: any) => call(`/drivers/${driverId}/vehicles/${vehicleId}`, { method: 'PATCH', body: data }),
    deleteVehicleById: (driverId: string, vehicleId: string) => call(`/drivers/${driverId}/vehicles/${vehicleId}`, { method: 'DELETE' }),
    setVehiclePrimary: (driverId: string, vehicleId: string) => call(`/drivers/${driverId}/vehicles/${vehicleId}/primary`, { method: 'PATCH', body: {} }),
    setOnlineStatus: (is_online: boolean) => call('/drivers/online-status', { method: 'PATCH', body: { is_online } })
  },
  riders: {
    list: (status = 'all') => call(`/riders?status=${status}`, { method: 'GET' }),
    get: (id: string) => call(`/riders/${id}`, { method: 'GET' }),
    updateById: (id: string, data: any) => call(`/riders/${id}`, { method: 'PATCH', body: data }),
    updateProfile: (data: any) => call('/riders/profile', { method: 'PATCH', body: data })
  },
  rides: {
    list: () => call('/rides', { method: 'GET' }),
    listByDriver: (driverId: string) => call(`/rides?driver_id=${encodeURIComponent(driverId)}`, { method: 'GET' }),
    listByRider: (riderId: string) => call(`/rides?rider_id=${encodeURIComponent(riderId)}`, { method: 'GET' }),
    get: (id: string) => call(`/rides/${id}`, { method: 'GET' }),
    rate: (id: string, data: { rating: number; rating_rider_behavior?: number | null; rating_rider_wait_time?: number | null; rating_rider_comment?: string | null; rating_driving?: number | null; rating_behavior?: number | null; rating_cleanliness?: number | null; rating_comment?: string | null }) =>
      call(`/rides/${id}/rate`, { method: 'PATCH', body: data })
  },
  earnings: {
    summary: () => call('/earnings', { method: 'GET' }),
    transactions: (limit = 30, offset = 0) =>
      call(`/earnings/transactions?limit=${limit}&offset=${offset}`, { method: 'GET' }),
    listRecipients: () => call('/earnings/recipients', { method: 'GET' }),
    addRecipient: (data: { gateway: 'bkash' | 'nagad'; number: string; label?: string }) =>
      call('/earnings/recipients', { method: 'POST', body: data }),
    verifyRecipient: (data: { gateway: string; number: string; otp: string }) =>
      call('/earnings/recipients/verify', { method: 'POST', body: data }),
    deleteRecipient: (id: string) => call(`/earnings/recipients/${id}`, { method: 'DELETE' }),
    withdraw: (data: { recipient_id: string; amount: number; otp: string }) =>
      call('/earnings/withdraw', { method: 'POST', body: data }),
    withdrawSendOtp: () =>
      call('/earnings/withdraw/send-otp', { method: 'POST' }),
    chart: (period: 'daily' | 'weekly' | 'monthly') =>
      call(`/earnings/chart?period=${period}`, { method: 'GET' })
  }
}

export default api
