import prisma from '@/lib/db';
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

    const existing = await prisma.employee.findUnique({ where: { email } });
    if (existing) {
      return errorResponse('Email already registered');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const employee = await prisma.employee.create({
      data: {
        name,
        email,
        password: hashedPassword,
        phone: phone || '',
        department: department || 'General',
        role: 'employee',
        employeeRole: 'normal',
        baseSalary: 0,
        joinDate: new Date().toISOString().split('T')[0],
        status: 'active',
      },
    });

    return jsonResponse({
      success: true,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
      },
    }, 201);
  } catch (error) {
    console.error('Register error:', error);
    return errorResponse('Internal server error', 500);
  }
}
