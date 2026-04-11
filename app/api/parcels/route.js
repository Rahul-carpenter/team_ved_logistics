import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET parcels
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const { searchParams } = new URL(request.url);
  const status = searchParams.get('status');
  const search = searchParams.get('search');

  const where = {};
  if (user.role !== 'admin') where.assignedRider = user.id;
  if (status) where.status = status;
  if (search) {
    where.OR = [
      { parcelId: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } },
    ];
  }

  const parcels = await prisma.parcel.findMany({
    where,
    include: { rider: { select: { name: true } } },
    orderBy: { createdAt: 'desc' },
  });

  return jsonResponse({ parcels });
}

// POST create parcel
export async function POST(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  try {
    const data = await request.json();
    if (!data.customerName || !data.pickupAddress || !data.deliveryAddress || !data.assignedRider) {
      return errorResponse('Missing required fields');
    }

    // Generate parcel ID
    const count = await prisma.parcel.count();
    const parcelId = `VL-${20000 + count + 1}`;

    const parcel = await prisma.parcel.create({
      data: {
        parcelId,
        customerName: data.customerName,
        pickupAddress: data.pickupAddress,
        deliveryAddress: data.deliveryAddress,
        parcelType: data.parcelType || 'Document',
        weight: data.weight || '0',
        assignedRider: data.assignedRider,
        status: 'assigned',
        note: data.note || '',
        statusHistory: [{ status: 'assigned', timestamp: new Date().toISOString() }],
      },
    });

    return jsonResponse({ success: true, parcel }, 201);
  } catch (error) {
    console.error('Create parcel error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// PUT update parcel
export async function PUT(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  try {
    const data = await request.json();
    if (!data.id) return errorResponse('Parcel ID required');

    const parcel = await prisma.parcel.findUnique({ where: { id: data.id } });
    if (!parcel) return errorResponse('Parcel not found', 404);

    const updateData = {};
    if (data.status) {
      updateData.status = data.status;
      const history = Array.isArray(parcel.statusHistory) ? parcel.statusHistory : [];
      history.push({ status: data.status, timestamp: new Date().toISOString() });
      updateData.statusHistory = history;
    }
    if (data.note !== undefined) updateData.note = data.note;
    if (data.assignedRider) updateData.assignedRider = data.assignedRider;

    const updated = await prisma.parcel.update({
      where: { id: data.id },
      data: updateData,
    });

    return jsonResponse({ success: true, parcel: updated });
  } catch (error) {
    console.error('Update parcel error:', error);
    return errorResponse('Internal server error', 500);
  }
}

// DELETE parcel
export async function DELETE(request) {
  const user = getUserFromRequest(request);
  if (!user || user.role !== 'admin') return errorResponse('Forbidden', 403);

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (!id) return errorResponse('Parcel ID required');

  await prisma.parcel.delete({ where: { id } });
  return jsonResponse({ success: true });
}
