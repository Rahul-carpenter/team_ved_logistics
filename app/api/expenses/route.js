import { getDb, genId } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET expenses
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');

  const db = await getDb();
  const filter = {};
  if (user.role !== 'admin') filter.employeeId = user.id;
  if (status) filter.status = status;

  const expenses = await db.collection('expenses').aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, department: 1 } }],
        as: 'employeeArr',
    }},
    { $addFields: {
        id: '$_id',
        employee: { $arrayElemAt: ['$employeeArr', 0] },
    }},
    { $project: { employeeArr: 0, _id: 0 } },
  ]).toArray();

  return jsonResponse({ expenses });
}

// POST create expense
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    const now = new Date();
    const db = await getDb();

    const expense = {
      _id: genId(),
      employeeId: user.id,
      type: data.type || 'fuel',
      amount: data.amount || 0,
      description: data.description || '',
      receiptImage: null, // Don't store base64 receipts to save space
      status: 'pending',
      requestDate: now,
      note: data.note || '',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('expenses').insertOne(expense);

    const { _id, ...rest } = expense;
    return jsonResponse({ success: true, expense: { id: _id, ...rest } }, 201);
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

    const db = await getDb();
    const updateData = { updatedAt: new Date() };
    if (data.status && user.role === 'admin') updateData.status = data.status;
    if (data.note !== undefined) updateData.note = data.note;

    await db.collection('expenses').updateOne(
      { _id: data.id },
      { $set: updateData }
    );

    return jsonResponse({ success: true });
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

  const db = await getDb();
  await db.collection('expenses').deleteOne({ _id: id });
  return jsonResponse({ success: true });
}
