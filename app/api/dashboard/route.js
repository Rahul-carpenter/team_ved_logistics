import { getDb } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const db = await getDb();
  const today = new Date().toISOString().split('T')[0];
  const thisMonth = new Date().toISOString().slice(0, 7);

  if (user.role === 'admin') {
    const [
      totalEmployees, totalRiders, todayAttendanceCount,
      pendingAdvances, pendingExpenses, monthPayments,
    ] = await Promise.all([
      db.collection('employees').countDocuments({ role: { $ne: 'admin' }, status: 'active' }),
      db.collection('employees').countDocuments({ employeeRole: 'rider', status: 'active' }),
      db.collection('attendance').countDocuments({ date: today }),
      db.collection('advances').countDocuments({ status: 'pending' }),
      db.collection('expenses').countDocuments({ status: 'pending' }),
      db.collection('salary_payments').find({ month: thisMonth }).toArray(),
    ]);

    const totalPaidMonth = monthPayments.reduce((s, p) => s + p.netAmount, 0);

    // Recent daily logs with employee name
    const recentLogs = await db.collection('daily_logs').aggregate([
      { $match: { date: today } },
      { $sort: { createdAt: -1 } },
      { $limit: 6 },
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

    // Today attendance list
    const todayAttList = await db.collection('attendance').aggregate([
      { $match: { date: today } },
      { $sort: { checkIn: -1 } },
      { $limit: 5 },
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

    return jsonResponse({
      stats: {
        totalEmployees, totalRiders, todayAttendance: todayAttendanceCount,
        pendingAdvances, pendingExpenses, totalPaidMonth,
      },
      recentLogs,
      todayAttendance: todayAttList,
    });
  }

  // Employee dashboard
  const [todayAtt, todayLog, activeRide, employee] = await Promise.all([
    db.collection('attendance').findOne({ employeeId: user.id, date: today }),
    db.collection('daily_logs').findOne({ employeeId: user.id, date: today }),
    db.collection('rides').findOne({ riderId: user.id, date: today, status: 'started' }),
    db.collection('employees').findOne(
      { _id: user.id },
      { projection: { baseSalary: 1, department: 1, employeeRole: 1, joinDate: 1, bikeNumber: 1 } }
    ),
  ]);

  // Map _id to id
  const mapDoc = (doc) => {
    if (!doc) return null;
    const { _id, ...rest } = doc;
    return { id: _id, ...rest };
  };

  return jsonResponse({
    todayAttendance: mapDoc(todayAtt),
    employee: mapDoc(employee),
    todayLog: mapDoc(todayLog),
    activeRide: mapDoc(activeRide),
  });
}
