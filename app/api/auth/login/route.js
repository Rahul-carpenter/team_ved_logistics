import { getDb } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, jsonResponse, errorResponse } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const db = await getDb();
    const employee = await db.collection('employees').findOne({ email });

    if (!employee || employee.status !== 'active') {
      return errorResponse('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, employee.password);
    if (!valid) {
      return errorResponse('Invalid email or password', 401);
    }

    const token = signToken({
      id: employee._id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      employeeRole: employee.employeeRole,
      department: employee.department,
    });

    return jsonResponse({
      success: true,
      token,
      user: {
        id: employee._id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        employeeRole: employee.employeeRole,
        department: employee.department,
        avatar: employee.avatar,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
