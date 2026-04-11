import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  if (user.role === 'admin') {
    const [
      totalEmployees, totalRiders, todayAttendance,
      pendingAdvances, pendingExpenses, monthPayments,
    ] = await Promise.all([
      prisma.employee.count({ where: { role: { not: 'admin' }, status: 'active' } }),
      prisma.employee.count({ where: { employeeRole: 'rider', status: 'active' } }),
      prisma.attendance.count({ where: { date: today } }),
      prisma.advance.count({ where: { status: 'pending' } }),
      prisma.expense.count({ where: { status: 'pending' } }),
      prisma.salaryPayment.findMany({ where: { month: thisMonth } }),
    ]);

    const totalPaidMonth = monthPayments.reduce((s, p) => s + p.netAmount, 0);

    // Recent daily logs
    const recentLogs = await prisma.dailyLog.findMany({
      where: { date: today },
      take: 6,
      orderBy: { createdAt: 'desc' },
      include: { employee: { select: { name: true } } },
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
        pendingAdvances, pendingExpenses, totalPaidMonth,
      },
      recentLogs,
      todayAttendance: todayAttList,
    });
  }

  // Employee dashboard
  const todayAtt = await prisma.attendance.findFirst({
    where: { employeeId: user.id, date: today },
  });
  
  const todayLog = await prisma.dailyLog.findFirst({
    where: { employeeId: user.id, date: today },
  });
  
  const activeRide = await prisma.ride.findFirst({
    where: { riderId: user.id, date: today, status: 'started' }
  });

  const employee = await prisma.employee.findUnique({
    where: { id: user.id },
    select: { baseSalary: true, department: true, employeeRole: true, joinDate: true, bikeNumber: true },
  });

  return jsonResponse({ todayAttendance: todayAtt, employee, todayLog, activeRide });
}
