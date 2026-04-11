/* ══════════════════════════════════════════
   Ved Logistics — Unified Team Module
   Employees + Riders in ONE UI
   ══════════════════════════════════════════ */

const Employees = (() => {
  let searchQuery = '';
  let roleFilter = 'all';
  let statusFilter = 'all';

  const render = () => {
    const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
    const filtered = emps.filter(e => {
      if (roleFilter !== 'all' && e.employeeRole !== roleFilter) return false;
      if (statusFilter !== 'all' && e.status !== statusFilter) return false;
      return Utils.matchesSearch(e, searchQuery, ['name', 'email', 'department', 'phone', 'bikeNumber', 'notes']);
    });
    const riders = emps.filter(e => e.employeeRole === 'rider');
    const rides = Store.getAll('rides');
    const parcels = Store.getAll('parcels');

    return `
      <div class="page-header">
        <div><h1>👥 Team</h1><div class="page-header-sub">${emps.length} members · ${riders.length} riders</div></div>
        <div class="page-actions">
          <button class="btn-primary" onclick="Employees.showAddModal()">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Add Member
          </button>
        </div>
      </div>

      <div class="filter-bar">
        <div class="search-box">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
          <input type="text" placeholder="Search by name, email, bike, notes..." id="empSearch" value="${searchQuery}">
        </div>
        <div class="filter-pills">
          <button class="filter-pill ${roleFilter==='all'?'active':''}" data-filter="all">All (${emps.length})</button>
          <button class="filter-pill ${roleFilter==='normal'?'active':''}" data-filter="normal">Employee (${emps.filter(e=>e.employeeRole==='normal').length})</button>
          <button class="filter-pill ${roleFilter==='rider'?'active':''}" data-filter="rider">Rider (${riders.length})</button>
        </div>
      </div>

      <!-- Desktop Table -->
      <div class="table-wrap hide-mobile">
        <table>
          <thead><tr><th>Member</th><th>Contact</th><th>Department</th><th>Role</th><th>Bike</th><th>Salary</th><th>Status</th><th>Notes</th><th>Actions</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? '<tr><td colspan="9"><div class="empty-state"><p>No team members found</p></div></td></tr>' :
            filtered.map(e => {
              const riderRides = rides.filter(rd => rd.riderId === e.id);
              const totalKm = riderRides.reduce((s,rd) => s + (rd.distance||0), 0);
              const activeParcels = parcels.filter(p => p.assignedRider === e.id && p.status !== 'delivered').length;
              return `<tr>
                <td><div style="display:flex;align-items:center;gap:10px">
                  <div class="avatar${e.employeeRole==='rider'?' rider-avatar':''}">${e.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
                  <div><div style="font-weight:700;font-size:.82rem">${e.name}</div><div style="font-size:.68rem;color:var(--text-muted)">Since ${Utils.fmtDate(e.joinDate)}</div></div>
                </div></td>
                <td><div style="font-size:.78rem">${e.email}</div><div style="font-size:.72rem;color:var(--text-muted)">${e.phone || '—'}</div></td>
                <td><span style="font-size:.8rem">${e.department}</span></td>
                <td><span class="badge ${e.employeeRole==='rider'?'badge-rider':'badge-role'}">${e.employeeRole}</span>
                  ${e.employeeRole==='rider' && totalKm > 0 ? `<div style="font-size:.62rem;color:var(--teal);margin-top:2px">${totalKm} km · ${activeParcels} active</div>` : ''}
                </td>
                <td style="font-size:.78rem">${e.bikeNumber || '—'}</td>
                <td style="font-weight:700">${Utils.fmtCurrency(e.baseSalary)}</td>
                <td><span class="badge ${e.status==='active'?'badge-active':'badge-inactive'}">${e.status}</span></td>
                <td style="font-size:.72rem;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap" title="${(e.notes||'').replace(/"/g,'&quot;')}">${e.notes || '<span style="color:var(--text-muted)">—</span>'}</td>
                <td><div class="td-actions">
                  ${e.employeeRole==='rider' ? `<button class="btn-icon" title="Log Ride" style="color:var(--teal);border-color:var(--teal)" data-logride="${e.id}" data-ridername="${e.name}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18.5" cy="18.5" r="3.5"/><circle cx="5.5" cy="18.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg></button>` : ''}
                  <button class="btn-icon" title="View Details" data-view="${e.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg></button>
                  <button class="btn-icon" title="Edit" data-edit="${e.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
                  <button class="btn-icon" title="Delete" data-delete="${e.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3,6 5,6 21,6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>

      <!-- Mobile Card View -->
      <div class="mobile-cards show-mobile">
        ${filtered.length === 0 ? '<div class="empty-state"><p>No team members found</p></div>' :
        filtered.map(e => {
          const riderRides = rides.filter(rd => rd.riderId === e.id);
          const totalKm = riderRides.reduce((s,rd) => s + (rd.distance||0), 0);
          return `<div class="member-card">
            <div class="member-card-top">
              <div class="avatar${e.employeeRole==='rider'?' rider-avatar':''}">${e.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
              <div class="member-card-info">
                <div class="member-card-name">${e.name}</div>
                <div class="member-card-sub">${e.department} · ${e.email}</div>
              </div>
              <span class="badge ${e.employeeRole==='rider'?'badge-rider':'badge-role'}">${e.employeeRole}</span>
            </div>
            <div class="member-card-details">
              <div><span>Salary</span><strong>${Utils.fmtCurrency(e.baseSalary)}</strong></div>
              <div><span>Status</span><span class="badge ${e.status==='active'?'badge-active':'badge-inactive'}">${e.status}</span></div>
              ${e.bikeNumber ? `<div><span>Bike</span><strong>${e.bikeNumber}</strong></div>` : ''}
              ${e.employeeRole==='rider' ? `<div><span>KM</span><strong style="color:var(--teal)">${totalKm} km</strong></div>` : ''}
            </div>
            ${e.notes ? `<div class="member-card-note">${e.notes}</div>` : ''}
            <div class="member-card-actions">
              ${e.employeeRole==='rider' ? `<button class="btn-sm btn-outline" data-logride="${e.id}" data-ridername="${e.name}">🏍️ Log Ride</button>` : ''}
              <button class="btn-sm btn-outline" data-view="${e.id}">👁 View</button>
              <button class="btn-sm btn-outline" data-edit="${e.id}">✏️ Edit</button>
              <button class="btn-sm btn-danger" data-delete="${e.id}">🗑</button>
            </div>
          </div>`;
        }).join('')}
      </div>
    `;
  };

  const bind = () => {
    document.getElementById('empSearch')?.addEventListener('input', Utils.debounce(e => {
      searchQuery = e.target.value;
      document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
      bind();
    }));

    document.querySelectorAll('.filter-pill[data-filter]').forEach(btn => {
      btn.onclick = () => {
        roleFilter = btn.dataset.filter;
        document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
        bind();
      };
    });

    document.querySelectorAll('[data-view]').forEach(btn => {
      btn.onclick = () => showDetailModal(btn.dataset.view);
    });

    document.querySelectorAll('[data-edit]').forEach(btn => {
      btn.onclick = () => showEditModal(btn.dataset.edit);
    });

    document.querySelectorAll('[data-delete]').forEach(btn => {
      btn.onclick = async () => {
        const emp = Store.getById('employees', btn.dataset.delete);
        const ok = await Utils.confirm(`Delete <strong>${emp?.name}</strong>? This action cannot be undone.`);
        if (ok) {
          Store.remove('employees', btn.dataset.delete);
          Utils.toast('Member removed', 'success');
          document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
          bind();
        }
      };
    });

    // Log Ride buttons on rider rows
    document.querySelectorAll('[data-logride]').forEach(btn => {
      btn.onclick = () => Riders.logRide(btn.dataset.logride, btn.dataset.ridername);
    });
  };

  // ── Unified form (employee + rider fields together) ──
  const formHTML = (emp = {}) => `
    <div class="form-row">
      <div class="form-group"><label class="form-label">Full Name *</label><input class="form-input" id="ef-name" value="${emp.name||''}"></div>
      <div class="form-group"><label class="form-label">Email *</label><input class="form-input" type="email" id="ef-email" value="${emp.email||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Phone</label><input class="form-input" id="ef-phone" value="${emp.phone||''}"></div>
      <div class="form-group"><label class="form-label">Department</label><input class="form-input" id="ef-department" value="${emp.department||''}"></div>
    </div>
    <div class="form-row">
      <div class="form-group">
        <label class="form-label">Role Type</label>
        <select class="form-select" id="ef-employeeRole">
          <option value="normal" ${emp.employeeRole==='normal'||!emp.employeeRole?'selected':''}>Employee Only</option>
          <option value="rider" ${emp.employeeRole==='rider'?'selected':''}>Employee + Rider</option>
        </select>
        <div class="form-hint">A rider is also an employee. Same person can do both tasks.</div>
      </div>
      <div class="form-group"><label class="form-label">Base Salary</label><input class="form-input" type="number" id="ef-baseSalary" value="${emp.baseSalary||0}"></div>
    </div>
    <div class="form-row">
      <div class="form-group"><label class="form-label">Join Date</label><input class="form-input" type="date" id="ef-joinDate" value="${emp.joinDate||Utils.today()}"></div>
      <div class="form-group"><label class="form-label">Password ${emp.id ? '(leave blank to keep)' : '*'}</label><input class="form-input" type="password" id="ef-password" placeholder="${emp.id?'Unchanged':'Create password'}"></div>
    </div>
    <div class="form-group" id="bikeField" style="display:${emp.employeeRole==='rider'?'block':'none'}">
      <label class="form-label">Bike Number</label>
      <input class="form-input" id="ef-bikeNumber" value="${emp.bikeNumber||''}" placeholder="e.g., RJ-14-AB-1234">
    </div>
    <div class="form-group">
      <label class="form-label">Status</label>
      <select class="form-select" id="ef-status">
        <option value="active" ${emp.status==='active'||!emp.status?'selected':''}>Active</option>
        <option value="inactive" ${emp.status==='inactive'?'selected':''}>Inactive</option>
      </select>
    </div>
    <div class="form-group">
      <label class="form-label">Notes / Remarks</label>
      <textarea class="form-textarea" id="ef-notes" placeholder="Add any notes about this person...">${emp.notes||''}</textarea>
      <div class="form-hint">Admin notes — only visible to admin</div>
    </div>
  `;

  const showAddModal = async () => {
    await Utils.modal('Add Team Member', formHTML(), {
      confirmText: 'Add Member',
      onOpen: (overlay) => {
        overlay.querySelector('#ef-employeeRole').onchange = (e) => {
          overlay.querySelector('#bikeField').style.display = e.target.value === 'rider' ? 'block' : 'none';
        };
      },
      onConfirm: (overlay) => {
        const name = overlay.querySelector('#ef-name').value.trim();
        const email = overlay.querySelector('#ef-email').value.trim();
        const password = overlay.querySelector('#ef-password').value;
        if (!name || !email || !password) { Utils.toast('Name, email and password required', 'error'); return false; }

        const data = {
          name, email, password,
          phone: overlay.querySelector('#ef-phone').value,
          department: overlay.querySelector('#ef-department').value || 'General',
          role: 'employee',
          employeeRole: overlay.querySelector('#ef-employeeRole').value,
          baseSalary: parseInt(overlay.querySelector('#ef-baseSalary').value) || 0,
          joinDate: overlay.querySelector('#ef-joinDate').value || Utils.today(),
          bikeNumber: overlay.querySelector('#ef-bikeNumber').value,
          status: overlay.querySelector('#ef-status').value,
          notes: overlay.querySelector('#ef-notes').value.trim(),
          avatar: '',
        };

        if (Store.getAll('employees').find(e => e.email === email)) {
          Utils.toast('Email already exists', 'error'); return false;
        }

        Store.create('employees', data);
        Utils.toast(`${name} added successfully!`, 'success');
        document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
        bind();
        return true;
      }
    });
  };

  const showEditModal = async (id) => {
    const emp = Store.getById('employees', id);
    if (!emp) return;
    await Utils.modal(`Edit — ${emp.name}`, formHTML(emp), {
      confirmText: 'Save Changes',
      onOpen: (overlay) => {
        overlay.querySelector('#ef-employeeRole').onchange = (e) => {
          overlay.querySelector('#bikeField').style.display = e.target.value === 'rider' ? 'block' : 'none';
        };
      },
      onConfirm: (overlay) => {
        const name = overlay.querySelector('#ef-name').value.trim();
        const email = overlay.querySelector('#ef-email').value.trim();
        if (!name || !email) { Utils.toast('Name and email required', 'error'); return false; }

        const data = {
          name, email,
          phone: overlay.querySelector('#ef-phone').value,
          department: overlay.querySelector('#ef-department').value,
          employeeRole: overlay.querySelector('#ef-employeeRole').value,
          baseSalary: parseInt(overlay.querySelector('#ef-baseSalary').value) || 0,
          joinDate: overlay.querySelector('#ef-joinDate').value,
          bikeNumber: overlay.querySelector('#ef-bikeNumber').value,
          status: overlay.querySelector('#ef-status').value,
          notes: overlay.querySelector('#ef-notes').value.trim(),
        };
        const pw = overlay.querySelector('#ef-password').value;
        if (pw) data.password = pw;

        Store.update('employees', id, data);
        Utils.toast('Member updated!', 'success');
        document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
        bind();
        return true;
      }
    });
  };

  // ── Detail View: full profile + rides + deliveries + salary history ──
  const showDetailModal = async (id) => {
    const emp = Store.getById('employees', id);
    if (!emp) return;
    const rides = Store.query('rides', r => r.riderId === id).sort((a,b) => new Date(b.date) - new Date(a.date));
    const totalKm = rides.reduce((s,r) => s + (r.distance||0), 0);
    const totalFuel = rides.reduce((s,r) => s + (r.fuelCost||0), 0);
    const parcels = Store.query('parcels', p => p.assignedRider === id);
    const delivered = parcels.filter(p => p.status === 'delivered').length;
    const active = parcels.filter(p => p.status !== 'delivered').length;
    const salaryPayments = Store.query('salary_payments', s => s.employeeId === id).sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    const attendance = Store.query('attendance', a => a.employeeId === id);
    const thisMonth = attendance.filter(a => a.date.startsWith(new Date().toISOString().slice(0,7)));

    await Utils.modal(`${emp.name} — Full Profile`, `
      <div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:12px;margin-bottom:20px">
        <div style="text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--blue)">${emp.department}</div>
          <div style="font-size:.65rem;color:var(--text-muted)">Department</div>
        </div>
        <div style="text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--emerald)">${thisMonth.length} Days</div>
          <div style="font-size:.65rem;color:var(--text-muted)">This Month</div>
        </div>
        <div style="text-align:center;padding:12px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.1rem;font-weight:700;color:var(--indigo)">${Utils.fmtCurrency(emp.baseSalary)}</div>
          <div style="font-size:.65rem;color:var(--text-muted)">Base Salary</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:16px;font-size:.82rem">
        <div><span style="color:var(--text-muted)">Email:</span> <strong>${emp.email}</strong></div>
        <div><span style="color:var(--text-muted)">Phone:</span> <strong>${emp.phone || '—'}</strong></div>
        <div><span style="color:var(--text-muted)">Role:</span> <span class="badge ${emp.employeeRole==='rider'?'badge-rider':'badge-role'}">${emp.employeeRole}</span></div>
        <div><span style="color:var(--text-muted)">Status:</span> <span class="badge ${emp.status==='active'?'badge-active':'badge-inactive'}">${emp.status}</span></div>
        <div><span style="color:var(--text-muted)">Join Date:</span> <strong>${Utils.fmtDate(emp.joinDate)}</strong></div>
        ${emp.bikeNumber ? `<div><span style="color:var(--text-muted)">Bike:</span> <strong>${emp.bikeNumber}</strong></div>` : ''}
      </div>

      ${emp.notes ? `<div style="padding:10px 14px;background:rgba(37,99,235,.06);border-left:3px solid var(--blue);border-radius:0 8px 8px 0;margin-bottom:16px;font-size:.82rem"><strong>Notes:</strong> ${emp.notes}</div>` : ''}

      ${emp.employeeRole === 'rider' ? `
        <div style="display:flex;align-items:center;justify-content:space-between;margin:16px 0 10px;flex-wrap:wrap;gap:8px">
          <h4 style="display:flex;align-items:center;gap:8px">🏍️ Rider Stats
            <span style="font-size:.7rem;font-weight:500;color:var(--text-muted)">${rides.length} rides · ${totalKm} km</span>
          </h4>
          <button class="btn-primary btn-sm" onclick="Riders.logRide('${emp.id}','${emp.name.replace(/'/g,"\\'")}')">🏍️ Log Ride + Photos</button>
        </div>
        <div style="display:grid;grid-template-columns:1fr 1fr 1fr 1fr;gap:8px;margin-bottom:12px">
          <div style="text-align:center;padding:8px;background:var(--bg-input);border-radius:var(--radius-md)">
            <div style="font-weight:700;color:var(--teal)">${totalKm}</div><div style="font-size:.6rem;color:var(--text-muted)">Total KM</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--bg-input);border-radius:var(--radius-md)">
            <div style="font-weight:700;color:var(--emerald)">${delivered}</div><div style="font-size:.6rem;color:var(--text-muted)">Delivered</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--bg-input);border-radius:var(--radius-md)">
            <div style="font-weight:700;color:var(--amber)">${active}</div><div style="font-size:.6rem;color:var(--text-muted)">Active</div>
          </div>
          <div style="text-align:center;padding:8px;background:var(--bg-input);border-radius:var(--radius-md)">
            <div style="font-weight:700;color:var(--rose)">${Utils.fmtCurrency(totalFuel)}</div><div style="font-size:.6rem;color:var(--text-muted)">Fuel</div>
          </div>
        </div>
        ${rides.length > 0 ? `
          <div class="table-wrap" style="max-height:200px;overflow-y:auto">
            <table><thead><tr><th>Date</th><th>Start</th><th>End</th><th>Dist</th><th>Fuel</th><th>📷</th></tr></thead>
            <tbody>${rides.slice(0,10).map(r => `<tr>
              <td style="font-size:.75rem">${Utils.fmtDate(r.date)}</td>
              <td style="font-size:.75rem">${r.startKm}</td><td style="font-size:.75rem">${r.endKm}</td>
              <td style="font-weight:600;font-size:.75rem">${r.distance} km</td>
              <td style="font-size:.75rem">${Utils.fmtCurrency(r.fuelCost)}</td>
              <td>${r.startImage || r.endImage ? '📷' : '—'}</td>
            </tr>`).join('')}</tbody></table>
          </div>
        ` : '<div class="empty-state" style="padding:10px"><p>No rides logged yet</p></div>'}
      ` : ''}

      ${salaryPayments.length > 0 ? `
        <h4 style="margin:16px 0 10px">💰 Salary Payments</h4>
        <div class="table-wrap" style="max-height:180px;overflow-y:auto">
          <table><thead><tr><th>Date</th><th>Amount</th><th>Note</th><th>Paid By</th></tr></thead>
          <tbody>${salaryPayments.map(s => `<tr>
            <td style="font-size:.75rem;font-weight:600">${Utils.fmtDate(s.paymentDate)}</td>
            <td style="font-weight:700;color:var(--emerald);font-size:.8rem">${Utils.fmtCurrency(s.amount)}</td>
            <td style="font-size:.72rem;max-width:160px;overflow:hidden;text-overflow:ellipsis" title="${(s.note||'').replace(/"/g,'&quot;')}">${s.note || '—'}</td>
            <td style="font-size:.72rem">${s.paidBy || 'Admin'}</td>
          </tr>`).join('')}</tbody></table>
        </div>
      ` : ''}
    `, { size: 'lg', confirmText: false, cancelText: 'Close' });
  };

  return { render, bind, showAddModal };
})();
