import { getDb, genId } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET salary payments
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const month = searchParams.get('month');
  const employeeId = searchParams.get('employeeId');

  const db = await getDb();
  const filter = {};
  if (user.role !== 'admin') filter.employeeId = user.id;
  if (employeeId && user.role === 'admin') filter.employeeId = employeeId;
  if (month) filter.month = month;

  const payments = await db.collection('salary_payments').aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, department: 1, baseSalary: 1 } }],
        as: 'employeeArr',
    }},
    { $addFields: {
        id: '$_id',
        employee: { $arrayElemAt: ['$employeeArr', 0] },
    }},
    { $project: { employeeArr: 0, _id: 0 } },
  ]).toArray();

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

    const db = await getDb();

    // Auto-calculate deductions from approved advances
    const approvedAdvances = await db.collection('advances').find({
      employeeId: data.employeeId,
      status: 'approved',
    }).toArray();

    const autoDeductions = approvedAdvances.reduce((sum, adv) => sum + adv.amount, 0);
    const totalDeductions = autoDeductions + Number(data.deductions || 0);
    const netAmount = Number(data.amount) - totalDeductions;
    const now = new Date();

    const payment = {
      _id: genId(),
      employeeId: data.employeeId,
      amount: Number(data.amount),
      deductions: totalDeductions,
      netAmount,
      paymentDate: data.paymentDate || now.toISOString().split('T')[0],
      month: data.month,
      note: (data.note || '') + (autoDeductions > 0 ? ` [Auto-deducted ${autoDeductions} for approved advances]` : ''),
      paidBy: user.name,
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('salary_payments').insertOne(payment);

    // Mark advances as deducted
    if (autoDeductions > 0) {
      const ids = approvedAdvances.map(a => a._id);
      await db.collection('advances').updateMany(
        { _id: { $in: ids } },
        { $set: { status: 'deducted', updatedAt: now } }
      );
    }

    const { _id, ...rest } = payment;
    return jsonResponse({ success: true, payment: { id: _id, ...rest }, deductedAdvances: approvedAdvances.length }, 201);
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

  const db = await getDb();
  await db.collection('salary_payments').deleteOne({ _id: id });
  return jsonResponse({ success: true });
}
