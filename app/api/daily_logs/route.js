import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');

  const where = {};
  if (user.role !== 'admin') where.employeeId = user.id;
  else if (employeeId) where.employeeId = employeeId;
  
  if (date) where.date = date;

  const logs = await prisma.dailyLog.findMany({
    where,
    include: { employee: { select: { name: true } } },
    orderBy: { date: 'desc' },
  });

  return jsonResponse({ logs });
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    const today = new Date().toISOString().split('T')[0];

    const log = await prisma.dailyLog.upsert({
      where: {
        employeeId_date: { employeeId: user.id, date: data.date || today }
      },
      update: {
        delivered: data.delivered,
        pickedUp: data.pickedUp,
        store: data.store,
        note: data.note,
      },
      create: {
        employeeId: user.id,
        date: data.date || today,
        delivered: data.delivered || 0,
        pickedUp: data.pickedUp || 0,
        store: data.store || 0,
        note: data.note || '',
      }
    });

    return jsonResponse({ success: true, log });
  } catch (error) {
    console.error('Daily log error:', error);
    return errorResponse('Internal server error', 500);
  }
}
