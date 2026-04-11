/* ══════════════════════════════════════════
   Ved Logistics — Expenses Module
   ══════════════════════════════════════════ */

const Expenses = (() => {
  let filter = 'all';
  const TYPE_MAP = { fuel: '⛽ Fuel', maintenance: '🔧 Maintenance', emergency: '🆘 Emergency', other: '📋 Other' };

  const render = () => {
    const expenses = Store.getAll('expenses').sort((a,b) => new Date(b.requestDate) - new Date(a.requestDate));
    const filtered = filter === 'all' ? expenses : expenses.filter(e => e.status === filter);
    const total = expenses.reduce((s,e) => s + (e.amount||0), 0);
    const approved = expenses.filter(e => e.status === 'approved').reduce((s,e) => s + e.amount, 0);
    const pending = expenses.filter(e => e.status === 'pending');

    return `
      <div class="page-header">
        <div><h1>💳 Expenses</h1><div class="page-header-sub">${expenses.length} total requests</div></div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" style="--stat-color:var(--blue)">
          <div class="stat-value">${Utils.fmtCurrency(total)}</div><div class="stat-label">Total Requested</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--emerald)">
          <div class="stat-value">${Utils.fmtCurrency(approved)}</div><div class="stat-label">Approved</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--amber)">
          <div class="stat-value">${pending.length}</div><div class="stat-label">Pending</div>
        </div>
      </div>

      <div class="filter-bar">
        <div class="filter-pills">
          ${['all','pending','approved','rejected'].map(s => `<button class="filter-pill ${filter===s?'active':''}" data-ef="${s}">${s==='all'?'All':s.charAt(0).toUpperCase()+s.slice(1)} (${s==='all'?expenses.length:expenses.filter(e=>e.status===s).length})</button>`).join('')}
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Type</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th><th>Actions</th></tr></thead>
          <tbody>
            ${filtered.length === 0 ? '<tr><td colspan="7"><div class="empty-state"><p>No expenses</p></div></td></tr>' :
            filtered.map(e => {
              const emp = Store.getById('employees', e.employeeId);
              return `<tr>
                <td style="font-weight:600">${emp?.name || 'Unknown'}</td>
                <td>${TYPE_MAP[e.type] || e.type}</td>
                <td style="font-weight:700;color:var(--blue)">${Utils.fmtCurrency(e.amount)}</td>
                <td style="font-size:.8rem;max-width:200px;overflow:hidden;text-overflow:ellipsis">${e.description}</td>
                <td style="font-size:.78rem">${Utils.fmtDate(e.requestDate)}</td>
                <td><span class="badge badge-${e.status}">${e.status}</span></td>
                <td><div class="td-actions">
                  ${e.status === 'pending' ? `
                    <button class="btn-success btn-sm" data-approve-exp="${e.id}">✓</button>
                    <button class="btn-danger btn-sm" data-reject-exp="${e.id}">✕</button>
                  ` : ''}
                </div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const bind = () => {
    document.querySelectorAll('[data-ef]').forEach(btn => {
      btn.onclick = () => { filter = btn.dataset.ef; Dashboard.navigate('expenses'); };
    });
    document.querySelectorAll('[data-approve-exp]').forEach(btn => {
      btn.onclick = () => {
        Store.update('expenses', btn.dataset.approveExp, { status: 'approved' });
        Utils.toast('Expense approved', 'success');
        Dashboard.navigate('expenses');
      };
    });
    document.querySelectorAll('[data-reject-exp]').forEach(btn => {
      btn.onclick = () => {
        Store.update('expenses', btn.dataset.rejectExp, { status: 'rejected' });
        Utils.toast('Expense rejected', 'info');
        Dashboard.navigate('expenses');
      };
    });
  };

  // ── Employee View ──
  const renderMy = () => {
    const user = Auth.getCurrentUser();
    const myExp = Store.query('expenses', e => e.employeeId === user.id).sort((a,b) => new Date(b.requestDate) - new Date(a.requestDate));

    return `
      <div class="page-header">
        <div><h1>💳 My Expenses</h1><div class="page-header-sub">${myExp.length} requests</div></div>
        <div class="page-actions">
          <button class="btn-primary" id="addExpenseBtn">+ New Expense</button>
        </div>
      </div>

      <div class="table-wrap">
        <table>
          <thead><tr><th>Type</th><th>Amount</th><th>Description</th><th>Date</th><th>Status</th></tr></thead>
          <tbody>
            ${myExp.length === 0 ? '<tr><td colspan="5"><div class="empty-state"><p>No expenses submitted</p></div></td></tr>' :
            myExp.map(e => `<tr>
              <td>${TYPE_MAP[e.type] || e.type}</td>
              <td style="font-weight:700">${Utils.fmtCurrency(e.amount)}</td>
              <td style="font-size:.82rem">${e.description}</td>
              <td style="font-size:.78rem">${Utils.fmtDate(e.requestDate)}</td>
              <td><span class="badge badge-${e.status}">${e.status}</span></td>
            </tr>`).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const bindMy = () => {
    document.getElementById('addExpenseBtn')?.addEventListener('click', async () => {
      await Utils.modal('New Expense Request', `
        <div class="form-group">
          <label class="form-label">Type</label>
          <select class="form-select" id="exp-type">
            <option value="fuel">⛽ Fuel</option>
            <option value="maintenance">🔧 Maintenance</option>
            <option value="emergency">🆘 Emergency</option>
            <option value="other">📋 Other</option>
          </select>
        </div>
        <div class="form-group"><label class="form-label">Amount *</label><input type="number" class="form-input" id="exp-amount" placeholder="e.g., 500"></div>
        <div class="form-group"><label class="form-label">Description *</label><textarea class="form-textarea" id="exp-desc" placeholder="Describe the expense..."></textarea></div>
        <div class="form-group"><label class="form-label">Receipt Image</label><input type="file" class="form-input" id="exp-receipt" accept="image/*"></div>
      `, {
        confirmText: 'Submit',
        onConfirm: async (overlay) => {
          const amount = parseInt(overlay.querySelector('#exp-amount').value);
          const desc = overlay.querySelector('#exp-desc').value.trim();
          if (!amount || !desc) { Utils.toast('Fill required fields', 'error'); return false; }

          let receiptImage = null;
          const file = overlay.querySelector('#exp-receipt').files[0];
          if (file) receiptImage = await Utils.fileToBase64(file);

          Store.create('expenses', {
            employeeId: Auth.getCurrentUser().id,
            type: overlay.querySelector('#exp-type').value,
            amount, description: desc, receiptImage,
            status: 'pending',
            requestDate: new Date().toISOString(),
          });
          Utils.toast('Expense submitted!', 'success');
          Dashboard.navigate('my-expenses');
          return true;
        }
      });
    });
  };

  return { render, bind, renderMy, bindMy };
})();
