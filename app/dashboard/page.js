'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

// ── API helper ──
function api(path, opts = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ved_token') : '';
  return fetch(path, {
    ...opts,
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}`, ...opts.headers },
  }).then(r => r.json());
}

// ── Format helpers ──
const fmtCurrency = (n) => '₹' + Number(n || 0).toLocaleString('en-IN');
const fmtTime = (d) => d ? new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }) : '—';
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';
const fmtDuration = (ms) => { const h = Math.floor(ms/3600000); const m = Math.floor((ms%3600000)/60000); return `${h}h ${m}m`; };
const getGreeting = () => { const h = new Date().getHours(); return h < 12 ? 'Morning' : h < 17 ? 'Afternoon' : 'Evening'; };

// ── SVG Icons ──
const Icons = {
  dashboard: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/></svg>,
  team: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
  parcels: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27,6.96 12,12.01 20.73,6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>,
  attendance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  salary: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  expenses: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2"/><line x1="1" y1="10" x2="23" y2="10"/></svg>,
  settings: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9c.26.6.83 1 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>,
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Module data for sub-pages
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [expenses, setExpenses] = useState([]);

  // Auth check
  useEffect(() => {
    const token = localStorage.getItem('ved_token');
    const u = localStorage.getItem('ved_user');
    if (!token || !u) { router.replace('/'); return; }
    try { setUser(JSON.parse(u)); } catch { router.replace('/'); }
  }, [router]);

  // Load page data
  const loadPage = useCallback(async (p) => {
    setLoading(true);
    try {
      if (p === 'home') {
        const d = await api('/api/dashboard');
        setData(d);
      } else if (p === 'team') {
        const d = await api('/api/employees');
        setEmployees(d.employees || []);
      } else if (p === 'attendance') {
        const d = await api('/api/attendance');
        setAttendance(d.attendance || []);
      } else if (p === 'parcels') {
        const d = await api('/api/parcels');
        setParcels(d.parcels || []);
      } else if (p === 'salary') {
        const d = await api('/api/salary');
        setSalaryPayments(d.payments || []);
      } else if (p === 'expenses') {
        const d = await api('/api/expenses');
        setExpenses(d.expenses || []);
      }
    } catch (err) {
      console.error('Load error:', err);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (user) loadPage(page);
  }, [user, page, loadPage]);

  const navigate = (p) => { setPage(p); setSidebarOpen(false); };

  const logout = () => {
    localStorage.removeItem('ved_token');
    localStorage.removeItem('ved_user');
    router.replace('/');
  };

  // ── Check-in / Check-out ──
  const handleCheckIn = async () => {
    await api('/api/attendance', { method: 'POST', body: JSON.stringify({}) });
    loadPage('home');
  };

  const handleCheckOut = async () => {
    await api('/api/attendance', { method: 'PUT', body: JSON.stringify({ checkOut: true }) });
    loadPage('home');
  };

  // ── Update parcel status ──
  const updateParcelStatus = async (id, newStatus) => {
    await api('/api/parcels', { method: 'PUT', body: JSON.stringify({ id, status: newStatus }) });
    loadPage(page);
  };

  if (!user) return <div className="loading"><div className="spinner"></div></div>;

  const isAdmin = user.role === 'admin';

  // ── Nav items ──
  const navSections = isAdmin ? [
    { section: 'Overview', items: [{ id: 'home', label: 'Dashboard', icon: Icons.dashboard }] },
    { section: 'Team', items: [{ id: 'team', label: 'Team', icon: Icons.team }, { id: 'attendance', label: 'Attendance', icon: Icons.attendance }] },
    { section: 'Operations', items: [{ id: 'parcels', label: 'Parcels', icon: Icons.parcels }] },
    { section: 'Finance', items: [{ id: 'salary', label: 'Salary', icon: Icons.salary }, { id: 'expenses', label: 'Expenses', icon: Icons.expenses }] },
    { section: 'System', items: [{ id: 'settings', label: 'Settings', icon: Icons.settings }] },
  ] : [
    { section: 'Overview', items: [{ id: 'home', label: 'Dashboard', icon: Icons.dashboard }] },
    { section: 'My Work', items: [
      { id: 'attendance', label: 'My Attendance', icon: Icons.attendance },
      { id: 'salary', label: 'My Salary', icon: Icons.salary },
      { id: 'expenses', label: 'My Expenses', icon: Icons.expenses },
      ...(user.employeeRole === 'rider' ? [{ id: 'parcels', label: 'My Deliveries', icon: Icons.parcels }] : []),
    ]},
  ];

  const statusNext = { assigned: 'picked_up', picked_up: 'in_transit', in_transit: 'delivered' };

  // ── Render page content ──
  const renderContent = () => {
    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    switch (page) {
      case 'home':
        if (isAdmin && data?.stats) {
          const s = data.stats;
          return <>
            <div className="page-header">
              <div>
                <h1>Good {getGreeting()}, {user.name.split(' ')[0]} 👋</h1>
                <div className="page-header-sub">Here&apos;s what&apos;s happening at Ved Logistics today</div>
              </div>
            </div>
            <div className="stat-grid">
              {[
                { label: 'Team Members', value: s.totalEmployees, color: 'var(--blue)' },
                { label: 'Active Riders', value: s.totalRiders, color: 'var(--teal)' },
                { label: 'Delivered Today', value: s.deliveredToday, color: 'var(--emerald)' },
                { label: 'Pending Parcels', value: s.pendingParcels, color: 'var(--amber)' },
                { label: 'Checked In', value: s.todayAttendance, color: 'var(--indigo)' },
                { label: 'Paid This Month', value: fmtCurrency(s.totalPaidMonth), color: 'var(--rose)' },
              ].map((stat, i) => (
                <div className="stat-card" key={i} style={{ '--stat-color': stat.color }}>
                  <div className="stat-icon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /></svg></div>
                  <div className="stat-value">{stat.value}</div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card">
                <div className="card-header"><div><div className="card-title">Recent Parcels</div></div></div>
                <div className="table-wrap">
                  <table><thead><tr><th>Parcel</th><th>Customer</th><th>Status</th></tr></thead>
                    <tbody>{(data.recentParcels || []).map(p => (
                      <tr key={p.id}><td style={{ fontWeight: 700 }}>{p.parcelId}</td><td>{p.customerName}</td>
                        <td><span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span></td></tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
              <div className="card">
                <div className="card-header"><div><div className="card-title">Today&apos;s Attendance</div><div className="card-subtitle">{s.todayAttendance} checked in</div></div></div>
                {(data.todayAttendance || []).map(a => (
                  <div className="activity-item" key={a.id}>
                    <div className="avatar">{a.employee?.name?.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
                    <div><div className="activity-text">{a.employee?.name}</div><div className="activity-time">In: {fmtTime(a.checkIn)}{a.checkOut ? ` · Out: ${fmtTime(a.checkOut)}` : ' · Working'}</div></div>
                  </div>
                ))}
                {(!data.todayAttendance || data.todayAttendance.length === 0) && <div className="empty-state"><p>No check-ins yet</p></div>}
              </div>
            </div>
          </>;
        }
        // Employee home
        if (data) {
          const att = data.todayAttendance;
          const emp = data.employee;
          return <>
            <div className="page-header"><div><h1>Welcome, {user.name.split(' ')[0]} 👋</h1><div className="page-header-sub">{fmtDate(new Date())} · {user.employeeRole === 'rider' ? 'Rider' : 'Employee'}</div></div></div>
            <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', marginBottom: 24 }}>
              <div className="card" style={{ flex: 1, minWidth: 280, textAlign: 'center' }}>
                <h3 style={{ marginBottom: 16 }}>Today&apos;s Attendance</h3>
                {att ? <>
                  <span className="badge badge-active" style={{ fontSize: '.8rem', padding: '6px 16px' }}>✓ In at {fmtTime(att.checkIn)}</span>
                  {att.checkOut ? <div style={{ marginTop: 12 }}><span className="badge badge-inactive">Out: {fmtTime(att.checkOut)}</span><div style={{ marginTop: 8, fontSize: '.85rem', color: 'var(--text-secondary)' }}>Duration: <strong>{fmtDuration(new Date(att.checkOut) - new Date(att.checkIn))}</strong></div></div>
                    : <div style={{ marginTop: 16 }}><button className="checkin-btn out" onClick={handleCheckOut}>🕐 Check Out</button></div>}
                </> : <button className="checkin-btn in" onClick={handleCheckIn}>📍 Check In Now</button>}
              </div>
              <div className="card" style={{ flex: 1, minWidth: 280 }}>
                <h3 style={{ marginBottom: 12 }}>Quick Info</h3>
                {[
                  ['Base Salary', fmtCurrency(emp?.baseSalary)],
                  ['Department', emp?.department ?? '—'],
                  ['Role', user.employeeRole],
                  ['Join Date', fmtDate(emp?.joinDate)],
                ].map(([l, v]) => (
                  <div key={l} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                    <span style={{ color: 'var(--text-muted)', fontSize: '.82rem' }}>{l}</span><strong>{v}</strong>
                  </div>
                ))}
              </div>
            </div>
            {user.employeeRole === 'rider' && (data.myParcels || []).length > 0 && (
              <div className="card">
                <div className="card-header"><div><div className="card-title">My Active Deliveries</div></div></div>
                <div className="table-wrap">
                  <table><thead><tr><th>Parcel</th><th>Customer</th><th>Status</th><th>Action</th></tr></thead>
                    <tbody>{data.myParcels.map(p => (
                      <tr key={p.id}><td style={{ fontWeight: 700 }}>{p.parcelId}</td><td>{p.customerName}</td>
                        <td><span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                        <td>{statusNext[p.status] && <button className="btn-primary btn-sm" onClick={() => updateParcelStatus(p.id, statusNext[p.status])}>→ {statusNext[p.status].replace('_', ' ')}</button>}</td>
                      </tr>
                    ))}</tbody>
                  </table>
                </div>
              </div>
            )}
          </>;
        }
        return null;

      case 'team':
        return <>
          <div className="page-header"><div><h1>👥 Team Members</h1><div className="page-header-sub">{employees.length} members</div></div></div>
          <div className="card">
            <div className="table-wrap">
              <table><thead><tr><th>Name</th><th>Email</th><th>Department</th><th>Role</th><th>Salary</th><th>Status</th></tr></thead>
                <tbody>{employees.filter(e => e.role !== 'admin').map(e => (
                  <tr key={e.id}><td><div style={{ display: 'flex', alignItems: 'center', gap: 10 }}><div className="avatar">{e.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div><strong>{e.name}</strong></div></td>
                    <td>{e.email}</td><td>{e.department}</td>
                    <td><span className={`badge badge-${e.employeeRole === 'rider' ? 'rider' : 'role'}`}>{e.employeeRole}</span></td>
                    <td>{fmtCurrency(e.baseSalary)}</td>
                    <td><span className={`badge badge-${e.status === 'active' ? 'active' : 'inactive'}`}>{e.status}</span></td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>;

      case 'attendance':
        return <>
          <div className="page-header"><div><h1>📅 Attendance</h1><div className="page-header-sub">{attendance.length} records</div></div></div>
          <div className="card">
            <div className="table-wrap">
              <table><thead><tr><th>Employee</th><th>Date</th><th>Check In</th><th>Check Out</th><th>Duration</th></tr></thead>
                <tbody>{attendance.slice(0, 50).map(a => (
                  <tr key={a.id}>
                    <td><strong>{a.employee?.name || '—'}</strong></td><td>{a.date}</td>
                    <td>{fmtTime(a.checkIn)}</td><td>{a.checkOut ? fmtTime(a.checkOut) : <span className="badge badge-active">Working</span>}</td>
                    <td>{a.checkOut ? fmtDuration(new Date(a.checkOut) - new Date(a.checkIn)) : '—'}</td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>;

      case 'parcels':
        return <>
          <div className="page-header"><div><h1>📦 Parcels</h1><div className="page-header-sub">{parcels.length} total</div></div></div>
          <div className="card">
            <div className="table-wrap">
              <table><thead><tr><th>ID</th><th>Customer</th><th>Route</th><th>Rider</th><th>Status</th>{isAdmin && <th>Action</th>}</tr></thead>
                <tbody>{parcels.map(p => (
                  <tr key={p.id}><td style={{ fontWeight: 700 }}>{p.parcelId}</td><td>{p.customerName}</td>
                    <td style={{ fontSize: '.78rem' }}>{p.pickupAddress} → {p.deliveryAddress}</td>
                    <td>{p.rider?.name || '—'}</td>
                    <td><span className={`badge badge-${p.status}`}>{p.status.replace('_', ' ')}</span></td>
                    {isAdmin && <td>{statusNext[p.status] && <button className="btn-primary btn-sm" onClick={() => updateParcelStatus(p.id, statusNext[p.status])}>→ {statusNext[p.status].replace('_', ' ')}</button>}</td>}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>;

      case 'salary':
        return <>
          <div className="page-header"><div><h1>💰 Salary Payments</h1><div className="page-header-sub">{salaryPayments.length} payments</div></div></div>
          <div className="card">
            <div className="table-wrap">
              <table><thead><tr><th>Employee</th><th>Amount</th><th>Month</th><th>Payment Date</th><th>Paid By</th></tr></thead>
                <tbody>{salaryPayments.map(p => (
                  <tr key={p.id}><td><strong>{p.employee?.name || '—'}</strong></td><td>{fmtCurrency(p.amount)}</td>
                    <td>{p.month}</td><td>{p.paymentDate}</td><td>{p.paidBy || '—'}</td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>;

      case 'expenses':
        return <>
          <div className="page-header"><div><h1>💳 Expenses</h1><div className="page-header-sub">{expenses.length} records</div></div></div>
          <div className="card">
            <div className="table-wrap">
              <table><thead><tr><th>Employee</th><th>Type</th><th>Amount</th><th>Description</th><th>Status</th></tr></thead>
                <tbody>{expenses.map(e => (
                  <tr key={e.id}><td><strong>{e.employee?.name || '—'}</strong></td><td style={{ textTransform: 'capitalize' }}>{e.type}</td>
                    <td>{fmtCurrency(e.amount)}</td><td>{e.description}</td>
                    <td><span className={`badge badge-${e.status}`}>{e.status}</span></td></tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        </>;

      case 'settings':
        return <>
          <div className="page-header"><div><h1>⚙️ Settings</h1></div></div>
          <div className="card" style={{ maxWidth: 500 }}>
            <h3 style={{ marginBottom: 16 }}>System Info</h3>
            {[['Company', 'Ved Logistics'], ['Database', 'Supabase PostgreSQL'], ['Framework', 'Next.js'], ['Deployment', 'Vercel Ready']].map(([k, v]) => (
              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
                <span style={{ color: 'var(--text-muted)' }}>{k}</span><strong>{v}</strong>
              </div>
            ))}
          </div>
        </>;

      default:
        return <div className="empty-state"><h3>Page not found</h3></div>;
    }
  };

  return (
    <div className="app-layout">
      {/* Sidebar Overlay */}
      {sidebarOpen && <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />}

      {/* Sidebar */}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Image src="/logo.jpg" alt="Ved Logistics" width={40} height={40} />
          <div className="sidebar-brand-text">Ved Logistics<small>Management Portal</small></div>
        </div>

        <nav className="sidebar-nav">
          {navSections.map((sec) => (
            <div className="nav-section" key={sec.section}>
              <div className="nav-section-title">{sec.section}</div>
              {sec.items.map((item) => (
                <a key={item.id} className={`nav-item ${page === item.id ? 'active' : ''}`} onClick={() => navigate(item.id)}>
                  {item.icon}<span>{item.label}</span>
                </a>
              ))}
            </div>
          ))}
        </nav>

        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="sidebar-user-avatar">{user.name.split(' ').map(w => w[0]).join('').slice(0, 2)}</div>
            <div>
              <div className="sidebar-user-name">{user.name}</div>
              <div className="sidebar-user-role">{isAdmin ? 'Administrator' : user.employeeRole === 'rider' ? 'Rider' : 'Employee'}</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left">
            <button className="topbar-hamburger" onClick={() => setSidebarOpen(!sidebarOpen)}>☰</button>
            <div className="topbar-breadcrumb"><strong>{navSections.flatMap(s => s.items).find(i => i.id === page)?.label || 'Dashboard'}</strong></div>
          </div>
          <div className="topbar-right">
            <button className="btn-outline btn-sm" onClick={logout} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16,17 21,12 16,7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Logout
            </button>
          </div>
        </header>

        <main className="content">
          {renderContent()}
        </main>
      </div>
    </div>
  );
}
