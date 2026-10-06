import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import GoogleSheetSyncModal from '../../components/modals/GoogleSheetSyncModal';
import { PageHeader, Badge, Button, Card, EmptyState } from '../../components/common';
import {
  Compass,
  Filter,
  Zap,
  ShieldCheck,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckSquare,
  Radio,
  Sparkles
} from 'lucide-react';

const getApprovedPeriodDetails = (request) => {
  if (request.type !== 'attendance_consideration') {
    return { count: '—', timing: '—' };
  }

  const periods = Array.isArray(request.selectedPeriods)
    ? request.selectedPeriods
    : Array.isArray(request.periods)
      ? request.periods
      : [];
  const count = request.approvedPeriodsCount ?? request.periodsCount ?? (periods.length || '—');
  const timing = request.periodsTiming || (periods.length
    ? periods.map((period) => (
      typeof period === 'object' ? period?.time || period?.label || period?.id || '' : period
    )).filter(Boolean).join(', ')
    : '—');

  return { count, timing };
};

export default function HodRequestsCentral() {
  const {
    attendanceRequests,
    leaveRequests,
    attendanceQueries,
    hodApproveAttendanceConsideration,
    hodRejectAttendanceConsideration,
    hodApproveLeave,
    hodRejectLeave,
    hodApproveAttendanceQuery,
    hodRejectAttendanceQuery,
    addToast
  } = useERP();

  const [filter, setFilter] = useState('all');
  const [showGoogleSheetModal, setShowGoogleSheetModal] = useState(false);
  const [periodAdjustments, setPeriodAdjustments] = useState({});

  const allRequests = [
    ...attendanceRequests.map((r) => ({ ...r, type: 'attendance_consideration' })),
    ...leaveRequests.map((l) => ({ ...l, type: 'leave_request' })),
    ...attendanceQueries.map((q) => ({
      ...q,
      title: `Attendance Query: ${q.subjectName || q.subject || 'Dispute'}`,
      type: 'attendance_query'
    }))
  ];

  const isAccepted = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'approved' || s === 'completed' || s === 'approved_by_hod';
  };

  const isAwaitingHod = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'pending_hod' || s === 'pending_hod_direct' || s === 'recommended_by_tg';
  };

  const isPendingTg = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'pending' || s === 'pending_tg';
  };

  const allAccepted = allRequests.filter((r) => isAccepted(r.status));

  const filtered = allRequests.filter((r) => {
    if (filter === 'pending') return isAwaitingHod(r.status);
    if (filter === 'bypass') return isPendingTg(r.status);
    if (filter === 'leaves') return r.type === 'leave_request';
    if (filter === 'considerations') return r.type === 'attendance_consideration';
    if (filter === 'approved') return isAccepted(r.status);
    return true;
  });

  // Multi-format Approved Clearance Downloads
  const handleExportCsv = (list = allAccepted) => {
    if (!list || list.length === 0) {
      addToast?.('No Records', 'There are no approved requests to export.', 'warning');
      return;
    }
    const headers = ['Request ID', 'Student / Faculty', 'Roll / Enrollment', 'Request Category', 'Dates / Duration', 'Periods Approved', 'Time Interval', 'Reason / Subject', 'Status', 'Date Approved'];
    const rows = list.map((r) => {
      const { count, timing } = getApprovedPeriodDetails(r);
      return [
        `"${r.id || ''}"`,
        `"${r.studentName || r.applicantName || 'Student'}"`,
        `"${r.rollNo || r.enrollmentNo || '—'}"`,
        `"${r.type === 'attendance_consideration' ? 'Attendance Consideration' : r.type === 'leave_request' ? `Student Leave (${r.leaveType || 'General'})` : 'Attendance Dispute Query'}"`,
        `"${r.dateRangeLabel || r.dates || r.date || r.startDate || '—'}"`,
        `"${count}"`,
        `"${String(timing).replace(/"/g, '""')}"`,
        `"${(r.reason || r.title || '').replace(/"/g, '""')}"`,
        `"APPROVED BY HOD"`,
        `"${new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString()}"`
      ];
    });
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HOD_Cleared_Requests_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast?.('CSV Export Complete', `Downloaded ${list.length} approved record(s) as CSV.`, 'success');
  };

  const handleExportExcel = (list = allAccepted) => {
    if (!list || list.length === 0) {
      addToast?.('No Records', 'There are no approved requests to export.', 'warning');
      return;
    }
    const tableRows = list.map((r, i) => {
      const { count, timing } = getApprovedPeriodDetails(r);
      return `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td>#${r.id || ''}</td>
        <td><strong>${r.studentName || r.applicantName || 'Student'}</strong></td>
        <td>${r.rollNo || r.enrollmentNo || '—'}</td>
        <td>${r.type === 'attendance_consideration' ? 'Attendance Consideration' : r.type === 'leave_request' ? `Student Leave (${r.leaveType || 'General'})` : 'Attendance Dispute'}</td>
        <td>${r.dateRangeLabel || r.dates || r.date || r.startDate || '—'}</td>
        <td>${count}</td>
        <td>${timing}</td>
        <td>${r.reason || r.title || ''}</td>
        <td style="color: #047857; font-weight: bold; text-align: center;">APPROVED</td>
        <td>${new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString()}</td>
      </tr>
    `;
    }).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Calibri, sans-serif; font-size: 11pt; }
          th { background-color: #1E40AF; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 8px 12px; }
          td { border: 1px solid #CBD5E1; padding: 6px 10px; }
          tr:nth-child(even) { background-color: #F8FAFC; }
        </style>
      </head>
      <body>
        <h2>Oriental Institute of Science & Technology (OIST) - Dept. of CSE</h2>
        <h3>Official Approved Clearances & Sanctioned Requests Ledger</h3>
        <p>Generated on: ${new Date().toLocaleString()} | Authorized by: Head of Department (HOD CSE)</p>
        <table border="1">
          <thead>
            <tr>
              <th>#</th>
              <th>Request ID</th>
              <th>Applicant Name</th>
              <th>Roll / Enrollment</th>
              <th>Category</th>
              <th>Period / Dates</th>
              <th>Periods Approved</th>
              <th>Time Interval</th>
              <th>Reason / Particulars</th>
              <th>Status</th>
              <th>Date Sanctioned</th>
            </tr>
          </thead>
          <tbody>
            ${tableRows}
          </tbody>
        </table>
      </body>
      </html>
    `;
    const blob = new Blob([excelTemplate], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HOD_Cleared_Requests_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    addToast?.('Excel Export Complete', `Downloaded ${list.length} approved record(s) as Excel file.`, 'success');
  };

  const handlePrintReport = (list = allAccepted) => {
    if (!list || list.length === 0) {
      addToast?.('No Records', 'There are no approved requests to print.', 'warning');
      return;
    }
    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Department Clearances Ledger - OIST CSE</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 2rem; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #1e40af; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .logo-title { font-size: 18px; font-weight: 800; color: #1e40af; text-transform: uppercase; margin: 0; }
            .sub { font-size: 12px; color: #64748b; margin-top: 4px; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 1rem; font-size: 12px; font-weight: 600; color: #475569; }
            table { width: 100%; border-collapse: collapse; font-size: 12px; }
            th { background-color: #f1f5f9; border: 1px solid #cbd5e1; padding: 8px; text-align: left; font-weight: 700; }
            td { border: 1px solid #cbd5e1; padding: 8px; }
            tr:nth-child(even) { background-color: #f8fafc; }
            .status { color: #047857; font-weight: 700; }
            .footer { margin-top: 3.5rem; display: flex; justify-content: space-between; font-size: 12px; font-weight: 600; }
            .seal { border-top: 1px dashed #94a3b8; width: 220px; text-align: center; padding-top: 8px; }
            @media print { button { display: none; } }
          </style>
        </head>
        <body>
          <div class="header">
            <h1 class="logo-title">Oriental Institute of Science & Technology (OIST)</h1>
            <div class="sub">Department of Computer Science & Engineering • CampusFlow ERP</div>
            <h2 style="font-size: 16px; margin: 12px 0 0 0; color: #0f172a;">Official Approved Clearances & Sanctioned Requests Ledger</h2>
          </div>
          <div class="meta">
            <span>Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
            <span>Authorized by: Head of Department (HOD CSE)</span>
            <span>Total Sanctioned: ${list.length} record(s)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Applicant</th>
                <th>Roll / ID</th>
                <th>Category</th>
                <th>Duration / Dates</th>
                <th>Reason / Subject</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${list.map((r, i) => {
                const { count, timing } = getApprovedPeriodDetails(r);
                return `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.studentName || r.applicantName || 'Student'}</strong></td>
                  <td>${r.rollNo || r.enrollmentNo || '—'}</td>
                  <td>${r.type === 'attendance_consideration' ? 'Attendance Consideration' : r.type === 'leave_request' ? `Leave (${r.leaveType || 'General'})` : 'Dispute Correction'}</td>
                  <td>${r.dateRangeLabel || r.dates || r.date || r.startDate || '—'}</td>
                  <td>${count}</td>
                  <td>${timing}</td>
                  <td>${r.reason || r.title || ''}</td>
                  <td class="status">APPROVED</td>
                </tr>
              `;
              }).join('')}
            </tbody>
          </table>
          <div class="footer">
            <div class="seal">Department ERP Coordinator</div>
            <div class="seal">Head of Department (HOD CSE)<br><span style="font-size: 10px; color: #64748b;">(Digital Authentication Signature)</span></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const handleApproveAction = async (req, customPeriods) => {
    try {
      const finalPeriods = customPeriods ?? periodAdjustments[req.id] ?? req.periodsCount ?? 4;
      if (req.type === 'attendance_consideration') {
        await hodApproveAttendanceConsideration(req.id, req.status === 'pending_tg', {
          approvedPeriodsCount: finalPeriods,
          comments: `Sanctioned by HOD CSE: ${finalPeriods} consideration lecture periods credited.`
        });
      } else if (req.type === 'leave_request' || req.leaveType) {
        await hodApproveLeave(req.id, req.status === 'pending_tg');
      } else {
        await hodApproveAttendanceQuery(req.id);
      }
      addToast?.(
        'Request Cleared',
        `Approval recorded successfully${req.type === 'attendance_consideration' ? ` (${finalPeriods} consideration periods sanctioned)` : ''}.`,
        'success'
      );
    } catch (err) {
      addToast?.('Action Failed', err.message || 'Could not record approval.', 'error');
    }
  };

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        {/* Top Header with Multi-Format Download Buttons */}
        <PageHeader
          title="Department Requests & Approvals Central"
          description="Central repository of attendance considerations, student leave applications, and attendance dispute queries with direct TG bypass authority."
          badge={<Badge variant="purple" size="sm">HOD Digital Sign-off</Badge>}
          actions={
            <div className="flex items-center gap-2 flex-wrap">
              {/* Google Live Sheet Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowGoogleSheetModal(true)}
                id="btn-requests-google-live-sheet"
                leftIcon={<FileSpreadsheet size={15} className="text-emerald-600" />}
                rightIcon={
                  <span className="flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse" />
                    LIVE
                  </span>
                }
              >
                Google Live Sheet
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportExcel()}
                disabled={allAccepted.length === 0}
                id="btn-requests-download-excel"
                leftIcon={<FileSpreadsheet size={15} className="text-emerald-600" />}
                rightIcon={<Badge variant="success" size="xs">{allAccepted.length}</Badge>}
              >
                Export Excel
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handleExportCsv()}
                disabled={allAccepted.length === 0}
                id="btn-requests-download-csv"
                leftIcon={<Download size={15} />}
              >
                CSV
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePrintReport()}
                disabled={allAccepted.length === 0}
                id="btn-requests-print-report"
                leftIcon={<Printer size={15} className="text-primary-600" />}
              >
                Print Report
              </Button>
            </div>
          }
        />

        {/* Filter Pills */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Requests (${allRequests.length})` },
            { id: 'pending', label: `Awaiting HOD Sign-off (${allRequests.filter((r) => isAwaitingHod(r.status)).length})` },
            { id: 'bypass', label: `⚡ Direct Bypass Queue (${allRequests.filter((r) => isPendingTg(r.status)).length})` },
            { id: 'leaves', label: `Leave Applications (${allRequests.filter((r) => r.type === 'leave_request').length})` },
            { id: 'considerations', label: `Considerations (${allRequests.filter((r) => r.type === 'attendance_consideration').length})` },
            { id: 'approved', label: `Cleared & Synced (${allAccepted.length})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className={`py-1.5 px-3 rounded-lg text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                filter === f.id
                  ? 'bg-primary text-white border-primary shadow-xs font-bold'
                  : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-900'
              }`}
              id={`filter-pill-${f.id}`}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Dedicated Banner when Approved Tab is Selected */}
        {filter === 'approved' && (
          <div
            style={{
              padding: '0.85rem 1.25rem',
              backgroundColor: '#ECFDF5',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #A7F3D0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '0.75rem'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <CheckCircle2 size={20} className="text-emerald-600" />
              <div>
                <h4 style={{ fontSize: '13px', fontWeight: 700, color: '#065F46', margin: 0 }}>
                  Official Approved & Synced Clearances Register ({filtered.length} records)
                </h4>
                <p style={{ fontSize: '11px', color: '#047857', margin: '2px 0 0 0' }}>
                  All sanctioned leaves, duty considerations, and dispute corrections ready for spreadsheet export and departmental auditing.
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={() => setShowGoogleSheetModal(true)}
                className="btn btn-sm btn-outline-success"
                style={{ fontSize: '11px', fontWeight: 700, backgroundColor: '#FFFFFF' }}
              >
                <FileSpreadsheet size={13} className="me-1 text-emerald-600" />
                Live Google Sheet
              </button>
              <button
                onClick={() => handleExportExcel(filtered)}
                className="btn btn-sm btn-success"
                style={{ fontSize: '11px', fontWeight: 700 }}
              >
                <FileSpreadsheet size={13} className="me-1" />
                Export Selected (Excel)
              </button>
              <button
                onClick={() => handleExportCsv(filtered)}
                className="btn btn-sm btn-outline-success"
                style={{ fontSize: '11px', fontWeight: 700, background: '#FFFFFF' }}
              >
                <Download size={13} className="me-1" />
                Export CSV
              </button>
            </div>
          </div>
        )}

        {/* List with Interactive Actions enabled */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {filtered.length === 0 ? (
            <div className="card text-center p-8 text-slate-400 text-xs">
              No requests match the selected filter.
            </div>
          ) : (
            filtered.map((req) => {
              const normStatus = String(req.status || '').toLowerCase();
              const isActionable = !['completed', 'approved', 'rejected', 'approved_by_hod'].includes(normStatus);
              const isConsideration = req.type === 'attendance_consideration';
              const currentPeriods = periodAdjustments[req.id] ?? req.periodsCount ?? 4;

              return (
                <div key={req.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                  <RequestCard
                    request={{
                      ...req,
                      periodsCount: currentPeriods,
                      approvedPeriodsCount: req.approvedPeriodsCount || (normStatus === 'approved' ? currentPeriods : undefined)
                    }}
                    showActions={isActionable}
                    role="hod"
                    onApprove={() => handleApproveAction(req, currentPeriods)}
                    onReject={() => {
                      if (req.type === 'attendance_consideration') {
                        hodRejectAttendanceConsideration(req.id);
                      } else if (req.type === 'leave_request' || req.leaveType) {
                        hodRejectLeave(req.id);
                      } else if (req.type === 'attendance_query') {
                        hodRejectAttendanceQuery(req.id);
                      }
                    }}
                  />

                  {/* HOD Consideration Authority Stepper */}
                  {isConsideration && isActionable && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '0.65rem 1rem',
                        backgroundColor: '#FAF5FF',
                        border: '1px solid #E9D5FF',
                        borderRadius: 'var(--radius-xl)',
                        flexWrap: 'wrap',
                        gap: '0.65rem'
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px' }}>
                        <Sparkles size={16} className="text-purple-600 shrink-0" />
                        <div>
                          <span style={{ fontWeight: 800, color: '#581C87' }}>HOD Consideration Control: </span>
                          <span style={{ color: '#7E22CE' }}>
                            Increase or decrease sanctioned periods to be credited for this activity
                          </span>
                        </div>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontSize: '11px', color: '#6B21A8', fontWeight: 600 }}>Sanctioned Periods:</span>
                        <div style={{ display: 'inline-flex', alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: '8px', border: '1px solid #D8B4FE', padding: '2px' }}>
                          <button
                            type="button"
                            onClick={() => {
                              if (currentPeriods > 1) {
                                setPeriodAdjustments((prev) => ({ ...prev, [req.id]: currentPeriods - 1 }));
                              }
                            }}
                            className="btn btn-xs"
                            style={{ width: '26px', height: '26px', padding: 0, fontWeight: 800, color: '#7E22CE', borderRadius: '6px' }}
                            title="Decrease period count"
                          >
                            –
                          </button>
                          <span
                            style={{
                              minWidth: '42px',
                              textAlign: 'center',
                              fontWeight: 800,
                              fontSize: '12.5px',
                              color: '#581C87',
                              padding: '0 4px'
                            }}
                          >
                            {currentPeriods}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              if (currentPeriods < 14) {
                                setPeriodAdjustments((prev) => ({ ...prev, [req.id]: currentPeriods + 1 }));
                              }
                            }}
                            className="btn btn-xs"
                            style={{ width: '26px', height: '26px', padding: 0, fontWeight: 800, color: '#7E22CE', borderRadius: '6px' }}
                            title="Increase period count"
                          >
                            +
                          </button>
                        </div>
                        <span style={{ fontSize: '10.5px', color: '#7E22CE', fontWeight: 600 }}>Period{currentPeriods > 1 ? 's' : ''}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* Google Live Sheet Sync Modal */}
      {showGoogleSheetModal && (
        <GoogleSheetSyncModal
          onClose={() => setShowGoogleSheetModal(false)}
          totalApprovedCount={allAccepted.length}
        />
      )}
    </div>
  );
}
