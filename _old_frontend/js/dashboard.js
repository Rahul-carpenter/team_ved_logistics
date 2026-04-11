/* ══════════════════════════════════════════
   Ved Logistics — Dashboard Controller
   SPA-like routing + sidebar + page rendering
   ══════════════════════════════════════════ */

const Dashboard = (() => {
  // ── SVG Icons ──
  const I = {
    dashboard: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>',
    team: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    parcels: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
    attendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01M12 14h.01M16 14h.01M8 18h.01M12 18h.01"/></svg>',
    salary: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>',
    expenses: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>',
    reports: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14,2 14,8 20,8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>',
    settings: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>',
    bike: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18.5" cy="18.5" r="3.5"/><circle cx="5.5" cy="18.5" r="3.5"/><path d="M15 6a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-3 11.5V14l-3-3 4-3 2 3h2"/></svg>',
    myAttendance: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg>',
  };

  const user = Auth.getCurrentUser();

  // ── Navigation Config (Riders removed from admin — merged into Team) ──
  const getNavItems = () => {
    if (!user) return [];
    if (user.role === 'admin') {
      return [
        { section: 'Overview', items: [
          { id: 'home', label: 'Dashboard', icon: I.dashboard },
        ]},
        { section: 'Team', items: [
          { id: 'team', label: 'Team', icon: I.team },
          { id: 'attendance', label: 'Attendance', icon: I.attendance },
        ]},
        { section: 'Operations', items: [
          { id: 'parcels', label: 'Parcels', icon: I.parcels },
        ]},
        { section: 'Finance', items: [
          { id: 'salary', label: 'Salary', icon: I.salary },
          { id: 'expenses', label: 'Expenses', icon: I.expenses },
        ]},
        { section: 'Analytics', items: [
          { id: 'reports', label: 'Reports', icon: I.reports },
          { id: 'settings', label: 'Settings', icon: I.settings },
        ]},
      ];
    }

    // Employee / Rider nav
    const items = [
      { section: 'Overview', items: [
        { id: 'home', label: 'Dashboard', icon: I.dashboard },
      ]},
      { section: 'My Work', items: [
        { id: 'my-attendance', label: 'My Attendance', icon: I.myAttendance },
        { id: 'my-salary', label: 'My Salary', icon: I.salary },
        { id: 'my-expenses', label: 'My Expenses', icon: I.expenses },
      ]},
    ];

    if (user.employeeRole === 'rider') {
      items[1].items.push(
        { id: 'my-deliveries', label: 'My Deliveries', icon: I.parcels },
        { id: 'my-rides', label: 'Bike Tracking', icon: I.bike },
      );
    }
    return items;
  };

  // ── Render Sidebar ──
  const renderSidebar = () => {
    const nav = document.getElementById('sidebarNav');
    const navItems = getNavItems();
    nav.innerHTML = navItems.map(section => `
      <div class="nav-section">
        <div class="nav-section-title">${section.section}</div>
        ${section.items.map(item => `
          <a class="nav-item" data-page="${item.id}" href="#${item.id}">
            ${item.icon}
            <span>${item.label}</span>
            ${item.badge ? `<span class="nav-badge">${item.badge}</span>` : ''}
          </a>
        `).join('')}
      </div>
    `).join('');

    // User info
    document.getElementById('userAvatar').textContent = user.name.split(' ').map(w => w[0]).join('').slice(0, 2);
    document.getElementById('userName').textContent = user.name;
    document.getElementById('userRole').textContent = user.role === 'admin' ? 'Administrator' : user.employeeRole === 'rider' ? 'Rider' : 'Employee';
  };

  // ── Pages Registry (no separate 'riders' page — team covers all) ──
  const pages = {
    'home': () => user.role === 'admin' ? renderAdminHome() : renderEmployeeHome(),
    'team': () => Employees.render(),
    'employees': () => Employees.render(), // backward compat
    'attendance': () => Attendance.renderAdmin(),
    'parcels': () => Parcels.render(),
    'salary': () => Salary.render(),
    'expenses': () => Expenses.render(),
    'reports': () => Reports.render(),
    'settings': () => renderSettings(),
    'my-attendance': () => Attendance.renderMy(),
    'my-salary': () => Salary.renderMy(),
    'my-expenses': () => Expenses.renderMy(),
    'my-deliveries': () => Parcels.renderMy(),
    'my-rides': () => Riders.renderMyRides(),
  };

  // ── Route to Page ──
  let currentPage = '';
  const navigate = (pageId) => {
    pageId = pageId || 'home';
    currentPage = pageId;

    // Update active nav
    document.querySelectorAll('.nav-item').forEach(el => {
      el.classList.toggle('active', el.dataset.page === pageId);
    });

    // Update breadcrumb
    const label = document.querySelector(`.nav-item[data-page="${pageId}"] span`)?.textContent || 'Dashboard';
    document.getElementById('breadcrumb').innerHTML = `<strong>${label}</strong>`;

    // Render page
    const content = document.getElementById('content');
    content.innerHTML = '<div style="padding:40px;text-align:center;color:var(--text-muted)">Loading...</div>';

    const renderer = pages[pageId];
    if (renderer) {
      const html = renderer();
      if (typeof html === 'string') {
        content.innerHTML = `<div class="page-transition">${html}</div>`;
      }
    } else {
      content.innerHTML = '<div class="empty-state"><h3>Page not found</h3></div>';
    }

    // Close mobile sidebar
    closeMobileSidebar();

    // Bind page-specific events
    setTimeout(() => bindPageEvents(pageId), 50);
  };

  const bindPageEvents = (pageId) => {
    switch (pageId) {
      case 'home': user.role === 'admin' ? bindAdminHomeEvents() : bindEmployeeHomeEvents(); break;
      case 'team': case 'employees': Employees.bind(); break;
      case 'attendance': Attendance.bindAdmin(); break;
      case 'parcels': Parcels.bind(); break;
      case 'salary': Salary.bind(); break;
      case 'expenses': Expenses.bind(); break;
      case 'reports': Reports.bind(); break;
      case 'settings': bindSettingsEvents(); break;
      case 'my-attendance': Attendance.bindMy(); break;
      case 'my-salary': Salary.bindMy(); break;
      case 'my-expenses': Expenses.bindMy(); break;
      case 'my-deliveries': Parcels.bindMy(); break;
      case 'my-rides': Riders.bindMyRides(); break;
    }
  };

  // ── Mobile sidebar ──
  const closeMobileSidebar = () => {
    document.getElementById('sidebar').classList.remove('open');
    document.getElementById('sidebarOverlay').classList.remove('show');
  };

  // ══════════════════════════════
  //  ADMIN HOME (Dashboard)
  // ══════════════════════════════
  const renderAdminHome = () => {
    const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
    const riders = emps.filter(e => e.employeeRole === 'rider');
    const todayStr = Utils.today();
    const parcels = Store.getAll('parcels');
    const todayAtt = Store.query('attendance', a => a.date === todayStr);
    const deliveredToday = parcels.filter(p => p.status === 'delivered' && p.updatedAt?.startsWith(todayStr));
    const pendingParcels = parcels.filter(p => p.status !== 'delivered');
    const pendingExpenses = Store.query('expenses', e => e.status === 'pending');
    const thisMonthPayments = Store.query('salary_payments', s => s.paymentDate?.startsWith(new Date().toISOString().slice(0,7)));
    const totalPaidMonth = thisMonthPayments.reduce((s,p) => s + (p.amount||0), 0);

    return `
      <div class="page-header">
        <div>
          <h1>Good ${new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'}, ${user.name.split(' ')[0]} 👋</h1>
          <div class="page-header-sub">Here's what's happening at Ved Logistics today</div>
        </div>
        <div class="page-actions">
          <button class="btn-outline btn-sm" onclick="Dashboard.navigate('reports')">📊 Reports</button>
          <button class="btn-primary btn-sm" onclick="Employees.showAddModal()">+ Add Member</button>
        </div>
      </div>

      <div class="stat-grid">
        <div class="stat-card" style="--stat-color:var(--blue)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/></svg></div>
          <div class="stat-value" data-counter="${emps.length}">0</div>
          <div class="stat-label">Team Members</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--teal)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="18.5" cy="18.5" r="3.5"/><circle cx="5.5" cy="18.5" r="3.5"/></svg></div>
          <div class="stat-value" data-counter="${riders.length}">0</div>
          <div class="stat-label">Active Riders</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--emerald)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22,4 12,14.01 9,11.01"/></svg></div>
          <div class="stat-value" data-counter="${deliveredToday.length}">0</div>
          <div class="stat-label">Delivered Today</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--amber)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12,6 12,12 16,14"/></svg></div>
          <div class="stat-value" data-counter="${pendingParcels.length}">0</div>
          <div class="stat-label">Pending Parcels</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--indigo)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/></svg></div>
          <div class="stat-value" data-counter="${todayAtt.length}">0</div>
          <div class="stat-label">Checked In Today</div>
        </div>
        <div class="stat-card" style="--stat-color:var(--rose)">
          <div class="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></div>
          <div class="stat-value">${Utils.fmtCurrency(totalPaidMonth)}</div>
          <div class="stat-label">Paid This Month</div>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:20px">
        <div class="card">
          <div class="card-header">
            <div><div class="card-title">Recent Deliveries</div><div class="card-subtitle">Latest parcel updates</div></div>
            <button class="btn-outline btn-sm" onclick="Dashboard.navigate('parcels')">View All</button>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Parcel</th><th>Customer</th><th>Status</th></tr></thead>
              <tbody>
                ${parcels.slice(0, 6).map(p => {
                  const statusMap = {assigned:'badge-assigned',picked_up:'badge-picked_up',in_transit:'badge-in_transit',delivered:'badge-delivered'};
                  return `<tr><td style="font-weight:700;font-size:.78rem">${p.parcelId}</td><td style="font-size:.78rem">${p.customerName}</td><td><span class="badge ${statusMap[p.status]}">${p.status.replace('_',' ')}</span></td></tr>`;
                }).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <div class="card">
          <div class="card-header">
            <div><div class="card-title">Today's Attendance</div><div class="card-subtitle">${todayAtt.length} / ${emps.length} checked in</div></div>
            <button class="btn-outline btn-sm" onclick="Dashboard.navigate('attendance')">View All</button>
          </div>
          <div style="margin-bottom:12px">
            <div class="progress"><div class="progress-fill" style="width:${emps.length ? Math.round(todayAtt.length/emps.length*100) : 0}%"></div></div>
          </div>
          ${todayAtt.slice(0, 5).map(a => {
            const emp = Store.getById('employees', a.employeeId);
            return `<div class="activity-item">
              <div class="avatar">${emp ? emp.name.split(' ').map(w=>w[0]).join('').slice(0,2) : '?'}</div>
              <div><div class="activity-text">${emp?.name || 'Unknown'}</div><div class="activity-time">In: ${Utils.fmtTime(a.checkIn)}${a.checkOut ? ' · Out: '+Utils.fmtTime(a.checkOut) : ' · Still working'}</div></div>
            </div>`;
          }).join('') || '<div class="empty-state"><p>No check-ins yet today</p></div>'}
        </div>
      </div>
    `;
  };

  const bindAdminHomeEvents = () => {
    document.querySelectorAll('[data-counter]').forEach(el => {
      Utils.animateCounter(el, parseInt(el.dataset.counter));
    });
  };

  // ══════════════════════════════
  //  EMPLOYEE HOME
  // ══════════════════════════════
  const renderEmployeeHome = () => {
    const todayStr = Utils.today();
    const myAtt = Store.query('attendance', a => a.employeeId === user.id && a.date === todayStr);
    const checkedIn = myAtt.length > 0;
    const todayRecord = myAtt[0];
    const canCheckOut = checkedIn && !todayRecord?.checkOut;
    const myParcels = user.employeeRole === 'rider' ? Store.query('parcels', p => p.assignedRider === user.id && p.status !== 'delivered') : [];
    const emp = Store.getById('employees', user.id);

    return `
      <div class="page-header">
        <div>
          <h1>Welcome back, ${user.name.split(' ')[0]} 👋</h1>
          <div class="page-header-sub">${Utils.fmtDate(new Date())} · ${user.employeeRole === 'rider' ? 'Rider' : 'Employee'} · ${user.department}</div>
        </div>
      </div>

      <div style="display:flex;gap:20px;margin-bottom:24px;flex-wrap:wrap">
        <div class="card" style="flex:1;min-width:280px;text-align:center">
          <h3 style="margin-bottom:16px">Today's Attendance</h3>
          ${checkedIn ? `
            <div style="margin-bottom:12px">
              <span class="badge badge-active" style="font-size:.8rem;padding:6px 16px">✓ Checked In at ${Utils.fmtTime(todayRecord.checkIn)}</span>
            </div>
            ${todayRecord.checkOut ? `
              <div><span class="badge badge-inactive" style="font-size:.8rem;padding:6px 16px">Checked Out at ${Utils.fmtTime(todayRecord.checkOut)}</span></div>
              <div style="margin-top:12px;font-size:.85rem;color:var(--text-secondary)">Duration: <strong>${Utils.fmtDuration(new Date(todayRecord.checkOut) - new Date(todayRecord.checkIn))}</strong></div>
            ` : `
              <button class="checkin-btn out" id="checkOutBtn">🕐 Check Out</button>
            `}
          ` : `
            <button class="checkin-btn in" id="checkInBtn">📍 Check In Now</button>
          `}
        </div>

        <div class="card" style="flex:1;min-width:280px">
          <h3 style="margin-bottom:12px">Quick Info</h3>
          <div style="display:grid;gap:10px">
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="color:var(--text-muted);font-size:.82rem">Base Salary</span>
              <strong>${Utils.fmtCurrency(emp?.baseSalary)}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="color:var(--text-muted);font-size:.82rem">Department</span>
              <strong>${emp?.department || '—'}</strong>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border)">
              <span style="color:var(--text-muted);font-size:.82rem">Role</span>
              <span class="badge ${user.employeeRole === 'rider' ? 'badge-rider' : 'badge-role'}">${user.employeeRole}</span>
            </div>
            <div style="display:flex;justify-content:space-between;padding:8px 0">
              <span style="color:var(--text-muted);font-size:.82rem">Join Date</span>
              <strong>${Utils.fmtDate(emp?.joinDate)}</strong>
            </div>
          </div>
        </div>
      </div>

      ${user.employeeRole === 'rider' && myParcels.length > 0 ? `
        <div class="card">
          <div class="card-header">
            <div><div class="card-title">My Active Deliveries</div><div class="card-subtitle">${myParcels.length} pending</div></div>
          </div>
          <div class="table-wrap">
            <table>
              <thead><tr><th>Parcel</th><th>Customer</th><th>Route</th><th>Status</th><th>Action</th></tr></thead>
              <tbody>
                ${myParcels.map(p => `<tr>
                  <td style="font-weight:700">${p.parcelId}</td>
                  <td>${p.customerName}</td>
                  <td style="font-size:.78rem">${p.pickupAddress} → ${p.deliveryAddress}</td>
                  <td><span class="badge badge-${p.status}">${p.status.replace('_',' ')}</span></td>
                  <td><button class="btn-primary btn-sm" data-update-parcel="${p.id}">Update Status</button></td>
                </tr>`).join('')}
              </tbody>
            </table>
          </div>
        </div>
      ` : ''}
    `;
  };

  const bindEmployeeHomeEvents = () => {
    const checkInBtn = document.getElementById('checkInBtn');
    if (checkInBtn) {
      checkInBtn.onclick = () => {
        Store.create('attendance', {
          employeeId: user.id,
          date: Utils.today(),
          checkIn: new Date().toISOString(),
          checkOut: null,
          location: 'Office',
        });
        Utils.toast('Checked in successfully!', 'success');
        navigate('home');
      };
    }

    const checkOutBtn = document.getElementById('checkOutBtn');
    if (checkOutBtn) {
      checkOutBtn.onclick = () => {
        const todayAtt = Store.query('attendance', a => a.employeeId === user.id && a.date === Utils.today());
        if (todayAtt[0]) {
          Store.update('attendance', todayAtt[0].id, { checkOut: new Date().toISOString() });
          Utils.toast('Checked out successfully!', 'success');
          navigate('home');
        }
      };
    }

    document.querySelectorAll('[data-update-parcel]').forEach(btn => {
      btn.onclick = () => Parcels.updateStatusFlow(btn.dataset.updateParcel);
    });
  };

  // ══════════════════════════════
  //  SETTINGS PAGE
  // ══════════════════════════════
  const renderSettings = () => {
    const settings = {
      companyName: Store.getSetting('companyName', 'Ved Logistics'),
      workStartTime: Store.getSetting('workStartTime', '09:00'),
      workEndTime: Store.getSetting('workEndTime', '18:00'),
      lateThresholdMin: Store.getSetting('lateThresholdMin', 30),
      salaryCycleDay: Store.getSetting('salaryCycleDay', 1),
      salaryCycleType: Store.getSetting('salaryCycleType', 'monthly'),
      currency: Store.getSetting('currency', '₹'),
    };

    return `
      <div class="page-header">
        <div><h1>⚙️ Settings</h1><div class="page-header-sub">Configure work hours, salary cycle, and company options</div></div>
      </div>

      <div class="settings-grid">
        <div class="setting-card">
          <h4>🏢 Company</h4>
          <div class="form-group">
            <label class="form-label">Company Name</label>
            <input class="form-input" id="s-companyName" value="${settings.companyName}">
          </div>
          <div class="form-group">
            <label class="form-label">Currency Symbol</label>
            <input class="form-input" id="s-currency" value="${settings.currency}">
          </div>
        </div>

        <div class="setting-card">
          <h4>🕐 Working Hours</h4>
          <div class="form-hint" style="margin-bottom:12px">Flexible — change anytime. Used for late check-in calculations.</div>
          <div class="form-row">
            <div class="form-group">
              <label class="form-label">Start Time</label>
              <input type="time" class="form-input" id="s-workStartTime" value="${settings.workStartTime}">
            </div>
            <div class="form-group">
              <label class="form-label">End Time</label>
              <input type="time" class="form-input" id="s-workEndTime" value="${settings.workEndTime}">
            </div>
          </div>
          <div class="form-group">
            <label class="form-label">Late Threshold (minutes after start)</label>
            <input type="number" class="form-input" id="s-lateThresholdMin" value="${settings.lateThresholdMin}" min="0" max="120">
          </div>
        </div>

        <div class="setting-card">
          <h4>💰 Salary Cycle</h4>
          <div class="form-hint" style="margin-bottom:12px">Reference info — admin pays salary manually per employee.</div>
          <div class="form-group">
            <label class="form-label">Cycle Type</label>
            <select class="form-select" id="s-salaryCycleType">
              <option value="monthly" ${settings.salaryCycleType === 'monthly' ? 'selected' : ''}>Monthly</option>
              <option value="biweekly" ${settings.salaryCycleType === 'biweekly' ? 'selected' : ''}>Bi-Weekly</option>
              <option value="weekly" ${settings.salaryCycleType === 'weekly' ? 'selected' : ''}>Weekly</option>
            </select>
          </div>
          <div class="form-group">
            <label class="form-label">Cycle Start Day</label>
            <input type="number" class="form-input" id="s-salaryCycleDay" value="${settings.salaryCycleDay}" min="1" max="31">
            <div class="form-hint">Day of month when salary period starts</div>
          </div>
        </div>

        <div class="setting-card">
          <h4>🗑️ Data Management</h4>
          <div class="form-hint" style="margin-bottom:12px">Manage demo data and system reset options.</div>
          <button class="btn-danger" id="resetDataBtn" style="width:100%">⚠ Reset All Data</button>
          <div class="form-hint" style="margin-top:8px">This will clear all data and re-seed demo data</div>
        </div>
      </div>

      <div style="margin-top:24px;display:flex;gap:10px">
        <button class="btn-primary" id="saveSettingsBtn">Save Settings</button>
      </div>
    `;
  };

  const bindSettingsEvents = () => {
    document.getElementById('saveSettingsBtn')?.addEventListener('click', () => {
      ['companyName', 'workStartTime', 'workEndTime', 'lateThresholdMin', 'salaryCycleDay', 'salaryCycleType', 'currency'].forEach(key => {
        const el = document.getElementById('s-' + key);
        if (el) Store.setSetting(key, el.type === 'number' ? parseInt(el.value) : el.value);
      });
      Utils.toast('Settings saved successfully!', 'success');
    });

    document.getElementById('resetDataBtn')?.addEventListener('click', async () => {
      const ok = await Utils.confirm('This will delete ALL data and reload with demo data. Continue?', '⚠ Reset Data');
      if (ok) {
        Store.clearAll();
        window.location.reload();
      }
    });
  };

  // ── Initialize ──
  const init = () => {
    // Seed demo data
    Seed.run();

    // Auth check
    if (!Auth.requireAuth()) return;

    // Dark mode
    const dark = Store.getSetting('darkMode', false);
    if (dark) document.documentElement.setAttribute('data-theme', 'dark');

    // Render sidebar
    renderSidebar();

    // Route from hash or default
    const hash = window.location.hash.slice(1) || 'home';
    navigate(hash);

    // Hash change listener
    window.addEventListener('hashchange', () => {
      navigate(window.location.hash.slice(1) || 'home');
    });

    // Sidebar click
    document.getElementById('sidebarNav').addEventListener('click', (e) => {
      const item = e.target.closest('.nav-item');
      if (item) {
        e.preventDefault();
        window.location.hash = item.dataset.page;
      }
    });

    // Mobile menu
    document.getElementById('menuToggle').addEventListener('click', () => {
      document.getElementById('sidebar').classList.toggle('open');
      document.getElementById('sidebarOverlay').classList.toggle('show');
    });
    document.getElementById('sidebarOverlay').addEventListener('click', closeMobileSidebar);

    // Dark mode toggle
    document.getElementById('darkToggle').addEventListener('click', () => {
      const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
      document.documentElement.setAttribute('data-theme', isDark ? '' : 'dark');
      Store.setSetting('darkMode', !isDark);
      document.getElementById('darkToggle').textContent = isDark ? '🌙' : '☀️';
    });

    // Logout
    document.getElementById('logoutBtn').addEventListener('click', () => Auth.logout());
  };

  // Start
  document.addEventListener('DOMContentLoaded', init);

  return { navigate, init };
})();
