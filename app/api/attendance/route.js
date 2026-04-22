import { getDb, genId } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET attendance records
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const date = searchParams.get('date');
  const employeeId = searchParams.get('employeeId');
  const month = searchParams.get('month');

  const db = await getDb();
  const filter = {};
  if (user.role !== 'admin') filter.employeeId = user.id;
  if (employeeId && user.role === 'admin') filter.employeeId = employeeId;
  if (date) filter.date = date;
  if (month) filter.date = { $regex: `^${month}` };

  // Aggregate with employee lookup for name
  const records = await db.collection('attendance').aggregate([
    { $match: filter },
    { $sort: { checkIn: -1 } },
    { $lookup: {
        from: 'employees',
        localField: 'employeeId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, department: 1, employeeRole: 1 } }],
        as: 'employeeArr',
    }},
    { $addFields: {
        id: '$_id',
        employee: { $arrayElemAt: ['$employeeArr', 0] },
    }},
    { $project: { employeeArr: 0, _id: 0 } },
  ]).toArray();

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

    const db = await getDb();

    // Check if already checked in today
    const existing = await db.collection('attendance').findOne({ employeeId, date: today });
    if (existing) return errorResponse('Already checked in today');

    const now = new Date();
    const record = {
      _id: genId(),
      employeeId,
      date: today,
      checkIn: now,
      checkOut: null,
      location: data.location || 'Office',
      note: data.note || '',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('attendance').insertOne(record);

    const { _id, ...rest } = record;
    return jsonResponse({ success: true, attendance: { id: _id, ...rest } }, 201);
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
    const db = await getDb();

    if (data.checkOut) {
      const today = new Date().toISOString().split('T')[0];
      const employeeId = user.role === 'admin' && data.employeeId ? data.employeeId : user.id;

      const record = await db.collection('attendance').findOne({
        employeeId, date: today, checkOut: null,
      });
      if (!record) return errorResponse('No active check-in found');

      await db.collection('attendance').updateOne(
        { _id: record._id },
        { $set: { checkOut: new Date(), updatedAt: new Date() } }
      );

      return jsonResponse({ success: true, attendance: { id: record._id, ...record, checkOut: new Date() } });
    }

    if (data.id) {
      await db.collection('attendance').updateOne(
        { _id: data.id },
        { $set: { note: data.note || '', updatedAt: new Date() } }
      );
      return jsonResponse({ success: true });
    }

    return errorResponse('Invalid request');
  } catch (error) {
    console.error('Attendance update error:', error);
    return errorResponse('Internal server error', 500);
  }
}
