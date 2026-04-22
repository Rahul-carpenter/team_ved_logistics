import { getDb } from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const db = await getDb();
  const employee = await db.collection('employees').findOne(
    { _id: user.id },
    {
      projection: {
        _id: 1, name: 1, email: 1, phone: 1,
        department: 1, role: 1, employeeRole: 1,
        baseSalary: 1, joinDate: 1, status: 1,
        avatar: 1, bikeNumber: 1, notes: 1,
      },
    }
  );

  if (!employee) return errorResponse('User not found', 404);

  // Map _id to id for frontend compatibility
  const { _id, ...rest } = employee;
  return jsonResponse({ user: { id: _id, ...rest } });
}
