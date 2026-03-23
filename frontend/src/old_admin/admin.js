/* =============================================
   OIJABA – Admin Panel Renderer
   Uses window.OijabaData from data.js
   ============================================= */
const D = window.OijabaData;

/* ── helpers ── */
function statusPill(s) {
  s = (s || 'pending').toLowerCase();
  const map = {
    active: 'muse-badge-success',
    pending: 'muse-badge-warning',
    suspended: 'muse-badge-error',
    resolved: 'muse-badge-success',
    transit: 'muse-badge-primary',
    delivered: 'muse-badge-success',
    open: 'muse-badge-warning',
    pickup: 'muse-badge-primary'
  };
  const label = { active: 'Active', pending: 'Pending', suspended: 'Suspended', resolved: 'Resolved', transit: 'In Transit', delivered: 'Delivered', open: 'Open', pickup: 'Pickup' };
  return `<span class="muse-badge ${map[s] || 'muse-badge-primary'}">${label[s] || s}</span>`;
}
function stars(n) { return n ? '★'.repeat(Math.round(n)) + '☆'.repeat(5 - Math.round(n)) : '—'; }
function badge(txt) { return `<span class="muse-badge muse-badge-primary">${txt}</span>`; }
function acBtns(type, id) {
  if (type === 'rider-active') return `<button class="muse-btn" onclick="openProfile('rider','${id}')">View</button><button class="muse-btn" style="color:var(--muse-error)" onclick="suspendAccount('rider','${id}')">Suspend</button>`;
  if (type === 'rider-suspended') return `<button class="muse-btn active" onclick="unsuspendAccount('rider','${id}')">Restore</button>`;
  if (type === 'driver-active') return `<button class="muse-btn" onclick="openProfile('driver','${id}')">View</button><button class="muse-btn" style="color:var(--muse-error)" onclick="suspendAccount('driver','${id}')">Suspend</button>`;
  if (type === 'driver-pending') return `<button class="muse-btn active" onclick="approveDriver('${id}')" style="margin-right:8px">Approve</button><button class="muse-btn" style="color:var(--muse-error)" onclick="rejectDriver('${id}')">Reject</button>`;
  if (type === 'driver-suspended') return `<button class="muse-btn active" onclick="unsuspendAccount('driver','${id}')">Restore</button>`;
  return `<button class="muse-btn" onclick="openProfile('driver','${id}')">View</button>`;
}

function getVehicleEmoji(type) {
  type = (type || '').toLowerCase();
  if (type.includes('cng') || type.includes('auto')) return '<img src="/assets/vehicles/easybike.jpg" style="width:24px;height:18px;vertical-align:middle">';
  if (type.includes('bike')) return '<img src="/assets/vehicles/motorbike.jpg" style="width:24px;height:18px;vertical-align:middle">';
  if (type.includes('van')) return '<img src="/assets/vehicles/van.jpg" style="width:24px;height:18px;vertical-align:middle">';
  if (type.includes('rickshaw')) return '<img src="/assets/vehicles/rickshaw.jpg" style="width:24px;height:18px;vertical-align:middle">';
  if (type.includes('boat')) return '⛵';
  if (type.includes('tractor')) return '🚜';
  if (type.includes('car')) return '🚗';
  return '🚗';
}

/* ── Panel switching ── */
function showPanel(id, navEl) {
  document.querySelectorAll('.page-panel').forEach(p => p.classList.remove('active'));
  const panel = document.getElementById('panel-' + id);
  if (panel) { panel.classList.add('active'); renderPanel(id); }

  // Sidebar items
  document.querySelectorAll('.muse-nav-item').forEach(n => n.classList.remove('active'));

  // Dashboard toggle buttons
  document.querySelectorAll('.muse-btn').forEach(b => b.classList.remove('active'));

  if (navEl) navEl.classList.add('active');
}

function syncUIWithData() {
  const riderBadge = document.querySelector('.muse-nav-item[onclick*="riders"] .muse-nav-badge');
  if (riderBadge) riderBadge.textContent = D.riders.length;

  const driverBadge = document.querySelector('.muse-nav-item[onclick*="drivers"] .muse-nav-badge');
  if (driverBadge) driverBadge.textContent = D.drivers.length;

  const complaintsBadge = document.querySelector('.muse-nav-item[onclick*="complaints"] .muse-nav-badge');
  if (complaintsBadge) complaintsBadge.textContent = D.complaints.length;

  const liveBadge = document.getElementById('liveBadge');
  if (liveBadge) liveBadge.textContent = D.liveRides.length;
}

function renderPanel(id) {
  const fns = { riders: renderRiders, drivers: renderDrivers, live: renderLive, rides: renderRides, parcels: renderParcels, complaints: renderComplaints, analytics: renderAnalytics, dashboard: renderDashboard, vehicles: renderVehicles, settings: renderSettings };
  if (fns[id]) fns[id]();
}

/* ── DASHBOARD ── */
function renderDashboard() {
  buildChart();
  renderAnalytics();

  // Dynamic Dashboard Stats
  const statCards = document.querySelectorAll('.muse-stat-card');

  statCards.forEach(card => {
    const label = card.querySelector('.muse-stat-label');
    if (label && label.textContent.includes('Rider')) {
      card.querySelector('.muse-stat-value').textContent = D.riders.length;
    }
    if (label && label.textContent.includes('Driver')) {
      const drCount = card.querySelector('.muse-stat-value');
      drCount.textContent = D.drivers.length;
      const active = D.drivers.filter(d => d.status === 'active').length;
      const pending = D.drivers.filter(d => d.status === 'pending').length;

      let sub = card.querySelector('.muse-stat-sub');
      if (!sub) {
        sub = document.createElement('div');
        sub.className = 'muse-stat-sub';
        sub.style.fontSize = '12px';
        sub.style.marginTop = '4px';
        card.querySelector('div').appendChild(sub);
      }
      sub.innerHTML = `<span style="color:var(--muse-success)">${active} active</span> · <span style="color:var(--muse-warning)">${pending} pending</span>`;
    }
  });

  const rCount = document.getElementById('rideCount');
  if (rCount) rCount.textContent = D.liveRides.length;

  const rCount2 = document.getElementById('rideCount2');
  if (rCount2) rCount2.textContent = D.liveRides.length;

  const compBtn = document.querySelector('button[onclick*="complaints"]');
  if (compBtn) compBtn.textContent = `⚠️ Complaints (${D.complaints.length})`;

  const vCount = document.querySelector('.pie-center div:first-child');
  if (vCount) vCount.textContent = D.vehicles ? D.vehicles.length : 8;

  // Add Recent Activity to Dashboard
  const dashboardTop = document.querySelector('#panel-dashboard');
  if (dashboardTop && !document.getElementById('recentActivityTable')) {
    const activityDiv = document.createElement('div');
    activityDiv.id = 'recentActivityTable';
    activityDiv.className = 'muse-card';
    activityDiv.style.marginTop = '24px';
    activityDiv.style.padding = '0';

    const latest = [...D.drivers].reverse().slice(0, 5);

    activityDiv.innerHTML = `
      <div class="muse-card-header">
        <div class="muse-card-title">🚀 Recently Joined Drivers</div>
      </div>
      <div class="muse-table-wrap">
        <table class="muse-table">
          <thead>
            <tr><th>Driver</th><th>Vehicle</th><th>Area</th><th>Status</th></tr>
          </thead>
          <tbody>
            ${latest.map(d => `
              <tr>
                <td><strong>${d.name}</strong></td>
                <td>${d.vehicleEmoji || '🚗'} ${d.vehicle}</td>
                <td>${d.area}</td>
                <td>${statusPill(d.status)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
      </div>
    `;
    dashboardTop.appendChild(activityDiv);
  }
}
function buildChart() {
  const data = [84000, 92000, 78000, 145000, 121000, 164000, 184000];
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const max = Math.max(...data);
  const el = document.getElementById('revenueChart');
  if (!el) return;
  el.innerHTML = data.map((v, i) =>
    `<div class="bar-item"><div class="bar-val">৳${Math.round(v / 1000)}K</div><div class="bar" style="height:${Math.round(v / max * 100)}%"></div><div class="bar-label">${days[i]}</div></div>`
  ).join('');
}

/* ── RIDERS ── */
function renderRiders() {
  const tbody = document.getElementById('ridersBody');
  if (!tbody) return;
  tbody.innerHTML = D.riders.map(r => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
           <div style="width:36px;height:36px;border-radius:50%;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:18px">${r.avatar}</div>
           <div>
             <div style="font-weight:600">${r.name}</div>
             <div style="font-size:11px;color:var(--muse-text-secondary)">${r.nameBn}</div>
           </div>
        </div>
      </td>
      <td>${r.phone}</td>
      <td>${r.area}</td>
      <td style="font-weight:700">${r.totalRides}</td>
      <td style="color:var(--muse-primary);font-weight:700">৳${r.totalSpent.toLocaleString()}</td>
      <td style="font-size:13px">${r.preferredVehicle}</td>
      <td style="font-size:12px">${r.lastRide}</td>
      <td>${statusPill(r.status)}</td>
      <td><div style="display:flex;gap:4px">${acBtns('rider-' + r.status, r.id)}</div></td>
    </tr>`).join('');
}

/* ── DRIVERS ── */
function renderDrivers() {
  const tbody = document.getElementById('driversBody');
  if (!tbody) {
    console.error('driversBody not found');
    return;
  }

  // Update dynamic counts in UI
  const total = D.drivers.length;
  const active = D.drivers.filter(d => d.status === 'active').length;
  const pending = D.drivers.filter(d => d.status === 'pending').length;
  const suspended = D.drivers.filter(d => d.status === 'suspended').length;

  const countEl = document.querySelector('#panel-drivers p');
  if (countEl) {
    countEl.innerHTML = `${total} registered · ${active} active · <strong style="color:var(--muse-warning)">${pending} pending approval</strong> · ${suspended} suspended`;
  }

  const tabs = document.querySelectorAll('#panel-drivers .muse-btn');
  if (tabs.length >= 4) {
    tabs[0].textContent = `All (${total})`;
    tabs[1].textContent = `Active (${active})`;
    tabs[2].textContent = `Pending (${pending})`;
    tabs[3].textContent = `Suspended (${suspended})`;
  }

  tbody.innerHTML = D.drivers.map(d => {
    try {
      const earned = typeof d.totalEarned === 'string' ? parseFloat(d.totalEarned) : (d.totalEarned || 0);
      const rating = typeof d.rating === 'string' ? parseFloat(d.rating) : (d.rating || 0);
      const status = d.status || 'pending';
      const drId = d.id || ('D-' + Math.random().toString(36).substr(2, 9));

      return `
      <tr id="drow-${drId}">
        <td>
          <div style="display:flex;align-items:center;gap:12px">
            <div style="width:36px;height:36px;border-radius:50%;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:18px">
              ${d.avatar || '🧑‍✈️'}
            </div>
            <div>
              <div style="font-weight:600;font-size:14px">${d.name || 'Unknown Driver'}</div>
              <div style="font-size:11px;color:var(--muse-text-secondary)">${d.nameBn || ''}</div>
            </div>
          </div>
        </td>
        <td>${d.phone || '—'}</td>
        <td style="font-size:13px">
          ${d.vehicleEmoji || getVehicleEmoji(d.vehicle) || '🚗'} ${d.vehicle || 'Vehicle'}
          <div style="font-size:11px;color:var(--muse-text-secondary)">${d.plate || d.vehiclePlate || 'No Plate'}</div>
        </td>
        <td>${d.area || 'Unknown'}</td>
        <td style="font-weight:700">${d.totalRides || 0}</td>
        <td style="color:var(--muse-primary);font-weight:700">৳${earned.toLocaleString()}</td>
        <td style="color:#faad14;font-weight:700">${rating ? rating.toFixed(1) + ' ★' : '—'}</td>
        <td style="text-align:center">${d.nidVerified ? '✅' : '⏳'}</td>
        <td>${statusPill(status)}</td>
        <td><div style="display:flex;gap:4px">${acBtns('driver-' + status, drId)}</div></td>
      </tr>`;
    } catch (e) {
      console.error('Error rendering driver row', e);
      return '';
    }
  }).join('');
}

/* ── LIVE RIDES ── */
function renderLive() {
  const tbody = document.getElementById('liveBody');
  if (!tbody) return;
  tbody.innerHTML = D.liveRides.map(r => `
    <tr>
      <td><strong>${r.id}</strong></td>
      <td>${r.rider}</td>
      <td>
        <div style="font-weight:600">${r.driver}</div>
        <div style="font-size:11px;color:var(--muse-text-secondary)">${r.driverPhone}</div>
      </td>
      <td>${r.vehicle}</td>
      <td style="font-size:12px">${r.from} <br/>→ ${r.to}</td>
      <td style="color:var(--muse-primary);font-weight:700">${r.eta}</td>
      <td style="font-weight:700">${r.fare}</td>
      <td>${statusPill(r.status)}</td>
      <td><button class="muse-btn" style="color:var(--muse-error);padding:4px 8px" onclick="cancelRide('${r.id}')">Cancel</button></td>
    </tr>`).join('');
}

/* ── RIDES ── */
function renderRides() {
  const tbody = document.getElementById('ridesBody');
  if (!tbody) return;
  tbody.innerHTML = D.completedRides.map(r => `
    <tr>
      <td><strong>${r.id}</strong></td>
      <td>${r.rider}</td>
      <td><strong>${r.driver}</strong></td>
      <td>${r.vehicle}</td>
      <td style="font-size:12px">${r.from} <br/>→ ${r.to}</td>
      <td style="color:var(--muse-primary);font-weight:700">${r.fare}</td>
      <td>${r.payment}</td>
      <td style="color:#faad14;font-size:12px">${'★'.repeat(r.riderRating)}</td>
      <td style="font-size:11px;color:var(--muse-text-secondary)">${r.date}</td>
    </tr>`).join('');
}

/* ── PARCELS ── */
function renderParcels() {
  const tbody = document.getElementById('parcelsBody');
  if (!tbody) return;
  tbody.innerHTML = D.parcels.map(p => `
    <tr>
      <td><strong>${p.id}</strong></td>
      <td>
        <div style="font-weight:600">${p.sender}</div>
        <div style="font-size:11px;color:var(--muse-text-secondary)">${p.senderPhone}</div>
      </td>
      <td>${p.type}</td>
      <td>${p.to}</td>
      <td>${p.driver}</td>
      <td style="color:var(--muse-primary);font-weight:700">${p.fee}</td>
      <td>
        <select class="muse-search" style="padding:4px 8px;font-size:12px" onchange="updateParcelStatus('${p.id}', this.value)">
          <option value="pickup" ${p.status === 'pickup' ? 'selected' : ''}>Pickup</option>
          <option value="transit" ${p.status === 'transit' ? 'selected' : ''}>Transit</option>
          <option value="delivered" ${p.status === 'delivered' ? 'selected' : ''}>Delivered</option>
        </select>
      </td>
      <td style="font-size:11px;color:var(--muse-text-secondary)">${p.date}</td>
    </tr>`).join('');
}

/* ── COMPLAINTS ── */
function renderComplaints() {
  const tbody = document.getElementById('complaintsBody');
  if (!tbody) return;
  tbody.innerHTML = D.complaints.map(c => `
    <tr id="crow-${c.id}">
      <td><strong>${c.id}</strong></td>
      <td>${c.reporter}</td>
      <td>${c.against}</td>
      <td><span class="muse-badge ${c.priority === 'high' ? 'muse-badge-error' : 'muse-badge-primary'}">${c.type}</span></td>
      <td style="max-width:200px;font-size:12px;color:var(--muse-text-secondary)">${c.detail}</td>
      <td style="font-size:11px">${c.date}</td>
      <td>${statusPill(c.status)}</td>
      <td>${c.status === 'open'
      ? `<div style="display:flex;gap:4px"><button class="muse-btn active" style="padding:4px 8px" onclick="resolveComplaint('${c.id}')">Resolve</button></div>`
      : `<span style="font-size:12px;color:var(--muse-text-secondary)">✓ Closed</span>`
    }</td>
    </tr>`).join('');
}

/* ── ANALYTICS ── */
function renderAnalytics() {
  const el = document.getElementById('vehicleAnalytics');
  if (!el) return;
  const data = [
    { e: '🛺', n: 'Auto Rickshaw', pct: 42, c: 'var(--muse-primary)' },
    { e: '🏍️', n: 'Motorbike', pct: 31, c: 'var(--muse-warning)' },
    { e: '🚚', n: 'Van', pct: 15, c: '#29B6F6' },
    { e: '⛵', n: 'Boat', pct: 7, c: '#AB47BC' },
    { e: '🚜', n: 'Tractor', pct: 5, c: 'var(--muse-error)' }
  ];
  el.innerHTML = data.map(d => `
    <div style="flex:1;min-width:110px;background:#f8f9fa;border-radius:12px;padding:20px;text-align:center;border:1px solid #efefef">
       <div style="font-size:24px;margin-bottom:8px">${d.e}</div>
       <div style="font-size:12px;font-weight:700;color:var(--muse-text-secondary)">${d.n}</div>
       <div style="font-size:22px;font-weight:800;color:${d.c};margin-top:4px">${d.pct}%</div>
    </div>`).join('');

  // Also update dashboard pie if it exists
  const pie = document.getElementById('vehiclePie');
  if (pie) {
    const gradient = data.map((d, i) => {
      const prevPct = data.slice(0, i).reduce((sum, item) => sum + item.pct, 0);
      return `${d.c} ${prevPct}% ${prevPct + d.pct}%`;
    }).join(', ');
    pie.style.background = `conic-gradient(${gradient})`;
  }
}

/* ── VEHICLES ── */
function renderVehicles() {
  const tbody = document.getElementById('vehiclesBody');
  if (!tbody) return;
  tbody.innerHTML = D.vehicles.map(v => `
    <tr>
      <td>
        <div style="display:flex;align-items:center;gap:12px">
          <div style="width:48px;height:36px;display:flex;align-items:center;justify-content:center;background:#fff;border-radius:8px;border:1px solid #efefef;overflow:hidden">
            ${v.img ? `<img src="${v.img}" style="width:40px;height:30px;object-fit:contain">` : `<span style="font-size:20px">${v.emoji}</span>`}
          </div>
          <div style="font-weight:600">${v.name}</div>
        </div>
      </td>
      <td>${v.capacity} Persons</td>
      <td style="font-weight:700">৳${v.fare}</td>
      <td><span class="muse-badge ${v.enabled ? 'muse-badge-success' : 'muse-badge-error'}">${v.enabled ? 'Enabled' : 'Disabled'}</span></td>
      <td>
        <label class="muse-switch">
          <input type="checkbox" ${v.enabled ? 'checked' : ''} onchange="toggleVehicle('${v.id}', this.checked)">
          <span class="muse-slider"></span>
        </label>
      </td>
    </tr>`).join('');
}

async function toggleVehicle(id, enabled) {
  try {
    const res = await window.oijabaApi.vehicles.update(id, { enabled });
    if (res.success) {
      const v = D.vehicles.find(x => x.id === id);
      if (v) v.enabled = enabled;
      renderVehicles();
      triggerToast(enabled ? '✅ Vehicle Enabled' : '⚠️ Vehicle Disabled', (v ? v.name : id) + ' visibility updated');
    }
  } catch (err) {
    console.error('Failed to toggle vehicle:', err);
    triggerToast('❌ Error', 'Failed to update vehicle status');
    renderVehicles(); // revert UI toggle
  }
}

/* ── SETTINGS ── */
function renderSettings() {
  document.getElementById('maintenanceToggle').checked = D.config.maintenanceMode;
  document.getElementById('registrationToggle').checked = D.config.registrationOpen;
  document.getElementById('alertInput').value = D.config.platformAlert;
}

function updateSettings(key, val) {
  D.config[key] = val;
  saveToStorage();
  triggerToast('⚙️ Setting Updated', key + ' is now ' + val);
}

function setPlatformAlert() {
  const val = document.getElementById('alertInput').value;
  D.config.platformAlert = val;
  saveToStorage();
  triggerToast('📢 Broadcast Sent', val || 'Alert cleared');
}

function saveToStorage() {
  localStorage.setItem('oijaba_admin_data', JSON.stringify({ config: D.config, vehicles: D.vehicles }));
}

function loadFromStorage() {
  const saved = localStorage.getItem('oijaba_admin_data');
  if (saved) {
    const data = JSON.parse(saved);
    D.config = data.config;
    D.vehicles = data.vehicles;
  }
}

/* ── PROFILE MODAL ── */
function openProfile(type, id) {
  const obj = type === 'rider' ? D.riders.find(r => r.id === id) : D.drivers.find(d => d.id === id);
  if (!obj) return;
  const m = document.getElementById('profileModal');
  const body = document.getElementById('profileBody');
  if (type === 'rider') {
    body.innerHTML = `
      <div style="text-align:center;margin-bottom:24px">
        <div style="width:80px;height:80px;border-radius:50%;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:48px;margin:0 auto 16px">${obj.avatar}</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:4px">${obj.name}</h3>
        <p style="color:var(--muse-text-secondary);font-size:13px">${obj.nameBn} · Joined ${obj.joined}</p>
        <div style="margin-top:12px">${statusPill(obj.status)}</div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:24px">
        <div style="background:#f8f9fa;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:20px;font-weight:800">${obj.totalRides}</div>
          <div style="font-size:11px;color:var(--muse-text-secondary);text-transform:uppercase">Total Rides</div>
        </div>
        <div style="background:#f8f9fa;padding:16px;border-radius:12px;text-align:center">
          <div style="font-size:20px;font-weight:800;color:var(--muse-primary)">৳${obj.totalSpent.toLocaleString()}</div>
          <div style="font-size:11px;color:var(--muse-text-secondary);text-transform:uppercase">Total Spent</div>
        </div>
      </div>
      <div style="font-size:13px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--muse-text-secondary)">Phone</span><strong style="color:var(--muse-text)">${obj.phone}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--muse-text-secondary)">Area</span><strong style="color:var(--muse-text)">${obj.area}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--muse-text-secondary)">Preferred</span><strong style="color:var(--muse-text)">${obj.preferredVehicle}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--muse-text-secondary)">Last Ride</span><strong style="color:var(--muse-text)">${obj.lastRide}</strong></div>
        ${obj.suspendReason ? `<div style="background:var(--muse-error-light);padding:12px;border-radius:8px;color:var(--muse-error);font-size:12px">⚠️ ${obj.suspendReason}</div>` : ''}
      </div>
      <div style="margin-top:24px;display:flex;gap:12px">
        <button class="muse-btn" style="flex:1" onclick="editProfile('rider','${obj.id}')">Edit Profile</button>
        <button class="muse-btn" style="flex:1;color:var(--muse-error)" onclick="deleteAccount('rider','${obj.id}')">Delete Account</button>
      </div>`;
  } else {
    body.innerHTML = `
      <div style="text-align:center;margin-bottom:24px">
        <div style="width:80px;height:80px;border-radius:50%;background:#f0f2f5;display:flex;align-items:center;justify-content:center;font-size:48px;margin:0 auto 16px">${obj.avatar}</div>
        <h3 style="font-size:20px;font-weight:700;margin-bottom:4px">${obj.name}</h3>
        <p style="color:var(--muse-text-secondary);font-size:13px">${obj.vehicleEmoji} ${obj.vehicle} · ${obj.plate}</p>
        <div style="margin-top:12px;display:flex;gap:4px;justify-content:center">
          ${statusPill(obj.status)} 
          ${obj.nidVerified ? '<span class="muse-badge muse-badge-success">NID Verified</span>' : '<span class="muse-badge muse-badge-warning">NID Pending</span>'}
        </div>
      </div>
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:24px">
        <div style="background:#f8f9fa;padding:12px;border-radius:12px;text-align:center">
          <div style="font-size:18px;font-weight:800">${obj.totalRides}</div>
          <div style="font-size:10px;color:var(--muse-text-secondary);text-transform:uppercase">Rides</div>
        </div>
        <div style="background:#f8f9fa;padding:12px;border-radius:12px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:var(--muse-primary)">৳${(obj.totalEarned / 1000).toFixed(1)}K</div>
          <div style="font-size:10px;color:var(--muse-text-secondary);text-transform:uppercase">Earned</div>
        </div>
        <div style="background:#f8f9fa;padding:12px;border-radius:12px;text-align:center">
          <div style="font-size:18px;font-weight:800;color:#faad14">${obj.rating ? obj.rating.toFixed(1) : '—'}</div>
          <div style="font-size:10px;color:var(--muse-text-secondary);text-transform:uppercase">Rating</div>
        </div>
      </div>
      <div style="font-size:13px;display:flex;flex-direction:column;gap:12px">
        <div style="display:flex;justify-content:space-between"><span style="color:var(--muse-text-secondary)">Phone</span><strong>${obj.phone}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--muse-text-secondary)">Area</span><strong>${obj.area}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--muse-text-secondary)">Joined</span><strong>${obj.joined}</strong></div>
        <div style="display:flex;justify-content:space-between"><span style="color:var(--muse-text-secondary)">Today</span><strong style="color:var(--muse-primary)">৳${obj.todayEarned} · ${obj.todayRides} rides</strong></div>
      </div>
      <div style="margin-top:24px;display:flex;gap:12px">
        <button class="muse-btn" style="flex:1" onclick="editProfile('driver','${obj.id}')">Edit Profile</button>
        <button class="muse-btn" style="flex:1;color:var(--muse-error)" onclick="deleteAccount('driver','${obj.id}')">Delete Account</button>
      </div>`;
  }
  document.getElementById('profileModal').classList.add('open');
}
function closeProfile() { document.getElementById('profileModal').classList.remove('open'); }

function editProfile(type, id) {
  const obj = type === 'rider' ? D.riders.find(r => r.id === id) : D.drivers.find(d => d.id === id);
  if (!obj) return;
  const body = document.getElementById('profileBody');
  body.innerHTML = `
    <h3 style="margin-bottom:20px;font-weight:700">Edit ${type === 'rider' ? 'Rider' : 'Driver'} Profile</h3>
    <div style="display:flex;flex-direction:column;gap:16px">
      <div><label style="font-size:12px;color:var(--muse-text-secondary);display:block;margin-bottom:6px">Full Name (En)</label><input type="text" id="editName" class="muse-search" style="width:100%" value="${obj.name}"></div>
      <div><label style="font-size:12px;color:var(--muse-text-secondary);display:block;margin-bottom:6px">Full Name (Bn)</label><input type="text" id="editNameBn" class="muse-search" style="width:100%" value="${obj.nameBn}"></div>
      <div><label style="font-size:12px;color:var(--muse-text-secondary);display:block;margin-bottom:6px">Phone Number</label><input type="text" id="editPhone" class="muse-search" style="width:100%" value="${obj.phone}"></div>
      <div><label style="font-size:12px;color:var(--muse-text-secondary);display:block;margin-bottom:6px">Service Area</label><input type="text" id="editArea" class="muse-search" style="width:100%" value="${obj.area}"></div>
    </div>
    <div style="margin-top:24px;display:flex;gap:12px">
      <button class="muse-btn active" style="flex:1" onclick="saveProfile('${type}','${id}')">Save Changes</button>
      <button class="muse-btn" style="flex:1" onclick="openProfile('${type}','${id}')">Cancel</button>
    </div>
  `;
}

function saveProfile(type, id) {
  const obj = type === 'rider' ? D.riders.find(r => r.id === id) : D.drivers.find(d => d.id === id);
  if (!obj) return;
  obj.name = document.getElementById('editName').value;
  obj.nameBn = document.getElementById('editNameBn').value;
  obj.phone = document.getElementById('editPhone').value;
  obj.area = document.getElementById('editArea').value;
  if (type === 'driver') {
    obj.plate = document.getElementById('editPlate').value;
    obj.vehicleModel = document.getElementById('editModel').value;
  }

  // Refresh UI
  if (type === 'rider') renderRiders(); else renderDrivers();
  openProfile(type, id);
  triggerToast('✅ Profile Saved', obj.name + ' has been updated.');
}

function deleteAccount(type, id) {
  if (!confirm('Are you sure you want to permanently delete this account? This action cannot be undone.')) return;
  if (type === 'rider') {
    D.riders = D.riders.filter(r => r.id !== id);
    renderRiders();
  } else {
    D.drivers = D.drivers.filter(d => d.id !== id);
    renderDrivers();
  }
  closeProfile();
  triggerToast('🗑️ Account Deleted', 'The record has been removed.');
}

/* ── ACTIONS ── */
function approveDriver(id) {
  const row = document.getElementById('drow-' + id);
  if (row) { row.querySelector('.status-pill').className = 'status-pill s-active'; row.querySelector('.status-pill').textContent = 'Active'; row.querySelector('.action-btns').innerHTML = `<button class="ab ab-view" onclick="openProfile('driver','${id}')">View</button>`; }
  const d = D.drivers.find(x => x.id === id);
  if (d) d.status = 'active';
  triggerToast('✅ Driver Approved', 'SMS notification sent to driver');
}
function rejectDriver(id) {
  const row = document.getElementById('drow-' + id);
  if (row) { row.querySelector('.status-pill').className = 'status-pill s-rejected'; row.querySelector('.status-pill').textContent = 'Rejected'; row.querySelector('.action-btns').innerHTML = '<span style="font-size:12px;color:var(--text-muted)">Rejected</span>'; }
  triggerToast('❌ Driver Rejected', 'Application has been declined');
}
function suspendAccount(type, id) {
  triggerToast('⚠️ Account Suspended', 'The account has been suspended pending review');
}
function unsuspendAccount(type, id) {
  triggerToast('✅ Account Restored', 'Account has been reactivated');
}
function resolveComplaint(id) {
  const row = document.getElementById('crow-' + id);
  if (row) { row.querySelector('.status-pill').className = 'status-pill s-completed'; row.querySelector('.status-pill').textContent = 'Resolved'; row.querySelector('.action-btns').outerHTML = '<td><span style="font-size:12px;color:var(--text-muted)">✓ Resolved</span></td>'; }
  triggerToast('✅ Complaint Resolved', 'Case #' + id + ' has been closed');
}

function cancelRide(id) {
  const r = D.liveRides.find(x => x.id === id);
  if (r) {
    D.liveRides = D.liveRides.filter(x => x.id !== id);
    renderLive();
    triggerToast('🛑 Ride Cancelled', 'Ride ' + id + ' has been terminated by admin');
  }
}

function updateParcelStatus(id, status) {
  const p = D.parcels.find(x => x.id === id);
  if (p) {
    p.status = status;
    triggerToast('📦 Parcel Updated', 'Status changed to ' + status);
  }
}

/* ── TOAST ── */
let toastTimer;
function triggerToast(title, msg) {
  const t = document.getElementById('toast');
  document.getElementById('toastTitle').textContent = title;
  document.getElementById('toastMsg').textContent = msg;
  t.classList.add('show');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove('show'), 4000);
}

/* ── SEARCH ── */
function filterRiders(q) {
  q = q.toLowerCase();
  document.querySelectorAll('#ridersBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}
function filterDrivers(q) {
  q = q.toLowerCase();
  document.querySelectorAll('#driversBody tr').forEach(row => {
    row.style.display = row.textContent.toLowerCase().includes(q) ? '' : 'none';
  });
}

/* ── LIVE COUNTER ── */
setInterval(() => {
  const el = document.getElementById('rideCount');
  if (el) { let n = parseInt(el.textContent); n = Math.max(8, Math.min(20, n + (Math.random() > 0.5 ? 1 : -1))); el.textContent = n; }
}, 4000);

/* ── INIT & API INTEGRATION ── */
async function initAdmin() {
  try {
    if (!window.getToken()) {
      console.log("No token, using static data for design phase");
      syncUIWithData();
      renderPanel('dashboard');
      return;
    }

    const [ridersRes, driversRes, ridesRes, vehiclesRes] = await Promise.all([
      window.oijabaApi.riders.list(),
      window.oijabaApi.drivers.list(),
      window.oijabaApi.rides.list(),
      window.oijabaApi.vehicles.list()
    ]);

    if (driversRes.drivers) {
      D.drivers = driversRes.drivers.map(d => ({
        id: d.id,
        name: d.name,
        nameBn: d.name_bn || d.name,
        phone: d.phone,
        vehicle: d.vehicle_type,
        vehicleEmoji: getVehicleEmoji(d.vehicle_type),
        plate: d.vehicle_plate || 'Reg Pending',
        area: d.area || 'Unknown',
        totalRides: parseInt(d.total_rides || 0),
        totalEarned: parseFloat(d.total_earned || 0),
        rating: d.rating_count > 0 ? (d.rating_sum / d.rating_count) : 4.8,
        ratingCount: d.rating_count || 0,
        nidVerified: d.nid_verified,
        status: d.status,
        avatar: d.avatar || '🧑‍✈️',
        badges: d.badges || [],
        tripHistory: [],
        online: d.is_online,
        todayEarned: parseFloat(d.today_earned || 0),
        todayRides: parseInt(d.today_rides || 0),
        joined: new Date(d.created_at).toLocaleDateString()
      }));
    }

    if (ridersRes.riders) {
      D.riders = ridersRes.riders.map(r => ({
        id: r.id,
        name: r.name,
        nameBn: r.name_bn || r.name,
        phone: r.phone,
        area: r.service_area || 'Unknown',
        totalRides: parseInt(r.total_rides || 0),
        totalSpent: 0,
        preferredVehicle: 'cng',
        lastRide: 'Never',
        status: r.status,
        avatar: r.avatar || '🧑',
        rideHistory: [],
        joined: new Date(r.created_at).toLocaleDateString()
      }));
    }

    if (ridesRes.rides) {
      D.completedRides = ridesRes.rides.filter(r => r.status === 'completed').map(r => ({
        id: r.ride_ref,
        rider: 'Rider ' + r.rider_id,
        driver: 'Driver ' + r.driver_id,
        vehicle: r.vehicle_type,
        from: r.pickup_location,
        to: r.dropoff_location,
        fare: '৳' + r.fare,
        payment: r.payment_method,
        riderRating: Math.floor(Math.random() * 2) + 4,
        date: new Date(r.created_at).toLocaleString()
      }));
    }

    if (vehiclesRes.vehicles) {
      D.vehicles = vehiclesRes.vehicles.map(v => ({
        id: v.id,
        name: v.name,
        nameBn: v.name_bn,
        img: v.img,
        emoji: v.emoji,
        enabled: v.enabled,
        fare: parseFloat(v.fare),
        capacity: v.capacity
      }));
    }

    syncUIWithData();

    // Re-render currently active panel
    const activeItem = document.querySelector('.nav-item.active');
    if (activeItem) activeItem.click();

  } catch (err) {
    console.error('Failed to fetch admin data via api.js. Make sure you are logged in as admin.', err);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  loadFromStorage();
  const activePanel = document.querySelector('.page-panel.active');
  if (activePanel) {
    const id = activePanel.id.replace('panel-', '');
    renderPanel(id);
  }
  initAdmin();
});
