/* ══════════════════════════════════════════
   Ved Logistics — Riders / Bike Tracking Module
   Used by both admin (Team page) and employee (My Rides)
   ══════════════════════════════════════════ */

const Riders = (() => {
  const render = () => {
    const riders = Store.getAll('employees').filter(e => e.employeeRole === 'rider');
    const rides = Store.getAll('rides');
    const parcels = Store.getAll('parcels');

    return `
      <div class="page-header">
        <div><h1>🏍️ Riders</h1><div class="page-header-sub">${riders.length} active riders</div></div>
      </div>

      <div class="stat-grid">
        ${riders.map(r => {
          const riderRides = rides.filter(rd => rd.riderId === r.id);
          const totalKm = riderRides.reduce((s,rd) => s + (rd.distance||0), 0);
          const activeParcels = parcels.filter(p => p.assignedRider === r.id && p.status !== 'delivered').length;
          const completedParcels = parcels.filter(p => p.assignedRider === r.id && p.status === 'delivered').length;
          return `
            <div class="card" style="cursor:pointer" onclick="Riders.showDetail('${r.id}')">
              <div style="display:flex;align-items:center;gap:12px;margin-bottom:14px">
                <div class="avatar" style="background:linear-gradient(135deg,var(--teal),var(--blue))">${r.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                <div>
                  <div style="font-weight:700;font-size:.9rem">${r.name}</div>
                  <div style="font-size:.72rem;color:var(--text-muted)">${r.bikeNumber || 'No bike assigned'}</div>
                </div>
              </div>
              <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px;text-align:center">
                <div><div style="font-family:var(--font-heading);font-weight:700;color:var(--teal)">${totalKm}</div><div style="font-size:.65rem;color:var(--text-muted)">Total KM</div></div>
                <div><div style="font-family:var(--font-heading);font-weight:700;color:var(--emerald)">${completedParcels}</div><div style="font-size:.65rem;color:var(--text-muted)">Delivered</div></div>
                <div><div style="font-family:var(--font-heading);font-weight:700;color:var(--amber)">${activeParcels}</div><div style="font-size:.65rem;color:var(--text-muted)">Active</div></div>
              </div>
            </div>`;
        }).join('')}
      </div>
    `;
  };

  const bind = () => {};

  const showDetail = async (riderId) => {
    const rider = Store.getById('employees', riderId);
    const rides = Store.query('rides', r => r.riderId === riderId).sort((a,b) => new Date(b.date) - new Date(a.date));
    const totalKm = rides.reduce((s,r) => s + (r.distance||0), 0);
    const totalFuel = rides.reduce((s,r) => s + (r.fuelCost||0), 0);

    await Utils.modal(`${rider.name} — Ride History`, `
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--teal)">${totalKm} km</div>
          <div style="font-size:.65rem;color:var(--text-muted)">Distance</div>
        </div>
        <div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--amber)">${Utils.fmtCurrency(totalFuel)}</div>
          <div style="font-size:.65rem;color:var(--text-muted)">Fuel</div>
        </div>
        <div style="flex:1;min-width:80px;text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--indigo)">${rides.length}</div>
          <div style="font-size:.65rem;color:var(--text-muted)">Rides</div>
        </div>
      </div>

      <div class="table-wrap" style="max-height:300px;overflow-y:auto">
        <table>
          <thead><tr><th>Date</th><th>Start</th><th>End</th><th>Dist</th><th>Fuel</th><th>Photos</th></tr></thead>
          <tbody>
            ${rides.length === 0 ? '<tr><td colspan="6"><div class="empty-state"><p>No rides logged</p></div></td></tr>' :
            rides.map(r => `<tr>
              <td class="td-mobile-stack">${Utils.fmtDate(r.date)}</td>
              <td>${r.startKm}</td><td>${r.endKm}</td>
              <td><strong>${r.distance} km</strong></td>
              <td>${Utils.fmtCurrency(r.fuelCost)}</td>
              <td>
                ${r.startImage ? `<img src="${r.startImage}" class="ride-thumb" onclick="Riders.viewPhoto(this.src)" title="Before">` : ''}
                ${r.endImage ? `<img src="${r.endImage}" class="ride-thumb" onclick="Riders.viewPhoto(this.src)" title="After">` : ''}
                ${!r.startImage && !r.endImage ? '—' : ''}
              </td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `, { size: 'lg', confirmText: false, cancelText: 'Close' });
  };

  // ── View photo full screen ──
  const viewPhoto = (src) => {
    Utils.modal('📷 Speedometer Photo', `
      <div style="text-align:center">
        <img src="${src}" style="max-width:100%;max-height:60vh;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,.15)">
      </div>
    `, { confirmText: false, cancelText: 'Close', size: 'lg' });
  };

  // ── Log ride for ANY rider (admin OR self) ──
  const logRide = async (riderId, riderName) => {
    const isAdmin = Auth.getCurrentUser().role === 'admin';
    const targetId = riderId || Auth.getCurrentUser().id;
    const targetName = riderName || Auth.getCurrentUser().name;

    await Utils.modal(`🏍️ Log Ride — ${targetName}`, `
      <div class="form-group">
        <label class="form-label">Date</label>
        <input type="date" class="form-input" id="ride-date" value="${Utils.today()}">
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Starting KM *</label><input type="number" class="form-input" id="ride-startKm" placeholder="e.g., 12500" inputmode="numeric"></div>
        <div class="form-group"><label class="form-label">Ending KM *</label><input type="number" class="form-input" id="ride-endKm" placeholder="e.g., 12550" inputmode="numeric"></div>
      </div>
      <div class="form-group">
        <label class="form-label">Fuel Cost (₹)</label>
        <input type="number" class="form-input" id="ride-fuel" placeholder="0" value="0" inputmode="numeric">
      </div>
      <div class="form-group">
        <label class="form-label">📷 Speedometer BEFORE (photo)</label>
        <input type="file" class="form-input file-input" id="ride-imgBefore" accept="image/*" capture="environment">
        <div class="form-hint">Take or upload photo of speedometer before ride</div>
      </div>
      <div class="form-group">
        <label class="form-label">📷 Speedometer AFTER (photo)</label>
        <input type="file" class="form-input file-input" id="ride-imgAfter" accept="image/*" capture="environment">
        <div class="form-hint">Take or upload photo of speedometer after ride</div>
      </div>
      <div class="form-group">
        <label class="form-label">Note</label>
        <textarea class="form-textarea" id="ride-note" placeholder="Any note about this ride..."></textarea>
      </div>
    `, {
      confirmText: 'Save Ride',
      onConfirm: async (overlay) => {
        const startKm = parseInt(overlay.querySelector('#ride-startKm').value);
        const endKm = parseInt(overlay.querySelector('#ride-endKm').value);
        if (!startKm || !endKm || endKm <= startKm) { Utils.toast('Invalid KM readings — end must be > start', 'error'); return false; }

        let startImage = null, endImage = null;
        const f1 = overlay.querySelector('#ride-imgBefore').files[0];
        const f2 = overlay.querySelector('#ride-imgAfter').files[0];
        if (f1) startImage = await Utils.fileToBase64(f1);
        if (f2) endImage = await Utils.fileToBase64(f2);

        Store.create('rides', {
          riderId: targetId,
          date: overlay.querySelector('#ride-date').value,
          startKm, endKm, distance: endKm - startKm,
          startImage, endImage,
          fuelCost: parseInt(overlay.querySelector('#ride-fuel').value) || 0,
          note: overlay.querySelector('#ride-note').value.trim(),
          loggedBy: Auth.getCurrentUser().name,
          status: 'completed',
        });
        Utils.toast(`Ride logged: ${endKm - startKm} km!`, 'success');
        
        // Refresh current page
        const hash = window.location.hash.slice(1);
        if (hash === 'my-rides') {
          document.getElementById('content').innerHTML = `<div class="page-transition">${renderMyRides()}</div>`;
          bindMyRides();
        } else {
          Dashboard.navigate(hash || 'team');
        }
        return true;
      }
    });
  };

  // ── Employee's own ride tracking ──
  const renderMyRides = () => {
    const user = Auth.getCurrentUser();
    const rides = Store.query('rides', r => r.riderId === user.id).sort((a,b) => new Date(b.date) - new Date(a.date));
    const totalKm = rides.reduce((s,r) => s + (r.distance||0), 0);
    const totalFuel = rides.reduce((s,r) => s + (r.fuelCost||0), 0);

    return `
      <div class="page-header">
        <div><h1>🏍️ My Bike Tracking</h1><div class="page-header-sub">${rides.length} rides · ${totalKm} km · ${Utils.fmtCurrency(totalFuel)} fuel</div></div>
        <div class="page-actions">
          <button class="btn-primary" id="startRideBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Log Ride
          </button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" style="--stat-color:var(--teal)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/></svg></div>
          <div class="stat-value">${totalKm}</div><div class="stat-label">Total KM</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--indigo)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/></svg></div>
          <div class="stat-value">${rides.length}</div><div class="stat-label">Total Rides</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--amber)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="stat-value">${Utils.fmtCurrency(totalFuel)}</div><div class="stat-label">Total Fuel</div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Ride History</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Start</th><th>End</th><th>Dist</th><th>Fuel</th><th>Photos</th></tr></thead>
            <tbody>
              ${rides.length === 0 ? '<tr><td colspan="6"><div class="empty-state"><p>No rides yet. Tap "Log Ride" to start!</p></div></td></tr>' :
              rides.map(r => `<tr>
                <td style="font-weight:600">${Utils.fmtDate(r.date)}</td>
                <td>${r.startKm}</td><td>${r.endKm}</td>
                <td><strong>${r.distance} km</strong></td>
                <td>${Utils.fmtCurrency(r.fuelCost)}</td>
                <td>
                  ${r.startImage ? `<img src="${r.startImage}" class="ride-thumb" onclick="Riders.viewPhoto(this.src)" title="Before">` : ''}
                  ${r.endImage ? `<img src="${r.endImage}" class="ride-thumb" onclick="Riders.viewPhoto(this.src)" title="After">` : ''}
                  ${!r.startImage && !r.endImage ? '—' : ''}
                </td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const bindMyRides = () => {
    document.getElementById('startRideBtn')?.addEventListener('click', () => {
      logRide(Auth.getCurrentUser().id, Auth.getCurrentUser().name);
    });
  };

  return { render, bind, showDetail, renderMyRides, bindMyRides, logRide, viewPhoto };
})();
