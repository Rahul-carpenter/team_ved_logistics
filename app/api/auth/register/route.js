import { getDb, genId } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { jsonResponse, errorResponse } from '@/lib/auth';

export async function POST(request) {
  try {
    const { name, email, password, department, phone } = await request.json();

    if (!name || !email || !password) {
      return errorResponse('Name, email and password are required');
    }

    if (password.length < 4) {
      return errorResponse('Password must be at least 4 characters');
    }

    const db = await getDb();
    const existing = await db.collection('employees').findOne({ email });
    if (existing) {
      return errorResponse('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const now = new Date();

    const employee = {
      _id: genId(),
      name,
      email,
      password: hashedPassword,
      phone: phone || '',
      department: department || 'General',
      role: 'employee',
      employeeRole: 'normal',
      baseSalary: 0,
      joinDate: now.toISOString().split('T')[0],
      status: 'active',
      avatar: '',
      bikeNumber: '',
      notes: '',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('employees').insertOne(employee);

    return jsonResponse({
      success: true,
      user: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
      },
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Internal server error', 500);
  }
}
