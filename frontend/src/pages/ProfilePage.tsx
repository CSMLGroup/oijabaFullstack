import React, { useEffect, useMemo, useRef, useState } from 'react'
import api from '../api'
import { BD_LOCATIONS, POST_OFFICES } from '../bd-post-office-master'
import { BD_DISTRICTS_BN, BD_LOCATIONS_BN, POST_OFFICES_BN } from '../bd-post-office-master-bn'

type RiderProfileForm = {
  name_bn: string
  district: string
  upazilla: string
  house_no: string
  road_no: string
  landmark: string
  post_office: string
  profile_image: string
}

function toForm(user: any): RiderProfileForm {
  return {
    name_bn: user?.name_bn || '',
    district: user?.district || '',
    upazilla: user?.upazilla || '',
    house_no: user?.house_no || '',
    road_no: user?.road_no || '',
    landmark: user?.landmark || '',
    post_office: user?.post_office || '',
    profile_image: user?.profile_image || ''
  }
}

export default function ProfilePage({ language = 'bn' }: { language?: 'en' | 'bn' }): JSX.Element {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState<RiderProfileForm>(toForm(null))
  const [photoFileName, setPhotoFileName] = useState('')
  const photoInputRef = useRef<HTMLInputElement | null>(null)

  const bn = language === 'bn'
  const t = {
    profile: bn ? 'প্রোফাইল' : 'Profile',
    loading: bn ? 'লোড হচ্ছে...' : 'Loading…',
    notLoggedIn: bn ? 'লগইন করা হয়নি' : 'Not logged in',
    profileDetails: bn ? 'প্রোফাইলের বিবরণ' : 'Profile details',
    protectedNote: bn ? 'নাম, ফোন এবং এনআইডি সুরক্ষিত এবং এই পেজ থেকে পরিবর্তন করা যাবে না।' : 'Name, phone and NID are protected and cannot be changed from this page.',
    name: bn ? 'নাম' : 'Name',
    phone: bn ? 'ফোন' : 'Phone',
    nid: bn ? 'এনআইডি নম্বর' : 'NID Number',
    nameBn: bn ? 'নাম (বাংলায়)' : 'Name (Bangla)',
    district: bn ? 'জেলা' : 'District',
    upazilla: bn ? 'উপজেলা' : 'Upazilla',
    postOffice: bn ? 'পোস্ট অফিস' : 'Post Office',
    houseNo: bn ? 'বাড়ি নম্বর' : 'House No',
    roadNo: bn ? 'রাস্তা নম্বর' : 'Road No',
    landmark: bn ? 'ল্যান্ডমার্ক' : 'Landmark',
    uploadPhoto: bn ? 'নতুন ছবি আপলোড করুন' : 'Upload New Photo',
    changePhoto: bn ? 'ছবি পরিবর্তন করুন' : 'Change Photo',
    selected: bn ? 'নির্বাচিত' : 'Selected',
    saving: bn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...',
    saveChanges: bn ? 'পরিবর্তন সংরক্ষণ করুন' : 'Save changes',
  }

  useEffect(() => {
    let mounted = true
    api.auth
      ?.me()
      .then((data: any) => {
        if (!mounted) return
        const currentUser = data.user || data
        setUser(currentUser)
        setForm(toForm(currentUser))
      })
      .catch(() => {})
      .finally(() => mounted && setLoading(false))
    return () => {
      mounted = false
    }
  }, [])

  async function onSave(event: React.FormEvent) {
    event.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const data: any = await api.riders.updateProfile(form)
      const updated = data?.user || data
      setUser(updated)
      setForm(toForm(updated))
      setMessage('Profile updated successfully.')
    } catch (error: any) {
      setMessage(error?.message || 'Failed to update profile.')
    } finally {
      setSaving(false)
    }
  }

  function handlePhotoUpload(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      setMessage('Please upload an image file.')
      return
    }

    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setForm((prev) => ({ ...prev, profile_image: result }))
      setPhotoFileName(file.name)
      setMessage('Photo selected. Click "Save changes" to update your profile photo.')
    }
    reader.onerror = () => setMessage('Failed to read image file.')
    reader.readAsDataURL(file)
  }

  const profileImageSrc = form.profile_image || user?.profile_image || ''

  const districtOptions = useMemo(
    () => bn
      ? BD_DISTRICTS_BN
      : Object.keys(BD_LOCATIONS).sort().map((d) => ({ value: d, label: d })),
    [bn]
  )

  const upazillaOptions = useMemo(() => {
    if (!form.district) return [] as Array<{ value: string; label: string }>
    if (bn) return BD_LOCATIONS_BN[form.district] || []
    return (BD_LOCATIONS[form.district] || []).map((u) => ({ value: u, label: u }))
  }, [form.district, bn])

  const postOfficeOptions = useMemo(() => {
    if (!form.upazilla) return [] as Array<{ value: string; label: string }>
    if (bn) return POST_OFFICES_BN[form.upazilla] || []
    return (POST_OFFICES[form.upazilla] || []).map((po) => ({
      value: `${po.name} (${po.code})`,
      label: `${po.name} (${po.code})`
    }))
  }, [form.upazilla, bn])

  const selectStyle: React.CSSProperties = { width: '100%', padding: '10px 12px', border: '1px solid #d6e2da', borderRadius: 8, background: '#fff', color: '#1A2920', fontSize: 14, fontFamily: 'inherit' }

  function renderReadOnlyField(label: string, value?: string) {
    return (
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#3D5A47', fontWeight: 600 }}>{label}</span>
        <input value={value || ''} readOnly style={{ width: '100%', padding: '10px 12px', border: '1px solid #d6e2da', borderRadius: 8, background: '#f3f7f5', color: '#1A2920' }} />
      </label>
    )
  }

  function renderEditableField(
    label: string,
    keyName: keyof RiderProfileForm,
    placeholder = ''
  ) {
    return (
      <label style={{ display: 'grid', gap: 6 }}>
        <span style={{ fontSize: 12, color: '#3D5A47', fontWeight: 600 }}>{label}</span>
        <input
          value={form[keyName]}
          onChange={(event) => setForm((prev) => ({ ...prev, [keyName]: event.target.value }))}
          placeholder={placeholder}
          style={{ width: '100%', padding: '10px 12px', border: '1px solid #d6e2da', borderRadius: 8, background: '#fff', color: '#1A2920' }}
        />
      </label>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      <h2>{t.profile}</h2>
      {loading ? (
        <div>{t.loading}</div>
      ) : !user ? (
        <div>{t.notLoggedIn}</div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: 16 }}>
          <aside style={{ padding: 16, background: 'var(--bg-card)' }}>
            <div style={{ marginBottom: 14, display: 'flex', justifyContent: 'center' }}>
              {profileImageSrc ? (
                <img
                  src={profileImageSrc}
                  alt="Rider"
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    objectFit: 'cover',
                    border: '2px solid #d6e2da',
                    background: '#f4f7f6'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 120,
                    height: 120,
                    borderRadius: '50%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: 42,
                    fontWeight: 700,
                    color: '#006a4e',
                    background: '#e9f3ee',
                    border: '2px solid #d6e2da'
                  }}
                >
                  {(user.name || user.phone || 'U')[0]?.toUpperCase()}
                </div>
              )}
            </div>

            <div style={{ fontSize: 28, fontWeight: 800 }}>
              {user.name || user.phone || 'User'}
            </div>
            <div style={{ marginTop: 8 }}>{user.phone}</div>

            <div style={{ marginTop: 16 }}>
              <input
                ref={photoInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoUpload}
                style={{ display: 'none' }}
              />
              <button
                type="button"
                onClick={() => photoInputRef.current?.click()}
                style={{
                  width: '100%',
                  border: '1px solid rgba(0,106,78,0.28)',
                  borderRadius: 999,
                  padding: '10px 14px',
                  background: 'linear-gradient(180deg,#ffffff,#f2f8f5)',
                  color: '#004c38',
                  fontWeight: 700,
                  cursor: 'pointer',
                  boxShadow: '0 6px 16px rgba(0,106,78,0.12)'
                }}
              >
                {photoFileName ? t.changePhoto : t.uploadPhoto}
              </button>
              {photoFileName && (
                <div style={{ marginTop: 8, fontSize: 12, color: '#3D5A47', textAlign: 'center' }}>
                  {t.selected}: {photoFileName}
                </div>
              )}
            </div>
          </aside>

          <section style={{ padding: 16, background: 'var(--bg-elevated)' }}>
            <h3>{t.profileDetails}</h3>
            <p style={{ margin: '6px 0 0', fontSize: 13, color: '#3D5A47' }}>
              {t.protectedNote}
            </p>

            <form onSubmit={onSave} style={{ marginTop: 14, display: 'grid', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {renderReadOnlyField(t.name, user.name)}
                {renderReadOnlyField(t.phone, user.phone)}
              </div>

              {renderReadOnlyField(t.nid, user.nid_number)}

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {renderEditableField(t.nameBn, 'name_bn')}
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#3D5A47', fontWeight: 600 }}>{t.district}</span>
                  <select
                    value={form.district}
                    onChange={(e) => setForm((prev) => ({ ...prev, district: e.target.value, upazilla: '', post_office: '' }))}
                    style={selectStyle}
                  >
                    <option value="">{bn ? 'জেলা নির্বাচন করুন' : 'Select District'}</option>
                    {districtOptions.map((d) => (
                      <option key={d.value} value={d.value}>{d.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#3D5A47', fontWeight: 600 }}>{t.upazilla}</span>
                  <select
                    value={form.upazilla}
                    onChange={(e) => setForm((prev) => ({ ...prev, upazilla: e.target.value, post_office: '' }))}
                    disabled={!form.district}
                    style={selectStyle}
                  >
                    <option value="">{bn ? 'উপজেলা/থানা নির্বাচন করুন' : 'Select Upazilla'}</option>
                    {upazillaOptions.map((u) => (
                      <option key={u.value} value={u.value}>{u.label}</option>
                    ))}
                  </select>
                </label>
                <label style={{ display: 'grid', gap: 6 }}>
                  <span style={{ fontSize: 12, color: '#3D5A47', fontWeight: 600 }}>{t.postOffice}</span>
                  <select
                    value={form.post_office}
                    onChange={(e) => setForm((prev) => ({ ...prev, post_office: e.target.value }))}
                    disabled={!form.upazilla}
                    style={selectStyle}
                  >
                    <option value="">{bn ? 'পোস্ট অফিস নির্বাচন করুন' : 'Select Post Office'}</option>
                    {postOfficeOptions.map((po) => (
                      <option key={po.value} value={po.value}>{po.label}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {renderEditableField(t.houseNo, 'house_no')}
                {renderEditableField(t.roadNo, 'road_no')}
              </div>

              {renderEditableField(t.landmark, 'landmark')}

              {message && (
                <div
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    background: message.toLowerCase().includes('success') ? 'rgba(0,106,78,0.1)' : 'rgba(220,38,38,0.08)',
                    color: message.toLowerCase().includes('success') ? '#006a4e' : '#b91c1c',
                    fontSize: 13,
                    fontWeight: 600
                  }}
                >
                  {message}
                </div>
              )}

              <div>
                <button
                  type="submit"
                  disabled={saving}
                  style={{
                    border: 'none',
                    borderRadius: 10,
                    padding: '10px 16px',
                    fontWeight: 700,
                    color: '#fff',
                    background: saving ? '#6b8f76' : 'linear-gradient(135deg,#006a4e,#004c38)',
                    cursor: saving ? 'not-allowed' : 'pointer'
                  }}
                >
                  {saving ? t.saving : t.saveChanges}
                </button>
              </div>
            </form>
          </section>
        </div>
      )}
    </div>
  )
}
