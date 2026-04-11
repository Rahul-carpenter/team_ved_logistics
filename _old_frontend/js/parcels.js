/* ══════════════════════════════════════════
   Ved Logistics — Parcels Module
   ══════════════════════════════════════════ */

const Parcels = (() => {
  let statusFilter = 'all';

  const STATUS_MAP = {
    assigned: { label: 'Assigned', color: 'var(--amber)', cls: 'badge-assigned' },
    picked_up: { label: 'Picked Up', color: 'var(--blue)', cls: 'badge-picked_up' },
    in_transit: { label: 'In Transit', color: 'var(--indigo)', cls: 'badge-in_transit' },
    delivered: { label: 'Delivered', color: 'var(--emerald)', cls: 'badge-delivered' },
  };
  const STATUS_ORDER = ['assigned', 'picked_up', 'in_transit', 'delivered'];

  const render = () => {
    const parcels = Store.getAll('parcels').sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));
    const filtered = statusFilter === 'all' ? parcels : parcels.filter(p => p.status === statusFilter);
    const riders = Store.getAll('employees').filter(e => e.employeeRole === 'rider');

    return `
      <div class="page-header">
        <div><h1>📦 Parcels</h1><div class="page-header-sub">${parcels.length} total deliveries</div></div>
        <div class="page-actions">
          <button class="btn-primary" id="addParcelBtn">+ Create Delivery</button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-pills">
          <button class="filter-pill ${statusFilter==='all'?'active':''}" data-sf="all">All (${parcels.length})</button>
          ${STATUS_ORDER.map(s => `<button class="filter-pill ${statusFilter===s?'active':''}" data-sf="${s}">${STATUS_MAP[s].label} (${parcels.filter(p=>p.status===s).length})</button>`).join('')}
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Parcel ID</th><th>Customer</th><th>Route</th><th>Type</th><th>Weight</th><th>Rider</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? '<tr><td colspan="8"><div class="empty-state"><p>No parcels found</p></div></td></tr>' :
            filtered.map(p => {
              const rider = Store.getById('employees', p.assignedRider);
              return `<tr>
                <td style="font-weight:700;color:var(--blue)">${p.parcelId}</td>
                <td>${p.customerName}</td>
                <td style="font-size:.78rem">${p.pickupAddress} → ${p.deliveryAddress}</td>
                <td style="font-size:.78rem">${p.parcelType}</td>
                <td>${p.weight} kg</td>
                <td>${rider ? `<div style="display:flex;align-items:center;gap:6px"><div class="avatar" style="width:24px;height:24px;font-size:.6rem;border-radius:6px">${rider.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>${rider.name.split(' ')[0]}</div>` : '—'}</td>
                <td><span class="badge ${STATUS_MAP[p.status]?.cls}">${STATUS_MAP[p.status]?.label}</span></td>
                <td><div class="td-actions">
                  <button class="btn-icon" title="Details" data-parcel-detail="${p.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
                  ${p.status !== 'delivered' ? `<button class="btn-sm btn-success" data-parcel-advance="${p.id}">▶ Next</button>` : ''}
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const bind = () => {
    document.querySelectorAll('[data-sf]').forEach(btn => {
      btn.onclick = () => {
        statusFilter = btn.dataset.sf;
        document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
        bind();
      };
    });

    document.getElementById('addParcelBtn')?.addEventListener('click', showAddModal);

    document.querySelectorAll('[data-parcel-advance]').forEach(btn => {
      btn.onclick = () => updateStatusFlow(btn.dataset.parcelAdvance);
    });

    document.querySelectorAll('[data-parcel-detail]').forEach(btn => {
      btn.onclick = () => showDetail(btn.dataset.parcelDetail);
    });
  };

  const showAddModal = async () => {
    const riders = Store.getAll('employees').filter(e => e.employeeRole === 'rider');
    await Utils.modal('Create New Delivery', `
      <div class="form-row">
        <div class="form-group"><label class="form-label">Customer Name *</label><input class="form-input" id="pf-customer"></div>
        <div class="form-group">
          <label class="form-label">Parcel Type</label>
          <select class="form-select" id="pf-type">
            <option>Document</option><option>Small Package</option><option>Medium Box</option><option>Large Box</option><option>Fragile</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Pickup Address *</label><input class="form-input" id="pf-pickup" placeholder="City, State"></div>
        <div class="form-group"><label class="form-label">Delivery Address *</label><input class="form-input" id="pf-delivery" placeholder="City, State"></div>
      </div>
      <div class="form-row">
        <div class="form-group"><label class="form-label">Weight (kg)</label><input type="number" class="form-input" id="pf-weight" value="1" step="0.1"></div>
        <div class="form-group">
          <label class="form-label">Assign Rider *</label>
          <select class="form-select" id="pf-rider">
            ${riders.map(r => `<option value="${r.id}">${r.name}</option>`).join('')}
          </select>
        </div>
      </div>
    `, {
      confirmText: 'Create Delivery',
      onConfirm: (overlay) => {
        const customer = overlay.querySelector('#pf-customer').value.trim();
        const pickup = overlay.querySelector('#pf-pickup').value.trim();
        const delivery = overlay.querySelector('#pf-delivery').value.trim();
        if (!customer || !pickup || !delivery) { Utils.toast('Fill all required fields', 'error'); return false; }

        const count = Store.getAll('parcels').length;
        Store.create('parcels', {
          parcelId: 'VL-' + (20000 + count + 1),
          customerName: customer,
          pickupAddress: pickup,
          deliveryAddress: delivery,
          parcelType: overlay.querySelector('#pf-type').value,
          weight: overlay.querySelector('#pf-weight').value,
          assignedRider: overlay.querySelector('#pf-rider').value,
          status: 'assigned',
          statusHistory: [{ status: 'assigned', timestamp: new Date().toISOString() }],
        });
        Utils.toast('Delivery created!', 'success');
        document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
        bind();
        return true;
      }
    });
  };

  const updateStatusFlow = async (parcelId) => {
    const parcel = Store.getById('parcels', parcelId);
    if (!parcel) return;
    const curIdx = STATUS_ORDER.indexOf(parcel.status);
    if (curIdx >= STATUS_ORDER.length - 1) { Utils.toast('Already delivered', 'info'); return; }

    const nextStatus = STATUS_ORDER[curIdx + 1];
    const ok = await Utils.confirm(`Update <strong>${parcel.parcelId}</strong> status to <strong>${STATUS_MAP[nextStatus].label}</strong>?`, 'Update Status');
    if (ok) {
      const history = parcel.statusHistory || [];
      history.push({ status: nextStatus, timestamp: new Date().toISOString() });
      Store.update('parcels', parcelId, { status: nextStatus, statusHistory: history });
      Utils.toast(`Status updated to ${STATUS_MAP[nextStatus].label}`, 'success');
      // Refresh whichever page we're on
      const hash = window.location.hash.slice(1);
      Dashboard.navigate(hash || 'parcels');
    }
  };

  const showDetail = async (parcelId) => {
    const p = Store.getById('parcels', parcelId);
    if (!p) return;
    const rider = Store.getById('employees', p.assignedRider);
    const curIdx = STATUS_ORDER.indexOf(p.status);

    await Utils.modal(`Parcel ${p.parcelId}`, `
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px;margin-bottom:20px">
        <div><span style="font-size:.72rem;color:var(--text-muted);display:block">Customer</span><strong>${p.customerName}</strong></div>
        <div><span style="font-size:.72rem;color:var(--text-muted);display:block">Type</span><strong>${p.parcelType}</strong></div>
        <div><span style="font-size:.72rem;color:var(--text-muted);display:block">Pickup</span><strong>${p.pickupAddress}</strong></div>
        <div><span style="font-size:.72rem;color:var(--text-muted);display:block">Delivery</span><strong>${p.deliveryAddress}</strong></div>
        <div><span style="font-size:.72rem;color:var(--text-muted);display:block">Weight</span><strong>${p.weight} kg</strong></div>
        <div><span style="font-size:.72rem;color:var(--text-muted);display:block">Rider</span><strong>${rider?.name || '—'}</strong></div>
      </div>

      <h4 style="margin-bottom:12px">Delivery Progress</h4>
      <div class="delivery-steps">
        ${STATUS_ORDER.map((s, i) => {
          const isDone = i <= curIdx;
          const isActive = i === curIdx;
          return `<div class="delivery-step ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}">
            ${i < STATUS_ORDER.length - 1 ? '<div class="delivery-step-line"></div>' : ''}
            <div class="delivery-step-dot">${isDone ? '✓' : i + 1}</div>
            <div class="delivery-step-label">${STATUS_MAP[s].label}</div>
          </div>`;
        }).join('')}
      </div>

      <h4 style="margin:20px 0 12px">Status History</h4>
      <div class="timeline">
        ${(p.statusHistory || []).map((h, i) => `
          <div class="timeline-item ${i === (p.statusHistory||[]).length - 1 ? 'current' : 'done'}">
            <div class="timeline-time">${Utils.fmtDateTime(h.timestamp)}</div>
            <div class="timeline-text">${STATUS_MAP[h.status]?.label || h.status}</div>
          </div>
        `).join('')}
      </div>
    `, { size: 'lg', confirmText: false, cancelText: 'Close' });
  };

  // ── Rider's own deliveries ──
  const renderMy = () => {
    const user = Auth.getCurrentUser();
    const myParcels = Store.query('parcels', p => p.assignedRider === user.id).sort((a,b) => new Date(b.createdAt) - new Date(a.createdAt));

    return `
      <div class="page-header">
        <div><h1>📦 My Deliveries</h1><div class="page-header-sub">${myParcels.length} total · ${myParcels.filter(p=>p.status!=='delivered').length} pending</div></div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Parcel ID</th><th>Customer</th><th>Route</th><th>Status</th><th>Action</th></tr></thead>
          <tbody>
            ${myParcels.map(p => `<tr>
              <td style="font-weight:700;color:var(--blue)">${p.parcelId}</td>
              <td>${p.customerName}</td>
              <td style="font-size:.78rem">${p.pickupAddress} → ${p.deliveryAddress}</td>
              <td><span class="badge ${STATUS_MAP[p.status]?.cls}">${STATUS_MAP[p.status]?.label}</span></td>
              <td>${p.status !== 'delivered' ? `<button class="btn-primary btn-sm" data-advance="${p.id}">▶ Next Status</button>` : '<span style="color:var(--emerald)">✓ Done</span>'}</td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const bindMy = () => {
    document.querySelectorAll('[data-advance]').forEach(btn => {
      btn.onclick = () => updateStatusFlow(btn.dataset.advance);
    });
  };

  return { render, bind, renderMy, bindMy, updateStatusFlow, showDetail };
})();
