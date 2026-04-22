import { getDb, genId } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const employeeId = searchParams.get('employeeId');
  const date = searchParams.get('date');

  const db = await getDb();
  const filter = {};
  if (user.role !== 'admin') filter.employeeId = user.id;
  else if (employeeId) filter.employeeId = employeeId;
  if (date) filter.date = date;

  const logs = await db.collection('daily_logs').aggregate([
    { $match: filter },
    { $sort: { date: -1 } },
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

  return jsonResponse({ logs });
}

export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    const today = new Date().toISOString().split('T')[0];
    const date = data.date || today;
    const now = new Date();

    const db = await getDb();

    // Upsert: update if exists, insert if not
    const result = await db.collection('daily_logs').findOneAndUpdate(
      { employeeId: user.id, date },
      {
        $set: {
          delivered: data.delivered ?? 0,
          pickedUp: data.pickedUp ?? 0,
          store: data.store ?? 0,
          note: data.note ?? '',
          updatedAt: now,
        },
        $setOnInsert: {
          _id: genId(),
          employeeId: user.id,
          date,
          createdAt: now,
        },
      },
      { upsert: true, returnDocument: 'after' }
    );

    const doc = result;
    const { _id, ...rest } = doc;
    return jsonResponse({ success: true, log: { id: _id, ...rest } });
  } catch (error) {
    console.error('Daily log error:', error);
    return errorResponse('Internal server error', 500);
  }
}
