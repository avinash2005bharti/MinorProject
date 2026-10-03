import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
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
  CheckSquare
} from 'lucide-react';

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
    addToast
  } = useERP();

  const [filter, setFilter] = useState('all');

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
    const headers = ['Request ID', 'Student / Faculty', 'Roll / Enrollment', 'Request Category', 'Dates / Duration', 'Reason / Subject', 'Status', 'Date Approved'];
    const rows = list.map((r) => [
      `"${r.id || ''}"`,
      `"${r.studentName || r.applicantName || 'Student'}"`,
      `"${r.rollNo || r.enrollmentNo || '—'}"`,
      `"${r.type === 'attendance_consideration' ? 'Attendance Consideration' : r.type === 'leave_request' ? `Student Leave (${r.leaveType || 'General'})` : 'Attendance Dispute Query'}"`,
      `"${r.dateRangeLabel || r.dates || r.date || r.startDate || '—'}"`,
      `"${(r.reason || r.title || '').replace(/"/g, '""')}"`,
      `"APPROVED BY HOD"`,
      `"${new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString()}"`
    ]);
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
    const tableRows = list.map((r, i) => `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td>#${r.id || ''}</td>
        <td><strong>${r.studentName || r.applicantName || 'Student'}</strong></td>
        <td>${r.rollNo || r.enrollmentNo || '—'}</td>
        <td>${r.type === 'attendance_consideration' ? 'Attendance Consideration' : r.type === 'leave_request' ? `Student Leave (${r.leaveType || 'General'})` : 'Attendance Dispute'}</td>
        <td>${r.dateRangeLabel || r.dates || r.date || r.startDate || '—'}</td>
        <td>${r.reason || r.title || ''}</td>
        <td style="color: #047857; font-weight: bold; text-align: center;">APPROVED</td>
        <td>${new Date(r.updatedAt || r.createdAt || Date.now()).toLocaleDateString()}</td>
      </tr>
    `).join('');

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
              ${list.map((r, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${r.studentName || r.applicantName || 'Student'}</strong></td>
                  <td>${r.rollNo || r.enrollmentNo || '—'}</td>
                  <td>${r.type === 'attendance_consideration' ? 'Attendance Consideration' : r.type === 'leave_request' ? `Leave (${r.leaveType || 'General'})` : 'Dispute Correction'}</td>
                  <td>${r.dateRangeLabel || r.dates || r.date || r.startDate || '—'}</td>
                  <td>${r.reason || r.title || ''}</td>
                  <td class="status">APPROVED</td>
                </tr>
              `).join('')}
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

  const handleApproveAction = async (req) => {
    try {
      if (req.type === 'attendance_consideration') {
        await hodApproveAttendanceConsideration(req.id, req.status === 'pending_tg');
      } else if (req.type === 'leave_request' || req.leaveType) {
        await hodApproveLeave(req.id, req.status === 'pending_tg');
      } else {
        await hodApproveAttendanceQuery(req.id);
      }
      addToast?.(
        'Request Cleared',
        'Approval recorded successfully. You can download the updated approved list anytime from the top bar.',
        'success'
      );
    } catch (err) {
      addToast?.('Action Failed', err.message || 'Could not record approval.', 'error');
    }
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {/* Top Header with Multi-Format Download Buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
                Department Requests & Approvals Central
              </h1>
              <span className="badge badge-indigo">HOD Digital Sign-off</span>
            </div>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Central repository of attendance considerations, student leave applications, and attendance dispute queries with direct TG bypass authority
            </p>
          </div>

          {/* Quick Downloads Toolbar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <button
              onClick={() => handleExportExcel()}
              disabled={allAccepted.length === 0}
              className="btn btn-sm btn-outline-success"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: 'var(--radius-lg)',
                padding: '0.45rem 0.85rem',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#FFFFFF'
              }}
              id="btn-requests-download-excel"
              title="Download all approved clearances in Excel format"
            >
              <FileSpreadsheet size={15} className="text-emerald-600" />
              <span>Download Approved (Excel)</span>
              <span className="badge badge-emerald" style={{ fontSize: '10px' }}>{allAccepted.length}</span>
            </button>

            <button
              onClick={() => handleExportCsv()}
              disabled={allAccepted.length === 0}
              className="btn btn-sm btn-outline"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: 'var(--radius-lg)',
                padding: '0.45rem 0.85rem',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#FFFFFF'
              }}
              id="btn-requests-download-csv"
              title="Download all approved clearances in CSV format"
            >
              <Download size={15} />
              <span>Download CSV</span>
            </button>

            <button
              onClick={() => handlePrintReport()}
              disabled={allAccepted.length === 0}
              className="btn btn-sm btn-outline-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                borderRadius: 'var(--radius-lg)',
                padding: '0.45rem 0.85rem',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#FFFFFF'
              }}
              id="btn-requests-print-report"
              title="Print or Save PDF report of approved requests"
            >
              <Printer size={15} className="text-blue-600" />
              <span>Print Report</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '0.4rem', overflowX: 'auto', paddingBottom: '2px' }}>
          {[
            { id: 'all', label: `All Requests (${allRequests.length})` },
            { id: 'pending', label: `Awaiting HOD Sign-off (${allRequests.filter((r) => isAwaitingHod(r.status)).length})` },
            { id: 'bypass', label: `⚡ In TG Queue / Direct Bypass (${allRequests.filter((r) => isPendingTg(r.status)).length})` },
            { id: 'leaves', label: `Leave Applications (${allRequests.filter((r) => r.type === 'leave_request').length})` },
            { id: 'considerations', label: `Considerations (${allRequests.filter((r) => r.type === 'attendance_consideration').length})` },
            { id: 'approved', label: `Cleared & Synced (${allAccepted.length})` }
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => setFilter(f.id)}
              className="btn btn-sm"
              style={{
                backgroundColor: filter === f.id ? 'var(--primary)' : '#FFFFFF',
                color: filter === f.id ? '#FFFFFF' : 'var(--text-secondary)',
                border: filter === f.id ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                fontSize: '12px',
                fontWeight: filter === f.id ? 700 : 500,
                boxShadow: filter === f.id ? '0 2px 6px rgba(29, 78, 216, 0.2)' : 'var(--shadow-sm)'
              }}
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
            filtered.map((req) => (
              <RequestCard
                key={req.id}
                request={req}
                showActions={req.status !== 'completed' && req.status !== 'approved' && req.status !== 'rejected'}
                role="hod"
                onApprove={() => handleApproveAction(req)}
                onReject={() => {
                  if (req.type === 'attendance_consideration') {
                    hodRejectAttendanceConsideration(req.id);
                  } else if (req.type === 'leave_request' || req.leaveType) {
                    hodRejectLeave(req.id);
                  }
                }}
              />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
