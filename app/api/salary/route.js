import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET salary payments
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const employeeId = searchParams.get('employeeId');

  const where = {};
  if (user.role !== 'admin') where.employeeId = user.id;
  if (employeeId && user.role === 'admin') where.employeeId = employeeId;
  if (month) where.month = month;

  const payments = await prisma.salaryPayment.findMany({
    where,
    include: { employee: { select: { name: true, department: true, baseSalary: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return jsonResponse({ payments });
}

// POST create salary payment
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  try {
    const data = await request.json();
    if (!data.employeeId || !data.amount || !data.month) {
      return errorResponse('Employee, amount, and month are required');
    }

    const netAmount = Number(data.amount) - Number(data.deductions || 0);

    const payment = await prisma.salaryPayment.create({
      data: {
        employeeId: data.employeeId,
        amount: Number(data.amount),
        deductions: Number(data.deductions || 0),
        netAmount,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        month: data.month,
        note: data.note || '',
        paidBy: user.name,
      },
    });

    return jsonResponse({ success: true, payment }, 201);
  } catch (error) {
    console.error('Create payment error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE salary payment
export async function DELETE(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errorResponse('Payment ID required');

  await prisma.salaryPayment.delete({ where: { id } });
  return jsonResponse({ success: true });
}
