import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import { dashboardApi } from '../../api/dashboardApi';
import { leaveApi } from '../../api/leaveApi';
import {
  ShieldCheck,
  Users,
  CheckSquare,
  Sparkles,
  ArrowRight,
  Activity,
  Calendar,
  AlertTriangle,
  Bot,
  Zap,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  Clock,
  UserCheck,
  UserMinus,
  Check,
  BookOpen,
  Layers,
  ChevronRight,
  Download,
  FileSpreadsheet
} from 'lucide-react';

export default function HodDashboard() {
  const {
    currentUser,
    dashboardData,
    hodApproveAttendanceConsideration,
    hodRejectAttendanceConsideration,
    hodApproveAttendanceQuery,
    hodApproveLeave,
    hodRejectLeave,
    approveLeaveDirectly,
    rejectLeaveDirectly,
    approveConsiderationDirectly,
    rejectConsiderationDirectly,
    addToast
  } = useERP();

  const [dashboard, setDashboard] = useState(dashboardData || null);
  const [facultyAvailability, setFacultyAvailability] = useState(dashboardData?.facultyAvailability || []);
  const [loading, setLoading] = useState(!dashboardData);
  const [error, setError] = useState(null);
  const [actionProcessing, setActionProcessing] = useState(null);

  // Leave & AI Substitution States
  const [isHodOnLeave, setIsHodOnLeave] = useState(false);
  const [togglingHodLeave, setTogglingHodLeave] = useState(false);
  const [selectedAbsentTeacher, setSelectedAbsentTeacher] = useState(null);
  const [substituteProposals, setSubstituteProposals] = useState([]);
  const [loadingProposals, setLoadingProposals] = useState(false);
  const [chosenSubstitutes, setChosenSubstitutes] = useState({}); // slotId -> substituteTeacherId

  const fetchHodData = async () => {
    if (!dashboard) setLoading(true);
    setError(null);
    try {
      const dashRes = await dashboardApi.getHodDashboard();

      if (dashRes?.data) {
        setDashboard(dashRes.data);
        const teachers = dashRes.data.facultyAvailability || [];
        setFacultyAvailability(teachers);
        
        // Check if HOD is on leave
        const hodInList = teachers.find(
          (t) => t.id === currentUser?.id || t.email === currentUser?.email
        );
        if (hodInList) {
          setIsHodOnLeave(hodInList.status === 'ON_LEAVE');
        }
      }
    } catch (err) {
      setError(err.message || 'Unable to load HOD departmental data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHodData();
  }, []);

  const totalStudents = dashboard?.totalStudentsCount !== undefined ? dashboard.totalStudentsCount : 0;
  const totalFaculty = facultyAvailability.length > 0 ? facultyAvailability.length : (dashboard?.totalFacultyCount || 0);
  const avgAttendance = dashboard?.departmentAverageAttendance !== undefined ? dashboard.departmentAverageAttendance : 0;
  const pendingApprovals = dashboard?.pendingApprovals || { leaves: [], attendanceConsiderations: [], attendanceQueries: [] };
  const pendingLeaves = pendingApprovals.leaves || [];
  const pendingAttendance = pendingApprovals.attendanceConsiderations || [];
  const pendingQueries = pendingApprovals.attendanceQueries || [];
  const totalPending = pendingLeaves.length + pendingAttendance.length + pendingQueries.length;

  // On leave calculations
  const teachersOnLeave = facultyAvailability.filter((t) => t.status === 'ON_LEAVE');
  const teachersAvailable = facultyAvailability.filter((t) => t.status !== 'ON_LEAVE');

  // HOD Self-Leave Toggle
  const handleToggleHodLeave = async () => {
    const teacherId = currentUser?.teacherId || currentUser?.id;
    if (!teacherId) return;
    setTogglingHodLeave(true);
    try {
      const nextStatus = !isHodOnLeave;
      await leaveApi.toggleLeave(teacherId, {
        onLeave: nextStatus,
        reason: nextStatus ? 'HOD marked on leave from departmental portal' : ''
      });
      setIsHodOnLeave(nextStatus);
      addToast(
        nextStatus ? 'HOD Status: On Leave' : 'HOD Status: Available',
        nextStatus
          ? 'You are now marked on leave today. Department notified.'
          : 'You are now marked available today.',
        nextStatus ? 'warning' : 'success'
      );
      fetchHodData();
    } catch (err) {
      addToast('Status Update Failed', err.message || 'Could not update status.', 'error');
    } finally {
      setTogglingHodLeave(false);
    }
  };

  // 1-Click HOD Toggle of Any Teacher's Leave Status
  const [togglingTeacherId, setTogglingTeacherId] = useState(null);

  const handleToggleTeacherLeave = async (fId, currentOnLeave, teacherName) => {
    try {
      setTogglingTeacherId(fId);
      const nextStatus = !currentOnLeave;
      await leaveApi.toggleLeave(fId, {
        onLeave: nextStatus,
        reason: nextStatus ? 'Marked on leave by HOD via Departmental Dashboard' : ''
      });

      // Optimistic update of local availability state
      setFacultyAvailability((prev) =>
        prev.map((f) => {
          if (f.id === fId) {
            return {
              ...f,
              status: nextStatus ? 'ON_LEAVE' : 'AVAILABLE',
              availability_status: nextStatus ? 'On Leave' : 'Available'
            };
          }
          return f;
        })
      );

      addToast(
        nextStatus ? 'Teacher Marked On Leave' : 'Teacher Marked Available',
        `${teacherName || 'Faculty member'} is now marked ${nextStatus ? 'ON LEAVE 🔴' : 'AVAILABLE 🟢'} for today.`,
        nextStatus ? 'warning' : 'success'
      );

      // Refresh availability & dashboard metrics
      const availRes = await leaveApi.getFacultyAvailability();
      if (availRes?.faculty) {
        setFacultyAvailability(availRes.faculty);
      }
    } catch (err) {
      addToast('Error Toggling Status', err.message || 'Unable to update teacher leave status.', 'error');
    } finally {
      setTogglingTeacherId(null);
    }
  };

  // AI Substitution Proposals fetch
  const handleLoadSubstituteProposals = async (teacher) => {
    setSelectedAbsentTeacher(teacher);
    setLoadingProposals(true);
    setSubstituteProposals([]);
    try {
      const res = await leaveApi.proposeSubstitutes(teacher.id, '');
      const props = res?.proposals || [];
      setSubstituteProposals(props);
      // Pre-select recommended top choice for each slot
      const initialChoices = {};
      props.forEach((p) => {
        if (p.recommendedSubstitute?.teacherId) {
          initialChoices[p.slotId] = p.recommendedSubstitute.teacherId;
        }
      });
      setChosenSubstitutes(initialChoices);
      if (props.length === 0) {
        addToast('No Class Clashes', `${teacher.name} has no scheduled timetable slots today.`, 'info');
      }
    } catch (err) {
      addToast('AI Proposals Failed', err.message || 'Could not calculate substitutes.', 'error');
    } finally {
      setLoadingProposals(false);
    }
  };

  // 1-Click HOD Approval of AI Substitution
  const handleApproveSubstitute = async (proposal) => {
    const chosenTeacherId = chosenSubstitutes[proposal.slotId] || proposal.recommendedSubstitute?.teacherId;
    if (!chosenTeacherId) {
      addToast('Selection Missing', 'Please select a substitute teacher for this class.', 'warning');
      return;
    }

    setActionProcessing(proposal.slotId);
    try {
      await leaveApi.applySubstitute({
        slotId: proposal.slotId,
        originalTeacherId: selectedAbsentTeacher.id,
        substituteTeacherId: chosenTeacherId,
        reason: 'HOD approved AI substitute recommendation'
      });

      addToast(
        'Substitution Confirmed',
        `Timetable slot updated successfully. Replacement teacher assigned.`,
        'success'
      );

      // Refresh proposal list
      const res = await leaveApi.proposeSubstitutes(selectedAbsentTeacher.id, '');
      setSubstituteProposals(res?.proposals || []);
      fetchHodData();
    } catch (err) {
      addToast('Approval Failed', err.message || 'Could not update timetable slot.', 'error');
    } finally {
      setActionProcessing(null);
    }
  };

  // Request Approval Handlers
  const handleApproveDuty = async (id) => {
    setActionProcessing(id);
    try {
      await hodApproveAttendanceConsideration(id);
      fetchHodData();
    } finally {
      setActionProcessing(null);
    }
  };

  const handleApproveLeave = async (id) => {
    setActionProcessing(id);
    try {
      await hodApproveLeave(id);
      fetchHodData();
    } finally {
      setActionProcessing(null);
    }
  };

  const handleApproveQuery = async (id) => {
    setActionProcessing(id);
    try {
      await hodApproveAttendanceQuery(id);
      fetchHodData();
    } finally {
      setActionProcessing(null);
    }
  };

  return (
    <div className="container-fluid py-4" style={{ maxWidth: '1440px', margin: '0 auto' }}>
      <div className="d-flex flex-column gap-4">
        {/* Header */}
        <div className="d-flex justify-content-between align-items-center flex-wrap gap-3">
          <div>
            <div className="d-flex align-items-center gap-2">
              <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                Dept. of Computer Science & Engineering
              </h2>
              <span className="badge bg-primary-subtle text-primary border border-primary-subtle">HOD Office</span>
            </div>
            <p style={{ fontSize: '13px', color: '#64748B', margin: '4px 0 0 0' }}>
              Head of Department: {currentUser?.name || 'Dr. Alok Verma'} • Academic Governance & AI Timetable Engine
            </p>
          </div>

          <div className="d-flex align-items-center gap-2">
            {/* HOD Self-Leave Toggle Switch */}
            <button
              id="btn-hod-self-leave-toggle"
              onClick={handleToggleHodLeave}
              disabled={togglingHodLeave}
              className="btn btn-sm d-inline-flex align-items-center gap-2"
              style={{
                borderRadius: '30px',
                fontWeight: 700,
                fontSize: '12px',
                border: isHodOnLeave ? '2px solid #EF4444' : '2px solid #10B981',
                backgroundColor: isHodOnLeave ? '#FEE2E2' : '#ECFDF5',
                color: isHodOnLeave ? '#991B1B' : '#065F46',
                padding: '6px 16px',
                boxShadow: isHodOnLeave ? '0 0 12px rgba(239, 68, 68, 0.25)' : '0 0 12px rgba(16, 185, 129, 0.25)',
                cursor: togglingHodLeave ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
              title="Click to toggle your departmental availability status for today"
            >
              <span style={{ fontSize: '14px', lineHeight: 1 }}>{isHodOnLeave ? '🔴' : '🟢'}</span>
              <span>{isHodOnLeave ? 'Duty Status: On Leave' : 'Duty Status: Available'}</span>
              <span style={{ fontSize: '10px', opacity: 0.75, paddingLeft: '2px' }}>
                ({togglingHodLeave ? 'Updating...' : 'Toggle'})
              </span>
            </button>

            <button
              onClick={fetchHodData}
              disabled={loading}
              className="btn btn-outline-secondary btn-sm d-inline-flex align-items-center gap-1"
              style={{ borderRadius: '8px' }}
            >
              <RefreshCw size={14} className={loading ? 'fa-spin' : ''} />
              <span>Refresh</span>
            </button>

            <Link
              to="/hod/timetable?view=current"
              className="btn btn-outline-primary btn-sm d-inline-flex align-items-center gap-1"
              style={{ borderRadius: '8px', fontWeight: 600 }}
              id="btn-hod-current-timetable-header"
              title="View current active departmental timetable"
            >
              <Calendar size={14} />
              <span>Current Timetable</span>
            </Link>

            <Link
              to="/hod/timetable?view=generator"
              className="btn btn-primary btn-sm d-inline-flex align-items-center gap-1"
              style={{ borderRadius: '8px', fontWeight: 600 }}
              id="btn-hod-ai-generator-header"
              title="Open AI Timetable Generator & Scheduler"
            >
              <Sparkles size={14} />
              <span>AI Timetable Generator</span>
            </Link>
          </div>
        </div>

        {/* Loading and Error states */}
        {loading && (
          <div className="card p-5 text-center text-muted d-flex flex-column align-items-center justify-content-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span style={{ fontSize: '13px', fontWeight: 600 }}>Loading Departmental Overview from Database...</span>
          </div>
        )}

        {error && (
          <div className="alert alert-danger d-flex align-items-center justify-content-between" style={{ borderRadius: '10px' }}>
            <div className="d-flex align-items-center gap-2">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
            <button onClick={fetchHodData} className="btn btn-sm btn-primary">Try Again</button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Quick Actions Bar */}
            <QuickActions role="hod" />

            {/* Quick Display Widget */}
            <QuickDisplay />

            {/* --- COMPACT STATUS CARDS (SECTION 15 SPECIFICATION) --- */}
            <div className="row g-3">
              <div className="col-lg-3 col-md-4 col-sm-6">
                <div className="card p-3 h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 p-2 bg-primary-subtle text-primary">
                      <UserCheck size={22} />
                    </div>
                    <div>
                      <div className="text-muted small">Total Teachers</div>
                      <div className="h4 fw-bold mb-0 text-dark">{totalFaculty}</div>
                      <div className="small text-muted" style={{ fontSize: '11px' }}>Department Faculty</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-4 col-sm-6">
                <div className="card p-3 h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className={`rounded-3 p-2 ${teachersOnLeave.length > 0 ? 'bg-danger-subtle text-danger' : 'bg-success-subtle text-success'}`}>
                      <UserMinus size={22} />
                    </div>
                    <div>
                      <div className="text-muted small">Teachers On Leave Today</div>
                      <div className="h4 fw-bold mb-0 text-dark">{teachersOnLeave.length}</div>
                      <div className="small" style={{ fontSize: '11px', color: teachersOnLeave.length > 0 ? '#DC2626' : '#16A34A' }}>
                        {teachersOnLeave.length > 0 ? 'Replacements Required' : 'All Teachers Present'}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-4 col-sm-6">
                <div className="card p-3 h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 p-2 bg-info-subtle text-info">
                      <Users size={22} />
                    </div>
                    <div>
                      <div className="text-muted small">Total Students</div>
                      <div className="h4 fw-bold mb-0 text-dark">{totalStudents}</div>
                      <div className="small text-muted" style={{ fontSize: '11px' }}>Enrolled CSE Batches</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-4 col-sm-6">
                <div className="card p-3 h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 p-2 bg-indigo-subtle text-indigo">
                      <BookOpen size={22} />
                    </div>
                    <div>
                      <div className="text-muted small">Active Subjects</div>
                      <div className="h4 fw-bold mb-0 text-dark">5</div>
                      <div className="small text-muted" style={{ fontSize: '11px' }}>Semester 5 Curriculum</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-4 col-sm-6">
                <div className="card p-3 h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 p-2 bg-warning-subtle text-warning">
                      <Clock size={22} />
                    </div>
                    <div>
                      <div className="text-muted small">Today's Classes</div>
                      <div className="h4 fw-bold mb-0 text-dark">7 Slots</div>
                      <div className="small text-muted" style={{ fontSize: '11px' }}>Active Daily Periods</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-4 col-sm-6">
                <div className="card p-3 h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 p-2 bg-success-subtle text-success">
                      <Calendar size={22} />
                    </div>
                    <div>
                      <div className="text-muted small">Timetable Status</div>
                      <div className="h5 fw-bold mb-0 text-success">Published</div>
                      <div className="small text-muted" style={{ fontSize: '11px' }}>Mon–Sat Dynamic Grid</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-4 col-sm-6">
                <div className="card p-3 h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className={`rounded-3 p-2 ${totalPending > 0 ? 'bg-amber-subtle text-amber' : 'bg-light text-muted'}`}>
                      <CheckSquare size={22} />
                    </div>
                    <div>
                      <div className="text-muted small">Pending Clearances</div>
                      <div className="h4 fw-bold mb-0 text-dark">{totalPending}</div>
                      <div className="small text-warning" style={{ fontSize: '11px' }}>Requires HOD Action</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="col-lg-3 col-md-4 col-sm-6">
                <div className="card p-3 h-100 shadow-sm" style={{ borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div className="d-flex align-items-center gap-3">
                    <div className="rounded-3 p-2 bg-primary-subtle text-primary">
                      <Activity size={22} />
                    </div>
                    <div>
                      <div className="text-muted small">Average Attendance</div>
                      <div className="h4 fw-bold mb-0 text-primary">{avgAttendance}%</div>
                      <div className="small text-muted" style={{ fontSize: '11px' }}>Department Aggregate</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* --- AI TEACHER REPLACEMENT & AFFECTED CLASSES ALERT PANEL --- */}
            {teachersOnLeave.length > 0 && (
              <div className="card border-warning shadow-sm" style={{ borderRadius: '14px', backgroundColor: '#FFFBEB' }}>
                <div className="card-header bg-transparent border-bottom p-3 d-flex justify-content-between align-items-center">
                  <div className="d-flex align-items-center gap-2">
                    <AlertTriangle size={20} className="text-warning" />
                    <h5 className="fw-bold mb-0 text-dark">
                      Leave Intelligence: Faculty On Leave Today ({teachersOnLeave.length})
                    </h5>
                  </div>
                  <span className="badge bg-warning text-dark fw-bold">AI Substitution Engine Ready</span>
                </div>

                <div className="card-body p-4">
                  <p className="text-muted small mb-3">
                    The following teachers are marked <strong>ON LEAVE 🔴</strong> for today. Click below to inspect their scheduled classes and allow the AI engine to recommend eligible substitute teachers with zero conflicts.
                  </p>

                  <div className="d-flex flex-wrap gap-2 mb-4">
                    {teachersOnLeave.map((teacher) => (
                      <button
                        key={teacher.id}
                        onClick={() => handleLoadSubstituteProposals(teacher)}
                        className={`btn btn-sm d-inline-flex align-items-center gap-2 ${
                          selectedAbsentTeacher?.id === teacher.id ? 'btn-dark' : 'btn-outline-dark'
                        }`}
                        style={{ borderRadius: '8px', padding: '8px 14px' }}
                      >
                        <span style={{ fontSize: '12px' }}>🔴</span>
                        <span className="fw-bold">{teacher.name}</span>
                        <span className="badge bg-secondary" style={{ fontSize: '11px' }}>{teacher.designation || 'Faculty'}</span>
                        <ChevronRight size={14} />
                      </button>
                    ))}
                  </div>

                  {/* Proposals View for Selected Absent Teacher */}
                  {selectedAbsentTeacher && (
                    <div className="p-3 bg-white rounded border">
                      <div className="d-flex justify-content-between align-items-center mb-3">
                        <div className="fw-bold text-dark">
                          Affected Classes for <span className="text-danger">{selectedAbsentTeacher.name}</span> today:
                        </div>
                        {loadingProposals && <span className="text-muted small fa-spin">Evaluating candidates...</span>}
                      </div>

                      {substituteProposals.length === 0 && !loadingProposals ? (
                        <div className="text-muted small p-3 text-center">
                          No active timetable classes scheduled for {selectedAbsentTeacher.name} today.
                        </div>
                      ) : (
                        <div className="table-responsive">
                          <table className="table table-sm table-bordered align-middle mb-0 small">
                            <thead className="table-light">
                              <tr>
                                <th>Class Time</th>
                                <th>Subject</th>
                                <th>Target Section</th>
                                <th>Classroom</th>
                                <th>AI Recommended Substitute</th>
                                <th>Alternate Candidates</th>
                                <th className="text-center" style={{ width: '150px' }}>HOD Action</th>
                              </tr>
                            </thead>
                            <tbody>
                              {substituteProposals.map((prop) => (
                                <tr key={prop.slotId}>
                                  <td className="fw-bold">{prop.time || `Period ${prop.period}`}</td>
                                  <td>
                                    <div className="fw-semibold">{prop.subject}</div>
                                    <div className="text-muted" style={{ fontSize: '11px' }}>{prop.subjectCode}</div>
                                  </td>
                                  <td>Sec {prop.section || 'A'}</td>
                                  <td>{prop.room || 'CR-101'}</td>
                                  <td>
                                    {prop.recommendedSubstitute ? (
                                      <div>
                                        <div className="fw-bold text-primary">{prop.recommendedSubstitute.name}</div>
                                        <div className="d-flex gap-1 mt-1">
                                          <span className="badge bg-success-subtle text-success" style={{ fontSize: '10px' }}>
                                            Confidence: {prop.recommendedSubstitute.score}%
                                          </span>
                                          {prop.recommendedSubstitute.subjectMatch && (
                                            <span className="badge bg-info-subtle text-info" style={{ fontSize: '10px' }}>
                                              Subject Match
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    ) : (
                                      <span className="text-danger small">No candidate available in slot</span>
                                    )}
                                  </td>
                                  <td>
                                    {prop.alternateCandidates && prop.alternateCandidates.length > 0 ? (
                                      <select
                                        className="form-select form-select-sm"
                                        value={chosenSubstitutes[prop.slotId] || prop.recommendedSubstitute?.teacherId || ''}
                                        onChange={(e) => setChosenSubstitutes({ ...chosenSubstitutes, [prop.slotId]: e.target.value })}
                                        style={{ fontSize: '12px' }}
                                      >
                                        {prop.recommendedSubstitute && (
                                          <option value={prop.recommendedSubstitute.teacherId}>
                                            ⭐ {prop.recommendedSubstitute.name} (Recommended)
                                          </option>
                                        )}
                                        {prop.alternateCandidates.map((c) => (
                                          <option key={c.teacherId} value={c.teacherId}>
                                            {c.name} ({c.score}%)
                                          </option>
                                        ))}
                                      </select>
                                    ) : (
                                      <span className="text-muted small">None available</span>
                                    )}
                                  </td>
                                  <td className="text-center">
                                    <button
                                      onClick={() => handleApproveSubstitute(prop)}
                                      disabled={actionProcessing === prop.slotId || !prop.recommendedSubstitute}
                                      className="btn btn-sm btn-success d-inline-flex align-items-center gap-1"
                                      style={{ fontWeight: 600, fontSize: '12px' }}
                                    >
                                      <Check size={14} />
                                      <span>{actionProcessing === prop.slotId ? 'Updating...' : 'Approve Substitute'}</span>
                                    </button>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* --- FACULTY AVAILABILITY ROSTER --- */}
            <div className="card shadow-sm" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div className="card-header bg-white p-3 border-bottom d-flex justify-content-between align-items-center">
                <div className="d-flex align-items-center gap-2">
                  <UserCheck size={18} className="text-primary" />
                  <h5 className="fw-bold mb-0 text-dark">Faculty Availability Status Today</h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <span className="badge bg-success-subtle text-success border border-success-subtle">
                    🟢 {teachersAvailable.length} Available
                  </span>
                  <span className="badge bg-danger-subtle text-danger border border-danger-subtle">
                    🔴 {teachersOnLeave.length} On Leave
                  </span>
                </div>
              </div>

              <div className="table-responsive">
                <table className="table table-hover align-middle mb-0" style={{ fontSize: '13px' }}>
                  <thead className="table-light">
                    <tr>
                      <th style={{ padding: '12px 16px' }}>Faculty Member</th>
                      <th>Designation</th>
                      <th>Email & Contact</th>
                      <th>Weekly Workload</th>
                      <th>Today's Duty Status</th>
                      <th style={{ textAlign: 'right', paddingRight: '16px' }}>Quick Leave Toggle</th>
                    </tr>
                  </thead>
                  <tbody>
                    {facultyAvailability.length === 0 ? (
                      <tr><td colSpan="6" className="text-center py-4 text-muted">No faculty records found</td></tr>
                    ) : (
                      facultyAvailability.map((f) => {
                        const onLeave = f.status === 'ON_LEAVE';
                        const isToggling = togglingTeacherId === f.id;
                        return (
                          <tr key={f.id}>
                            <td style={{ padding: '12px 16px' }}>
                              <div className="fw-bold text-dark">{f.name}</div>
                              <div className="text-muted small">{f.employeeId || 'Faculty'}</div>
                            </td>
                            <td>{f.designation || 'Assistant Professor'}</td>
                            <td>{f.email || 'N/A'}</td>
                            <td><span className="badge bg-light text-dark border">{f.maxWeeklyWorkload || 18} hrs/wk</span></td>
                            <td>
                              <span
                                className={`badge ${
                                  onLeave ? 'bg-danger text-white' : 'bg-success text-white'
                                }`}
                                style={{ padding: '6px 12px', fontSize: '12px', borderRadius: '16px' }}
                              >
                                {onLeave ? '🔴 On Leave Today' : '🟢 Available Today'}
                              </span>
                            </td>
                            <td style={{ textAlign: 'right', paddingRight: '16px' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-end' }}>
                                <button
                                  type="button"
                                  onClick={() => handleToggleTeacherLeave(f.id, onLeave, f.name)}
                                  disabled={isToggling}
                                  className="btn btn-sm"
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '5px 12px',
                                    borderRadius: '20px',
                                    fontSize: '11px',
                                    fontWeight: 700,
                                    cursor: isToggling ? 'not-allowed' : 'pointer',
                                    transition: 'all 0.2s',
                                    border: onLeave ? '1.5px solid #10B981' : '1.5px solid #EF4444',
                                    backgroundColor: onLeave ? '#ECFDF5' : '#FEF2F2',
                                    color: onLeave ? '#065F46' : '#991B1B'
                                  }}
                                  title={`Click to mark ${f.name} as ${onLeave ? 'Available' : 'On Leave'}`}
                                >
                                  <span>{onLeave ? '🟢 Set Available' : '🔴 Set On Leave'}</span>
                                  {isToggling && <RefreshCw size={11} className="animate-spin" />}
                                </button>

                                {onLeave && (
                                  <button
                                    type="button"
                                    onClick={() => handleLoadSubstituteProposals(f)}
                                    className="btn btn-sm btn-primary"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '4px',
                                      padding: '5px 10px',
                                      borderRadius: '8px',
                                      fontSize: '11px',
                                      fontWeight: 600
                                    }}
                                    title="Inspect affected classes and AI substitute suggestions"
                                  >
                                    <Sparkles size={12} />
                                    <span>AI Substitutes</span>
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pending Requests & Clearances Requiring HOD Action */}
            <div className="card flex flex-col gap-3 shadow-sm p-4" style={{ borderRadius: '14px', border: '1px solid #E2E8F0' }}>
              <div className="d-flex align-items-center justify-content-between mb-2 flex-wrap gap-2">
                <div className="d-flex align-items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 d-flex align-items-center justify-content-center p-2 rounded">
                    <Clock size={18} />
                  </div>
                  <h5 className="fw-bold text-dark mb-0">
                    Awaiting HOD Digital Clearances ({totalPending})
                  </h5>
                </div>
                <div className="d-flex align-items-center gap-2">
                  <Link
                    to="/hod/approvals?tab=approved"
                    className="btn btn-outline-success btn-sm d-inline-flex align-items-center gap-1"
                    style={{ borderRadius: '8px', fontSize: '12px', fontWeight: 600, background: '#FFFFFF' }}
                    id="btn-hod-download-approved"
                    title="View and download all accepted student requests and sanctioned leaves"
                  >
                    <Download size={13} />
                    <span>Download Approved Lists</span>
                  </Link>
                  <Link to="/hod/requests" className="small text-primary fw-bold text-decoration-none">
                    Clearance Archive →
                  </Link>
                </div>
              </div>

              {totalPending === 0 ? (
                <div className="p-4 text-center text-muted small bg-light rounded">
                  No records found. All requests are cleared.
                </div>
              ) : (
                <div className="d-flex flex-column gap-2">
                  {/* Attendance Considerations */}
                  {pendingAttendance.map((req) => (
                    <div key={req.id} className="p-3 rounded border bg-white d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small text-dark">{req.studentName}</span>
                          <span className="badge bg-primary-subtle text-primary">{req.rollNo}</span>
                          <span className="badge bg-warning-subtle text-warning">Duty Attendance</span>
                        </div>
                        <p className="small text-muted mt-1 mb-0">{req.reason || req.title}</p>
                        <span className="small text-muted" style={{ fontSize: '11px' }}>Date Range: {req.dateRangeLabel || req.startDate}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          onClick={() => handleApproveDuty(req.id)}
                          disabled={actionProcessing === req.id}
                          className="btn btn-sm btn-success"
                        >
                          {actionProcessing === req.id ? 'Approving...' : 'Approve Credit'}
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Leave Requests */}
                  {pendingLeaves.map((leave) => (
                    <div key={leave.id} className="p-3 rounded border bg-white d-flex align-items-center justify-content-between flex-wrap gap-3">
                      <div>
                        <div className="d-flex align-items-center gap-2">
                          <span className="fw-bold small text-dark">{leave.applicantName || leave.studentName}</span>
                          <span className="badge bg-primary-subtle text-primary">{leave.rollNo || 'Faculty'}</span>
                          <span className="badge bg-danger-subtle text-danger">{leave.applicantType || 'Leave'}</span>
                        </div>
                        <p className="small text-muted mt-1 mb-0">{leave.reason}</p>
                        <span className="small text-muted" style={{ fontSize: '11px' }}>Period: {leave.startDate} to {leave.endDate}</span>
                      </div>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          onClick={() => handleApproveLeave(leave.id)}
                          disabled={actionProcessing === leave.id}
                          className="btn btn-sm btn-success"
                        >
                          {actionProcessing === leave.id ? 'Approving...' : 'Approve Leave'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
