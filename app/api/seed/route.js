import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { jsonResponse, errorResponse } from '@/lib/auth';

export async function POST() {
  try {
    // Check if already seeded
    const adminExists = await prisma.employee.findFirst({ where: { role: 'admin' } });
    if (adminExists) {
      return jsonResponse({ message: 'Database already seeded', seeded: false });
    }

    const hash = (pw) => bcrypt.hashSync(pw, 10);

    // Create employees
    const employees = await Promise.all([
      prisma.employee.create({ data: { name: 'Rahul Sharma', email: 'admin@vedlogistics.com', password: hash('admin123'), phone: '9876543210', department: 'Management', role: 'admin', employeeRole: 'admin', baseSalary: 80000, joinDate: '2024-01-15', status: 'active', notes: 'Company owner and primary admin' } }),
      prisma.employee.create({ data: { name: 'Arjun Patel', email: 'arjun@vedlogistics.com', password: hash('emp123'), phone: '9876543211', department: 'Operations', role: 'employee', employeeRole: 'normal', baseSalary: 25000, joinDate: '2024-03-10', status: 'active', notes: 'Handles warehouse operations' } }),
      prisma.employee.create({ data: { name: 'Priya Singh', email: 'priya@vedlogistics.com', password: hash('emp123'), phone: '9876543212', department: 'HR', role: 'employee', employeeRole: 'normal', baseSalary: 28000, joinDate: '2024-02-20', status: 'active', notes: 'HR manager' } }),
      prisma.employee.create({ data: { name: 'Vikram Reddy', email: 'vikram@vedlogistics.com', password: hash('emp123'), phone: '9876543213', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2024-04-05', status: 'active', bikeNumber: 'RJ-14-AB-1234', notes: 'Senior rider' } }),
      prisma.employee.create({ data: { name: 'Rohit Kumar', email: 'rohit@vedlogistics.com', password: hash('emp123'), phone: '9876543214', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2024-05-12', status: 'active', bikeNumber: 'RJ-14-CD-5678', notes: 'Jaipur-Jodhpur route' } }),
      prisma.employee.create({ data: { name: 'Sneha Desai', email: 'sneha@vedlogistics.com', password: hash('emp123'), phone: '9876543215', department: 'Sales', role: 'employee', employeeRole: 'normal', baseSalary: 30000, joinDate: '2024-06-01', status: 'active', notes: 'Top B2B sales' } }),
      prisma.employee.create({ data: { name: 'Karan Mehta', email: 'karan@vedlogistics.com', password: hash('emp123'), phone: '9876543216', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2024-07-15', status: 'active', bikeNumber: 'RJ-14-EF-9012' } }),
      prisma.employee.create({ data: { name: 'Deepak Joshi', email: 'deepak@vedlogistics.com', password: hash('emp123'), phone: '9876543217', department: 'Warehouse', role: 'employee', employeeRole: 'normal', baseSalary: 20000, joinDate: '2024-08-20', status: 'active', notes: 'Night shift warehouse' } }),
    ]);

    const riders = employees.filter(e => e.employeeRole === 'rider');
    const nonAdmins = employees.filter(e => e.role !== 'admin');

    // Create attendance (last 10 days)
    const now = new Date();
    for (let d = 9; d >= 0; d--) {
      const date = new Date(now);
      date.setDate(date.getDate() - d);
      if (date.getDay() === 0) continue;
      const dateStr = date.toISOString().split('T')[0];

      for (const emp of nonAdmins) {
        if (Math.random() > 0.15) {
          const checkIn = new Date(date);
          checkIn.setHours(8 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 50));
          const checkOut = new Date(date);
          checkOut.setHours(17 + Math.floor(Math.random() * 2), Math.floor(Math.random() * 50));

          await prisma.attendance.create({
            data: {
              employeeId: emp.id, date: dateStr,
              checkIn, checkOut: d === 0 ? null : checkOut,
              location: 'Office',
            },
          });
        }
      }
    }

    // Create parcels
    const statuses = ['assigned', 'picked_up', 'in_transit', 'delivered'];
    const types = ['Document', 'Small Package', 'Medium Box', 'Large Box', 'Fragile'];
    const cities = ['Jodhpur', 'Jaipur', 'Udaipur', 'Ajmer', 'Kota', 'Bikaner'];
    const customers = ['Rajesh Trading', 'Sharma Enterprises', 'Global Solutions', 'TechMart India', 'Quick Service Ltd'];

    for (let i = 0; i < 20; i++) {
      const created = new Date();
      created.setDate(created.getDate() - Math.floor(Math.random() * 15));
      const si = Math.floor(Math.random() * statuses.length);
      const history = statuses.slice(0, si + 1).map((s, j) => ({
        status: s,
        timestamp: new Date(created.getTime() + j * 7200000).toISOString(),
      }));

      await prisma.parcel.create({
        data: {
          parcelId: `VL-${20001 + i}`,
          customerName: customers[Math.floor(Math.random() * customers.length)],
          pickupAddress: cities[Math.floor(Math.random() * cities.length)] + ', Rajasthan',
          deliveryAddress: cities[Math.floor(Math.random() * cities.length)] + ', Rajasthan',
          parcelType: types[Math.floor(Math.random() * types.length)],
          weight: (Math.random() * 20 + 0.5).toFixed(1),
          assignedRider: riders[Math.floor(Math.random() * riders.length)].id,
          status: statuses[si],
          statusHistory: history,
        },
      });
    }

    // Create rides
    for (const rider of riders) {
      for (let i = 0; i < 4; i++) {
        const d = new Date();
        d.setDate(d.getDate() - Math.floor(Math.random() * 14));
        const startKm = Math.floor(Math.random() * 50000 + 10000);
        const dist = Math.floor(Math.random() * 60 + 5);
        await prisma.ride.create({
          data: {
            riderId: rider.id, date: d.toISOString().split('T')[0],
            startKm, endKm: startKm + dist, distance: dist,
            fuelCost: Math.round(dist * 3.5), status: 'completed',
          },
        });
      }
    }

    // Create expenses
    for (const rider of riders) {
      const expTypes = ['fuel', 'maintenance', 'emergency'];
      const amounts = [350, 1200, 500];
      const descs = ['Petrol for deliveries', 'Tire repair', 'Emergency recharge'];
      for (let i = 0; i < 2; i++) {
        await prisma.expense.create({
          data: {
            employeeId: rider.id,
            type: expTypes[i % 3], amount: amounts[i % 3],
            description: descs[i % 3],
            status: i === 0 ? 'approved' : 'pending',
          },
        });
      }
    }

    // Create salary payments (last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);
    for (const emp of nonAdmins) {
      await prisma.salaryPayment.create({
        data: {
          employeeId: emp.id, amount: emp.baseSalary,
          paymentDate: lastMonthStr + '-28', month: lastMonthStr,
          note: 'Monthly salary', paidBy: 'Rahul Sharma',
        },
      });
    }

    // Settings
    const defaults = [
      ['companyName', 'Ved Logistics'],
      ['workStartTime', '09:00'],
      ['workEndTime', '18:00'],
      ['lateThresholdMin', '30'],
      ['currency', '₹'],
    ];
    for (const [key, value] of defaults) {
      await prisma.setting.upsert({ where: { key }, create: { key, value }, update: { value } });
    }

    return jsonResponse({ message: 'Database seeded successfully!', seeded: true });
  } catch (error) {
    console.error('Seed error:', error);
    return errorResponse('Seed failed: ' + error.message, 500);
  }
}
