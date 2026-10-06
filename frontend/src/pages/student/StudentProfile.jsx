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
  const { currentUser, subjects, dashboardData } = useERP();
  const student = currentUser || {};
  const sectionName = typeof student.section === 'object' && student.section !== null ? (student.section.name || 'A') : (student.section || 'A');

  const rollNumber = student.enrollment_no || student.rollNo || 'OIST-CSE-2023';
  const attendanceRate = student.attendance !== undefined ? student.attendance : (dashboardData?.attendanceRate || 0);

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
              <span className="badge badge-emerald">{student.status || 'Active Student'}</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginTop: '2px' }}>
              Oriental Institute of Science & Technology (OIST) • Computer Science & Engineering Registry
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span className="badge badge-indigo" style={{ padding: '0.35rem 0.75rem', fontSize: '12px' }}>
              Batch {student.batch || '2023-2027'}
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
                <div
                  style={{
                    width: '92px',
                    height: '92px',
                    borderRadius: 'var(--radius-2xl)',
                    backgroundColor: 'var(--primary-container)',
                    color: 'var(--primary)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    boxShadow: 'var(--shadow-md)',
                    border: '3px solid var(--surface-high)',
                    flexShrink: 0
                  }}
                  title={student.name}
                >
                  <User size={44} />
                </div>

                <div style={{ flex: 1, minWidth: '240px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <h2 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)' }}>
                      {student.name || 'Student Profile'}
                    </h2>
                    <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                      <CheckCircle2 size={12} /> Verified
                    </span>
                  </div>

                  <p style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 600, marginTop: '2px' }}>
                    {student.department || 'Computer Science & Engineering'}
                  </p>

                  <div style={{ display: 'flex', gap: '1.25rem', marginTop: '0.65rem', fontSize: '13px', color: 'var(--text-secondary)', flexWrap: 'wrap' }}>
                    <span><strong>Enrollment No:</strong> <span className="tabular-nums" style={{ color: 'var(--text-primary)' }}>{rollNumber}</span></span>
                    <span><strong>Section:</strong> <span style={{ color: 'var(--text-primary)' }}>{sectionName}</span></span>
                    <span><strong>Semester:</strong> <span style={{ color: 'var(--text-primary)' }}>{student.semester || 5}th Sem</span></span>
                    <span><strong>Academic Year:</strong> <span style={{ color: 'var(--primary)', fontWeight: 700 }}>{student.year || '3rd Year'}</span></span>
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
                  <div style={{ fontSize: '20px', fontWeight: 800, color: attendanceRate >= 75 ? 'var(--secondary)' : 'var(--error)', marginTop: '2px' }}>
                    {attendanceRate}%
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>
                    {attendanceRate >= 75 ? 'Exam Eligible (≥75%)' : 'Attendance Shortage Alert'}
                  </span>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Official Email
                  </span>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-all' }}>
                    {student.email || 'N/A'}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>OIST Institutional ID</span>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Contact Phone
                  </span>
                  <div style={{ fontSize: '14px', fontWeight: 800, color: 'var(--primary)', marginTop: '2px' }}>
                    {student.phone || 'Not Registered'}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Emergency Verified</span>
                </div>

                <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)' }}>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                    Enrollment Status
                  </span>
                  <div style={{ fontSize: '16px', fontWeight: 800, color: 'var(--secondary)', marginTop: '2px' }}>
                    {student.status || 'Active'}
                  </div>
                  <span style={{ fontSize: '10px', color: 'var(--text-secondary)' }}>Autonomous ERP Registry</span>
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
                  {subjects.length} Subjects in Department Scheme
                </span>
              </div>

              {subjects.length === 0 ? (
                <div className="text-center" style={{ padding: '1.5rem', color: 'var(--text-secondary)', fontSize: '13px' }}>
                  No courses registered for this semester yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
                  {subjects.map((sub) => (
                    <div
                      key={sub.code || sub.id}
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
                            Credits: {sub.credits || 4} • Semester {sub.semester}
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                        <span className="badge badge-slate" style={{ fontSize: '11px' }}>
                          Core Curriculum
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
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
                  Teacher Guardian (TG) / Mentor
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <User size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                    {student.tgName || 'Department Mentor Assigned'}
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {student.tgEmail || 'tg.cse@college.edu'}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--secondary)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                  <CheckCircle2 size={12} /> Assigned Mentor
                </span>
              </div>

              {/* HOD */}
              <div style={{ padding: '0.75rem', backgroundColor: 'var(--surface-low)', borderRadius: 'var(--radius-xl)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', textTransform: 'uppercase', fontWeight: 700 }}>
                  Head of Department (HOD)
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <GraduationCap size={16} color="var(--primary)" />
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)', fontSize: '13px' }}>
                    HOD CSE
                  </span>
                </div>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>hod.cse@college.edu</span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                  CSE Department Office, Block-B
                </span>
              </div>
            </div>

            {/* Digital Identity & Security Certificate */}
            <div className="card" style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', backgroundColor: '#F8FAFC' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <QrCode size={18} color="var(--primary)" />
                <h3 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Digital Identity Credentials
                </h3>
              </div>

              <div style={{ fontSize: '12px', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Enrollment ID:</span>
                  <span style={{ fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-primary)' }}>{rollNumber}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Database State:</span>
                  <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>Active / Synced</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Access Tier:</span>
                  <span style={{ color: 'var(--text-primary)' }}>Student Portal Role</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingTop: '0.5rem', borderTop: '1px solid var(--border-subtle)', color: 'var(--text-muted)', fontSize: '11px' }}>
                <ShieldCheck size={14} color="var(--secondary)" />
                <span>OIST ERP Relational Academic Cloud</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
