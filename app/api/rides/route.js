import { getDb, genId } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET rides
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const db = await getDb();
  const filter = {};
  if (user.role !== 'admin') filter.riderId = user.id;

  const rides = await db.collection('rides').aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $lookup: {
        from: 'employees',
        localField: 'riderId',
        foreignField: '_id',
        pipeline: [{ $project: { name: 1, bikeNumber: 1 } }],
        as: 'riderArr',
    }},
    { $addFields: {
        id: '$_id',
        rider: { $arrayElemAt: ['$riderArr', 0] },
    }},
    { $project: { riderArr: 0, _id: 0 } },
  ]).toArray();

  return jsonResponse({ rides });
}

// POST create or complete ride
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    const today = new Date().toISOString().split('T')[0];
    const now = new Date();
    const db = await getDb();

    if (data.id) {
      // Complete existing ride
      const ride = await db.collection('rides').findOne({ _id: data.id });
      if (!ride || (ride.riderId !== user.id && user.role !== 'admin')) {
        return errorResponse('Forbidden', 403);
      }

      const distance = data.endKm ? (data.endKm - ride.startKm) : 0;

      // Limit endPhoto size: strip if > 200KB to save MongoDB space
      let endPhoto = data.endPhoto || null;
      if (endPhoto && endPhoto.length > 200000) {
        endPhoto = endPhoto.substring(0, 200000); // Truncate to ~200KB
      }

      await db.collection('rides').updateOne(
        { _id: data.id },
        { $set: {
          endKm: data.endKm,
          distance: distance > 0 ? distance : 0,
          endPhoto,
          status: 'completed',
          updatedAt: now,
        }}
      );

      const updated = await db.collection('rides').findOne({ _id: data.id });
      const { _id, ...rest } = updated;
      return jsonResponse({ success: true, ride: { id: _id, ...rest } });
    }

    // Start new ride
    const existing = await db.collection('rides').findOne({
      riderId: user.id, date: today, status: 'started',
    });
    if (existing) {
      return errorResponse('You already have a started ride today');
    }

    // Limit startPhoto size
    let startPhoto = data.startPhoto || null;
    if (startPhoto && startPhoto.length > 200000) {
      startPhoto = startPhoto.substring(0, 200000);
    }

    const ride = {
      _id: genId(),
      riderId: user.id,
      date: today,
      startKm: data.startKm || 0,
      endKm: 0,
      distance: 0,
      startPhoto,
      endPhoto: null,
      fuelCost: 0,
      status: 'started',
      note: '',
      createdAt: now,
      updatedAt: now,
    };

    await db.collection('rides').insertOne(ride);

    const { _id, ...rest } = ride;
    return jsonResponse({ success: true, ride: { id: _id, ...rest } }, 201);
  } catch (error) {
    console.error('Ride error:', error);
    return errorResponse('Internal server error', 500);
  }
}
