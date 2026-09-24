import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  X,
  User,
  CheckSquare,
  Award,
  FileText,
  MessageSquare,
  Clock,
  ShieldCheck,
  AlertTriangle,
  Mail,
  Phone,
  BookOpen
} from 'lucide-react';

export default function StudentDetailModal({ data, onClose }) {
  const { students, subjects, assignments, submissions, feedbackList, leaveRequests } = useERP();

  const student = data?.student || students[0];
  const [activeTab, setActiveTab] = useState('attendance'); // 'attendance', 'academics', 'assignments', 'feedback', 'requests'

  // Student specific data
  const studentFeedback = feedbackList.filter((fb) => fb.studentRoll === student?.rollNo);
  const studentSubmissions = submissions.filter((sub) => sub.rollNo === student?.rollNo);
  const studentLeaves = leaveRequests.filter((l) => l.rollNo === student?.rollNo);

  if (!student) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '640px', width: '92%', maxHeight: '90vh' }}
      >
        {/* Header Profile Summary */}
        <div className="flex items-start justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white font-bold text-lg flex items-center justify-center shadow-sm">
              {student.name.split(' ').map((n) => n[0]).join('')}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 leading-snug">{student.name}</h3>
                <span className={`badge ${student.attendance >= 75 ? 'badge-emerald' : 'badge-rose'} text-[11px]`}>
                  {student.attendance}% Attendance
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Roll: <strong className="text-slate-700">{student.rollNo}</strong> • Section CSE-3A • CGPA: <strong className="text-blue-600">{student.cgpa}</strong>
              </p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold mt-3 overflow-x-auto">
          {[
            { id: 'attendance', label: 'Attendance' },
            { id: 'academics', label: 'Academics & CGPA' },
            { id: 'assignments', label: `Assignments (${studentSubmissions.length})` },
            { id: 'feedback', label: `Faculty Feedback (${studentFeedback.length})` },
            { id: 'requests', label: `Leave Records (${studentLeaves.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-3 rounded-lg transition-all whitespace-nowrap ${
                activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="py-3 overflow-y-auto" style={{ maxHeight: '380px' }}>
          {/* TAB 1: ATTENDANCE */}
          {activeTab === 'attendance' && (
            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Aggregate</span>
                  <div className={`text-2xl font-extrabold ${student.attendance >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                    {student.attendance}%
                  </div>
                  <span className="text-[10px] text-slate-400">Min. req: 75%</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Status</span>
                  <div className={`text-sm font-bold mt-1.5 ${student.attendance >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {student.attendance >= 75 ? 'Safe Standing' : 'Shortage Warning'}
                  </div>
                  <span className="text-[10px] text-slate-400">Advisory active</span>
                </div>
                <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200">
                  <span className="text-[10px] text-slate-500 uppercase font-bold">Classes Attended</span>
                  <div className="text-2xl font-extrabold text-blue-600">
                    78 <span className="text-xs text-slate-400 font-normal">/ 109</span>
                  </div>
                  <span className="text-[10px] text-slate-400">Across 5 subjects</span>
                </div>
              </div>

              <div className="flex flex-col gap-2 mt-1">
                <span className="text-xs font-bold text-slate-800">Subject-Wise Breakdown</span>
                {subjects.map((sub) => {
                  const pct = Math.round((sub.attended / sub.totalHeld) * 100);
                  return (
                    <div key={sub.id} className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                      <div className="min-w-0">
                        <span className="font-bold text-slate-800 truncate block">{sub.name}</span>
                        <span className="text-[11px] text-slate-500">{sub.code} • {sub.faculty}</span>
                      </div>
                      <div className="text-right shrink-0">
                        <span className={`font-bold ${pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>{pct}%</span>
                        <span className="text-[10px] text-slate-400 block">{sub.attended}/{sub.totalHeld} classes</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* TAB 2: ACADEMICS */}
          {activeTab === 'academics' && (
            <div className="flex flex-col gap-3 text-xs">
              <div className="bg-blue-50/70 p-3 rounded-xl border border-blue-200 flex items-center justify-between">
                <div>
                  <span className="text-[11px] text-blue-700 font-medium">Cumulative Grade Point Average</span>
                  <div className="text-2xl font-extrabold text-blue-900">{student.cgpa} / 10.0</div>
                </div>
                <span className="badge badge-indigo text-xs">Top 10% in CSE-3A</span>
              </div>

              <div className="grid grid-cols-2 gap-2 mt-1">
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Semester 5 SGPA</span>
                  <span className="text-base font-bold text-slate-800">8.65</span>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                  <span className="text-slate-500 block text-[10px] uppercase font-bold">Semester 4 SGPA</span>
                  <span className="text-base font-bold text-slate-800">8.22</span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                <span className="font-bold text-slate-800">Mid-Term Assessment Scores (Internal Marks)</span>
                <div className="flex items-center justify-between text-slate-600 border-b border-slate-100 py-1">
                  <span>Data Structures & Algorithms</span>
                  <strong className="text-slate-900">27 / 30</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 border-b border-slate-100 py-1">
                  <span>Database Management Systems</span>
                  <strong className="text-slate-900">25 / 30</strong>
                </div>
                <div className="flex items-center justify-between text-slate-600 py-1">
                  <span>Operating Systems</span>
                  <strong className="text-slate-900">24 / 30</strong>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: ASSIGNMENTS */}
          {activeTab === 'assignments' && (
            <div className="flex flex-col gap-2 text-xs">
              {studentSubmissions.length === 0 ? (
                <div className="text-center py-6 text-slate-400">No submitted assignments recorded.</div>
              ) : (
                studentSubmissions.map((sub) => (
                  <div key={sub.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800 text-sm">{sub.assignmentTitle}</span>
                      <span className="badge badge-emerald text-[10px]">Graded: {sub.marks}/{sub.totalMarks}</span>
                    </div>
                    <span className="text-slate-500 text-[11px]">Submitted {sub.submittedAt} • File: {sub.fileName}</span>
                    {sub.feedback && (
                      <div className="mt-1 p-2 bg-emerald-50 rounded-lg text-emerald-800 text-[11px]">
                        <strong>Faculty Feedback:</strong> {sub.feedback}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 4: FACULTY FEEDBACK */}
          {activeTab === 'feedback' && (
            <div className="flex flex-col gap-2 text-xs">
              {studentFeedback.length === 0 ? (
                <div className="text-center py-6 text-slate-400">No observations recorded by faculty yet.</div>
              ) : (
                studentFeedback.map((fb) => (
                  <div key={fb.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{fb.teacherName}</span>
                      <span className="badge badge-indigo text-[10px]">{fb.category}</span>
                    </div>
                    <p className="text-slate-600 mt-1">{fb.feedback}</p>
                    <span className="text-[10px] text-slate-400 mt-1">{fb.date}</span>
                  </div>
                ))
              )}
            </div>
          )}

          {/* TAB 5: REQUESTS / LEAVES */}
          {activeTab === 'requests' && (
            <div className="flex flex-col gap-2 text-xs">
              {studentLeaves.length === 0 ? (
                <div className="text-center py-6 text-slate-400">No student leave requests on file.</div>
              ) : (
                studentLeaves.map((lv) => (
                  <div key={lv.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col gap-1">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-800">{lv.title}</span>
                      <span className={`badge ${lv.status === 'completed' ? 'badge-emerald' : 'badge-amber'} text-[10px]`}>
                        {lv.status}
                      </span>
                    </div>
                    <span className="text-slate-500">{lv.dateRangeLabel} • {lv.leaveType}</span>
                    <p className="text-slate-600 mt-1">"{lv.reason}"</p>
                  </div>
                ))
              )}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex justify-end">
          <button onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
