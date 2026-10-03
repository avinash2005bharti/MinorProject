import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../../api/authApi';
import {
  Briefcase,
  User,
  Mail,
  Lock,
  Phone,
  BookOpen,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  Eye,
  EyeOff,
  Building2,
  ShieldCheck,
  Award
} from 'lucide-react';

export default function TeacherRegisterPage() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    designation: 'Assistant Professor',
    specialization: 'Computer Science & Engineering',
    phone: '',
    password: '',
    confirmPassword: ''
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');

    // Frontend validation
    if (!formData.name.trim()) {
      setError('Please provide your full official faculty name.');
      return;
    }

    if (!formData.email.trim() || !formData.email.includes('@')) {
      setError('Please provide a valid official institution email address.');
      return;
    }

    if (!formData.specialization.trim()) {
      setError('Please specify your academic or technical specialization.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must contain at least 6 characters.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match. Please re-enter.');
      return;
    }

    setLoading(true);

    try {
      const res = await authApi.registerTeacher({
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        designation: formData.designation,
        specialization: formData.specialization.trim(),
        phone: formData.phone.trim() || null
      });

      setSuccessMsg(res.message || 'Faculty account created successfully in CSE Department records!');
      setTimeout(() => {
        navigate('/login', {
          state: {
            registeredEmail: formData.email.trim().toLowerCase(),
            roleNotice: 'teacher'
          }
        });
      }, 1500);
    } catch (err) {
      setError(err.message || 'Unable to register faculty account. Please check details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="split-login-container" style={{ minHeight: '100vh', display: 'flex' }}>
      {/* LEFT BRANDING PANEL */}
      <div className="split-login-brand">
        <div>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem' }}>
            <span className="accreditation-pill">
              <span className="agent-pulse" style={{ backgroundColor: '#10B981', width: '6px', height: '6px' }} />
              Official Institutional Gateway • Estd. 1995
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.5rem' }}>
            <div className="brand-emblem-box">
              <img
                src="/oist.png"
                alt="Oriental Institute of Science & Technology"
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

          <div className="p-4 rounded-2xl bg-white/10 border border-white/15 backdrop-blur-md mb-6 max-w-[500px]">
            <h3 className="text-white font-bold text-base flex items-center gap-2 mb-1.5">
              <Briefcase size={20} className="text-indigo-300" />
              Faculty Self-Registration Portal
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Register as a teaching faculty member in the Department of CSE. Your account will automatically integrate with academic timetable assignment, live roll call attendance management, and AI substitution scheduling.
            </p>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '2rem' }}>
            <span className="accreditation-pill">
              <Award size={13} color="#FBBF24" />
              NAAC 'A+' Grade
            </span>
            <span className="accreditation-pill">
              <Building2 size={13} color="#60A5FA" />
              AICTE Approved
            </span>
            <span className="accreditation-pill">
              <ShieldCheck size={13} color="#34D399" />
              NBA Accredited
            </span>
          </div>
        </div>

        <div style={{ fontSize: '11px', color: '#64748B', display: 'flex', justifyContent: 'space-between', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '1.25rem' }}>
          <span>© {new Date().getFullYear()} OIST Bhopal • CSE Dept.</span>
          <span>Security Verified</span>
        </div>
      </div>

      {/* RIGHT REGISTRATION FORM */}
      <div className="split-login-form-area" style={{ flex: 1, padding: '2.5rem', overflowY: 'auto' }}>
        <div style={{ maxWidth: '540px', margin: '0 auto' }}>
          <div style={{ marginBottom: '1.75rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#4F46E5', fontSize: '12px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '0.5rem' }}>
              <Briefcase size={16} />
              <span>Faculty Registration</span>
            </div>
            <h2 style={{ fontSize: '26px', fontWeight: 800, color: '#0F172A', letterSpacing: '-0.02em' }}>
              Create Faculty Account
            </h2>
            <p style={{ fontSize: '13px', color: '#64748B', marginTop: '4px' }}>
              Register yourself in CSE Department faculty records.
            </p>
          </div>

          {error && (
            <div className="p-3.5 mb-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <AlertCircle size={17} className="shrink-0 text-rose-600" />
                <span>{error}</span>
              </div>
              {error.toLowerCase().includes('already exists') && (
                <Link to="/login" className="font-bold underline text-blue-700 whitespace-nowrap ml-2">
                  Sign in here →
                </Link>
              )}
            </div>
          )}

          {successMsg && (
            <div className="p-3.5 mb-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2.5">
              <CheckCircle2 size={17} className="shrink-0 text-emerald-600" />
              <span>{successMsg} Redirecting to login...</span>
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/* Full Name */}
            <div>
              <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                Full Name (with Title) *
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type="text"
                  name="name"
                  required
                  placeholder="e.g. Dr. Priya Singh"
                  value={formData.name}
                  onChange={handleChange}
                  className="input-field"
                  style={{ paddingLeft: '2.5rem' }}
                />
                <User size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
              </div>
            </div>

            {/* Email & Phone */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Official Email *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="email"
                    name="email"
                    required
                    placeholder="priya.singh@college.edu"
                    value={formData.email}
                    onChange={handleChange}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Mail size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Contact Phone (Optional)
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="+91 98260 11223"
                    value={formData.phone}
                    onChange={handleChange}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Phone size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>
            </div>

            {/* Designation & Specialization */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Faculty Designation *
                </label>
                <select
                  name="designation"
                  value={formData.designation}
                  onChange={handleChange}
                  className="input-field"
                >
                  <option value="Assistant Professor">Assistant Professor</option>
                  <option value="Associate Professor">Associate Professor</option>
                  <option value="Professor">Professor</option>
                  <option value="Assistant Professor (TG)">Assistant Professor (TG)</option>
                  <option value="Head of Department (HOD)">Head of Department (HOD)</option>
                  <option value="Visiting Faculty">Visiting Faculty</option>
                </select>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Specialization / Domain *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type="text"
                    name="specialization"
                    required
                    placeholder="e.g. Machine Learning, Networks"
                    value={formData.specialization}
                    onChange={handleChange}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <BookOpen size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>
            </div>

            {/* Password & Confirm Password */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem' }}>
              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    required
                    placeholder="Min. 6 characters"
                    value={formData.password}
                    onChange={handleChange}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="form-label" style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                  Confirm Password *
                </label>
                <div style={{ position: 'relative' }}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="confirmPassword"
                    required
                    placeholder="Re-enter password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className="input-field"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                  <Lock size={16} style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: '#94A3B8' }} />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{
                width: '100%',
                padding: '0.85rem',
                fontSize: '14px',
                fontWeight: 700,
                marginTop: '0.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem'
              }}
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true" />
                  <span>Registering Faculty Account...</span>
                </>
              ) : (
                <>
                  <span>Complete Faculty Registration</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>

          <div style={{ marginTop: '1.5rem', textAlign: 'center', fontSize: '13px', color: '#64748B' }}>
            <span>Already have a faculty account? </span>
            <Link to="/login" style={{ color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>
              Sign In to ERP
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
