import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import RequestCard from '../../components/RequestCard';
import { FileText, AlertTriangle, CheckCircle2, Calendar, User, Clock, Download, FileSpreadsheet, Printer } from 'lucide-react';

export default function HodLeaveApproval() {
  const { leaveRequests, hodApproveLeave, hodRejectLeave } = useERP();
  const [tab, setTab] = useState('pending'); // pending | approved

  const isAccepted = (status) => {
    const s = String(status || '').toLowerCase();
    return s === 'approved' || s === 'completed';
  };

  const pendingLeaves = leaveRequests.filter(l => !isAccepted(l.status) && String(l.status || '').toLowerCase() !== 'rejected');
  const approvedLeaves = leaveRequests.filter(l => isAccepted(l.status));
  const directFallbackLeaves = pendingLeaves.filter((l) => l.tgUnavailable || l.status === 'pending_hod_direct');

  const handleExportLeavesCsv = () => {
    if (approvedLeaves.length === 0) return;
    const headers = ['Student Name', 'Roll No', 'Section', 'Semester', 'Leave Type', 'Duration & Dates', 'Days', 'Reason', 'Status', 'Date Approved'];
    const rows = approvedLeaves.map((l) => [
      `"${l.studentName || 'Student'}"`,
      `"${l.rollNo || l.enrollmentNo || ''}"`,
      `"${l.section || 'A'}"`,
      `"${l.semester || 5}"`,
      `"${l.leaveType || 'Casual'}"`,
      `"${l.dateRangeLabel || l.dates || ''}"`,
      `"${l.totalDays || 1}"`,
      `"${(l.reason || '').replace(/"/g, '""')}"`,
      `"APPROVED BY HOD"`,
      `"${new Date(l.updatedAt || l.createdAt || Date.now()).toLocaleDateString()}"`
    ]);
    const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `HOD_Approved_Leaves_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportLeavesExcel = () => {
    if (approvedLeaves.length === 0) return;
    const tableRows = approvedLeaves.map((l, i) => `
      <tr>
        <td style="text-align: center;">${i + 1}</td>
        <td><strong>${l.studentName || ''}</strong></td>
        <td>${l.rollNo || l.enrollmentNo || '—'}</td>
        <td>Section ${l.section || 'A'}</td>
        <td style="text-align: center;">Sem ${l.semester || 5}</td>
        <td>${l.leaveType || 'Casual'}</td>
        <td>${l.dateRangeLabel || l.dates || '—'}</td>
        <td style="text-align: center;">${l.totalDays || 1} day(s)</td>
        <td>${l.reason || ''}</td>
        <td style="color: #047857; font-weight: bold; text-align: center;">APPROVED BY HOD</td>
      </tr>
    `).join('');

    const excelTemplate = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta charset="utf-8">
        <style>
          table { border-collapse: collapse; width: 100%; font-family: Calibri, sans-serif; font-size: 11pt; }
          th { background-color: #047857; color: #FFFFFF; font-weight: bold; border: 1px solid #CBD5E1; padding: 8px 12px; }
          td { border: 1px solid #CBD5E1; padding: 6px 10px; }
          tr:nth-child(even) { background-color: #F8FAFC; }
        </style>
      </head>
      <body>
        <h2>Oriental Institute of Science & Technology (OIST) - Dept. of CSE</h2>
        <h3>Official Authoritative Student Leaves Register</h3>
        <p>Sanctioned and Signed by: Head of Department (HOD CSE) on ${new Date().toLocaleString()}</p>
        <table border="1">
          <thead>
            <tr>
              <th>#</th>
              <th>Student Name</th>
              <th>Roll / Enrollment</th>
              <th>Section</th>
              <th>Semester</th>
              <th>Leave Type</th>
              <th>Duration & Dates</th>
              <th>Days</th>
              <th>Reason</th>
              <th>Status</th>
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
    link.setAttribute('download', `HOD_Sanctioned_Leaves_${new Date().toISOString().split('T')[0]}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrintLeavesReport = () => {
    if (approvedLeaves.length === 0) return;
    const printWindow = window.open('', '_blank', 'width=950,height=750');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Official Sanctioned Student Leaves Report - OIST CSE</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 2rem; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #047857; padding-bottom: 1rem; margin-bottom: 1.5rem; }
            .logo-title { font-size: 18px; font-weight: 800; color: #047857; text-transform: uppercase; margin: 0; }
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
            <h2 style="font-size: 16px; margin: 12px 0 0 0; color: #0f172a;">Official Sanctioned Student Leaves Register</h2>
          </div>
          <div class="meta">
            <span>Date Generated: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}</span>
            <span>Authorized by: Head of Department (HOD CSE)</span>
            <span>Total Sanctioned: ${approvedLeaves.length} record(s)</span>
          </div>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Student Name</th>
                <th>Roll / Enrollment</th>
                <th>Class</th>
                <th>Leave Type</th>
                <th>Dates & Duration</th>
                <th>Reason</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${approvedLeaves.map((l, i) => `
                <tr>
                  <td>${i + 1}</td>
                  <td><strong>${l.studentName || ''}</strong></td>
                  <td><code>${l.rollNo || l.enrollmentNo || '—'}</code></td>
                  <td>Sec ${l.section || 'A'} (Sem ${l.semester || 5})</td>
                  <td>${l.leaveType || 'Casual'}</td>
                  <td>${l.dateRangeLabel || l.dates || '—'} (${l.totalDays || 1} day)</td>
                  <td>${l.reason || 'Approved by authority'}</td>
                  <td class="status">✓ SANCTIONED</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          <div class="footer">
            <div class="seal">Dean / Academic Cell Verified</div>
            <div class="seal">HOD Signature & Official Seal</div>
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="page-wrapper">
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)' }}>
              Leave Management & Clearance
            </h1>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
              Digital sign-off on 3-tier and direct-routed student leaves with authoritative approval ledger
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <button
              onClick={handleExportLeavesExcel}
              disabled={approvedLeaves.length === 0}
              className="btn btn-sm btn-outline-success"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: 'var(--radius-full)',
                padding: '0.4rem 0.85rem',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#FFFFFF'
              }}
              title="Download Sanctioned Leaves (Excel)"
            >
              <FileSpreadsheet size={14} className="text-emerald-600" />
              <span>Download Leaves (Excel)</span>
            </button>

            <button
              onClick={handlePrintLeavesReport}
              disabled={approvedLeaves.length === 0}
              className="btn btn-sm btn-outline-primary"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '5px',
                borderRadius: 'var(--radius-full)',
                padding: '0.4rem 0.85rem',
                fontSize: '12px',
                fontWeight: 600,
                backgroundColor: '#FFFFFF'
              }}
              title="Print official PDF report of approved leaves"
            >
              <Printer size={14} className="text-blue-600" />
              <span>PDF Report</span>
            </button>
          </div>
        </div>

        {/* Tab switchers */}
        <div
          style={{
            display: 'flex',
            backgroundColor: 'var(--surface-high)',
            borderRadius: 'var(--radius-full)',
            padding: '4px',
            gap: '4px',
            maxWidth: '460px'
          }}
        >
          <button
            onClick={() => setTab('pending')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: tab === 'pending' ? 700 : 500,
              backgroundColor: tab === 'pending' ? '#FFFFFF' : 'transparent',
              color: tab === 'pending' ? 'var(--primary)' : 'var(--text-secondary)',
              boxShadow: tab === 'pending' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease'
            }}
          >
            Awaiting Clearance ({pendingLeaves.length})
          </button>

          <button
            onClick={() => setTab('approved')}
            style={{
              flex: 1,
              padding: '0.5rem 1rem',
              borderRadius: 'var(--radius-full)',
              fontSize: '12px',
              fontWeight: tab === 'approved' ? 700 : 500,
              backgroundColor: tab === 'approved' ? '#FFFFFF' : 'transparent',
              color: tab === 'approved' ? 'var(--secondary)' : 'var(--text-secondary)',
              boxShadow: tab === 'approved' ? 'var(--shadow-sm)' : 'none',
              transition: 'all 0.15s ease',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '5px'
            }}
            id="tab-hod-approved-leaves"
          >
            <CheckCircle2 size={14} color={tab === 'approved' ? 'var(--secondary)' : 'currentColor'} />
            <span>Accepted Leaves ({approvedLeaves.length})</span>
          </button>
        </div>

        {/* Direct Routing Highlight Banner if in pending tab */}
        {tab === 'pending' && directFallbackLeaves.length > 0 && (
          <div
            style={{
              backgroundColor: 'var(--tertiary-container)',
              padding: '1rem',
              borderRadius: 'var(--radius-xl)',
              border: '1px solid #FDE68A',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem'
            }}
          >
            <AlertTriangle size={20} color="var(--tertiary)" style={{ flexShrink: 0 }} />
            <div>
              <h4 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--on-tertiary-container)' }}>
                Direct HOD Clearance Queue ({directFallbackLeaves.length} items)
              </h4>
              <p style={{ fontSize: '12px', color: 'var(--on-tertiary-container)', opacity: 0.9 }}>
                These leave applications were routed directly to you because the mentor/TG was marked on leave/unavailable.
              </p>
            </div>
          </div>
        )}

        {/* TAB 1: PENDING LEAVES */}
        {tab === 'pending' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
            {pendingLeaves.length === 0 ? (
              <div className="card text-center" style={{ padding: '2.5rem', color: 'var(--text-secondary)' }}>
                <FileText size={36} style={{ margin: '0 auto 0.75rem', opacity: 0.4 }} />
                <h3 style={{ fontSize: '15px', fontWeight: 600, color: 'var(--text-primary)' }}>No records found.</h3>
                <p style={{ fontSize: '13px', margin: '0.25rem 0 0' }}>No student leave applications awaiting clearance.</p>
              </div>
            ) : (
              pendingLeaves.map((req) => (
                <RequestCard
                  key={req.id}
                  request={req}
                  showActions={req.status !== 'completed' && req.status !== 'approved' && req.status !== 'rejected'}
                  role="hod"
                  onApprove={() => hodApproveLeave(req.id, req.status === 'pending_tg')}
                  onReject={() => hodRejectLeave(req.id)}
                />
              ))
            )}
          </div>
        )}

        {/* TAB 2: ACCEPTED / APPROVED LEAVES LIST */}
        {tab === 'approved' && (
          <div className="card" style={{ padding: '1rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <h3 style={{ fontSize: '16px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Accepted Student Leaves Ledger
                </h3>
                <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Officially sanctioned leaves synchronized with department attendance registers
                </span>
              </div>
              <span className="badge badge-emerald" style={{ fontSize: '12px', padding: '0.35rem 0.75rem' }}>
                {approvedLeaves.length} Sanctioned Leaves
              </span>
            </div>

            <div style={{ overflowX: 'auto', border: '1px solid var(--border-subtle)', borderRadius: 'var(--radius-lg)' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
                <thead>
                  <tr style={{ backgroundColor: 'var(--surface-low)', borderBottom: '1px solid var(--border-subtle)' }}>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Student Name</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Roll / Enrollment</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Leave Type</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Duration & Dates</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Reason</th>
                    <th style={{ padding: '0.75rem 1rem', fontWeight: 700, color: 'var(--text-primary)' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {approvedLeaves.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '2.5rem', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <CheckCircle2 size={32} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
                        <div style={{ fontWeight: 600, color: 'var(--text-primary)' }}>No approved leaves yet</div>
                        <div style={{ fontSize: '12px', marginTop: '2px' }}>
                          Approved student leave applications will appear here automatically.
                        </div>
                      </td>
                    </tr>
                  ) : (
                    approvedLeaves.map((lv, idx) => (
                      <tr
                        key={lv.id || idx}
                        style={{
                          borderBottom: '1px solid var(--border-subtle)',
                          backgroundColor: idx % 2 === 0 ? 'transparent' : 'rgba(248, 250, 252, 0.5)'
                        }}
                      >
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'block' }}>
                            {lv.studentName || 'Student'}
                          </span>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Section {lv.section || 'A'} • Sem {lv.semester || 5}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontFamily: 'monospace', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {lv.rollNo || lv.enrollmentNo || '—'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-emerald" style={{ fontSize: '11px' }}>
                            {lv.leaveType || 'Casual'}
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', fontSize: '12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600, color: 'var(--text-primary)' }}>
                            <Calendar size={13} style={{ color: 'var(--text-muted)' }} />
                            <span>{lv.dateRangeLabel || lv.dates || '—'}</span>
                          </div>
                          <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                            Total: {lv.totalDays || 1} day(s)
                          </span>
                        </td>
                        <td style={{ padding: '0.75rem 1rem', maxWidth: '240px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                          {lv.reason || 'Personal reasons approved'}
                        </td>
                        <td style={{ padding: '0.75rem 1rem' }}>
                          <span className="badge badge-emerald" style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px' }}>
                            <CheckCircle2 size={12} />
                            <span>Approved by HOD</span>
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
