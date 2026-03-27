import React, { useEffect, useState } from 'react'
import api from '../api'

type Vehicle = {
  id: string
  name: string
  enabled: boolean
  fare?: number
  base_fare?: number
  per_km_rate?: number
  min_fare?: number
  capacity?: number
  sort_order?: number
  fare_rule_en?: string
  fare_rule_bn?: string
}

const emptyVehicle: Partial<Vehicle> = {
  name: '',
  enabled: true,
  base_fare: 0,
  per_km_rate: 0,
  min_fare: 0,
  capacity: 1,
  sort_order: 0,
  fare_rule_en: '',
  fare_rule_bn: '',
}

export default function Vehicles(): JSX.Element {
  const [vehicles, setVehicles] = useState<Vehicle[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editId, setEditId] = useState<string | null>(null)
  const [editData, setEditData] = useState<Partial<Vehicle>>(emptyVehicle)
  const [adding, setAdding] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showModal, setShowModal] = useState(false)

  const fetchVehicles = async () => {
    setLoading(true)
    setError(null)
    try {
      const res: any = await api.get('/vehicles?include_disabled=true')
      setVehicles(Array.isArray(res.vehicles) ? res.vehicles : [])
    } catch (err: any) {
      setError(err.message || 'Failed to fetch vehicles')
      setVehicles([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchVehicles() }, [])

  const handleEdit = (v: Vehicle) => {
    setEditId(v.id)
    setEditData({ ...v })
    setAdding(false)
    setShowModal(true)
  }

  const handleAdd = () => {
    setEditId(null)
    setEditData({ ...emptyVehicle })
    setAdding(true)
    setShowModal(true)
  }

  const handleCancel = () => {
    setEditId(null)
    setEditData({ ...emptyVehicle })
    setAdding(false)
    setShowModal(false)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type, checked } = e.target
    setEditData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      if (adding) {
        // TODO: Implement add vehicle API if available
        alert('Add vehicle API not implemented.');
      } else if (editId) {
        await api.patch(`/vehicles/${editId}`, editData)
        setEditId(null)
        setEditData({ ...emptyVehicle })
        await fetchVehicles()
      }
      setShowModal(false)
    } catch (err: any) {
      alert(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
      setAdding(false)
    }
  }

  const handleToggle = async (v: Vehicle) => {
    try {
      await api.patch(`/vehicles/${v.id}`, { enabled: !v.enabled })
      await fetchVehicles()
    } catch (err: any) {
      alert(err.message || 'Failed to update status')
    }
  }

  return (
    <div style={{ padding: 24 }}>
      <h2>Vehicles & Fares</h2>
      <button className="btn btn-primary" onClick={handleAdd} style={{ marginBottom: 16 }}>+ Add Vehicle</button>
      {loading && <div>Loading vehicles...</div>}
      {error && <div style={{ color: 'red' }}>{error}</div>}
      {!loading && !error && (
        <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 8 }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left', padding: 8 }}>Name</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Enabled</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Base Fare</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Per KM Rate</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Min Fare</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Capacity</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Sort Order</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Fare Rule (EN)</th>
              <th style={{ textAlign: 'left', padding: 8 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map(v => (
              <tr key={v.id} style={{ borderBottom: '1px solid #eee' }}>
                <td style={{ padding: 8 }}>{v.name}</td>
                <td style={{ padding: 8 }}>
                  <input type="checkbox" checked={v.enabled} onChange={() => handleToggle(v)} />
                </td>
                <td style={{ padding: 8 }}>{v.base_fare ?? '-'}</td>
                <td style={{ padding: 8 }}>{v.per_km_rate ?? '-'}</td>
                <td style={{ padding: 8 }}>{v.min_fare ?? '-'}</td>
                <td style={{ padding: 8 }}>{v.capacity ?? '-'}</td>
                <td style={{ padding: 8 }}>{v.sort_order ?? '-'}</td>
                <td style={{ padding: 8 }}>{v.fare_rule_en ?? '-'}</td>
                <td style={{ padding: 8 }}>
                  <button className="btn btn-outline" onClick={() => handleEdit(v)}>Edit</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {showModal && (
        <div style={{
          position: 'fixed',
          top: 0, left: 0, width: '100vw', height: '100vh',
          background: 'rgba(0,0,0,0.18)',
          zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <div style={{
            background: '#fff',
            borderRadius: 18,
            boxShadow: '0 8px 32px 0 rgba(60,60,60,0.18), 0 1.5px 8px 0 rgba(0,0,0,0.08)',
            padding: '32px 32px 24px 32px',
            minWidth: 440,
            maxWidth: '96vw',
            margin: 16,
            position: 'relative',
            color: '#222',
          }}>
            <h2 style={{ margin: 0, marginBottom: 24, fontWeight: 700, fontSize: 24 }}>{adding ? 'Add Vehicle' : 'Edit Vehicle'}</h2>
            <form onSubmit={e => { e.preventDefault(); handleSave(); }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 20,
                marginBottom: 12,
              }}>
                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500, fontSize: 14 }}>
                  Name
                  <input name="name" placeholder="Name" value={editData.name || ''} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e0e0e0', marginTop: 6, fontSize: 15, background: '#fafbfc' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500, fontSize: 14 }}>
                  Base Fare
                  <input name="base_fare" type="number" placeholder="Base Fare" value={editData.base_fare ?? ''} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e0e0e0', marginTop: 6, fontSize: 15, background: '#fafbfc' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500, fontSize: 14 }}>
                  Per KM Rate
                  <input name="per_km_rate" type="number" placeholder="Per KM Rate" value={editData.per_km_rate ?? ''} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e0e0e0', marginTop: 6, fontSize: 15, background: '#fafbfc' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500, fontSize: 14 }}>
                  Min Fare
                  <input name="min_fare" type="number" placeholder="Min Fare" value={editData.min_fare ?? ''} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e0e0e0', marginTop: 6, fontSize: 15, background: '#fafbfc' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500, fontSize: 14 }}>
                  Capacity
                  <input name="capacity" type="number" placeholder="Capacity" value={editData.capacity ?? ''} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e0e0e0', marginTop: 6, fontSize: 15, background: '#fafbfc' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500, fontSize: 14 }}>
                  Sort Order
                  <input name="sort_order" type="number" placeholder="Sort Order" value={editData.sort_order ?? ''} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e0e0e0', marginTop: 6, fontSize: 15, background: '#fafbfc' }} />
                </label>
                <label style={{ display: 'flex', flexDirection: 'column', fontWeight: 500, fontSize: 14, gridColumn: '1 / span 2' }}>
                  Fare Rule (EN)
                  <input name="fare_rule_en" placeholder="Fare Rule (EN)" value={editData.fare_rule_en || ''} onChange={handleChange} style={{ padding: 10, borderRadius: 8, border: '1.5px solid #e0e0e0', marginTop: 6, fontSize: 15, background: '#fafbfc' }} />
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontWeight: 500, fontSize: 14, gridColumn: '1 / span 2' }}>
                  <input name="enabled" type="checkbox" checked={!!editData.enabled} onChange={handleChange} /> Enabled
                </label>
              </div>
              <div style={{ display: 'flex', gap: 16, marginTop: 18, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-outline" onClick={handleCancel} disabled={saving} style={{ padding: '10px 22px', borderRadius: 8, fontWeight: 600, fontSize: 15, border: '1.5px solid #e0e0e0', background: '#fff', color: '#444', transition: 'background 0.2s' }}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={saving} style={{ padding: '10px 22px', borderRadius: 8, fontWeight: 600, fontSize: 15, background: '#4f46e5', color: '#fff', border: 'none', boxShadow: '0 2px 8px 0 rgba(79,70,229,0.08)', transition: 'background 0.2s' }}>{adding ? 'Add' : 'Save'}</button>
              </div>
            </form>
            <button onClick={handleCancel} style={{ position: 'absolute', top: 18, right: 22, background: 'none', border: 'none', fontSize: 26, color: '#888', cursor: 'pointer', fontWeight: 700, lineHeight: 1 }} aria-label="Close">&times;</button>
          </div>
        </div>
      )}
    </div>
  )
}
