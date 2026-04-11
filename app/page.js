'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState('login');
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [toast, setToast] = useState(null);

  // Login fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Register fields
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [regPassword, setRegPassword] = useState('');
  const [regDepartment, setRegDepartment] = useState('');

  // Check if already logged in
  useEffect(() => {
    const token = localStorage.getItem('ved_token');
    if (token) router.replace('/dashboard');
  }, [router]);

  // Auto-seed database on first visit
  useEffect(() => {
    const seedDB = async () => {
      try {
        setSeeding(true);
        const res = await fetch('/api/seed', { method: 'POST' });
        const data = await res.json();
        if (data.seeded) {
          showToast('Demo data loaded! Use admin@vedlogistics.com / admin123', 'success');
        }
      } catch (err) {
        console.error('Seed error:', err);
      } finally {
        setSeeding(false);
      }
    };
    seedDB();
  }, []);

  const showToast = (msg, type) => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 4000);
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      showToast('Please enter email and password', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();

      if (data.success) {
        localStorage.setItem('ved_token', data.token);
        localStorage.setItem('ved_user', JSON.stringify(data.user));
        showToast('Login successful! Redirecting…', 'success');
        setTimeout(() => router.push('/dashboard'), 500);
      } else {
        showToast(data.error || 'Invalid credentials', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (!regName || !regEmail || !regPassword || !regDepartment) {
      showToast('Please fill all fields', 'error');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: regName, email: regEmail, password: regPassword, department: regDepartment }),
      });
      const data = await res.json();

      if (data.success) {
        showToast('Account created! Please log in.', 'success');
        setTab('login');
        setEmail(regEmail);
      } else {
        showToast(data.error || 'Registration failed', 'error');
      }
    } catch {
      showToast('Network error. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        {/* Logo */}
        <div className="login-logo">
          <Image src="/logo.jpg" alt="Ved Logistics" width={48} height={48} priority />
          <div className="login-logo-text">
            Ved Logistics
            <small>Delivery Portal</small>
          </div>
        </div>

        {/* Card */}
        <div className="login-card">
          <h2>Welcome Back</h2>
          <p>Sign in to manage dispatch, tracking & team operations.</p>

          {/* Tabs */}
          <div className="login-tabs">
            <button
              className={`login-tab ${tab === 'login' ? 'active' : ''}`}
              onClick={() => setTab('login')}
            >
              Login
            </button>
            <button
              className={`login-tab ${tab === 'register' ? 'active' : ''}`}
              onClick={() => setTab('register')}
            >
              Register
            </button>
          </div>

          {/* Login Form */}
          {tab === 'login' && (
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="admin@vedlogistics.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                />
              </div>
              <div className="form-row">
                <label className="form-check">
                  <input type="checkbox" /> Remember me
                </label>
                <a href="#" className="form-link">Forgot password?</a>
              </div>
              <button className="btn" type="submit" disabled={loading || seeding}>
                {loading ? 'Signing in…' : seeding ? 'Setting up…' : 'Sign In'}
              </button>
            </form>
          )}

          {/* Register Form */}
          {tab === 'register' && (
            <form onSubmit={handleRegister}>
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Enter your name"
                  value={regName}
                  onChange={(e) => setRegName(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Email</label>
                <input
                  className="form-input"
                  type="email"
                  placeholder="you@vedlogistics.com"
                  value={regEmail}
                  onChange={(e) => setRegEmail(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <input
                  className="form-input"
                  type="password"
                  placeholder="Create password"
                  value={regPassword}
                  onChange={(e) => setRegPassword(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label">Department</label>
                <input
                  className="form-input"
                  type="text"
                  placeholder="Dispatch, HR, Sales…"
                  value={regDepartment}
                  onChange={(e) => setRegDepartment(e.target.value)}
                />
              </div>
              <button className="btn" type="submit" disabled={loading}>
                {loading ? 'Creating…' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <div className="login-footer">
          🔒 Secured connection · Ved Logistics © 2024
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`login-toast show ${toast.type}`}>
          {toast.msg}
        </div>
      )}
    </div>
  );
}
