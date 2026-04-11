import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken, jsonResponse, errorResponse } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return errorResponse('Email and password are required');
    }

    const employee = await prisma.employee.findUnique({ where: { email } });

    if (!employee || employee.status !== 'active') {
      return errorResponse('Invalid email or password', 401);
    }

    const valid = await bcrypt.compare(password, employee.password);
    if (!valid) {
      return errorResponse('Invalid email or password', 401);
    }

    const token = signToken({
      id: employee.id,
      name: employee.name,
      email: employee.email,
      role: employee.role,
      employeeRole: employee.employeeRole,
      department: employee.department,
    });

    const response = jsonResponse({
      success: true,
      token,
      user: {
        id: employee.id,
        name: employee.name,
        email: employee.email,
        role: employee.role,
        employeeRole: employee.employeeRole,
        department: employee.department,
        avatar: employee.avatar,
      },
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return errorResponse('Internal server error', 500);
  }
}
