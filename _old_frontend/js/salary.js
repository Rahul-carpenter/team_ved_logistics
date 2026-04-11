/* ══════════════════════════════════════════
   Ved Logistics — Salary Module (Admin Manual Pay)
   Admin decides: which employee, which date, which amount, with notes
   ══════════════════════════════════════════ */

const Salary = (() => {
  let monthFilter = new Date().toISOString().slice(0,7); // YYYY-MM

  const render = () => {
    const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
    const payments = Store.getAll('salary_payments').sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    const monthPayments = payments.filter(p => p.paymentDate && p.paymentDate.startsWith(monthFilter));
    const totalPaidMonth = monthPayments.reduce((s,p) => s + (p.amount||0), 0);
    const totalPayroll = emps.reduce((s,e) => s + (e.baseSalary||0), 0);
    const pendingAdv = Store.query('advances', a => a.status === 'pending');

    // Check who got paid this month
    const paidEmpIds = new Set(monthPayments.map(p => p.employeeId));
    const unpaid = emps.filter(e => !paidEmpIds.has(e.id));

    return `
      <div class="page-header">
        <div><h1>💰 Salary Management</h1><div class="page-header-sub">Admin controls all payments · Add notes for records</div></div>
        <div class="page-actions">
          <input type="month" class="form-input" id="salaryMonthFilter" value="${monthFilter}" style="width:auto">
          <button class="btn-primary" id="paySalaryBtn">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            Pay Salary
          </button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" style="--stat-color:var(--blue)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="stat-value">${Utils.fmtCurrency(totalPayroll)}</div><div class="stat-label">Total Payroll / Month</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--emerald)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg></div>
          <div class="stat-value">${Utils.fmtCurrency(totalPaidMonth)}</div><div class="stat-label">Paid (${monthFilter})</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--amber)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg></div>
          <div class="stat-value">${unpaid.length}</div><div class="stat-label">Unpaid Members</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--rose)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
          <div class="stat-value">${pendingAdv.length}</div><div class="stat-label">Pending Advances</div>
        </div>
      </div>

      <!-- Pending Advance Requests -->
      ${pendingAdv.length > 0 ? `
        <div class="card" style="margin-bottom:20px">
          <div class="card-header"><div class="card-title">⏳ Pending Advance Requests</div></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Amount</th><th>Reason</th><th>Date</th><th>Actions</th></tr></thead>
              <tbody>
                ${pendingAdv.map(a => {
                  const emp = Store.getById('employees', a.employeeId);
                  return `<tr>
                    <td style="font-weight:600">${emp?.name || 'Unknown'}</td>
                    <td style="font-weight:700;color:var(--blue)">${Utils.fmtCurrency(a.amount)}</td>
                    <td style="font-size:.82rem">${a.reason}</td>
                    <td style="font-size:.78rem">${Utils.fmtDate(a.requestDate)}</td>
                    <td><div class="td-actions">
                      <button class="btn-success btn-sm" data-approve-adv="${a.id}">✓ Approve</button>
                      <button class="btn-danger btn-sm" data-reject-adv="${a.id}">✕ Reject</button>
                    </div></td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}

      <!-- Salary Status per Employee -->
      <div class="card" style="margin-bottom:20px">
        <div class="card-header">
          <div><div class="card-title">Team Salary Status — ${monthFilter}</div><div class="card-subtitle">${emps.length - unpaid.length} paid · ${unpaid.length} pending</div></div>
        </div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Role</th><th>Base Salary</th><th>Paid Amount</th><th>Payment Date</th><th>Note</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>
              ${emps.map(e => {
                const empPayments = monthPayments.filter(p => p.employeeId === e.id);
                const totalPaid = empPayments.reduce((s,p) => s + (p.amount||0), 0);
                const lastPayment = empPayments[0];
                const isPaid = empPayments.length > 0;
                return `<tr>
                  <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${e.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div><span style="font-weight:600">${e.name}</span></div></td>
                  <td><span class="badge ${e.employeeRole==='rider'?'badge-rider':'badge-role'}">${e.employeeRole}</span></td>
                  <td>${Utils.fmtCurrency(e.baseSalary)}</td>
                  <td style="font-weight:700;color:${isPaid?'var(--emerald)':'var(--text-muted)'}">${isPaid ? Utils.fmtCurrency(totalPaid) : '—'}</td>
                  <td style="font-size:.78rem">${lastPayment ? Utils.fmtDate(lastPayment.paymentDate) : '—'}</td>
                  <td style="font-size:.72rem;max-width:150px;overflow:hidden;text-overflow:ellipsis" title="${(lastPayment?.note||'').replace(/"/g,'&quot;')}">${lastPayment?.note || '—'}</td>
                  <td>${isPaid ? '<span class="badge badge-active">Paid</span>' : '<span class="badge badge-pending">Unpaid</span>'}</td>
                  <td><div class="td-actions">
                    <button class="btn-primary btn-sm" data-pay-emp="${e.id}" data-pay-name="${e.name}" data-pay-salary="${e.baseSalary}">💰 Pay</button>
                  </div></td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <!-- Recent Payment History -->
      <div class="card">
        <div class="card-header"><div class="card-title">Payment History (All Time)</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Employee</th><th>Amount</th><th>Payment Date</th><th>Note</th><th>Paid By</th><th>Created</th></tr></thead>
            <tbody>
              ${payments.length === 0 ? '<tr><td colspan="6"><div class="empty-state"><p>No payments recorded yet</p></div></td></tr>' :
              payments.slice(0, 50).map(p => {
                const emp = Store.getById('employees', p.employeeId);
                return `<tr>
                  <td style="font-weight:600">${emp?.name || 'Unknown'}</td>
                  <td style="font-weight:700;color:var(--emerald)">${Utils.fmtCurrency(p.amount)}</td>
                  <td style="font-size:.78rem;font-weight:600">${Utils.fmtDate(p.paymentDate)}</td>
                  <td style="font-size:.78rem;max-width:200px;overflow:hidden;text-overflow:ellipsis" title="${(p.note||'').replace(/"/g,'&quot;')}">${p.note || '—'}</td>
                  <td style="font-size:.78rem">${p.paidBy || 'Admin'}</td>
                  <td style="font-size:.72rem;color:var(--text-muted)">${Utils.fmtDateTime(p.createdAt)}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const bind = () => {
    document.getElementById('salaryMonthFilter')?.addEventListener('change', (e) => {
      monthFilter = e.target.value;
      document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
      bind();
    });

    document.getElementById('paySalaryBtn')?.addEventListener('click', () => showPayModal());

    document.querySelectorAll('[data-pay-emp]').forEach(btn => {
      btn.onclick = () => showPayModal(btn.dataset.payEmp, btn.dataset.payName, parseInt(btn.dataset.paySalary));
    });

    document.querySelectorAll('[data-approve-adv]').forEach(btn => {
      btn.onclick = async () => {
        const adv = Store.getById('advances', btn.dataset.approveAdv);
        await Utils.modal('Approve Advance', `
          <p style="margin-bottom:12px">Approve advance of <strong>${Utils.fmtCurrency(adv?.amount)}</strong>?</p>
          <div class="form-group"><label class="form-label">Admin Note</label><textarea class="form-textarea" id="adv-note" placeholder="Add a note (optional)"></textarea></div>
        `, {
          confirmText: '✓ Approve',
          onConfirm: (overlay) => {
            const note = overlay.querySelector('#adv-note').value.trim();
            Store.update('advances', btn.dataset.approveAdv, { status: 'approved', approvedDate: new Date().toISOString(), note });
            Utils.toast('Advance approved', 'success');
            Dashboard.navigate('salary');
            return true;
          }
        });
      };
    });

    document.querySelectorAll('[data-reject-adv]').forEach(btn => {
      btn.onclick = async () => {
        await Utils.modal('Reject Advance', `
          <div class="form-group"><label class="form-label">Reason for Rejection</label><textarea class="form-textarea" id="reject-note" placeholder="Why is this being rejected?"></textarea></div>
        `, {
          confirmText: '✕ Reject',
          onConfirm: (overlay) => {
            const note = overlay.querySelector('#reject-note').value.trim();
            Store.update('advances', btn.dataset.rejectAdv, { status: 'rejected', note });
            Utils.toast('Advance rejected', 'info');
            Dashboard.navigate('salary');
            return true;
          }
        });
      };
    });
  };

  // ── Pay Salary Modal ──
  const showPayModal = async (preEmpId, preEmpName, preSalary) => {
    const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
    const user = Auth.getCurrentUser();

    await Utils.modal('💰 Pay Salary', `
      <div class="form-group">
        <label class="form-label">Select Employee *</label>
        <select class="form-select" id="sp-employee">
          <option value="">— Choose Employee —</option>
          ${emps.map(e => `<option value="${e.id}" ${e.id===preEmpId?'selected':''}>${e.name} (${e.employeeRole}) — Base: ${Utils.fmtCurrency(e.baseSalary)}</option>`).join('')}
        </select>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label class="form-label">Amount to Pay *</label>
          <input type="number" class="form-input" id="sp-amount" value="${preSalary||''}" placeholder="Enter amount">
        </div>
        <div class="form-group">
          <label class="form-label">Payment Date *</label>
          <input type="date" class="form-input" id="sp-date" value="${Utils.today()}">
          <div class="form-hint">Admin chooses the date</div>
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">Note / Remarks *</label>
        <textarea class="form-textarea" id="sp-note" placeholder="e.g., March salary, bonus included, partial payment...">${preEmpName ? `Salary payment for ${preEmpName}` : ''}</textarea>
        <div class="form-hint">Notes are mandatory — helps track all payments</div>
      </div>
    `, {
      confirmText: 'Confirm Payment',
      onOpen: (overlay) => {
        overlay.querySelector('#sp-employee').addEventListener('change', (e) => {
          const emp = Store.getById('employees', e.target.value);
          if (emp) {
            overlay.querySelector('#sp-amount').value = emp.baseSalary || '';
            overlay.querySelector('#sp-note').value = `Salary payment for ${emp.name}`;
          }
        });
      },
      onConfirm: (overlay) => {
        const employeeId = overlay.querySelector('#sp-employee').value;
        const amount = parseInt(overlay.querySelector('#sp-amount').value);
        const paymentDate = overlay.querySelector('#sp-date').value;
        const note = overlay.querySelector('#sp-note').value.trim();

        if (!employeeId) { Utils.toast('Please select an employee', 'error'); return false; }
        if (!amount || amount <= 0) { Utils.toast('Please enter a valid amount', 'error'); return false; }
        if (!paymentDate) { Utils.toast('Please select a payment date', 'error'); return false; }
        if (!note) { Utils.toast('Note is required for payment records', 'error'); return false; }

        Store.create('salary_payments', {
          employeeId,
          amount,
          paymentDate,
          note,
          paidBy: user.name,
          month: paymentDate.slice(0,7),
        });

        const emp = Store.getById('employees', employeeId);
        Utils.toast(`₹${amount.toLocaleString()} paid to ${emp?.name}!`, 'success');
        Dashboard.navigate('salary');
        return true;
      }
    });
  };

  // ── Employee View (My Salary) ──
  const renderMy = () => {
    const user = Auth.getCurrentUser();
    const payments = Store.query('salary_payments', s => s.employeeId === user.id).sort((a,b) => new Date(b.paymentDate) - new Date(a.paymentDate));
    const totalReceived = payments.reduce((s,p) => s + (p.amount||0), 0);
    const emp = Store.getById('employees', user.id);
    const advances = Store.query('advances', a => a.employeeId === user.id).sort((a,b) => new Date(b.requestDate) - new Date(a.requestDate));

    return `
      <div class="page-header">
        <div><h1>💰 My Salary</h1><div class="page-header-sub">Your payment history and advance requests</div></div>
        <div class="page-actions">
          <button class="btn-primary" id="requestAdvanceBtn">Request Advance</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" style="--stat-color:var(--blue)">
          <div class="stat-value">${Utils.fmtCurrency(emp?.baseSalary)}</div><div class="stat-label">Base Salary</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--emerald)">
          <div class="stat-value">${Utils.fmtCurrency(totalReceived)}</div><div class="stat-label">Total Received</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--indigo)">
          <div class="stat-value">${payments.length}</div><div class="stat-label">Payments</div>
        </div>
      </div>

      <div class="card" style="margin-bottom:20px">
        <div class="card-header"><div class="card-title">Payment History</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Amount</th><th>Note</th><th>Paid By</th></tr></thead>
            <tbody>
              ${payments.length === 0 ? '<tr><td colspan="4"><div class="empty-state"><p>No payments received yet</p></div></td></tr>' :
              payments.map(p => `<tr>
                <td style="font-weight:600">${Utils.fmtDate(p.paymentDate)}</td>
                <td style="font-weight:700;color:var(--emerald)">${Utils.fmtCurrency(p.amount)}</td>
                <td style="font-size:.82rem">${p.note || '—'}</td>
                <td style="font-size:.78rem">${p.paidBy || 'Admin'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Advance History</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Amount</th><th>Reason</th><th>Status</th><th>Note</th></tr></thead>
            <tbody>
              ${advances.length === 0 ? '<tr><td colspan="5"><div class="empty-state"><p>No advances requested</p></div></td></tr>' :
              advances.map(a => `<tr>
                <td>${Utils.fmtDate(a.requestDate)}</td>
                <td style="font-weight:700">${Utils.fmtCurrency(a.amount)}</td>
                <td style="font-size:.82rem">${a.reason}</td>
                <td><span class="badge badge-${a.status}">${a.status}</span></td>
                <td style="font-size:.72rem">${a.note || '—'}</td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const bindMy = () => {
    document.getElementById('requestAdvanceBtn')?.addEventListener('click', async () => {
      await Utils.modal('Request Salary Advance', `
        <div class="form-group"><label class="form-label">Amount *</label><input type="number" class="form-input" id="adv-amount" placeholder="e.g., 5000"></div>
        <div class="form-group"><label class="form-label">Reason *</label><textarea class="form-textarea" id="adv-reason" placeholder="Why do you need this advance?"></textarea></div>
      `, {
        confirmText: 'Submit Request',
        onConfirm: (overlay) => {
          const amount = parseInt(overlay.querySelector('#adv-amount').value);
          const reason = overlay.querySelector('#adv-reason').value.trim();
          if (!amount || !reason) { Utils.toast('Fill all fields', 'error'); return false; }
          Store.create('advances', {
            employeeId: Auth.getCurrentUser().id,
            amount, reason,
            status: 'pending',
            requestDate: new Date().toISOString(),
          });
          Utils.toast('Advance request submitted!', 'success');
          Dashboard.navigate('my-salary');
          return true;
        }
      });
    });
  };

  return { render, bind, renderMy, bindMy };
})();
