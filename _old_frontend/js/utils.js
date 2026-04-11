/* ══════════════════════════════════════════
   Ved Logistics — Utility Helpers
   ══════════════════════════════════════════ */

const Utils = (() => {
  // ── ID Generator ──
  const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

  // ── Date / Time Formatting ──
  const fmtDate = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const fmtTime = (d) => {
    if (!d) return '—';
    const dt = new Date(d);
    return dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const fmtDateTime = (d) => {
    if (!d) return '—';
    return fmtDate(d) + ' ' + fmtTime(d);
  };

  const fmtDuration = (ms) => {
    if (!ms || ms < 0) return '—';
    const h = Math.floor(ms / 3600000);
    const m = Math.floor((ms % 3600000) / 60000);
    return `${h}h ${m}m`;
  };

  const fmtCurrency = (n) => {
    if (n == null) return '₹0';
    return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 0 });
  };

  const today = () => new Date().toISOString().split('T')[0];

  const daysBetween = (a, b) => {
    const d1 = new Date(a), d2 = new Date(b);
    return Math.ceil(Math.abs(d2 - d1) / 86400000);
  };

  // ── Toast Notifications ──
  let toastContainer = null;

  const ensureToastContainer = () => {
    if (toastContainer && document.body.contains(toastContainer)) return;
    toastContainer = document.createElement('div');
    toastContainer.id = 'toast-container';
    toastContainer.style.cssText = 'position:fixed;bottom:24px;right:24px;z-index:99999;display:flex;flex-direction:column-reverse;gap:10px;pointer-events:none;';
    document.body.appendChild(toastContainer);
  };

  const toast = (message, type = 'info', duration = 3500) => {
    ensureToastContainer();
    const t = document.createElement('div');
    const colors = {
      success: '#22c55e', error: '#ef4444', warning: '#f59e0b', info: '#3b82f6'
    };
    const icons = {
      success: '✓', error: '✕', warning: '⚠', info: 'ℹ'
    };
    t.style.cssText = `
      pointer-events:auto;display:flex;align-items:center;gap:10px;
      padding:14px 20px;border-radius:14px;
      background:rgba(15,23,42,0.92);backdrop-filter:blur(12px);
      color:#fff;font-size:.85rem;font-weight:600;font-family:'Manrope',sans-serif;
      box-shadow:0 12px 40px rgba(0,0,0,.25);
      border-left:4px solid ${colors[type]};
      transform:translateX(120%);transition:transform .35s cubic-bezier(.22,1,.36,1),opacity .3s;
      max-width:380px;
    `;
    t.innerHTML = `<span style="font-size:1.1rem;color:${colors[type]}">${icons[type]}</span><span>${message}</span>`;
    toastContainer.appendChild(t);
    requestAnimationFrame(() => { t.style.transform = 'translateX(0)'; });
    setTimeout(() => {
      t.style.transform = 'translateX(120%)';
      t.style.opacity = '0';
      setTimeout(() => t.remove(), 350);
    }, duration);
  };

  // ── Modal System ──
  const modal = (title, contentHTML, options = {}) => {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'modal-overlay';
      overlay.innerHTML = `
        <div class="modal-box ${options.size || ''}">
          <div class="modal-header">
            <h3>${title}</h3>
            <button class="modal-close" data-action="close">×</button>
          </div>
          <div class="modal-body">${contentHTML}</div>
          ${options.hideFooter ? '' : `
          <div class="modal-footer">
            ${options.cancelText !== false ? `<button class="btn-outline" data-action="cancel">${options.cancelText || 'Cancel'}</button>` : ''}
            ${options.confirmText !== false ? `<button class="btn-primary" data-action="confirm">${options.confirmText || 'Save'}</button>` : ''}
          </div>`}
        </div>
      `;

      const close = (val) => {
        overlay.classList.add('closing');
        setTimeout(() => { overlay.remove(); resolve(val); }, 250);
      };

      overlay.addEventListener('click', (e) => {
        const action = e.target.dataset.action;
        if (action === 'close' || action === 'cancel') close(null);
        if (action === 'confirm') {
          if (options.onConfirm) {
            const result = options.onConfirm(overlay);
            if (result !== false) close(result);
          } else close(true);
        }
        if (e.target === overlay) close(null);
      });

      document.body.appendChild(overlay);
      requestAnimationFrame(() => overlay.classList.add('open'));

      if (options.onOpen) options.onOpen(overlay);
    });
  };

  const confirm = async (message, title = 'Confirm') => {
    return modal(title, `<p style="font-size:.9rem;color:var(--soft);line-height:1.6">${message}</p>`, {
      confirmText: 'Yes, Proceed',
      cancelText: 'Cancel',
      size: 'sm'
    });
  };

  // ── Search / Filter helper ──
  const matchesSearch = (obj, query, keys) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return keys.some(k => (obj[k] || '').toString().toLowerCase().includes(q));
  };

  // ── CSV Export ──
  const exportCSV = (data, filename, columns) => {
    const header = columns.map(c => c.label).join(',');
    const rows = data.map(row =>
      columns.map(c => {
        let v = typeof c.value === 'function' ? c.value(row) : row[c.key] || '';
        v = String(v).replace(/"/g, '""');
        return `"${v}"`;
      }).join(',')
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename + '.csv';
    a.click(); URL.revokeObjectURL(url);
    toast('Report exported successfully', 'success');
  };

  // ── Status Badge Generator ──
  const statusBadge = (status, map) => {
    const s = map[status] || { color: '#94a3b8', label: status };
    return `<span class="badge" style="--badge-color:${s.color}">${s.label || status}</span>`;
  };

  // ── Debounce ──
  const debounce = (fn, ms = 300) => {
    let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), ms); };
  };

  // ── Image to Base64 ──
  const fileToBase64 = (file) => new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  // ── Animate Counter ──
  const animateCounter = (el, target, duration = 1200) => {
    const start = parseInt(el.textContent) || 0;
    const range = target - start;
    const startTime = performance.now();
    const step = (now) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = Math.round(start + range * eased);
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  return {
    uid, fmtDate, fmtTime, fmtDateTime, fmtDuration, fmtCurrency,
    today, daysBetween, toast, modal, confirm, matchesSearch,
    exportCSV, statusBadge, debounce, fileToBase64, animateCounter
  };
})();
