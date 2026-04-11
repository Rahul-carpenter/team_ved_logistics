'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
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
  logs: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>,
  rides: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>,
  attendance: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>,
  salary: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>,
  advances: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="5" width="20" height="14" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>,
};

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [page, setPage] = useState('home');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  // Module data
  const [employees, setEmployees] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [dailyLogs, setDailyLogs] = useState([]);
  const [rides, setRides] = useState([]);
  const [salaryPayments, setSalaryPayments] = useState([]);
  const [advances, setAdvances] = useState([]);
  
  // Modals & Forms
  const [toast, setToast] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [modalData, setModalData] = useState({});
  const fileInputRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('ved_token');
    const u = localStorage.getItem('ved_user');
    if (!token || !u) { router.replace('/'); return; }
    try { setUser(JSON.parse(u)); } catch { router.replace('/'); }
  }, [router]);

  const loadPage = useCallback(async (p) => {
    setLoading(true);
    try {
      if (p === 'home') setData(await api('/api/dashboard'));
      else if (p === 'team') setEmployees((await api('/api/employees')).employees || []);
      else if (p === 'attendance') setAttendance((await api('/api/attendance')).attendance || []);
      else if (p === 'daily_logs') setDailyLogs((await api('/api/daily_logs')).logs || []);
      else if (p === 'rides') setRides((await api('/api/rides')).rides || []);
      else if (p === 'salary') setSalaryPayments((await api('/api/salary')).payments || []);
      else if (p === 'advances') setAdvances((await api('/api/advances')).advances || []);
    } catch (err) {
      console.error(err);
    }
    setLoading(false);
  }, []);

  useEffect(() => { if (user) loadPage(page); }, [user, page, loadPage]);

  const navigate = (p) => { setPage(p); setSidebarOpen(false); };
  const logout = () => { localStorage.clear(); router.replace('/'); };
  const showToast = (msg, type='success') => { setToast({ msg, type }); setTimeout(() => setToast(null), 3000); };

  // Actions
  const handleCheckInOut = async (isOut) => {
    const res = await api('/api/attendance', { method: isOut ? 'PUT' : 'POST', body: JSON.stringify(isOut ? { checkOut: true } : {}) });
    if (res.success) { showToast(`Checked ${isOut ? 'out' : 'in'} successfully`); loadPage('home'); }
    else showToast(res.error, 'error');
  };

  const handlePhotoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setModalData(prev => ({ ...prev, photo: reader.result }));
      reader.readAsDataURL(file);
    }
  };

  const submitRide = async (e) => {
    e.preventDefault();
    if (!modalData.photo) return showToast('Photo proof required', 'error');
    if (modalData.type === 'start' && !modalData.startKm) return showToast('Start KM required', 'error');
    if (modalData.type === 'end' && !modalData.endKm) return showToast('End KM required', 'error');

    const payload = modalData.type === 'start' 
      ? { startKm: parseInt(modalData.startKm), startPhoto: modalData.photo }
      : { id: data.activeRide.id, endKm: parseInt(modalData.endKm), endPhoto: modalData.photo };
      
    const res = await api('/api/rides', { method: 'POST', body: JSON.stringify(payload) });
    if (res.success) { showToast(`Ride ${modalData.type === 'start'?'started':'completed'}`); setModalType(null); loadPage('home'); }
    else showToast(res.error, 'error');
  };

  const submitDailyLog = async (e) => {
    e.preventDefault();
    const res = await api('/api/daily_logs', { method: 'POST', body: JSON.stringify(modalData) });
    if (res.success) { showToast('Daily log saved'); setModalType(null); loadPage(page); }
    else showToast(res.error, 'error');
  };

  const submitAdvance = async (e) => {
    e.preventDefault();
    const res = await api('/api/advances', { method: 'POST', body: JSON.stringify(modalData) });
    if (res.success) { showToast('Advance requested'); setModalType(null); loadPage(page); }
    else showToast(res.error, 'error');
  };

  const updateAdvanceStatus = async (id, status) => {
    const res = await api('/api/advances', { method: 'PUT', body: JSON.stringify({ id, status }) });
    if (res.success) { showToast(`Advance ${status}`); loadPage(page); }
  };

  const submitEmployee = async (e) => {
    e.preventDefault();
    const res = await api('/api/employees', { method: 'POST', body: JSON.stringify(modalData) });
    if (res.success) { showToast('Team member added successfully'); setModalType(null); loadPage(page); }
    else showToast(res.error, 'error');
  };

  const deleteEmployee = async (id, name) => {
    if (!confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) return;
    const res = await api(`/api/employees?id=${id}`, { method: 'DELETE' });
    if (res.success) { showToast(`${name} deleted`); loadPage(page); }
    else showToast(res.error, 'error');
  };

  if (!user) return <div className="loading"><div className="spinner"></div></div>;
  const isAdmin = user.role === 'admin';

  const navSections = isAdmin ? [
    { section: 'Overview', items: [{ id: 'home', label: 'Dashboard', icon: Icons.dashboard }] },
    { section: 'Team Logs', items: [{ id: 'team', label: 'Employees', icon: Icons.team }, { id: 'attendance', label: 'Attendance', icon: Icons.attendance }, { id: 'daily_logs', label: 'Daily Work Logs', icon: Icons.logs }] },
    { section: 'Operations', items: [{ id: 'rides', label: 'Ride Tracking', icon: Icons.rides }] },
    { section: 'Finance', items: [{ id: 'salary', label: 'Salaries', icon: Icons.salary }, { id: 'advances', label: 'Advances', icon: Icons.advances }] },
  ] : [
    { section: 'Overview', items: [{ id: 'home', label: 'My Dashboard', icon: Icons.dashboard }] },
    { section: 'My Logs', items: [{ id: 'daily_logs', label: 'My Work Logs', icon: Icons.logs }, ...(user.employeeRole === 'rider' ? [{ id: 'rides', label: 'My Rides', icon: Icons.rides }] : [])] },
    { section: 'Finance', items: [{ id: 'salary', label: 'My Salary', icon: Icons.salary }, { id: 'advances', label: 'My Advances', icon: Icons.advances }] },
  ];

  /* UI Renderers */
  const renderContent = () => {
    if (loading) return <div className="loading"><div className="spinner"></div></div>;

    switch (page) {
      case 'home':
        if (isAdmin && data?.stats) {
          return <>
            <div className="page-header"><div><h1>Dashboard</h1></div></div>
            <div className="stat-grid">
              {[
                { label: 'Total Employees', value: data.stats.totalEmployees, color: 'var(--blue)' },
                { label: 'Checked In Today', value: data.stats.todayAttendance, color: 'var(--emerald)' },
                { label: 'Pending Advances', value: data.stats.pendingAdvances, color: 'var(--amber)' },
                { label: 'Paid This Month', value: fmtCurrency(data.stats.totalPaidMonth), color: 'var(--rose)' },
              ].map((s, i) => (
                <div className="stat-card" key={i}><div className="stat-value" style={{color: s.color}}>{s.value}</div><div className="stat-label">{s.label}</div></div>
              ))}
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
              <div className="card">
                <div className="card-header"><div className="card-title">Recent Work Logs (Today)</div></div>
                {data.recentLogs?.map(l => (
                  <div key={l.id} className="activity-item">
                    <div className="avatar">{l.employee.name[0]}</div>
                    <div><div className="activity-text">{l.employee.name}</div><div className="activity-time">Delivered: {l.delivered} | Picked-Up: {l.pickedUp} | Store: {l.store}</div></div>
                  </div>
                ))}
                {!data.recentLogs?.length && <div className="empty-state">No logs submitted today</div>}
              </div>
            </div>
          </>;
        }
        
        // Employee Home
        if (data && !isAdmin) {
          const { todayAttendance, todayLog, activeRide } = data;
          return <>
            <div className="page-header"><div><h1>Welcome, {user.name}</h1></div></div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
              
              {/* Check IN/OUT */}
              <div className="card" style={{textAlign: 'center'}}>
                <h3>Attendance</h3>
                {todayAttendance ? (
                  <div style={{marginTop: 15}}>
                    <div className="badge badge-active" style={{marginBottom: 10, display: 'block'}}>In at: {fmtTime(todayAttendance.checkIn)}</div>
                    {todayAttendance.checkOut ? <div className="badge badge-inactive">Out at: {fmtTime(todayAttendance.checkOut)}</div>
                    : <button className="btn btn-danger" onClick={() => handleCheckInOut(true)}>Check Out</button>}
                  </div>
                ) : <button className="btn btn-primary" onClick={() => handleCheckInOut(false)}>Check In</button>}
              </div>

              {/* Ride Tracking */}
              {user.employeeRole === 'rider' && (
                <div className="card" style={{textAlign: 'center'}}>
                  <h3>Ride Tracking</h3>
                  <div style={{marginTop: 15}}>
                    {activeRide ? (
                       <button className="btn btn-danger" onClick={() => { setModalData({type:'end'}); setModalType('ride'); }}>End Ride (Upload Speedo)</button>
                    ) : (
                       <button className="btn btn-primary" onClick={() => { setModalData({type:'start'}); setModalType('ride'); }}>Start Ride (Upload Speedo)</button>
                    )}
                  </div>
                </div>
              )}

              {/* Work Log */}
              <div className="card" style={{textAlign: 'center'}}>
                <h3>Today&apos;s Work Log</h3>
                <div style={{marginTop: 15}}>
                  <button className="btn-outline" onClick={() => { setModalData(todayLog || {}); setModalType('log'); }}>
                    {todayLog ? 'Update Log' : 'Add Daily Log'}
                  </button>
                  {todayLog && <div style={{fontSize:'.8rem', color:'var(--text-muted)', marginTop:8}}>Delivered: {todayLog.delivered} | Picked: {todayLog.pickedUp}</div>}
                </div>
              </div>
            </div>
          </>;
        }
        return null;

      case 'daily_logs':
        return <>
          <div className="page-header"><div><h1>Daily Work Logs</h1></div></div>
          <div className="card table-wrap">
            <table><thead><tr>{isAdmin&&<th>Employee</th>}<th>Date</th><th>Delivered</th><th>Picked Up</th><th>Store/Warehouse</th><th>Notes</th></tr></thead>
              <tbody>{dailyLogs.map(l => (
                <tr key={l.id}>{isAdmin&&<td><strong>{l.employee?.name}</strong></td>}<td>{fmtDate(l.date)}</td>
                  <td><span className="badge badge-delivered">{l.delivered}</span></td><td><span className="badge badge-assigned">{l.pickedUp}</span></td>
                  <td>{l.store}</td><td>{l.note}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>;

      case 'rides':
        return <>
          <div className="page-header"><div><h1>Ride Tracking (Proof)</h1></div></div>
          <div className="card table-wrap">
            <table><thead><tr>{isAdmin&&<th>Rider</th>}<th>Date</th><th>Distance</th><th>Start Proof</th><th>End Proof</th><th>Status</th></tr></thead>
              <tbody>{rides.map(r => (
                <tr key={r.id}>{isAdmin&&<td><strong>{r.rider?.name}</strong></td>}<td>{fmtDate(r.date)}</td>
                  <td>{r.distance ? `${r.distance} KM` : '—'}</td>
                  <td>{r.startPhoto ? <img src={r.startPhoto} style={{width: 50, height: 30, objectFit:'cover', borderRadius:4, cursor:'zoom-in'}} onClick={()=>window.open(r.startPhoto)} alt=""/> : 'No photo'}</td>
                  <td>{r.endPhoto ? <img src={r.endPhoto} style={{width: 50, height: 30, objectFit:'cover', borderRadius:4, cursor:'zoom-in'}} onClick={()=>window.open(r.endPhoto)} alt=""/> : '—'}</td>
                  <td><span className={`badge badge-${r.status === 'completed' ? 'active' : 'pending'}`}>{r.status}</span></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>;

      case 'advances':
        return <>
          <div className="page-header">
            <div><h1>Advances & Requests</h1></div>
            {!isAdmin && <button className="btn-primary" onClick={() => {setModalData({}); setModalType('advance')}}>Request Advance</button>}
          </div>
          <div className="card table-wrap">
            <table><thead><tr>{isAdmin&&<th>Employee</th>}<th>Date</th><th>Amount</th><th>Reason</th><th>Status</th>{isAdmin&&<th>Actions</th>}</tr></thead>
              <tbody>{advances.map(a => (
                <tr key={a.id}>{isAdmin&&<td><strong>{a.employee?.name}</strong></td>}<td>{fmtDate(a.requestDate)}</td>
                  <td>{fmtCurrency(a.amount)}</td><td>{a.reason}</td>
                  <td><span className={`badge badge-${a.status}`}>{a.status}</span></td>
                  {isAdmin && <td>
                    {a.status === 'pending' && <><button className="btn-primary btn-sm" onClick={()=>updateAdvanceStatus(a.id, 'approved')} style={{marginRight:5}}>Approve</button>
                    <button className="btn-danger btn-sm" onClick={()=>updateAdvanceStatus(a.id, 'rejected')}>Reject</button></>}
                  </td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>;
        
      case 'salary':
        return <>
          <div className="page-header"><div><h1>Salary & Deductions</h1></div></div>
          <div className="card table-wrap">
            <table><thead><tr>{isAdmin&&<th>Employee</th>}<th>Month</th><th>Gross Salary</th><th>Deductions (Advances)</th><th>Net Paid</th></tr></thead>
              <tbody>{salaryPayments.map(p => (
                <tr key={p.id}>{isAdmin&&<td><strong>{p.employee?.name}</strong></td>}<td>{p.month}</td>
                  <td>{fmtCurrency(p.amount)}</td><td style={{color:'var(--rose)'}}>-{fmtCurrency(p.deductions)}</td>
                  <td style={{color:'var(--emerald)', fontWeight:'bold'}}>{fmtCurrency(p.netAmount)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>;
        
      // Team / Employees
      case 'team': 
        return <>
          <div className="page-header">
            <div><h1>Team Members</h1></div>
            {isAdmin && <button className="btn-primary" onClick={() => { setModalData({role:'employee', employeeRole:'normal', baseSalary:0}); setModalType('employee'); }}>Add New Member</button>}
          </div>
          <div className="card table-wrap" style={{ overflowX: 'auto' }}>
            <table style={{ minWidth: '600px' }}>
              <thead><tr><th>Name</th><th>Role</th><th>Salary</th>{isAdmin && <th>Actions</th>}</tr></thead>
              <tbody>{employees.map(e => (
                <tr key={e.id}>
                  <td>
                    <div><strong>{e.name}</strong></div>
                    <div style={{fontSize:'0.8em', color:'var(--text-muted)'}}>{e.email}</div>
                  </td>
                  <td><span className={`badge badge-${e.employeeRole === 'admin' ? 'active' : 'assigned'}`}>{e.employeeRole}</span></td>
                  <td>{fmtCurrency(e.baseSalary)}</td>
                  {isAdmin && <td>
                    {e.id !== user.id && <button className="btn-danger btn-sm" onClick={() => deleteEmployee(e.id, e.name)}>Delete</button>}
                  </td>}
                </tr>
              ))}</tbody>
            </table>
          </div>
        </>;
        
      case 'attendance': 
        return <div className="card table-wrap" style={{ overflowX: 'auto' }}><table style={{ minWidth: '500px' }}><thead><tr><th>Name</th><th>Date</th><th>In</th><th>Out</th></tr></thead><tbody>{attendance.slice(0, 50).map(a=><tr key={a.id}><td>{a.employee?.name}</td><td>{a.date}</td><td>{fmtTime(a.checkIn)}</td><td>{fmtTime(a.checkOut)}</td></tr>)}</tbody></table></div>;
      
      default: return <div>Select an option</div>;
    }
  };

  return (
    <div className="app-layout">
      {sidebarOpen && <div className="sidebar-overlay show" onClick={() => setSidebarOpen(false)} />}
      <aside className={`sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="sidebar-brand">
          <Image src="/icon.jpg" alt="Logo" width={40} height={40} />
          <div className="sidebar-brand-text">Ved Logistics<small>Management Portal</small></div>
        </div>
        <nav className="sidebar-nav">
          {navSections.map(sec => (
            <div className="nav-section" key={sec.section}>
              <div className="nav-section-title">{sec.section}</div>
              {sec.items.map(i => <a key={i.id} className={`nav-item ${page===i.id?'active':''}`} onClick={()=>navigate(i.id)}>{i.icon}<span>{i.label}</span></a>)}
            </div>
          ))}
        </nav>
      </aside>

      <div className="main-area">
        <header className="topbar">
          <div className="topbar-left"><button className="topbar-hamburger" onClick={()=>setSidebarOpen(true)}>☰</button><strong>{navSections.flatMap(s=>s.items).find(i=>i.id===page)?.label}</strong></div>
          <div className="topbar-right"><button className="btn-outline btn-sm" onClick={logout}>Logout</button></div>
        </header>

        <main className="content">{renderContent()}</main>
      </div>

      {/* Modals */}
      {modalType && (
        <div className="modal-overlay open">
          <div className="modal-box">
            <div className="modal-header">
              <h3>{modalType === 'ride' ? `${modalData.type==='start'?'Start':'End'} Ride` : modalType === 'log' ? 'Work Log' : 'Request Advance'}</h3>
              <button className="modal-close" onClick={()=>setModalType(null)}>×</button>
            </div>
            <div className="modal-body">
              {/* RIDE MODAL */}
              {modalType === 'ride' && <form onSubmit={submitRide}>
                <div className="form-group">
                  <label className="form-label">{modalData.type === 'start' ? 'Start KM Reading' : 'End KM Reading'}</label>
                  <input type="number" required className="form-input" value={modalData.type==='start'?modalData.startKm||'':modalData.endKm||''} onChange={e=>setModalData({...modalData, [modalData.type==='start'?'startKm':'endKm']: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">Speedometer Photo Proof</label>
                  <input type="file" accept="image/*" capture="environment" className="form-input" ref={fileInputRef} onChange={handlePhotoUpload} required />
                  {modalData.photo && <img src={modalData.photo} alt="Preview" style={{marginTop:10, maxHeight: 150, borderRadius:8}} />}
                </div>
                <button type="submit" className="btn-primary" style={{width:'100%'}}>Save Ride Log</button>
              </form>}
              
              {/* LOG MODAL */}
              {modalType === 'log' && <form onSubmit={submitDailyLog}>
                <div className="form-group"><label className="form-label">Delivered Items Count</label><input type="number" className="form-input" value={modalData.delivered||0} onChange={e=>setModalData({...modalData, delivered: parseInt(e.target.value)||0})} /></div>
                <div className="form-group"><label className="form-label">Picked Up Items Count</label><input type="number" className="form-input" value={modalData.pickedUp||0} onChange={e=>setModalData({...modalData, pickedUp: parseInt(e.target.value)||0})} /></div>
                <div className="form-group"><label className="form-label">Store / Warehouse Items</label><input type="number" className="form-input" value={modalData.store||0} onChange={e=>setModalData({...modalData, store: parseInt(e.target.value)||0})} /></div>
                <div className="form-group"><label className="form-label">Notes</label><textarea className="form-input" value={modalData.note||''} onChange={e=>setModalData({...modalData, note: e.target.value})} /></div>
                <button type="submit" className="btn-primary" style={{width:'100%'}}>Save Work Log</button>
              </form>}

              {/* ADVANCE MODAL */}
              {modalType === 'advance' && <form onSubmit={submitAdvance}>
                <div className="form-group"><label className="form-label">Amount (₹)</label><input type="number" required className="form-input" value={modalData.amount||''} onChange={e=>setModalData({...modalData, amount: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Reason</label><textarea required className="form-input" value={modalData.reason||''} onChange={e=>setModalData({...modalData, reason: e.target.value})} /></div>
                <button type="submit" className="btn-primary" style={{width:'100%'}}>Request Advance</button>
              </form>}

              {/* EMPLOYEE MODAL */}
              {modalType === 'employee' && <form onSubmit={submitEmployee}>
                <div className="form-group"><label className="form-label">Full Name</label><input type="text" required className="form-input" value={modalData.name||''} onChange={e=>setModalData({...modalData, name: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Email</label><input type="email" required className="form-input" value={modalData.email||''} onChange={e=>setModalData({...modalData, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Password</label><input type="password" required className="form-input" value={modalData.password||''} onChange={e=>setModalData({...modalData, password: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">Phone</label><input type="text" className="form-input" value={modalData.phone||''} onChange={e=>setModalData({...modalData, phone: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">System Role</label>
                  <select className="form-input" value={modalData.role||'employee'} onChange={e=>setModalData({...modalData, role: e.target.value})}>
                    <option value="employee">Standard User</option>
                    <option value="admin">Administrator</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Job Role</label>
                  <select className="form-input" value={modalData.employeeRole||'normal'} onChange={e=>setModalData({...modalData, employeeRole: e.target.value})}>
                    <option value="normal">Normal Staff</option>
                    <option value="rider">Rider / Driver</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
                <div className="form-group"><label className="form-label">Base Salary (₹)</label><input type="number" required className="form-input" value={modalData.baseSalary||''} onChange={e=>setModalData({...modalData, baseSalary: Number(e.target.value)})} /></div>
                <button type="submit" className="btn-primary" style={{width:'100%'}}>Add Team Member</button>
              </form>}
            </div>
          </div>
        </div>
      )}

      {toast && <div className={`login-toast show ${toast.type}`}>{toast.msg}</div>}
    </div>
  );
}
