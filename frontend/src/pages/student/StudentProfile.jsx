import React from 'react';
import { useERP } from '../../context/ERPContext';
import {
  ShieldCheck,
  Mail,
  BookOpen,
  User,
  Phone,
  MapPin,
  Award,
  CheckCircle2,
  Calendar,
  Sparkles,
  QrCode,
  GraduationCap
} from 'lucide-react';

export default function StudentProfile() {
  const { currentUser, subjects } = useERP();

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%' }}>
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Student Identity & Academic Profile
              </h1>
              <span className="badge badge-emerald">Active Student</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Oriental Institute of Science & Technology (OIST) • Computer Science & Engineering Registry
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-indigo" style={{ padding: '0.35rem 0.75rem', fontSize: '12px' }}>
              Autonomous Batch 2023-2027
            </span>
          </div>
        </div>

        {/* Full-Window Grid: 2 Columns on desktop */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }} className="lg:grid-cols-3">
          {/* Main 2-Span Column: Profile Details & Courses */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }} className="lg:col-span-2">
            {/* Primary Identity Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', position: 'relative', overflow: 'hidden' }}>
              <div
                style={{
                  position: 'absolute',
                  top: '-40px',
                  right: '-40px',
                  width: '180px',
                  height: '180px',
                  borderRadius: '50%',
                  backgroundColor: 'rgba(29, 78, 216, 0.04)',
                  filter: 'blur(30px)',
                  pointerEvents: 'none'
                }}
              />

              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', flexWrap: 'wrap' }}>
                <img
                  src={currentUser.avatar}
                  alt={currentUser.name}
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: 'var(--radius-2xl)',
                    objectFit: 'cover',
                    boxShadow: 'var(--shadow-md)',
                    border: '3px solid var(--surface-high)'
                  }}
                />

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {currentUser.name}
                    </h2>
                    <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                    {currentUser.department}
                  </p>

                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.65rem', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span><strong>Roll No:</strong> <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{currentUser.rollNo}</span></span>
                    <span><strong>Section:</strong> <span style={{ color: 'var(--text-primary)' }}>{currentUser.section}</span></span>
                    <span><strong>Semester:</strong> <span style={{ color: 'var(--text-primary)' }}>{currentUser.semester}th Sem</span></span>
                    <span><strong>CGPA:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{currentUser.cgpa} / 10</span></span>
                  </div>
                </div>
              </div>

              <hr style={{ borderColor: 'var(--border-subtle)', margin: '0.25rem 0' }} />

              {/* Academic Key Stats Bento */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: '0.75rem' }}>
                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Aggregate Attendance
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: currentUser.attendance >= 75 ? 'var(--secondary)' : 'var(--error)', marginTop: '2px' }}>
                    {currentUser.attendance}%
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Exam Eligible (&gt;75%)</span>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Credits Earned
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginTop: '2px' }}>
                    64 / 160
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>On track for graduation</span>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Academic Standing
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                    First Class
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>With Distinction</span>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Active Backlogs
                  </span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: 'var(--secondary)', marginTop: '2px' }}>
                    0
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Clear record</span>
                </div>
              </div>
            </div>

            {/* Registered Subjects & Course Portfolio */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} color="var(--primary)" />
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                    Current Semester Registered Courses
                  </h3>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                  {subjects.length} Subjects Active
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                {subjects.map((sub) => (
                  <div
                    key={sub.code}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      padding: '0.75rem 1rem',
                      backgroundColor: 'var(--surface-low)',
                      borderRadius: 'var(--radius-xl)',
                      gap: '1rem',
                      flexWrap: 'wrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: '200px' }}>
                      <span className="badge badge-indigo" style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '11px' }}>
                        {sub.code}
                      </span>
                      <div>
                        <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>
                          {sub.name}
                        </h4>
                        <span style={{ fontSize: '11px', color: 'var(--text-secondary)' }}>
                          {sub.teacher}
                        </span>
                      </div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)', display: 'block' }}>Attendance</span>
                        <span style={{ fontSize: '13px', fontWeight: 700, color: sub.percentage >= 75 ? 'var(--secondary)' : 'var(--error)' }}>
                          {sub.percentage}%
                        </span>
                      </div>
                      <span className="badge badge-slate" style={{ fontSize: '10px' }}>
                        {sub.attended}/{sub.total} Classes
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Governance, Contact & ID Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {/* Academic Governance Card */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <ShieldCheck size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Academic Governance
                </h3>
              </div>

              {/* TG */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Assigned Teacher Guardian (TG)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>{currentUser.tgName}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>{currentUser.tgEmail}</span>
                <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <CheckCircle2 size={12} /> Available in Cabin CS-204
                </span>
              </div>

              {/* HOD */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Head of Department (HOD)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>{currentUser.hodName}</span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>hod.cse@oist.ac.in</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  Department Office: Ground Floor, Block-B
                </span>
              </div>
            </div>

            {/* Digital Identity & Security Certificate */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Digital RFID Badge
                </h3>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Biometric UID:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>OIST-CSE-2023-8941</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Card Status:</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Active / Synced</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Gate Security:</span>
                  <span style={{ color: 'var(--text-primary)' }}>Turnstile NFC Clearance</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px' }}>
                <ShieldCheck size={14} color="var(--secondary)" />
                <span>OIST ERP 3.2 Secure Academic Cloud</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
