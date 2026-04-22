import { getDb, genId } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const db = await getDb();
  const filter = user.role !== 'admin' ? { employeeId: user.id } : {};

  const advances = await db.collection('advances').aggregate([
    { $match: filter },
    { $sort: { requestDate: -1 } },
    { $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1 } }],
        as: 'employeeArr',
    }},
    { $addFields: {
        id: '$_id',
        employee: { $arrayElemAt: ['$employeeArr', 0] },
    }},
    { $project: { employeeArr: 0, _id: 0 } },
  ]).toArray();

  return jsonResponse({ advances });
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    if (!data.amount || data.amount <= 0) return errorResponse('Valid amount required');

    const now = new Date();
    const db = await getDb();

    const advance = {
      _id: genId(),
      employeeId: user.id,
      amount: Number(data.amount),
      reason: data.reason || '',
      status: 'pending',
      requestDate: now,
      approvedDate: null,
      approvedBy: '',
      note: '',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('advances').insertOne(advance);

    const { _id, ...rest } = advance;
    return jsonResponse({ success: true, advance: { id: _id, ...rest } }, 201);
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

    const db = await getDb();
    const updateFields = {
      status: data.status,
      updatedAt: new Date(),
    };
    if (data.status === 'approved') {
      updateFields.approvedBy = user.name;
      updateFields.approvedDate = new Date();
    }

    await db.collection('advances').updateOne(
      { _id: data.id },
      { $set: updateFields }
    );

    const advance = await db.collection('advances').findOne({ _id: data.id });
    const { _id, ...rest } = advance;
    return jsonResponse({ success: true, advance: { id: _id, ...rest } });
  } catch (error) {
    console.error('Advance update error:', error);
    return errorResponse('Internal server error', 500);
  }
}
