import React, { useEffect, useState } from 'react'
import api from './api'

type User = {
  id?: string
  name?: string
  profile_image?: string | null
  driver_license_image?: string | null
}

function readFileAsDataURL(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const fr = new FileReader()
    fr.onload = () => resolve(String(fr.result))
    fr.onerror = reject
    fr.readAsDataURL(file)
  })
}

export default function DriverProfile(): JSX.Element {
  const [user, setUser] = useState<User | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const [licensePreview, setLicensePreview] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [isBangla, setIsBangla] = useState(() => localStorage.getItem('oijaba_lang') === 'bn')

  const t = (en: string, bn: string) => (isBangla ? bn : en)

  useEffect(() => {
    const syncLanguage = () => setIsBangla(localStorage.getItem('oijaba_lang') === 'bn')

    window.addEventListener('oijaba-language-changed', syncLanguage)

    api.auth
      .me()
      .then((res: any) => {
        const u: User = res.user || res
        setUser(u)
        setAvatarPreview(u.profile_image || null)
        setLicensePreview(u.driver_license_image || null)
      })
      .catch(() => {
        // ignore
      })

    return () => window.removeEventListener('oijaba-language-changed', syncLanguage)
  }, [])

  async function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const dataUrl = await readFileAsDataURL(f)
    setAvatarPreview(dataUrl)
  }

  async function handleLicenseChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0]
    if (!f) return
    const dataUrl = await readFileAsDataURL(f)
    setLicensePreview(dataUrl)
  }

  async function handleSave() {
    setSaving(true)
    try {
      const payload: Record<string, unknown> = {}
      if (avatarPreview) payload.profile_image = avatarPreview
      if (licensePreview) payload.driver_license_image = licensePreview
      const res: any = await api.drivers.updateProfile(payload)
      const updated: User = res.user || res
      setUser(updated)
      setAvatarPreview(updated.profile_image || null)
      setLicensePreview(updated.driver_license_image || null)
      alert(t('Saved', 'সংরক্ষণ হয়েছে'))
    } catch (err: any) {
      alert(err.message || t('Save failed', 'সংরক্ষণ ব্যর্থ হয়েছে'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
        <div>
          <h3>{t('Profile Photo', 'প্রোফাইল ছবি')}</h3>
          <div style={{ width: 180, height: 180, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {avatarPreview ? (
              <img src={avatarPreview} alt={t('avatar', 'প্রোফাইল ছবি')} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            ) : (
              <div style={{ color: '#888' }}>{t('No image', 'কোনো ছবি নেই')}</div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleAvatarChange} />
        </div>

        <div>
          <h3>{t('Driver License', 'ড্রাইভিং লাইসেন্স')}</h3>
          <div style={{ width: 320, height: 200, border: '1px solid #ddd', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
            {licensePreview ? (
              <img src={licensePreview} alt={t('license', 'লাইসেন্স')} style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
            ) : (
              <div style={{ color: '#888' }}>{t('No document', 'কোনো ডকুমেন্ট নেই')}</div>
            )}
          </div>
          <input type="file" accept="image/*" onChange={handleLicenseChange} />
        </div>
      </div>

      <div style={{ marginTop: 20 }}>
        <button onClick={handleSave} disabled={saving}>
          {saving ? t('Saving…', 'সংরক্ষণ করা হচ্ছে…') : t('Save', 'সংরক্ষণ করুন')}
        </button>
      </div>
    </div>
  )
}
