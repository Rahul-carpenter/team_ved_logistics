import { getDb, genId } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';
import { uploadToGoogleDrive } from '@/lib/google-drive';

// GET rides
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const db = await getDb();
  const filter = {};
  if (user.role !== 'admin') filter.riderId = user.id;

  let rides = await db.collection('rides').aggregate([
    { $match: filter },
    { $sort: { createdAt: -1 } },
    { $limit: 100 },
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

  // Prevent 413 Payload Too Large by wiping out massive legacy base64 strings
  rides = rides.map(r => {
    if (r.startPhoto && r.startPhoto.length > 100000) r.startPhoto = null;
    if (r.endPhoto && r.endPhoto.length > 100000) r.endPhoto = null;
    return r;
  });

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

    // Get employee info for naming files
    const employee = await db.collection('employees').findOne(
      { _id: user.id },
      { projection: { name: 1 } }
    );
    const riderName = employee?.name || 'Unknown';
    const timeStr = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).replace(/[:\s]/g, '-');

    if (data.id) {
      // Complete existing ride
      const ride = await db.collection('rides').findOne({ _id: data.id });
      if (!ride || (ride.riderId !== user.id && user.role !== 'admin')) {
        return errorResponse('Forbidden', 403);
      }

      const distance = data.endKm ? (data.endKm - ride.startKm) : 0;

      // Upload end photo to Google Drive
      let endPhoto = null;
      let endPhotoMeta = null;
      if (data.endPhoto) {
        const fileName = `END_${riderName}_${today}_${timeStr}_${data.endKm}km.jpg`;
        const driveResult = await uploadToGoogleDrive(data.endPhoto, fileName);
        if (driveResult) {
          endPhoto = driveResult.directLink;
          endPhotoMeta = {
            fileId: driveResult.fileId,
            viewLink: driveResult.webViewLink,
            thumbnailLink: driveResult.thumbnailLink,
          };
        } else {
          return errorResponse('Google Drive upload failed. Please try again.', 500);
        }
      }

      await db.collection('rides').updateOne(
        { _id: data.id },
        { $set: {
          endKm: data.endKm,
          distance: distance > 0 ? distance : 0,
          endPhoto,
          endPhotoMeta,
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

    // Upload start photo to Google Drive
    let startPhoto = null;
    let startPhotoMeta = null;
    if (data.startPhoto) {
      const fileName = `START_${riderName}_${today}_${timeStr}_${data.startKm}km.jpg`;
      const driveResult = await uploadToGoogleDrive(data.startPhoto, fileName);
      if (driveResult) {
        startPhoto = driveResult.directLink;
        startPhotoMeta = {
          fileId: driveResult.fileId,
          viewLink: driveResult.webViewLink,
          thumbnailLink: driveResult.thumbnailLink,
        };
      } else {
        return errorResponse('Google Drive upload failed. Please try again.', 500);
      }
    }

    const ride = {
      _id: genId(),
      riderId: user.id,
      date: today,
      startKm: data.startKm || 0,
      endKm: 0,
      distance: 0,
      startPhoto,
      startPhotoMeta,
      endPhoto: null,
      endPhotoMeta: null,
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
