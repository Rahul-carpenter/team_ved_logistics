// Database setup: creates collections & indexes for optimal performance
// Run once via /api/seed or on first connection

export async function ensureIndexes(db) {
  // employees
  await db.collection('employees').createIndexes([
    { key: { email: 1 }, unique: true },
    { key: { role: 1 } },
    { key: { employeeRole: 1 } },
    { key: { status: 1 } },
  ]);

  // attendance
  await db.collection('attendance').createIndexes([
    { key: { employeeId: 1 } },
    { key: { date: 1 } },
    { key: { employeeId: 1, date: 1 } },
  ]);

  // daily_logs
  await db.collection('daily_logs').createIndexes([
    { key: { employeeId: 1, date: 1 }, unique: true },
    { key: { date: 1 } },
  ]);

  // rides
  await db.collection('rides').createIndexes([
    { key: { riderId: 1 } },
    { key: { date: 1 } },
    { key: { riderId: 1, date: 1, status: 1 } },
  ]);

  // advances
  await db.collection('advances').createIndexes([
    { key: { employeeId: 1 } },
    { key: { status: 1 } },
  ]);

  // expenses
  await db.collection('expenses').createIndexes([
    { key: { employeeId: 1 } },
    { key: { status: 1 } },
  ]);

  // salary_payments
  await db.collection('salary_payments').createIndexes([
    { key: { employeeId: 1 } },
    { key: { month: 1 } },
  ]);

  // settings
  await db.collection('settings').createIndexes([
    { key: { key: 1 }, unique: true },
  ]);
}
