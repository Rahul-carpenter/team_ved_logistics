/* ══════════════════════════════════════════
   Ved Logistics — Attendance Module
   ══════════════════════════════════════════ */

const Attendance = (() => {
  let dateFilter = Utils.today();

  const isLate = (checkInTime) => {
    const startTime = Store.getSetting('workStartTime', '09:00');
    const threshold = Store.getSetting('lateThresholdMin', 30);
    const [sh, sm] = startTime.split(':').map(Number);
    const limit = new Date(checkInTime);
    const checkDate = new Date(checkInTime);
    limit.setHours(sh, sm + threshold, 0, 0);
    return checkDate > limit;
  };

  // ── Admin View ──
  const renderAdmin = () => {
    const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
    const allAtt = Store.query('attendance', a => a.date === dateFilter);
    const presentIds = allAtt.map(a => a.employeeId);
    const absent = emps.filter(e => !presentIds.includes(e.id));
    const late = allAtt.filter(a => isLate(a.checkIn));
    const workStart = Store.getSetting('workStartTime', '09:00');
    const workEnd = Store.getSetting('workEndTime', '18:00');

    return `
      <div class="page-header">
        <div><h1>📋 Attendance</h1><div class="page-header-sub">Work hours: ${workStart} - ${workEnd} (configurable in Settings)</div></div>
        <div class="page-actions">
          <input type="date" class="form-input" id="attDateFilter" value="${dateFilter}" style="width:auto">
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" style="--stat-color:var(--emerald)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg></div>
          <div class="stat-value">${allAtt.length}</div><div class="stat-label">Present</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--rose)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg></div>
          <div class="stat-value">${absent.length}</div><div class="stat-label">Absent</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--amber)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg></div>
          <div class="stat-value">${late.length}</div><div class="stat-label">Late</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--blue)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
          <div class="stat-value">${emps.length}</div><div class="stat-label">Total Staff</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:2fr 1fr;gap:20px">
        <div class="card">
          <div class="card-header"><div class="card-title">Attendance Records — ${Utils.fmtDate(dateFilter)}</div></div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Employee</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Status</th></tr></thead>
              <tbody>
                ${allAtt.length === 0 ? '<tr><td colspan="5"><div class="empty-state"><p>No records for this date</p></div></td></tr>' :
                allAtt.map(a => {
                  const emp = Store.getById('employees', a.employeeId);
                  const dur = a.checkOut ? new Date(a.checkOut) - new Date(a.checkIn) : null;
                  const lateFlag = isLate(a.checkIn);
                  return `<tr>
                    <td><div style="display:flex;align-items:center;gap:8px"><div class="avatar">${emp?.name?.split(' ').map(w=>w[0]).join('').slice(0,2)||'?'}</div><span style="font-weight:600">${emp?.name||'Unknown'}</span></div></td>
                    <td>${Utils.fmtTime(a.checkIn)}</td>
                    <td>${a.checkOut ? Utils.fmtTime(a.checkOut) : '<span style="color:var(--amber)">Still Working</span>'}</td>
                    <td>${dur ? Utils.fmtDuration(dur) : '—'}</td>
                    <td>${lateFlag ? '<span class="badge badge-pending">Late</span>' : '<span class="badge badge-active">On Time</span>'}</td>
                  </tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header"><div class="card-title">Absent Today</div></div>
          ${absent.length === 0 ? '<div class="empty-state"><p>All present! 🎉</p></div>' :
          absent.map(e => `
            <div class="activity-item">
              <div class="avatar" style="background:linear-gradient(135deg,var(--rose),#dc2626)">${e.name.split(' ').map(w=>w[0]).join('').slice(0,2)}</div>
              <div><div class="activity-text">${e.name}</div><div class="activity-time">${e.department}</div></div>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  };

  const bindAdmin = () => {
    document.getElementById('attDateFilter')?.addEventListener('change', (e) => {
      dateFilter = e.target.value;
      document.getElementById('content').innerHTML = `<div class="page-transition">${renderAdmin()}</div>`;
      bindAdmin();
    });
  };

  // ── Employee View ──
  const renderMy = () => {
    const user = Auth.getCurrentUser();
    const myAtt = Store.query('attendance', a => a.employeeId === user.id).sort((a,b) => new Date(b.date) - new Date(a.date));
    const todayRecord = myAtt.find(a => a.date === Utils.today());
    const checkedIn = !!todayRecord;
    const canCheckOut = checkedIn && !todayRecord?.checkOut;

    const thisMonth = myAtt.filter(a => a.date.startsWith(new Date().toISOString().slice(0,7)));
    const lateCount = thisMonth.filter(a => isLate(a.checkIn)).length;

    return `
      <div class="page-header">
        <div><h1>🕐 My Attendance</h1><div class="page-header-sub">This month: ${thisMonth.length} days present, ${lateCount} late</div></div>
      </div>

      <div style="display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap">
        <div class="card" style="flex:1;min-width:250px;text-align:center;padding:32px">
          ${checkedIn ? `
            <div style="font-size:3rem;margin-bottom:8px">✅</div>
            <h3>Checked In at ${Utils.fmtTime(todayRecord.checkIn)}</h3>
            ${canCheckOut ? `
              <button class="checkin-btn out" id="myCheckOut" style="margin:16px auto 0">🕐 Check Out</button>
            ` : todayRecord.checkOut ? `
              <p style="margin-top:8px;color:var(--text-secondary)">Checked out at ${Utils.fmtTime(todayRecord.checkOut)}<br>Duration: <strong>${Utils.fmtDuration(new Date(todayRecord.checkOut)-new Date(todayRecord.checkIn))}</strong></p>
            ` : ''}
          ` : `
            <div style="font-size:3rem;margin-bottom:8px">📍</div>
            <h3>You haven't checked in today</h3>
            <button class="checkin-btn in" id="myCheckIn" style="margin:16px auto 0">Check In Now</button>
          `}
        </div>

        <div class="card" style="flex:1;min-width:250px">
          <h4 style="margin-bottom:12px">This Month Summary</h4>
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:12px">
            <div style="text-align:center;padding:14px;background:var(--bg-input);border-radius:var(--radius-md)">
              <div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--emerald)">${thisMonth.length}</div>
              <div style="font-size:.7rem;color:var(--text-muted)">Present</div>
            </div>
            <div style="text-align:center;padding:14px;background:var(--bg-input);border-radius:var(--radius-md)">
              <div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--amber)">${lateCount}</div>
              <div style="font-size:.7rem;color:var(--text-muted)">Late</div>
            </div>
          </div>
        </div>
      </div>

      <div class="card">
        <div class="card-header"><div class="card-title">Attendance History</div></div>
        <div class="table-wrap">
          <table>
            <thead><tr><th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th><th>Status</th></tr></thead>
            <tbody>
              ${myAtt.slice(0, 30).map(a => {
                const dur = a.checkOut ? new Date(a.checkOut) - new Date(a.checkIn) : null;
                return `<tr>
                  <td style="font-weight:600">${Utils.fmtDate(a.date)}</td>
                  <td>${Utils.fmtTime(a.checkIn)}</td>
                  <td>${a.checkOut ? Utils.fmtTime(a.checkOut) : '—'}</td>
                  <td>${dur ? Utils.fmtDuration(dur) : '—'}</td>
                  <td>${isLate(a.checkIn) ? '<span class="badge badge-pending">Late</span>' : '<span class="badge badge-active">On Time</span>'}</td>
                </tr>`;
              }).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;
  };

  const bindMy = () => {
    document.getElementById('myCheckIn')?.addEventListener('click', () => {
      Store.create('attendance', {
        employeeId: Auth.getCurrentUser().id,
        date: Utils.today(),
        checkIn: new Date().toISOString(),
        checkOut: null, location: 'Office',
      });
      Utils.toast('Checked in!', 'success');
      Dashboard.navigate('my-attendance');
    });

    document.getElementById('myCheckOut')?.addEventListener('click', () => {
      const rec = Store.query('attendance', a => a.employeeId === Auth.getCurrentUser().id && a.date === Utils.today())[0];
      if (rec) {
        Store.update('attendance', rec.id, { checkOut: new Date().toISOString() });
        Utils.toast('Checked out!', 'success');
        Dashboard.navigate('my-attendance');
      }
    });
  };

  return { renderAdmin, bindAdmin, renderMy, bindMy };
})();
