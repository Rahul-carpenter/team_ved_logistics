import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET rides
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const where = {};
  if (user.role !== 'admin') where.riderId = user.id;

  const rides = await prisma.ride.findMany({
    where,
    include: { rider: { select: { name: true, bikeNumber: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return jsonResponse({ rides });
}

// POST create or update ride (with photos)
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    const today = new Date().toISOString().split('T')[0];

    if (data.id) {
      // Complete existing ride
      const ride = await prisma.ride.findUnique({ where: { id: data.id } });
      if (!ride || (ride.riderId !== user.id && user.role !== 'admin')) {
        return errorResponse('Forbidden', 403);
      }
      
      const distance = data.endKm ? (data.endKm - ride.startKm) : 0;
      
      const updated = await prisma.ride.update({
        where: { id: data.id },
        data: {
          endKm: data.endKm,
          distance: distance > 0 ? distance : 0,
          endPhoto: data.endPhoto, // base64
          status: 'completed',
        }
      });
      return jsonResponse({ success: true, ride: updated });
    }

    // Start new ride
    const existing = await prisma.ride.findFirst({
      where: { riderId: user.id, date: today, status: 'started' }
    });
    
    if (existing) {
      return errorResponse('You already have a started ride today');
    }

    const ride = await prisma.ride.create({
      data: {
        riderId: user.id,
        date: today,
        startKm: data.startKm || 0,
        startPhoto: data.startPhoto, // base64
        status: 'started',
      },
    });

    return jsonResponse({ success: true, ride }, 201);
  } catch (error) {
    console.error('Ride error:', error);
    return errorResponse('Internal server error', 500);
  }
}
