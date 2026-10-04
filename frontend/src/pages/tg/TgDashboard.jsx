import React, { useEffect, useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Link } from 'react-router-dom';
import QuickActions from '../../components/QuickActions';
import QuickDisplay from '../../components/QuickDisplay';
import { dashboardApi } from '../../api/dashboardApi';
import {
  PageHeader,
  StatCard,
  Card,
  Badge,
  Button,
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
  EmptyState
} from '../../components/common';
import {
  Users,
  AlertTriangle,
  FileText,
  CheckCircle2,
  Clock,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  RefreshCw,
  AlertCircle,
  BookOpen,
  FileSpreadsheet
} from 'lucide-react';

export default function TgDashboard() {
  const {
    currentUser,
    tgReviewAttendanceConsideration,
    tgReviewLeave,
    openModal
  } = useERP();

  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [actionProcessing, setActionProcessing] = useState(null);

  const fetchTgData = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardApi.getTgDashboard();
      if (res?.data) {
        setDashboard(res.data);
      }
    } catch (err) {
      setError(err.message || 'Unable to load TG mentor data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTgData();
  }, []);

  const mentor = dashboard?.mentor || currentUser || {};
  const mentees = dashboard?.mentees || [];
  const pendingLeaves = dashboard?.pendingLeaves || [];
  const pendingAttendance = dashboard?.pendingAttendance || [];
  const totalPending = pendingLeaves.length + pendingAttendance.length;

  const handleRecommendAttendance = async (id) => {
    setActionProcessing(id);
    try {
      await tgReviewAttendanceConsideration(id, 'Recommended by TG: Verified attendance credit.');
      fetchTgData();
    } finally {
      setActionProcessing(null);
    }
  };

  const handleRecommendLeave = async (id) => {
    setActionProcessing(id);
    try {
      await tgReviewLeave(id, true);
      fetchTgData();
    } finally {
      setActionProcessing(null);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <PageHeader
          title="Mentor & TG Dashboard"
          description={`Teacher Guardian: ${mentor?.name || 'Mentor'} • ${mentees.length} Mentees Under Direct Supervision`}
          badge={<Badge variant="primary" size="sm">Section {mentor?.assignedSection || 'A'}</Badge>}
          actions={
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal('googleSheet')}
                id="btn-tg-google-sheet"
                leftIcon={<FileSpreadsheet size={14} className="text-emerald-600" />}
                rightIcon={
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE
                  </span>
                }
              >
                Live Google Sheet
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={fetchTgData}
                disabled={loading}
                loading={loading}
                leftIcon={<RefreshCw size={13} />}
              >
                Refresh
              </Button>

              <Link
                to="/teacher"
                className="btn btn-outline text-xs py-2 px-3 flex items-center gap-1.5"
              >
                <BookOpen size={14} className="text-primary-600" />
                <span>My Teaching Classes</span>
              </Link>
            </div>
          }
        />

        {/* Loading and Error states */}
        {loading && (
          <div className="p-8 text-center text-slate-500 card flex flex-col items-center justify-center gap-2">
            <div className="spinner-border text-primary" role="status" style={{ width: '2rem', height: '2rem' }} />
            <span className="text-xs font-semibold">Loading Mentor & Student Records...</span>
          </div>
        )}

        {error && (
          <div className="p-4 rounded-2xl bg-danger-50 border border-danger-200 text-danger-800 text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle size={18} className="text-danger-600 shrink-0" />
              <span>{error}</span>
            </div>
            <Button variant="primary" size="sm" onClick={fetchTgData}>
              Try Again
            </Button>
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Quick Actions Bar */}
            <QuickActions role="tg" />

            {/* Quick Display Widget */}
            <QuickDisplay />

            {/* Metrics */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <StatCard
                title="Assigned Mentees"
                value={mentees.length}
                icon={<Users size={20} />}
                variant="primary"
                subtitle={`Section ${mentor.assignedSection || 'Unassigned'}`}
              />

              <StatCard
                title="Pending Verifications"
                value={totalPending}
                icon={<Clock size={20} />}
                variant={totalPending > 0 ? 'warning' : 'neutral'}
                subtitle="Requires TG Review"
              />

              <StatCard
                title="Mentorship Cohort"
                value="Active"
                icon={<Sparkles size={20} />}
                variant="success"
                subtitle="Semester 5 Direct Batch"
              />
            </div>

            {/* Pending Requests for TG Review */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-amber-600" />
                  <h3 className="text-sm font-bold text-slate-900 m-0">
                    Pending Student Requests Awaiting TG Review ({totalPending})
                  </h3>
                </div>
                <Badge variant={totalPending > 0 ? 'warning' : 'neutral'} size="xs">
                  {totalPending} Action Needed
                </Badge>
              </div>

              {totalPending === 0 ? (
                <EmptyState
                  title="No Pending Verifications"
                  description="All student requests in your mentorship group have been reviewed."
                />
              ) : (
                <div className="flex flex-col gap-2.5">
                  {/* Attendance Considerations */}
                  {pendingAttendance.map((req) => (
                    <div key={req.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{req.studentName}</span>
                          <Badge variant="primary" size="xs">{req.rollNo}</Badge>
                          <Badge variant="warning" size="xs">Attendance Consideration</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 mb-0">{req.reason || req.title}</p>
                      </div>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleRecommendAttendance(req.id)}
                        disabled={actionProcessing === req.id}
                        loading={actionProcessing === req.id}
                      >
                        Recommend to HOD
                      </Button>
                    </div>
                  ))}

                  {/* Leave Applications */}
                  {pendingLeaves.map((leave) => (
                    <div key={leave.id} className="p-3.5 rounded-xl border border-slate-200 bg-white flex items-center justify-between flex-wrap gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-slate-900">{leave.studentName}</span>
                          <Badge variant="primary" size="xs">{leave.rollNo}</Badge>
                          <Badge variant="purple" size="xs">{leave.leaveType || 'Leave'}</Badge>
                        </div>
                        <p className="text-xs text-slate-600 mt-1 mb-0">{leave.reason || leave.title}</p>
                      </div>
                      <Button
                        variant="primary"
                        size="xs"
                        onClick={() => handleRecommendLeave(leave.id)}
                        disabled={actionProcessing === leave.id}
                        loading={actionProcessing === leave.id}
                      >
                        Recommend to HOD
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>

            {/* Mentees Directory Table */}
            <Card>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-primary-600" />
                  <h3 className="text-sm font-bold text-slate-900 m-0">Mentees Under Supervision</h3>
                </div>
                <Badge variant="neutral" size="xs">{mentees.length} Enrolled</Badge>
              </div>

              {mentees.length === 0 ? (
                <EmptyState
                  title="No Mentees Assigned"
                  description="No students have been assigned to your mentorship group yet."
                />
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Enrollment No.</TableHead>
                      <TableHead>Student Name</TableHead>
                      <TableHead>Section</TableHead>
                      <TableHead>Batch</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {mentees.map((st) => (
                      <TableRow key={st.id}>
                        <TableCell className="font-bold text-primary-600 font-mono">{st.enrollment_no}</TableCell>
                        <TableCell className="text-slate-900 font-semibold">{st.name}</TableCell>
                        <TableCell className="text-slate-600">{st.section}</TableCell>
                        <TableCell className="text-slate-500">{st.batch}</TableCell>
                        <TableCell>
                          <Badge variant="success" size="xs" dot>{st.status || 'Active'}</Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </Card>
          </>
        )}
      </div>
    </div>
  );
}
