/* ══════════════════════════════════════════
   Ved Logistics — Reports Module
   ══════════════════════════════════════════ */

const Reports = (() => {
  let activeReport = 'attendance';

  const render = () => {
    return `
      <div class="page-header">
        <div><h1>📊 Reports</h1><div class="page-header-sub">Generate and export business reports</div></div>
      </div>

      <div class="tabs-bar">
        <div class="tab-item ${activeReport==='attendance'?'active':''}" data-report="attendance">Attendance</div>
        <div class="tab-item ${activeReport==='deliveries'?'active':''}" data-report="deliveries">Deliveries</div>
        <div class="tab-item ${activeReport==='riders'?'active':''}" data-report="riders">Rider Distance</div>
        <div class="tab-item ${activeReport==='salary'?'active':''}" data-report="salary">Salary</div>
        <div class="tab-item ${activeReport==='expenses'?'active':''}" data-report="expenses">Expenses</div>
      </div>

      <div id="reportContent">${renderReport(activeReport)}</div>
    `;
  };

  const renderReport = (type) => {
    switch(type) {
      case 'attendance': return attendanceReport();
      case 'deliveries': return deliveryReport();
      case 'riders': return riderReport();
      case 'salary': return salaryReport();
      case 'expenses': return expenseReport();
      default: return '';
    }
  };

  const attendanceReport = () => {
    const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
    const att = Store.getAll('attendance');
    const empData = emps.map(e => {
      const records = att.filter(a => a.employeeId === e.id);
      return { name: e.name, dept: e.department, totalDays: records.length, late: records.filter(a => {
        const startTime = Store.getSetting('workStartTime', '09:00');
        const threshold = Store.getSetting('lateThresholdMin', 30);
        const [sh, sm] = startTime.split(':').map(Number);
        const limit = new Date(a.checkIn); limit.setHours(sh, sm + threshold, 0, 0);
        return new Date(a.checkIn) > limit;
      }).length };
    });

    return `
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="btn-outline btn-sm" id="exportAttendance">📥 Export CSV</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Department</th><th>Days Present</th><th>Days Late</th><th>Attendance %</th></tr></thead>
          <tbody>
            ${empData.map(d => {
              const pct = d.totalDays > 0 ? Math.round(((d.totalDays - d.late) / d.totalDays) * 100) : 0;
              return `<tr>
                <td style="font-weight:600">${d.name}</td>
                <td>${d.dept}</td>
                <td>${d.totalDays}</td>
                <td style="color:${d.late>0?'var(--amber)':'var(--text)'}">${d.late}</td>
                <td><div style="display:flex;align-items:center;gap:8px"><div class="progress" style="flex:1;height:6px"><div class="progress-fill" style="width:${pct}%"></div></div><span style="font-weight:700;font-size:.78rem">${pct}%</span></div></td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const deliveryReport = () => {
    const parcels = Store.getAll('parcels');
    const total = parcels.length;
    const delivered = parcels.filter(p => p.status === 'delivered').length;
    const inTransit = parcels.filter(p => p.status === 'in_transit').length;

    return `
      <div style="display:flex;gap:16px;margin-bottom:20px">
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:700">${total}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">Total Parcels</div>
        </div>
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--emerald)">${delivered}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">Delivered</div>
        </div>
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--indigo)">${inTransit}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">In Transit</div>
        </div>
        <div style="flex:1;text-align:center;padding:16px;background:var(--bg-input);border-radius:var(--radius-md)">
          <div style="font-family:var(--font-heading);font-size:1.5rem;font-weight:700;color:var(--amber)">${total - delivered}</div>
          <div style="font-size:.72rem;color:var(--text-muted)">Pending</div>
        </div>
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="btn-outline btn-sm" id="exportDeliveries">📥 Export CSV</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Parcel</th><th>Customer</th><th>Route</th><th>Type</th><th>Rider</th><th>Status</th><th>Created</th></tr></thead>
          <tbody>
            ${parcels.sort((a,b) => new Date(b.createdAt)-new Date(a.createdAt)).map(p => {
              const rider = Store.getById('employees', p.assignedRider);
              return `<tr>
                <td style="font-weight:700">${p.parcelId}</td>
                <td>${p.customerName}</td>
                <td style="font-size:.78rem">${p.pickupAddress} → ${p.deliveryAddress}</td>
                <td>${p.parcelType}</td>
                <td>${rider?.name||'—'}</td>
                <td><span class="badge badge-${p.status}">${p.status.replace('_',' ')}</span></td>
                <td style="font-size:.78rem">${Utils.fmtDate(p.createdAt)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const riderReport = () => {
    const riders = Store.getAll('employees').filter(e => e.employeeRole === 'rider');
    const rides = Store.getAll('rides');

    return `
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="btn-outline btn-sm" id="exportRiders">📥 Export CSV</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Rider</th><th>Bike</th><th>Total Rides</th><th>Total KM</th><th>Total Fuel</th><th>Avg KM/Ride</th></tr></thead>
          <tbody>
            ${riders.map(r => {
              const rRides = rides.filter(rd => rd.riderId === r.id);
              const totalKm = rRides.reduce((s,rd) => s + (rd.distance||0), 0);
              const totalFuel = rRides.reduce((s,rd) => s + (rd.fuelCost||0), 0);
              const avg = rRides.length ? Math.round(totalKm / rRides.length) : 0;
              return `<tr>
                <td style="font-weight:600">${r.name}</td>
                <td>${r.bikeNumber||'—'}</td>
                <td>${rRides.length}</td>
                <td style="font-weight:700;color:var(--teal)">${totalKm} km</td>
                <td>${Utils.fmtCurrency(totalFuel)}</td>
                <td>${avg} km</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const salaryReport = () => {
    const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
    const advances = Store.getAll('advances');
    const expenses = Store.getAll('expenses');

    return `
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="btn-outline btn-sm" id="exportSalary">📥 Export CSV</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Base Salary</th><th>Advances</th><th>Reimbursements</th><th>Deductions</th><th>Net Payable</th></tr></thead>
          <tbody>
            ${emps.map(e => {
              const adv = advances.filter(a => a.employeeId === e.id && a.status === 'approved').reduce((s,a) => s + a.amount, 0);
              const reimb = expenses.filter(ex => ex.employeeId === e.id && ex.status === 'approved').reduce((s,ex) => s + ex.amount, 0);
              const net = (e.baseSalary||0) - adv + reimb;
              return `<tr>
                <td style="font-weight:600">${e.name}</td>
                <td>${Utils.fmtCurrency(e.baseSalary)}</td>
                <td style="color:var(--rose)">${adv > 0 ? '-'+Utils.fmtCurrency(adv) : '—'}</td>
                <td style="color:var(--emerald)">${reimb > 0 ? '+'+Utils.fmtCurrency(reimb) : '—'}</td>
                <td>${Utils.fmtCurrency(adv)}</td>
                <td style="font-weight:700">${Utils.fmtCurrency(net)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const expenseReport = () => {
    const expenses = Store.getAll('expenses');
    const byType = {};
    expenses.forEach(e => { byType[e.type] = (byType[e.type]||0) + e.amount; });

    return `
      <div style="display:flex;gap:16px;margin-bottom:20px;flex-wrap:wrap">
        ${Object.entries(byType).map(([type, amount]) => `
          <div style="flex:1;min-width:140px;text-align:center;padding:16px;background:var(--bg-input);border-radius:var(--radius-md)">
            <div style="font-family:var(--font-heading);font-size:1.2rem;font-weight:700">${Utils.fmtCurrency(amount)}</div>
            <div style="font-size:.72rem;color:var(--text-muted)">${type.charAt(0).toUpperCase() + type.slice(1)}</div>
          </div>
        `).join('')}
      </div>
      <div style="display:flex;justify-content:flex-end;margin-bottom:16px">
        <button class="btn-outline btn-sm" id="exportExpenses">📥 Export CSV</button>
      </div>
      <div class="table-wrap">
        <table>
          <thead><tr><th>Employee</th><th>Type</th><th>Amount</th><th>Description</th><th>Status</th><th>Date</th></tr></thead>
          <tbody>
            ${expenses.sort((a,b) => new Date(b.requestDate)-new Date(a.requestDate)).map(e => {
              const emp = Store.getById('employees', e.employeeId);
              return `<tr>
                <td style="font-weight:600">${emp?.name||'Unknown'}</td>
                <td>${e.type}</td>
                <td style="font-weight:700">${Utils.fmtCurrency(e.amount)}</td>
                <td style="font-size:.82rem">${e.description}</td>
                <td><span class="badge badge-${e.status}">${e.status}</span></td>
                <td style="font-size:.78rem">${Utils.fmtDate(e.requestDate)}</td>
              </tr>`;
            }).join('')}
          </tbody>
        </table>
      </div>
    `;
  };

  const bind = () => {
    document.querySelectorAll('.tab-item[data-report]').forEach(tab => {
      tab.onclick = () => {
        activeReport = tab.dataset.report;
        document.getElementById('content').innerHTML = `<div class="page-transition">${render()}</div>`;
        bind();
      };
    });

    // Export buttons
    document.getElementById('exportAttendance')?.addEventListener('click', () => {
      const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
      const att = Store.getAll('attendance');
      const data = emps.map(e => {
        const records = att.filter(a => a.employeeId === e.id);
        return { name: e.name, department: e.department, daysPresent: records.length };
      });
      Utils.exportCSV(data, 'attendance_report', [
        { label: 'Employee', key: 'name' },
        { label: 'Department', key: 'department' },
        { label: 'Days Present', key: 'daysPresent' },
      ]);
    });

    document.getElementById('exportDeliveries')?.addEventListener('click', () => {
      const parcels = Store.getAll('parcels');
      Utils.exportCSV(parcels, 'delivery_report', [
        { label: 'Parcel ID', key: 'parcelId' },
        { label: 'Customer', key: 'customerName' },
        { label: 'Pickup', key: 'pickupAddress' },
        { label: 'Delivery', key: 'deliveryAddress' },
        { label: 'Type', key: 'parcelType' },
        { label: 'Weight', key: 'weight' },
        { label: 'Status', key: 'status' },
      ]);
    });

    document.getElementById('exportRiders')?.addEventListener('click', () => {
      const riders = Store.getAll('employees').filter(e => e.employeeRole === 'rider');
      const rides = Store.getAll('rides');
      const data = riders.map(r => {
        const rr = rides.filter(rd => rd.riderId === r.id);
        return { name: r.name, bike: r.bikeNumber, rides: rr.length, km: rr.reduce((s,rd)=>s+(rd.distance||0),0), fuel: rr.reduce((s,rd)=>s+(rd.fuelCost||0),0) };
      });
      Utils.exportCSV(data, 'rider_distance_report', [
        { label: 'Rider', key: 'name' },
        { label: 'Bike', key: 'bike' },
        { label: 'Total Rides', key: 'rides' },
        { label: 'Total KM', key: 'km' },
        { label: 'Total Fuel', key: 'fuel' },
      ]);
    });

    document.getElementById('exportSalary')?.addEventListener('click', () => {
      const emps = Store.getAll('employees').filter(e => e.role !== 'admin');
      Utils.exportCSV(emps, 'salary_report', [
        { label: 'Employee', key: 'name' },
        { label: 'Department', key: 'department' },
        { label: 'Base Salary', key: 'baseSalary' },
      ]);
    });

    document.getElementById('exportExpenses')?.addEventListener('click', () => {
      const expenses = Store.getAll('expenses');
      Utils.exportCSV(expenses, 'expense_report', [
        { label: 'Type', key: 'type' },
        { label: 'Amount', key: 'amount' },
        { label: 'Description', key: 'description' },
        { label: 'Status', key: 'status' },
      ]);
    });
  };

  return { render, bind };
})();
