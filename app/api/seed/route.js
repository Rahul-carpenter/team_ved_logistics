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
    ]);

    const nonAdmins = employees.filter(e => e.role !== 'admin');
    const riders = employees.filter(e => e.employeeRole === 'rider');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Daily Logs
    for (const emp of nonAdmins) {
      await prisma.dailyLog.create({
        data: {
          employeeId: emp.id,
          date: today,
          delivered: Math.floor(Math.random() * 20),
          pickedUp: Math.floor(Math.random() * 15),
          store: Math.floor(Math.random() * 50),
          note: 'Regular day'
        }
      });
      await prisma.dailyLog.create({
        data: {
          employeeId: emp.id,
          date: yesterday,
          delivered: Math.floor(Math.random() * 25),
          pickedUp: Math.floor(Math.random() * 10),
          store: Math.floor(Math.random() * 45),
        }
      });
    }

    // Rides (with dummy photo URLs/base64 strings if we had them; using simple strings for demo)
    for (const rider of riders) {
      await prisma.ride.create({
        data: {
          riderId: rider.id,
          date: today,
          startKm: 12050,
          endKm: 12110,
          distance: 60,
          startPhoto: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==', // 1x1 transparent gif
          endPhoto: 'data:image/gif;base64,R0lGODlhAQABAIAAAP///wAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw==',
          fuelCost: 150,
          status: 'completed',
        }
      });
    }

    // Advances
    await prisma.advance.create({
      data: {
        employeeId: nonAdmins[0].id,
        amount: 5000,
        reason: 'Medical emergency',
        status: 'pending',
      }
    });
    await prisma.advance.create({
      data: {
        employeeId: nonAdmins[1].id,
        amount: 2000,
        reason: 'Festive advance',
        status: 'approved',
        approvedBy: 'Rahul Sharma',
        approvedDate: new Date(),
      }
    });

    // Salary Payments with Deductions
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);
    for (const emp of nonAdmins) {
      await prisma.salaryPayment.create({
        data: {
          employeeId: emp.id, 
          amount: emp.baseSalary,
          deductions: 2000,
          netAmount: emp.baseSalary - 2000,
          paymentDate: lastMonthStr + '-28', 
          month: lastMonthStr,
          note: 'Monthly salary (Deducted 2000 for past advance)', 
          paidBy: 'Rahul Sharma',
        },
      });
    }

    // Settings
    const defaults = [
      ['companyName', 'Ved Logistics'],
      ['currency', '₹'],
      ['allowPhotoUploads', 'true']
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
