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

// POST create ride
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();

    const ride = await prisma.ride.create({
      data: {
        riderId: user.id,
        date: data.date || new Date().toISOString().split('T')[0],
        startKm: data.startKm || 0,
        endKm: data.endKm || 0,
        distance: (data.endKm || 0) - (data.startKm || 0),
        fuelCost: data.fuelCost || 0,
        status: data.status || 'completed',
        note: data.note || '',
      },
    });

    return jsonResponse({ success: true, ride }, 201);
  } catch (error) {
    console.error('Create ride error:', error);
    return errorResponse('Internal server error', 500);
  }
}
