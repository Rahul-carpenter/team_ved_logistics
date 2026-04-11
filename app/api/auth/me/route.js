import prisma from '@/lib/db';
import { getUserFromRequest, jsonResponse, errorResponse } from '@/lib/auth';

export async function GET(request) {
  const user = getUserFromRequest(request);
  if (!user) return errorResponse('Unauthorized', 401);

  const employee = await prisma.employee.findUnique({
    where: { id: user.id },
    select: {
      id: true, name: true, email: true, phone: true,
      department: true, role: true, employeeRole: true,
      baseSalary: true, joinDate: true, status: true,
      avatar: true, bikeNumber: true, notes: true,
    },
  });

  if (!employee) return errorResponse('User not found', 404);
  return jsonResponse({ user: employee });
}
