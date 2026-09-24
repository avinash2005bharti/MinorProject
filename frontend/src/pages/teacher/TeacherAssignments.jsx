import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  FileText,
  PlusCircle,
  Users,
  Award,
  Clock,
  CheckCircle2,
  Calendar,
  Download,
  Check
} from 'lucide-react';

export default function TeacherAssignments() {
  const { assignments, submissions, gradeSubmission, openModal, currentUser } = useERP();
  const [selectedAsgId, setSelectedAsgId] = useState(assignments[0]?.id || 'asg-1');
  const [gradingSubmId, setGradingSubmId] = useState(null);
  const [marksInput, setMarksInput] = useState('');
  const [feedbackInput, setFeedbackInput] = useState('');

  const selectedAsg = assignments.find((a) => a.id === selectedAsgId) || assignments[0];
  const asgSubmissions = submissions.filter((s) => s.assignmentId === selectedAsg?.id);

  const handleOpenGrade = (subm) => {
    setGradingSubmId(subm.id);
    setMarksInput(subm.marks !== null ? String(subm.marks) : '');
    setFeedbackInput(subm.feedback || '');
  };

  const handleSaveGrade = (e) => {
    e.preventDefault();
    if (!marksInput) return;
    gradeSubmission(gradingSubmId, marksInput, feedbackInput);
    setGradingSubmId(null);
  };

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Assignments & Grading Central
            </h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create problem sets, assign deadlines, review student submissions & publish grades
            </p>
          </div>

          <button
            onClick={() => openModal('createAssignment')}
            className="btn btn-primary text-xs py-2 px-4 shadow-sm"
            id="btn-teacher-new-assignment"
          >
            <PlusCircle size={15} />
            <span>Create New Assignment</span>
          </button>
        </div>

        {/* Assignments Selector Carousel */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {assignments.map((asg) => (
            <button
              key={asg.id}
              onClick={() => {
                setSelectedAsgId(asg.id);
                setGradingSubmId(null);
              }}
              className={`p-3 rounded-2xl border text-left transition-all min-w-[240px] shrink-0 ${
                selectedAsgId === asg.id
                  ? 'bg-blue-50/80 border-blue-500 shadow-sm ring-1 ring-blue-500'
                  : 'bg-white border-slate-200 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                  {asg.section}
                </span>
                <span className="text-[10px] text-slate-400 font-semibold">{asg.dueDaysLeft}</span>
              </div>
              <h4 className="text-xs font-bold text-slate-900 mt-1.5 line-clamp-1">{asg.title}</h4>
              <div className="flex items-center justify-between text-[11px] text-slate-500 mt-2">
                <span>{asg.subjectCode}</span>
                <span className="font-semibold text-slate-700">{asg.submissionsCount} Submissions</span>
              </div>
            </button>
          ))}
        </div>

        {/* Selected Assignment Overview */}
        {selectedAsg && (
          <div className="card flex flex-col gap-3">
            <div className="flex items-start justify-between flex-wrap gap-3 pb-3 border-b border-slate-100">
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-bold text-slate-900">{selectedAsg.title}</h2>
                  <span className="badge badge-emerald text-xs">{selectedAsg.status}</span>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Course: <strong>{selectedAsg.subject} ({selectedAsg.subjectCode})</strong> • Target: <strong>{selectedAsg.section}</strong> • Due: <strong>{selectedAsg.dueDate}</strong> • Max: <strong>{selectedAsg.totalMarks} Marks</strong>
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs bg-slate-100 px-3 py-1.5 rounded-xl font-bold text-slate-700">
                  {asgSubmissions.length} of 42 Received
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-700 bg-slate-50 p-3 rounded-xl border border-slate-100">
              {selectedAsg.description}
            </p>

            {/* Submissions Table / Cards */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                Student Submissions ({asgSubmissions.length})
              </h3>

              {asgSubmissions.length === 0 ? (
                <div className="text-center py-8 text-slate-400 text-xs">
                  No student submissions uploaded for this problem set yet.
                </div>
              ) : (
                <div className="flex flex-col gap-2.5">
                  {asgSubmissions.map((subm) => (
                    <div
                      key={subm.id}
                      className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">{subm.studentName}</span>
                          <span className="font-mono text-slate-500">({subm.rollNo})</span>
                          <span className={`badge ${subm.status === 'graded' ? 'badge-emerald' : 'badge-amber'} text-[10px]`}>
                            {subm.status === 'graded' ? `Score: ${subm.marks}/${subm.totalMarks}` : 'Awaiting Grade'}
                          </span>
                        </div>
                        <span className="text-slate-500 block text-[11px] mt-0.5">
                          File: <strong className="text-slate-700">{subm.fileName}</strong> ({subm.fileSize}) • Submitted {subm.submittedAt}
                        </span>
                        {subm.feedback && (
                          <span className="text-slate-600 block text-[11px] mt-1 bg-white p-2 rounded-lg border border-slate-100">
                            <strong>Feedback:</strong> {subm.feedback}
                          </span>
                        )}
                      </div>

                      <div className="shrink-0 flex items-center gap-2">
                        <button
                          onClick={() => alert(`Downloading student file: ${subm.fileName}`)}
                          className="btn btn-sm btn-outline text-xs py-1 px-2.5"
                        >
                          <Download size={13} />
                          <span>Download</span>
                        </button>

                        <button
                          onClick={() => handleOpenGrade(subm)}
                          className="btn btn-sm btn-primary text-xs py-1 px-3"
                        >
                          <Award size={13} />
                          <span>{subm.status === 'graded' ? 'Edit Marks' : 'Grade Work'}</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Modal Grading Sheet if active */}
        {gradingSubmId && (
          <div className="modal-backdrop" onClick={() => setGradingSubmId(null)}>
            <div
              className="modal-container"
              onClick={(e) => e.stopPropagation()}
              style={{ maxWidth: '440px', width: '92%' }}
            >
              <div className="modal-header">
                <h3 className="text-sm font-bold text-slate-900">Grade Student Submission</h3>
                <button onClick={() => setGradingSubmId(null)} className="modal-close-btn">
                  ×
                </button>
              </div>

              <form onSubmit={handleSaveGrade} className="flex flex-col gap-3 mt-2">
                <div className="form-group mb-0">
                  <label className="form-label">Awarded Score (Max {selectedAsg.totalMarks})</label>
                  <input
                    type="number"
                    value={marksInput}
                    onChange={(e) => setMarksInput(e.target.value)}
                    max={selectedAsg.totalMarks}
                    min="0"
                    className="input-field"
                    required
                    id="input-grade-marks"
                  />
                </div>

                <div className="form-group mb-0">
                  <label className="form-label">Feedback / Remarks</label>
                  <textarea
                    value={feedbackInput}
                    onChange={(e) => setFeedbackInput(e.target.value)}
                    placeholder="Enter academic remarks, syntax feedback, algorithmic correctness..."
                    className="input-field"
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button type="button" onClick={() => setGradingSubmId(null)} className="btn btn-outline text-xs">
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary text-xs font-bold" id="btn-save-grade-confirm">
                    Save Grade
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
