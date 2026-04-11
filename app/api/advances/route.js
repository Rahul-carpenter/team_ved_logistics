import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const where = user.role !== 'admin' ? { employeeId: user.id } : {};

  const advances = await prisma.advance.findMany({
    where,
    include: { employee: { select: { name: true } } },
    orderBy: { requestDate: 'desc' },
  });

  return jsonResponse({ advances });
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    if (!data.amount || data.amount <= 0) return errorResponse('Valid amount required');

    const advance = await prisma.advance.create({
      data: {
        employeeId: user.id,
        amount: Number(data.amount),
        reason: data.reason || '',
        status: 'pending',
      }
    });

    return jsonResponse({ success: true, advance }, 201);
  } catch (error) {
    console.error('Advance request error:', error);
    return errorResponse('Internal server error', 500);
  }
}

export async function PUT(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  try {
    const data = await request.json();
    if (!data.id || !data.status) return errorResponse('ID and status required');

    const advance = await prisma.advance.update({
      where: { id: data.id },
      data: {
        status: data.status,
        approvedBy: data.status === 'approved' ? user.name : undefined,
        approvedDate: data.status === 'approved' ? new Date() : undefined,
      }
    });

    return jsonResponse({ success: true, advance });
  } catch (error) {
    console.error('Advance update error:', error);
    return errorResponse('Internal server error', 500);
  }
}
