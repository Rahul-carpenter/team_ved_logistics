import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET attendance records
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const employeeId = searchParams.get('employeeId');
  const month = searchParams.get('month');

  const where = {};
  if (user.role !== 'admin') where.employeeId = user.id;
  if (employeeId && user.role === 'admin') where.employeeId = employeeId;
  if (date) where.date = date;
  if (month) where.date = { startsWith: month };

  const records = await prisma.attendance.findMany({
    where,
    include: { employee: { select: { name: true, department: true, employeeRole: true } } },
    orderBy: { checkIn: 'desc' },
  });

  return jsonResponse({ attendance: records });
}

// POST check-in
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    const today = new Date().toISOString().split('T')[0];
    const employeeId = user.role === 'admin' && data.employeeId ? data.employeeId : user.id;

    // Check if already checked in today
    const existing = await prisma.attendance.findFirst({
      where: { employeeId, date: today },
    });
    if (existing) return errorResponse('Already checked in today');

    const record = await prisma.attendance.create({
      data: {
        employeeId,
        date: today,
        checkIn: new Date(),
        location: data.location || 'Office',
        note: data.note || '',
      },
    });

    return jsonResponse({ success: true, attendance: record }, 201);
  } catch (error) {
    console.error('Check-in error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT check-out or update
export async function PUT(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();

    if (data.checkOut) {
      // Check-out: find today's record
      const today = new Date().toISOString().split('T')[0];
      const employeeId = user.role === 'admin' && data.employeeId ? data.employeeId : user.id;

      const record = await prisma.attendance.findFirst({
        where: { employeeId, date: today, checkOut: null },
      });
      if (!record) return errorResponse('No active check-in found');

      const updated = await prisma.attendance.update({
        where: { id: record.id },
        data: { checkOut: new Date() },
      });
      return jsonResponse({ success: true, attendance: updated });
    }

    if (data.id) {
      const updated = await prisma.attendance.update({
        where: { id: data.id },
        data: { note: data.note || '' },
      });
      return jsonResponse({ success: true, attendance: updated });
    }

    return errorResponse('Invalid request');
  } catch (error) {
    console.error('Attendance update error:', error);
    return errorResponse('Internal server error', 500);
  }
}
