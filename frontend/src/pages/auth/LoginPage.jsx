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
  ArrowRight,
  Building2,
  GraduationCap,
  Award,
  Zap,
  Bot,
  MapPin,
  Check
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
    student: { id: '21cse084@oist.ac.in', name: 'Rahul Sharma', title: 'Student (Section CSE-3A)' },
    teacher: { id: 'r.verma@oist.ac.in', name: 'Dr. Rajesh Verma', title: 'Faculty (Associate Professor)' },
    tg: { id: 'k.sen@oist.ac.in', name: 'Prof. K. Sen', title: 'Mentor / Teacher Guardian' },
    hod: { id: 's.roy@oist.ac.in', name: 'Dr. S. Roy', title: 'Head of Department (CSE)' },
    admin: { id: 'admin@oist.ac.in', name: 'System Administrator', title: 'Campus IT Infrastructure' }
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
    }, 750);
  };

  const handleBiometric = () => {
    setLoading(true);
    setTimeout(() => {
      login(selectedRole, { collegeId, biometric: true });
      setLoading(false);
      navigate(`/${selectedRole}`);
    }, 550);
  };

  const roleLabelMap = {
    student: 'Student',
    teacher: 'Faculty',
    tg: 'Mentor / TG',
    hod: 'HOD',
    admin: 'Admin'
  };

  return (
    <div className="split-login-container">
      {/* ========================================================================= */}
      {/* LEFT HALF: College Name, Logos, Branding, Accreditations & Key Highlights  */}
      {/* ========================================================================= */}
      <div className="split-login-brand">
        {/* Top Header Badge */}
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <span className="accreditation-pill">
              <span className="agent-pulse" style={{ backgroundColor: '#10B981', width: '6px', height: '6px' }} />
              Official Institutional Gateway • Estd. 1995
            </span>
          </div>

          {/* Logo & College Identity Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="brand-emblem-box">
              <img
                src="/oist.png"
                alt="Oriental Institute of Science & Technology Logo"
                className="brand-emblem-img"
              />
            </div>
            <div>
              <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.12em', color: '#93C5FD', textTransform: 'uppercase' }}>
                Oriental Group of Institutes
              </span>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: '#FFFFFF', lineHeight: 1.15, marginTop: '2px' }}>
                Oriental Institute of Science & Technology
              </h1>
              <p style={{ fontSize: '13px', color: '#CBD5E1', fontWeight: 600, marginTop: '4px' }}>
                Department of Computer Science & Engineering (CSE)
              </p>
            </div>
          </div>

          <p style={{ fontSize: '14px', color: '#94A3B8', lineHeight: 1.6, maxWidth: '520px', marginBottom: '1.75rem' }}>
            Unified Digital CampusFlow Platform — Powering autonomous academic governance, AI-driven timetable scheduling, multi-tier clearances, and real-time student progression.
          </p>

          {/* Institutional Accreditations */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2.5rem' }}>
            <span className="accreditation-pill">
              <Award size={13} color="#FBBF24" />
              NAAC 'A+' Grade Accredited
            </span>
            <span className="accreditation-pill">
              <Building2 size={13} color="#60A5FA" />
              Approved by AICTE, New Delhi
            </span>
            <span className="accreditation-pill">
              <GraduationCap size={13} color="#34D399" />
              Affiliated to RGPV, Bhopal
            </span>
            <span className="accreditation-pill">
              <ShieldCheck size={13} color="#F472B6" />
              NBA Accredited Programmes
            </span>
          </div>

          {/* Core System Highlights */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: '520px' }}>
            <div className="brand-feature-card">
              <div className="brand-feature-icon">
                <Zap size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  Autonomous Attendance Agent
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '1px', lineHeight: 1.4 }}>
                  Automates duty credits, recalculating aggregates (72% → 84%) across 6 lectures instantly with zero manual faculty burden.
                </div>
              </div>
            </div>

            <div className="brand-feature-card">
              <div className="brand-feature-icon">
                <Bot size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  AI Timetable & Autonomous Conflict Resolution
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '1px', lineHeight: 1.4 }}>
                  Constraint satisfaction engine that detects venue double-bookings and self-heals scheduling collisions.
                </div>
              </div>
            </div>

            <div className="brand-feature-card">
              <div className="brand-feature-icon">
                <ShieldCheck size={18} />
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>
                  Role-Isolated Workspace Architecture
                </div>
                <div style={{ fontSize: '11px', color: '#CBD5E1', marginTop: '1px', lineHeight: 1.4 }}>
                  Strict authenticated sessions ensuring each user enters only their dedicated, role-specific portal window.
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Campus Footer */}
        <div style={{ paddingTop: '2.5rem', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#94A3B8', fontSize: '11px' }}>
            <MapPin size={14} color="#60A5FA" />
            <span>Oriental Campus, Raisen Road, Bhopal, Madhya Pradesh – 462021</span>
          </div>
          <p style={{ color: '#64748B', fontSize: '10px', marginTop: '4px' }}>
            © {new Date().getFullYear()} Oriental Institute of Science & Technology. All rights reserved.
          </p>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RIGHT HALF: Authentication Form, Role Selector & Quick Fast Pass           */}
      {/* ========================================================================= */}
      <div className="split-login-form-side">
        <div className="split-form-wrapper">
          {/* Card Header */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--primary)', fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              <ShieldCheck size={15} />
              <span>Campus Secure Single Sign-On</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
              Portal Sign In
            </h2>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Sign in with your credentials to open your designated role workspace.
            </p>
          </div>

          {/* Smart Role Selection Tabs */}
          <div
            style={{
              backgroundColor: 'var(--surface-low)',
              borderRadius: 'var(--radius-xl)',
              padding: '0.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.5rem',
              border: '1px solid var(--border-subtle)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 0.25rem' }}>
              <span style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                Select Role Workspace
              </span>
              <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--primary)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Sparkles size={12} />
                Demo Credentials Loaded
              </span>
            </div>

            <div style={{ display: 'flex', gap: '6px', overflowX: 'auto', paddingBottom: '2px' }}>
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
                  className={`login-role-tab ${selectedRole === role.id ? 'active' : ''}`}
                >
                  {role.label}
                </button>
              ))}
            </div>

            {/* Role Profile Info Chip */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.4rem 0.65rem',
                backgroundColor: 'var(--surface)',
                borderRadius: 'var(--radius-lg)',
                border: '1px solid var(--border-subtle)',
                fontSize: '11px'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                <span className="agent-pulse" style={{ width: '6px', height: '6px' }} />
                <span style={{ color: 'var(--text-muted)' }}>Active Persona:</span>
                <strong style={{ color: 'var(--text-primary)' }}>{demoAccounts[selectedRole].name}</strong>
              </div>
              <span className="badge badge-indigo" style={{ fontSize: '10px', padding: '0.1rem 0.5rem' }}>
                {demoAccounts[selectedRole].title}
              </span>
            </div>
          </div>

          {/* Form */}
          <div
            className="card"
            style={{
              padding: '1.75rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1.25rem',
              boxShadow: 'var(--shadow-lg)'
            }}
          >
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
              {/* College ID or Email Field */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="collegeId">
                    College ID or Institutional Email
                  </label>
                  <span style={{ fontSize: '11px', color: 'var(--primary)', fontWeight: 700 }}>
                    Role: {selectedRole.toUpperCase()}
                  </span>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
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
                    style={{ paddingLeft: '40px', height: '46px', borderRadius: 'var(--radius-xl)', fontSize: '13px' }}
                  />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-group" style={{ marginBottom: 0 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <label className="form-label" htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => alert('Password reset instructions have been dispatched to your institutional email.')}
                    style={{ color: 'var(--primary)', fontWeight: 600, fontSize: '11px' }}
                  >
                    Forgot?
                  </button>
                </div>
                <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                  <div style={{ position: 'absolute', left: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}>
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
                    style={{ paddingLeft: '40px', paddingRight: '40px', height: '46px', borderRadius: 'var(--radius-xl)', fontSize: '13px' }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '14px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center' }}
                    aria-label="Toggle password visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Remember Device Checkbox */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '12px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', cursor: 'pointer', userSelect: 'none' }}>
                  <input
                    type="checkbox"
                    checked={rememberDevice}
                    onChange={(e) => setRememberDevice(e.target.checked)}
                    style={{ accentColor: 'var(--primary)', width: '15px', height: '15px' }}
                  />
                  <span style={{ color: 'var(--text-secondary)' }}>Remember this workstation session</span>
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="btn btn-primary btn-lg"
                style={{
                  width: '100%',
                  borderRadius: 'var(--radius-xl)',
                  height: '48px',
                  fontWeight: 700,
                  fontSize: '14px',
                  boxShadow: 'var(--shadow-md)',
                  marginTop: '0.25rem'
                }}
              >
                {loading ? (
                  <>
                    <Loader2 size={18} className="animate-spin" />
                    <span>Opening {roleLabelMap[selectedRole]} Portal...</span>
                  </>
                ) : (
                  <>
                    <span>Enter {roleLabelMap[selectedRole]} Workspace</span>
                    <ArrowRight size={17} />
                  </>
                )}
              </button>
            </form>

            {/* Biometric Quick Sign-In */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.65rem' }}>
              <div style={{ position: 'relative', width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '100%', height: '1px', backgroundColor: 'var(--border-subtle)' }} />
                <span
                  style={{
                    position: 'absolute',
                    backgroundColor: '#FFFFFF',
                    padding: '0 0.65rem',
                    fontSize: '11px',
                    color: 'var(--text-muted)'
                  }}
                >
                  or passwordless fast pass
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
                  fontSize: '13px',
                  fontWeight: 600,
                  border: '1px solid var(--border-subtle)'
                }}
              >
                <Fingerprint size={18} color="var(--primary)" />
                <span>Biometric Touch / Face ID</span>
              </button>
            </div>

            {/* Assistance Box */}
            <div
              style={{
                backgroundColor: 'var(--surface-low)',
                borderRadius: 'var(--radius-xl)',
                padding: '0.85rem 1rem',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.65rem',
                fontSize: '11px',
                color: 'var(--text-secondary)',
                border: '1px solid var(--border-subtle)'
              }}
            >
              <HelpCircle size={18} color="var(--primary)" style={{ flexShrink: 0, marginTop: '1px' }} />
              <div>
                <strong style={{ color: 'var(--text-primary)' }}>Need assistance? </strong>
                Contact CSE Academic Cell (Block A) or email{' '}
                <a href="mailto:support@oist.ac.in" style={{ color: 'var(--primary)', fontWeight: 600 }}>
                  support@oist.ac.in
                </a>
              </div>
            </div>
          </div>

          {/* Security & System Info Footer */}
          <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', gap: '3px', color: 'var(--text-muted)', fontSize: '11px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
              <ShieldCheck size={14} color="var(--secondary)" />
              <span>OIST ERP v3.2 • Secure Institutional Cloud</span>
            </div>
            <span>End-to-End 256-Bit SSL Encryption • ISO/IEC 27001 Certified</span>
          </div>
        </div>
      </div>
    </div>
  );
}
