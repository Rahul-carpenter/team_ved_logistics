import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

// GET dashboard stats
export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  if (user.role === 'admin') {
    const [
      totalEmployees, totalRiders, todayAttendance,
      totalParcels, deliveredToday, pendingParcels,
      pendingExpenses, monthPayments,
    ] = await Promise.all([
      prisma.employee.count({ where: { role: { not: 'admin' }, status: 'active' } }),
      prisma.employee.count({ where: { employeeRole: 'rider', status: 'active' } }),
      prisma.attendance.count({ where: { date: today } }),
      prisma.parcel.count(),
      prisma.parcel.count({ where: { status: 'delivered', updatedAt: { gte: new Date(today) } } }),
      prisma.parcel.count({ where: { status: { not: 'delivered' } } }),
      prisma.expense.count({ where: { status: 'pending' } }),
      prisma.salaryPayment.findMany({ where: { month: thisMonth } }),
    ]);

    const totalPaidMonth = monthPayments.reduce((s, p) => s + p.amount, 0);

    // Recent parcels
    const recentParcels = await prisma.parcel.findMany({
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { rider: { select: { name: true } } },
    });

    // Today attendance list
    const todayAttList = await prisma.attendance.findMany({
      where: { date: today },
      take: 5,
      include: { employee: { select: { name: true } } },
      orderBy: { checkIn: 'desc' },
    });

    return jsonResponse({
      stats: {
        totalEmployees, totalRiders, todayAttendance,
        totalParcels, deliveredToday, pendingParcels,
        pendingExpenses, totalPaidMonth,
      },
      recentParcels,
      todayAttendance: todayAttList,
    });
  }

  // Employee dashboard
  const todayAtt = await prisma.attendance.findFirst({
    where: { employeeId: user.id, date: today },
  });
  const employee = await prisma.employee.findUnique({
    where: { id: user.id },
    select: { baseSalary: true, department: true, employeeRole: true, joinDate: true, bikeNumber: true },
  });
  const myParcels = user.employeeRole === 'rider'
    ? await prisma.parcel.findMany({ where: { assignedRider: user.id, status: { not: 'delivered' } } })
    : [];

  return jsonResponse({ todayAttendance: todayAtt, employee, myParcels });
}
