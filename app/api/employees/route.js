import prisma from '@/lib/db';
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

  const where = {};
  if (role) where.employeeRole = role;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { department: { contains: search, mode: 'insensitive' } },
    ];
  }

  const employees = await prisma.employee.findMany({
    where,
    select: {
      id: true, name: true, email: true, phone: true,
      department: true, role: true, employeeRole: true,
      baseSalary: true, joinDate: true, status: true,
      avatar: true, bikeNumber: true, notes: true,
      createdAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return jsonResponse({ employees });
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

    const existing = await prisma.employee.findUnique({ where: { email: data.email } });
    if (existing) return errorResponse('Email already registered');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const employee = await prisma.employee.create({
      data: {
        name: data.name,
        email: data.email,
        password: hashedPassword,
        phone: data.phone || '',
        department: data.department || 'General',
        role: data.role || 'employee',
        employeeRole: data.employeeRole || 'normal',
        baseSalary: data.baseSalary || 0,
        joinDate: data.joinDate || new Date().toISOString().split('T')[0],
        status: data.status || 'active',
        bikeNumber: data.bikeNumber || '',
        notes: data.notes || '',
      },
    });

    return jsonResponse({ success: true, employee: { ...employee, password: undefined } }, 201);
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

    const updateData = {};
    const allowedFields = ['name', 'email', 'phone', 'department', 'role', 'employeeRole', 'baseSalary', 'joinDate', 'status', 'bikeNumber', 'notes', 'avatar'];
    allowedFields.forEach(f => { if (data[f] !== undefined) updateData[f] = data[f]; });

    if (data.password) {
      updateData.password = await bcrypt.hash(data.password, 10);
    }

    const employee = await prisma.employee.update({
      where: { id: data.id },
      data: updateData,
    });

    return jsonResponse({ success: true, employee: { ...employee, password: undefined } });
  } catch (error) {
    console.error('Update employee error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE employee
export async function DELETE(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errorResponse('Employee ID required');

  await prisma.employee.delete({ where: { id } });
  return jsonResponse({ success: true });
}
