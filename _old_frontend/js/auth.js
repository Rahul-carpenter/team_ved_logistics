/* ══════════════════════════════════════════
   Ved Logistics — Auth Module
   ══════════════════════════════════════════ */

const Auth = (() => {
  const login = (email, password) => {
    const employees = Store.getAll('employees');
    const user = employees.find(e => e.email === email && e.password === password && e.status === 'active');
    if (!user) return { success: false, error: 'Invalid email or password' };
    const session = {
      id: user.id, name: user.name, email: user.email,
      role: user.role, employeeRole: user.employeeRole,
      department: user.department, avatar: user.avatar
    };
    Store.setSession(session);
    return { success: true, user: session };
  };

  const register = (data) => {
    const employees = Store.getAll('employees');
    if (employees.find(e => e.email === data.email)) {
      return { success: false, error: 'Email already registered' };
    }
    const emp = {
      id: Utils.uid(),
      name: data.name,
      email: data.email,
      password: data.password,
      phone: data.phone || '',
      department: data.department || 'General',
      role: 'employee',
      employeeRole: 'normal',
      baseSalary: 0,
      joinDate: Utils.today(),
      status: 'active',
      avatar: '',
      bikeNumber: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    employees.push(emp);
    localStorage.setItem('ved_employees', JSON.stringify(employees));
    return { success: true, user: emp };
  };

  const logout = () => {
    Store.clearSession();
    window.location.href = 'VedLogistics_login.html';
  };

  const getCurrentUser = () => Store.getSession();

  const isLoggedIn = () => !!Store.getSession();

  const isAdmin = () => {
    const u = Store.getSession();
    return u && u.role === 'admin';
  };

  const isRider = () => {
    const u = Store.getSession();
    return u && u.employeeRole === 'rider';
  };

  const requireAuth = (requiredRole) => {
    const u = Store.getSession();
    if (!u) { window.location.href = 'VedLogistics_login.html'; return false; }
    if (requiredRole && u.role !== requiredRole) { return false; }
    return true;
  };

  return { login, register, logout, getCurrentUser, isLoggedIn, isAdmin, isRider, requireAuth };
})();
