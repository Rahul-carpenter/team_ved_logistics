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

    // Auto-calculate deductions from approved advances
    const approvedAdvances = await prisma.advance.findMany({
      where: { employeeId: data.employeeId, status: 'approved' }
    });
    
    // Sum the approved advances
    const autoDeductions = approvedAdvances.reduce((sum, adv) => sum + adv.amount, 0);
    const totalDeductions = autoDeductions + Number(data.deductions || 0); // User can add manual extra deductions if needed
    const netAmount = Number(data.amount) - totalDeductions;

    const payment = await prisma.salaryPayment.create({
      data: {
        employeeId: data.employeeId,
        amount: Number(data.amount),
        deductions: totalDeductions,
        netAmount,
        paymentDate: data.paymentDate || new Date().toISOString().split('T')[0],
        month: data.month,
        note: (data.note || '') + (autoDeductions > 0 ? ` [Auto-deducted ${autoDeductions} for approved advances]` : ''),
        paidBy: user.name,
      },
    });

    // Mark the auto-deducted advances as 'deducted' so they aren't deducted again next month
    if (autoDeductions > 0) {
      await prisma.advance.updateMany({
        where: { id: { in: approvedAdvances.map(a => a.id) } },
        data: { status: 'deducted' }
      });
    }

    return jsonResponse({ success: true, payment, deductedAdvances: approvedAdvances.length }, 201);
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
