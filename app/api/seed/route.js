import { getDb, genId } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { jsonResponse, errorResponse } from '@/lib/auth';
import { ensureIndexes } from '@/lib/db-setup';

export async function POST() {
  try {
    const db = await getDb();

    // Create indexes first
    await ensureIndexes(db);

    // Check if already seeded
    const adminExists = await db.collection('employees').findOne({ role: 'admin' });
    if (adminExists) {
      return jsonResponse({ message: 'Database already seeded', seeded: false });
    }

    const hash = (pw) => bcrypt.hashSync(pw, 10);
    const now = new Date();

    // Create employees
    const employeesData = [
      { _id: genId(), name: 'Rahul Sharma', email: 'admin@vedlogistics.com', password: hash('admin123'), phone: '9876543210', department: 'Management', role: 'admin', employeeRole: 'admin', baseSalary: 80000, joinDate: '2024-01-15', status: 'active', avatar: '', bikeNumber: '', notes: 'Company owner and primary admin', createdAt: now, updatedAt: now },
      { _id: genId(), name: 'Arjun Patel', email: 'arjun@vedlogistics.com', password: hash('emp123'), phone: '9876543211', department: 'Operations', role: 'employee', employeeRole: 'normal', baseSalary: 25000, joinDate: '2024-03-10', status: 'active', avatar: '', bikeNumber: '', notes: 'Handles warehouse operations', createdAt: now, updatedAt: now },
      { _id: genId(), name: 'Priya Singh', email: 'priya@vedlogistics.com', password: hash('emp123'), phone: '9876543212', department: 'HR', role: 'employee', employeeRole: 'normal', baseSalary: 28000, joinDate: '2024-02-20', status: 'active', avatar: '', bikeNumber: '', notes: 'HR manager', createdAt: now, updatedAt: now },
      { _id: genId(), name: 'Vikram Reddy', email: 'vikram@vedlogistics.com', password: hash('emp123'), phone: '9876543213', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2024-04-05', status: 'active', avatar: '', bikeNumber: 'RJ-14-AB-1234', notes: 'Senior rider', createdAt: now, updatedAt: now },
      { _id: genId(), name: 'Rohit Kumar', email: 'rohit@vedlogistics.com', password: hash('emp123'), phone: '9876543214', department: 'Dispatch', role: 'employee', employeeRole: 'rider', baseSalary: 22000, joinDate: '2024-05-12', status: 'active', avatar: '', bikeNumber: 'RJ-14-CD-5678', notes: 'Jaipur-Jodhpur route', createdAt: now, updatedAt: now },
    ];

    await db.collection('employees').insertMany(employeesData);

    const nonAdmins = employeesData.filter(e => e.role !== 'admin');
    const riders = employeesData.filter(e => e.employeeRole === 'rider');
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];

    // Daily Logs — use insertMany for speed
    const dailyLogsDocs = [];
    for (const emp of nonAdmins) {
      dailyLogsDocs.push({
        _id: genId(),
        employeeId: emp._id,
        date: today,
        delivered: Math.floor(Math.random() * 20),
        pickedUp: Math.floor(Math.random() * 15),
        store: Math.floor(Math.random() * 50),
        note: 'Regular day',
        createdAt: now,
        updatedAt: now,
      });
      dailyLogsDocs.push({
        _id: genId(),
        employeeId: emp._id,
        date: yesterday,
        delivered: Math.floor(Math.random() * 25),
        pickedUp: Math.floor(Math.random() * 10),
        store: Math.floor(Math.random() * 45),
        note: '',
        createdAt: now,
        updatedAt: now,
      });
    }
    await db.collection('daily_logs').insertMany(dailyLogsDocs);

    // Rides — no base64 photos in seed; just placeholders to save space
    const rideDocs = riders.map(rider => ({
      _id: genId(),
      riderId: rider._id,
      date: today,
      startKm: 12050,
      endKm: 12110,
      distance: 60,
      startPhoto: null,
      endPhoto: null,
      fuelCost: 150,
      status: 'completed',
      note: '',
      createdAt: now,
      updatedAt: now,
    }));
    await db.collection('rides').insertMany(rideDocs);

    // Advances
    await db.collection('advances').insertMany([
      {
        _id: genId(),
        employeeId: nonAdmins[0]._id,
        amount: 5000,
        reason: 'Medical emergency',
        status: 'pending',
        requestDate: now,
        approvedDate: null,
        approvedBy: '',
        note: '',
        createdAt: now,
        updatedAt: now,
      },
      {
        _id: genId(),
        employeeId: nonAdmins[1]._id,
        amount: 2000,
        reason: 'Festive advance',
        status: 'approved',
        requestDate: now,
        approvedDate: now,
        approvedBy: 'Rahul Sharma',
        note: '',
        createdAt: now,
        updatedAt: now,
      },
    ]);

    // Salary Payments
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    const lastMonthStr = lastMonth.toISOString().slice(0, 7);

    const salaryDocs = nonAdmins.map(emp => ({
      _id: genId(),
      employeeId: emp._id,
      amount: emp.baseSalary,
      deductions: 2000,
      netAmount: emp.baseSalary - 2000,
      paymentDate: lastMonthStr + '-28',
      month: lastMonthStr,
      note: 'Monthly salary (Deducted 2000 for past advance)',
      paidBy: 'Rahul Sharma',
      createdAt: now,
      updatedAt: now,
    }));
    await db.collection('salary_payments').insertMany(salaryDocs);

    // Settings
    const settingsDocs = [
      { _id: genId(), key: 'companyName', value: 'Ved Logistics' },
      { _id: genId(), key: 'currency', value: '₹' },
      { _id: genId(), key: 'allowPhotoUploads', value: 'true' },
    ];
    for (const s of settingsDocs) {
      await db.collection('settings').updateOne(
        { key: s.key },
        { $set: { value: s.value }, $setOnInsert: { _id: s._id, key: s.key } },
        { upsert: true }
      );
    }

    return jsonResponse({ message: 'Database seeded successfully!', seeded: true });
  } catch (error) {
    console.error('Seed error:', error);
    return errorResponse('Seed failed: ' + error.message, 500);
  }
}
