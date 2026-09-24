import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { useNavigate } from 'react-router-dom';
import {
  Lock,
  User,
  Eye,
  EyeOff,
  Fingerprint,
  CheckCircle2,
  Loader2,
  Sparkles,
  HelpCircle,
  ShieldCheck,
  ArrowRight
} from 'lucide-react';

export default function LoginPage() {
  const { login, users } = useERP();
  const navigate = useNavigate();

  const [selectedRole, setSelectedRole] = useState('student');
  const [collegeId, setCollegeId] = useState('21cse084@oist.ac.in');
  const [password, setPassword] = useState('••••••••••••');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberDevice, setRememberDevice] = useState(true);
  const [loading, setLoading] = useState(false);

  const demoAccounts = {
    student: { id: '21cse084@oist.ac.in', name: 'Rahul Sharma (Student)' },
    teacher: { id: 'r.verma@oist.ac.in', name: 'Dr. Rajesh Verma (Faculty)' },
    tg: { id: 'k.sen@oist.ac.in', name: 'Prof. K. Sen (TG / Mentor)' },
    hod: { id: 's.roy@oist.ac.in', name: 'Dr. S. Roy (HOD CSE)' },
    admin: { id: 'admin@oist.ac.in', name: 'System Administrator' }
  };

  const handleSelectRole = (role) => {
    setSelectedRole(role);
    setCollegeId(demoAccounts[role].id);
    setPassword('••••••••••••');
  };

  const handleCollegeIdChange = (val) => {
    setCollegeId(val);
    const low = val.toLowerCase();
    if (low.includes('admin') || low.includes('sysadmin')) {
      setSelectedRole('admin');
    } else if (low.includes('hod') || low.includes('head') || low.includes('s.roy')) {
      setSelectedRole('hod');
    } else if (low.includes('mentor') || low.includes('tg') || low.includes('k.sen')) {
      setSelectedRole('tg');
    } else if (low.includes('prof') || low.includes('fac') || low.includes('r.verma')) {
      setSelectedRole('teacher');
    } else {
      setSelectedRole('student');
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);

    setTimeout(() => {
      login(selectedRole, { collegeId, password });
      setLoading(false);
      navigate(`/${selectedRole}`);
    }, 800);
  };

  const handleBiometric = () => {
    setLoading(true);
    setTimeout(() => {
      login(selectedRole, { collegeId, biometric: true });
      setLoading(false);
      navigate(`/${selectedRole}`);
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        backgroundColor: 'var(--bg-canvas)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1.5rem 1rem'
      }}
    >
      <div style={{ maxWidth: '440px', width: '100%', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {/* Subtle decorative ambient badge (Matching Stitch) */}
        <div style={{ display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.45rem',
              padding: '0.25rem 0.85rem',
              borderRadius: 'var(--radius-full)',
              backgroundColor: 'var(--surface-low)',
              color: 'var(--text-secondary)',
              fontSize: '11px',
              fontWeight: 600,
              border: '1px solid var(--border-subtle)'
            }}
          >
            <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
            <span>Official University Gateway • OIST CSE</span>
          </div>
        </div>

        {/* Main Unified Authentication Card (Matching Stitch college_erp_login) */}
        <div
          className="card"
          style={{
            padding: '2rem 1.5rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
            boxShadow: 'var(--shadow-xl)',
            borderRadius: 'var(--radius-2xl)'
          }}
        >
          {/* Top Branding Section */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
            <div
              style={{
                width: '68px',
                height: '68px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: '#FFFFFF',
                padding: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: 'var(--shadow-md)',
                border: '1px solid var(--border-subtle)',
                marginBottom: '0.75rem'
              }}
            >
              <img
                src="/oist.png"
                alt="OIST CSE Logo"
                style={{ width: '100%', height: '100%', objectFit: 'contain' }}
              />
            </div>

            <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', lineHeight: 1.2 }}>
              Oriental Institute of Science & Technology
            </h1>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--primary)', marginTop: '3px' }}>
              OIST CSE Campus ERP Portal
            </p>
            <p style={{ fontSize: '11px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Unified Digital Access & Autonomous Academic Management
            </p>
          </div>

          {/* Smart SSO Role Detection Badge Track (Matching Stitch) */}
          <div
            style={{
              backgroundColor: 'var(--surface-low)',
              padding: '0.65rem',
              borderRadius: 'var(--radius-xl)',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                SSO Auto-Role Detection
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Sparkles size={12} />
                Smart Match
              </span>
            </div>

            <div style={{ display: 'flex', gap: '4px', overflowX: 'auto', paddingBottom: '2px' }}>
              {[
                { id: 'student', label: 'Student' },
                { id: 'teacher', label: 'Faculty' },
                { id: 'tg', label: 'Mentor / TG' },
                { id: 'hod', label: 'HOD' },
                { id: 'admin', label: 'Admin' }
              ].map((role) => (
                <button
                  key={role.id}
                  type="button"
                  onClick={() => handleSelectRole(role.id)}
                  style={{
                    padding: '0.3rem 0.65rem',
                    borderRadius: 'var(--radius-full)',
                    fontSize: '11px',
                    fontWeight: selectedRole === role.id ? 700 : 500,
                    backgroundColor: selectedRole === role.id ? 'var(--primary)' : 'var(--surface-high)',
                    color: selectedRole === role.id ? '#FFFFFF' : 'var(--text-secondary)',
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease'
                  }}
                >
                  {role.label}
                </button>
              ))}
            </div>
          </div>

          {/* Login Form */}
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* College ID or Email Field */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <label className="form-label" htmlFor="collegeId">College ID or Email</label>
                <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 600 }}>
                  Role: {selectedRole.toUpperCase()}
                </span>
              </div>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <User size={18} />
                </div>
                <input
                  id="collegeId"
                  type="text"
                  required
                  value={collegeId}
                  onChange={(e) => handleCollegeIdChange(e.target.value)}
                  placeholder="e.g. 21cse084@oist.ac.in"
                  className="input-field"
                  style={{ paddingLeft: '38px', height: '46px', borderRadius: 'var(--radius-xl)' }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" htmlFor="password">Password</label>
              <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                <div style={{ position: 'absolute', left: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
                  <Lock size={18} />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="input-field"
                  style={{ paddingLeft: '38px', paddingRight: '38px', height: '46px', borderRadius: 'var(--radius-xl)' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: '12px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                  aria-label="Toggle password visibility"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none' }}>
                <input
                  type="checkbox"
                  checked={rememberDevice}
                  onChange={(e) => setRememberDevice(e.target.checked)}
                  style={{ accentColor: 'var(--primary)' }}
                />
                <span style={{ color: 'var(--text-secondary)' }}>Remember device</span>
              </label>

              <button
                type="button"
                onClick={() => alert('Self-service password recovery initiated. An authentication OTP has been dispatched to your registered contact.')}
                style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '12px' }}
              >
                Forgot Password?
              </button>
            </div>

            {/* Primary Action CTA */}
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-lg"
              style={{
                width: '100%',
                borderRadius: 'var(--radius-xl)',
                boxShadow: 'var(--shadow-md)',
                marginTop: '0.25rem'
              }}
            >
              {loading ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  <span>Validating Credentials...</span>
                </>
              ) : (
                <>
                  <span>Log In to OIST CSE ERP</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          {/* Biometric Quick Access Option (Matching Stitch) */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border-subtle)' }} />
              <span
                style={{
                  position: 'absolute',
                  backgroundColor: '#FFFFFF',
                  padding: '0 0.5rem',
                  fontSize: '11px',
                  color: 'var(--text-muted)'
                }}
              >
                or instant sign in
              </span>
            </div>

            <button
              type="button"
              onClick={handleBiometric}
              className="btn btn-secondary"
              style={{
                width: '100%',
                borderRadius: 'var(--radius-xl)',
                height: '42px',
                fontSize: '13px'
              }}
            >
              <Fingerprint size={18} color="var(--primary)" />
              <span>Biometric Fast Pass</span>
            </button>
          </div>

          {/* Emergency & Assistance Help Box (Matching Stitch) */}
          <div
            style={{
              backgroundColor: 'var(--surface-low)',
              borderRadius: 'var(--radius-xl)',
              padding: '0.85rem',
              display: 'flex',
              alignItems: 'flex-start',
              gap: '0.65rem',
              fontSize: '11px',
              color: 'var(--text-secondary)'
            }}
          >
            <HelpCircle size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '1px' }} />
            <div>
              <strong style={{ color: 'var(--text-primary)' }}>Need assistance? </strong>
              Contact Admin Support at{' '}
              <a href="mailto:support@oist.ac.in" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                support@oist.ac.in
              </a>{' '}
              or visit the CSE Academic Cell, Block A.
            </div>
          </div>
        </div>

        {/* Clean Minimalist Footer */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '2px', color: 'var(--text-muted)', fontSize: '11px' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
            <ShieldCheck size={14} color="var(--secondary)" />
            <span>OIST ERP v3.2 • Secure Academic Cloud</span>
          </div>
          <span>ISO/IEC 27001 Certified Campus System</span>
        </div>
      </div>
    </div>
  );
}
