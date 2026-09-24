import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  BookOpen,
  Calendar,
  Clock,
  FileText,
  Upload,
  CheckCircle2,
  AlertCircle,
  Download,
  Filter,
  Award
} from 'lucide-react';

export default function StudentAssignments() {
  const { assignments, submissions, openModal, currentUser } = useERP();
  const [filter, setFilter] = useState('all'); // 'all', 'pending', 'submitted', 'graded'

  // Student specific submissions
  const studentSubmissionsMap = {};
  submissions
    .filter((s) => s.rollNo === currentUser.rollNo || s.studentId === currentUser.id)
    .forEach((s) => {
      studentSubmissionsMap[s.assignmentId] = s;
    });

  const studentAssignments = assignments.filter((a) => {
    // Show assignments for user's section
    return !a.section || a.section === currentUser.section;
  });

  const filteredAssignments = studentAssignments.filter((a) => {
    const subm = studentSubmissionsMap[a.id];
    if (filter === 'pending') return !subm;
    if (filter === 'submitted') return subm && subm.status !== 'graded';
    if (filter === 'graded') return subm && subm.status === 'graded';
    return true;
  });

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Coursework & Assignments</h1>
              <span className="badge badge-indigo">Section {currentUser.section}</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Submit programming assignments, lab archives & view faculty grading
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-500">
              Total: <strong>{studentAssignments.length}</strong> Courseworks
            </span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {[
            { id: 'all', label: `All Assignments (${studentAssignments.length})` },
            { id: 'pending', label: `Pending Submission (${studentAssignments.filter((a) => !studentSubmissionsMap[a.id]).length})` },
            { id: 'submitted', label: `Submitted (${studentAssignments.filter((a) => studentSubmissionsMap[a.id] && studentSubmissionsMap[a.id].status !== 'graded').length})` },
            { id: 'graded', label: `Graded & Evaluated (${studentAssignments.filter((a) => studentSubmissionsMap[a.id]?.status === 'graded').length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`py-1.5 px-3.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                filter === tab.id
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Assignments List */}
        <div className="flex flex-col gap-4">
          {filteredAssignments.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <BookOpen size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-semibold">No assignments found for this filter.</p>
            </div>
          ) : (
            filteredAssignments.map((asg) => {
              const subm = studentSubmissionsMap[asg.id];
              const isSubmitted = !!subm;
              const isGraded = subm?.status === 'graded';

              return (
                <div key={asg.id} className="card flex flex-col gap-3">
                  {/* Top Row */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                          {asg.subjectCode} • {asg.subject}
                        </span>
                        {isGraded ? (
                          <span className="badge badge-emerald text-xs">
                            <CheckCircle2 size={12} /> Graded: {subm.marks}/{asg.totalMarks}
                          </span>
                        ) : isSubmitted ? (
                          <span className="badge badge-amber text-xs">
                            <Clock size={12} /> Under Review
                          </span>
                        ) : (
                          <span className="badge badge-rose text-xs">
                            <AlertCircle size={12} /> Due: {asg.dueDate} ({asg.dueDaysLeft})
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-slate-900 mt-1">{asg.title}</h3>
                      <p className="text-xs text-slate-500 mt-0.5">
                        Assigned by <strong>{asg.faculty}</strong> • Target: {asg.section} • Maximum Marks: <strong>{asg.totalMarks}</strong>
                      </p>
                    </div>

                    {!isSubmitted && (
                      <button
                        onClick={() => openModal('submitAssignment', { assignment: asg })}
                        className="btn btn-primary text-xs py-2 px-4 shadow-sm shrink-0"
                        id={`btn-submit-${asg.id}`}
                      >
                        <Upload size={14} />
                        <span>Submit Work</span>
                      </button>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100 leading-relaxed">
                    {asg.description}
                  </p>

                  {/* Submission Details if submitted */}
                  {isSubmitted && (
                    <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-200/80 flex flex-col gap-1.5 text-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-emerald-900 flex items-center gap-1.5">
                          <CheckCircle2 size={14} className="text-emerald-600" />
                          Submitted File: {subm.fileName}
                        </span>
                        <span className="text-[11px] text-emerald-700">{subm.submittedAt}</span>
                      </div>

                      {isGraded && (
                        <div className="mt-1 pt-1.5 border-t border-emerald-200/60 flex items-start gap-2">
                          <Award size={16} className="text-emerald-600 shrink-0 mt-0.5" />
                          <div>
                            <span className="font-bold text-emerald-900">
                              Score: {subm.marks} / {subm.totalMarks}
                            </span>
                            {subm.feedback && (
                              <p className="text-emerald-800 text-[11px] mt-0.5">
                                <strong>Faculty Feedback:</strong> "{subm.feedback}"
                              </p>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Attachment Footer */}
                  {asg.attachmentName && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-100 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <FileText size={14} />
                        Attachment: <span className="font-semibold text-slate-700">{asg.attachmentName}</span>
                      </span>
                      <button
                        onClick={() => alert(`Downloading problem set: ${asg.attachmentName}`)}
                        className="text-blue-600 hover:underline flex items-center gap-1 font-semibold"
                      >
                        <Download size={13} />
                        <span>Download Spec</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
