/* ══════════════════════════════════════════
   Ved Logistics — Demo Data Seeder
   ══════════════════════════════════════════ */

const Seed = (() => {
  const run = () => {
    if (Store.isSeeded()) return;

    // ── Default Settings (all flexible/configurable) ──
    Store.setSetting('companyName', 'Ved Logistics');
    Store.setSetting('workStartTime', '09:00');    // configurable
    Store.setSetting('workEndTime', '18:00');       // configurable
    Store.setSetting('lateThresholdMin', 30);       // minutes grace
    Store.setSetting('salaryCycleDay', 1);          // 1st of month
    Store.setSetting('salaryCycleType', 'monthly'); // monthly/biweekly
    Store.setSetting('currency', '₹');
    Store.setSetting('darkMode', false);

    // ── Users / Employees (unified — rider is an employee type) ──
    const employees = [
      { id: 'admin1', name: 'Rahul Sharma', email: 'admin@vedlogistics.com', password: 'admin123', phone: '9876543210', department: 'Management', role: 'admin', employeeRole: 'admin', baseSalary: 80000, joinDate: '2024-01-15', status: 'active', avatar: '', notes: 'Company owner and primary admin' },
      { id: 'emp1', name: 'Arjun Patel', email: 'arjun@vedlogistics.com', password: 'emp123', phone: '9876543211', department: 'Operations', role: 'employee', employeeRole: 'normal', baseSalary: 25000, joinDate: '2024-03-10', status: 'active', avatar: '', notes: 'Handles warehouse operations' },
      { id: 'emp2', name: 'Priya Singh', email: 'priya@vedlogistics.com', password: 'emp123', phone: '9876543212', department: 'HR', role: 'employee', employeeRole: 'normal', baseSalary: 28000, joinDate: '2024-02-20', status: 'active', avatar: '', notes: 'HR manager, handles hiring and payroll prep' },
      { id: 'emp3', name: 'Vikram Reddy', email: 'vikram@vedlogistics.com', password: 'emp123', phone: '9876543213', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2024-04-05', status: 'active', bikeNumber: 'RJ-14-AB-1234', avatar: '', notes: 'Senior rider, excellent delivery record' },
      { id: 'emp4', name: 'Rohit Kumar', email: 'rohit@vedlogistics.com', password: 'emp123', phone: '9876543214', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2024-05-12', status: 'active', bikeNumber: 'RJ-14-CD-5678', avatar: '', notes: 'Covers Jaipur-Jodhpur route' },
      { id: 'emp5', name: 'Sneha Desai', email: 'sneha@vedlogistics.com', password: 'emp123', phone: '9876543215', department: 'Sales', role: 'employee', employeeRole: 'normal', baseSalary: 30000, joinDate: '2024-06-01', status: 'active', avatar: '', notes: 'Top performer in B2B sales' },
      { id: 'emp6', name: 'Karan Mehta', email: 'karan@vedlogistics.com', password: 'emp123', phone: '9876543216', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2024-07-15', status: 'active', bikeNumber: 'RJ-14-EF-9012', avatar: '', notes: 'Also helps with warehouse loading' },
      { id: 'emp7', name: 'Deepak Joshi', email: 'deepak@vedlogistics.com', password: 'emp123', phone: '9876543217', department: 'Warehouse', role: 'employee', employeeRole: 'normal', baseSalary: 20000, joinDate: '2024-08-20', status: 'active', avatar: '', notes: 'Night shift warehouse manager' },
      { id: 'emp8', name: 'Amit Verma', email: 'amit@vedlogistics.com', password: 'emp123', phone: '9876543218', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2025-01-10', status: 'active', bikeNumber: 'RJ-14-GH-3456', avatar: '', notes: 'New rider, still in training period' },
    ];

    employees.forEach(e => {
      e.createdAt = new Date().toISOString();
      e.updatedAt = new Date().toISOString();
    });
    localStorage.setItem('ved_employees', JSON.stringify(employees));

    // ── Attendance (last 15 days sample) ──
    const attendance = [];
    const now = new Date();
    for (let d = 14; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0) continue; // skip Sundays

      employees.filter(e => e.role !== 'admin').forEach(emp => {
        if (Math.random() > 0.12) { // 88% attendance rate
          const checkInHour = 8 + Math.floor(Math.random() * 2);
          const checkInMin = Math.floor(Math.random() * 50);
          const checkIn = new Date(date);
          checkIn.setHours(checkInHour, checkInMin, 0);

          const checkOutHour = 17 + Math.floor(Math.random() * 2);
          const checkOutMin = Math.floor(Math.random() * 50);
          const checkOut = new Date(date);
          checkOut.setHours(checkOutHour, checkOutMin, 0);

          attendance.push({
            id: Utils.uid(),
            employeeId: emp.id,
            date: date.toISOString().split('T')[0],
            checkIn: checkIn.toISOString(),
            checkOut: d === 0 && Math.random() > 0.5 ? null : checkOut.toISOString(),
            location: 'Office',
            note: '',
            createdAt: checkIn.toISOString(),
            updatedAt: checkOut ? checkOut.toISOString() : checkIn.toISOString(),
          });
        }
      });
    }
    localStorage.setItem('ved_attendance', JSON.stringify(attendance));

    // ── Parcels ──
    const statuses = ['assigned', 'picked_up', 'in_transit', 'delivered'];
    const parcelTypes = ['Document', 'Small Package', 'Medium Box', 'Large Box', 'Fragile'];
    const cities = ['Jodhpur', 'Jaipur', 'Udaipur', 'Ajmer', 'Kota', 'Bikaner'];
    const customers = ['Rajesh Trading', 'Sharma Enterprises', 'Global Solutions', 'TechMart India', 'Quick Service Ltd', 'Mehta & Sons', 'Patel Industries'];
    const riders = employees.filter(e => e.employeeRole === 'rider');

    const parcels = [];
    for (let i = 0; i < 25; i++) {
      const created = new Date();
      created.setDate(created.getDate() - Math.floor(Math.random() * 20));
      const statusIdx = Math.floor(Math.random() * statuses.length);
      parcels.push({
        id: Utils.uid(),
        parcelId: 'VL-' + (20000 + i + 1),
        customerName: customers[Math.floor(Math.random() * customers.length)],
        pickupAddress: cities[Math.floor(Math.random() * cities.length)] + ', Rajasthan',
        deliveryAddress: cities[Math.floor(Math.random() * cities.length)] + ', Rajasthan',
        parcelType: parcelTypes[Math.floor(Math.random() * parcelTypes.length)],
        weight: (Math.random() * 20 + 0.5).toFixed(1),
        assignedRider: riders[Math.floor(Math.random() * riders.length)].id,
        status: statuses[statusIdx],
        note: ['', '', 'Handle with care', 'Urgent delivery', 'Customer VIP', ''][Math.floor(Math.random() * 6)],
        statusHistory: statuses.slice(0, statusIdx + 1).map((s, j) => ({
          status: s,
          timestamp: new Date(created.getTime() + j * 3600000 * 2).toISOString(),
        })),
        createdAt: created.toISOString(),
        updatedAt: new Date().toISOString(),
      });
    }
    localStorage.setItem('ved_parcels', JSON.stringify(parcels));

    // ── Rides (bike tracking) ──
    const rides = [];
    riders.forEach(rider => {
      for (let i = 0; i < 5; i++) {
        const d = new Date();
        d.setDate(d.getDate() - Math.floor(Math.random() * 14));
        const startKm = Math.floor(Math.random() * 50000 + 10000);
        const dist = Math.floor(Math.random() * 60 + 5);
        rides.push({
          id: Utils.uid(),
          riderId: rider.id,
          date: d.toISOString().split('T')[0],
          startKm: startKm,
          endKm: startKm + dist,
          distance: dist,
          startImage: null,
          endImage: null,
          fuelCost: Math.round(dist * 3.5),
          status: 'completed',
          note: '',
          createdAt: d.toISOString(),
          updatedAt: d.toISOString(),
        });
      }
    });
    localStorage.setItem('ved_rides', JSON.stringify(rides));

    // ── Advances ──
    const advances = [];
    employees.filter(e => e.role !== 'admin').slice(0, 4).forEach(emp => {
      advances.push({
        id: Utils.uid(),
        employeeId: emp.id,
        amount: [2000, 3000, 5000, 1500][Math.floor(Math.random() * 4)],
        reason: ['Personal emergency', 'Medical expense', 'Bike repair', 'Family need'][Math.floor(Math.random() * 4)],
        status: ['approved', 'approved', 'pending', 'approved'][Math.floor(Math.random() * 4)],
        requestDate: new Date(Date.now() - Math.random() * 15 * 86400000).toISOString(),
        approvedDate: new Date().toISOString(),
        note: ['', 'Approved by Rahul', 'Pending review', 'Urgent - approved immediately'][Math.floor(Math.random() * 4)],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    });
    localStorage.setItem('ved_advances', JSON.stringify(advances));

    // ── Expenses ──
    const expenses = [];
    riders.forEach(rider => {
      for (let i = 0; i < 3; i++) {
        expenses.push({
          id: Utils.uid(),
          employeeId: rider.id,
          type: ['fuel', 'maintenance', 'emergency'][i % 3],
          amount: [350, 1200, 500][i % 3],
          description: ['Petrol for deliveries', 'Tire puncture repair', 'Emergency phone recharge'][i % 3],
          receiptImage: null,
          status: ['approved', 'pending', 'approved'][i % 3],
          requestDate: new Date(Date.now() - Math.random() * 10 * 86400000).toISOString(),
          note: ['', 'Receipt verified', ''][i % 3],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });
      }
    });
    localStorage.setItem('ved_expenses', JSON.stringify(expenses));

    // ── Salary Payments (demo: last 2 months) ──
    const salaryPayments = [];
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0,7);

    employees.filter(e => e.role !== 'admin').forEach(emp => {
      // Last month — all paid
      salaryPayments.push({
        id: Utils.uid(),
        employeeId: emp.id,
        amount: emp.baseSalary,
        paymentDate: lastMonthStr + '-28',
        month: lastMonthStr,
        note: `${lastMonth.toLocaleString('en',{month:'long'})} salary - full payment`,
        paidBy: 'Rahul Sharma',
        createdAt: new Date(lastMonthStr + '-28').toISOString(),
        updatedAt: new Date(lastMonthStr + '-28').toISOString(),
      });
    });

    // This month — only some paid (to show pending)
    const thisMonthStr = new Date().toISOString().slice(0,7);
    employees.filter(e => e.role !== 'admin').slice(0, 3).forEach(emp => {
      salaryPayments.push({
        id: Utils.uid(),
        employeeId: emp.id,
        amount: emp.baseSalary,
        paymentDate: thisMonthStr + '-05',
        month: thisMonthStr,
        note: `${new Date().toLocaleString('en',{month:'long'})} salary - paid early`,
        paidBy: 'Rahul Sharma',
        createdAt: new Date(thisMonthStr + '-05').toISOString(),
        updatedAt: new Date(thisMonthStr + '-05').toISOString(),
      });
    });

    localStorage.setItem('ved_salary_payments', JSON.stringify(salaryPayments));

    Store.markSeeded();
    console.log('✅ Ved Logistics: Demo data seeded successfully');
  };

  return { run };
})();
