import { getDb, genId } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET all employees
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const role = searchParams.get('role');
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const db = await getDb();
  const filter = {};
  if (role) filter.employeeRole = role;
  if (status) filter.status = status;
  if (search) {
    const regex = { $regex: search, $options: 'i' };
    filter.$or = [
      { name: regex },
      { email: regex },
      { department: regex },
    ];
  }

  const employees = await db.collection('employees').find(filter, {
    projection: {
      password: 0, // Never send password
    },
  }).sort({ createdAt: -1 }).toArray();

  // Map _id to id
  const mapped = employees.map(({ _id, ...rest }) => ({ id: _id, ...rest }));

  return jsonResponse({ employees: mapped });
}

// POST create employee
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  try {
    const data = await request.json();
    if (!data.name || !data.email || !data.password) {
      return errorResponse('Name, email and password are required');
    }

    const db = await getDb();
    const existing = await db.collection('employees').findOne({ email: data.email });
    if (existing) return errorResponse('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const now = new Date();

    const employee = {
      _id: genId(),
      name: data.name,
      email: data.email,
      password: hashedPassword,
      phone: data.phone || '',
      department: data.department || 'General',
      role: data.role || 'employee',
      employeeRole: data.employeeRole || 'normal',
      baseSalary: data.baseSalary || 0,
      joinDate: data.joinDate || now.toISOString().split('T')[0],
      status: data.status || 'active',
      avatar: '',
      bikeNumber: data.bikeNumber || '',
      notes: data.notes || '',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('employees').insertOne(employee);

    const { password: _, _id, ...rest } = employee;
    return jsonResponse({ success: true, employee: { id: _id, ...rest } }, 201);
  } catch (error) {
    console.error('Create employee error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT update employee
export async function PUT(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  try {
    const data = await request.json();
    if (!data.id) return errorResponse('Employee ID required');

    const db = await getDb();
    const updateData = { updatedAt: new Date() };
    const allowedFields = ['name', 'email', 'phone', 'department', 'role', 'employeeRole', 'baseSalary', 'joinDate', 'status', 'bikeNumber', 'notes', 'avatar'];
    allowedFields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    await db.collection('employees').updateOne(
      { _id: data.id },
      { $set: updateData }
    );

    const employee = await db.collection('employees').findOne(
      { _id: data.id },
      { projection: { password: 0 } }
    );

    const { _id, ...rest } = employee;
    return jsonResponse({ success: true, employee: { id: _id, ...rest } });
  } catch (error) {
    console.error('Update employee error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE employee (cascade manual delete related docs)
export async function DELETE(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errorResponse('Employee ID required');

  const db = await getDb();

  // Cascade delete all related records
  await Promise.all([
    db.collection('attendance').deleteMany({ employeeId: id }),
    db.collection('daily_logs').deleteMany({ employeeId: id }),
    db.collection('rides').deleteMany({ riderId: id }),
    db.collection('advances').deleteMany({ employeeId: id }),
    db.collection('expenses').deleteMany({ employeeId: id }),
    db.collection('salary_payments').deleteMany({ employeeId: id }),
    db.collection('employees').deleteOne({ _id: id }),
  ]);

  return jsonResponse({ success: true });
}
