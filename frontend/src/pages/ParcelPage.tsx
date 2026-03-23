import React from 'react'

export default function ParcelPage(): JSX.Element {
  return (
    <div style={{ padding: 20 }}>
      <h2>Parcel Delivery</h2>
      <p>Static parcel page ported to React. Use the legacy UI for now; this is ready to be enhanced.</p>
      <div style={{ maxWidth: 800 }}>
        <div style={{ background: 'var(--bg-card)', padding: 16, borderRadius: 8 }}>
          <h3>Send a Parcel</h3>
          <p>Form UI is preserved from the legacy page. Implement booking flow in React when ready.</p>
        </div>
      </div>
    </div>
  )
}
