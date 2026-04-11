import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET expenses
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const where = {};
  if (user.role !== 'admin') where.employeeId = user.id;
  if (status) where.status = status;

  const expenses = await prisma.expense.findMany({
    where,
    include: { employee: { select: { name: true, department: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return jsonResponse({ expenses });
}

// POST create expense
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();

    const expense = await prisma.expense.create({
      data: {
        employeeId: user.id,
        type: data.type || 'fuel',
        amount: data.amount || 0,
        description: data.description || '',
        status: 'pending',
        note: data.note || '',
      },
    });

    return jsonResponse({ success: true, expense }, 201);
  } catch (error) {
    console.error('Create expense error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT update expense (admin approve/reject)
export async function PUT(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    if (!data.id) return errorResponse('Expense ID required');

    const updateData = {};
    if (data.status && user.role === 'admin') updateData.status = data.status;
    if (data.note !== undefined) updateData.note = data.note;

    const expense = await prisma.expense.update({
      where: { id: data.id },
      data: updateData,
    });

    return jsonResponse({ success: true, expense });
  } catch (error) {
    console.error('Update expense error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE expense
export async function DELETE(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errorResponse('Expense ID required');

  await prisma.expense.delete({ where: { id } });
  return jsonResponse({ success: true });
}
