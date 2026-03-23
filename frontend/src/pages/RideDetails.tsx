import React, { useEffect, useState } from 'react'
import api from '../api'

type Props = { rideId?: string }

export default function RideDetails({ rideId }: Props): JSX.Element {
  const [ride, setRide] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!rideId) return
    api.rides
      .get(rideId)
      .then((data: any) => setRide(data.data || data))
      .catch(() => setRide(null))
      .finally(() => setLoading(false))
  }, [rideId])

  if (!rideId) return <div style={{ padding: 20 }}>No ride selected.</div>

  return (
    <div style={{ padding: 20 }}>
      <h2>Ride Details</h2>
      {loading ? (
        <div>Loading…</div>
      ) : !ride ? (
        <div>Ride not found.</div>
      ) : (
        <div>
          <div style={{ fontWeight: 800 }}>{ride.ride_ref || ride.id}</div>
          <div style={{ marginTop: 8 }}>{ride.pickup_name} → {ride.destination_name}</div>
          <div style={{ marginTop: 8 }}>Status: {ride.status}</div>
          <pre style={{ marginTop: 12 }}>{JSON.stringify(ride, null, 2)}</pre>
        </div>
      )}
    </div>
  )
}
