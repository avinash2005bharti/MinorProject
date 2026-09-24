import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Upload, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';

export default function SubmitAssignmentModal({ data, onClose }) {
  const { submitAssignment, currentUser, assignments } = useERP();

  const targetAssignment = data?.assignment || assignments[0];
  const [comment, setComment] = useState('');
  const [fileName, setFileName] = useState(`${currentUser.name.replace(/\s+/g, '_')}_${targetAssignment?.subjectCode || 'Solution'}.pdf`);
  const [fileAttached, setFileAttached] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetAssignment) return;

    submitAssignment(targetAssignment.id, {
      fileName: fileAttached ? fileName : 'Student_Solution_Archive.pdf',
      fileSize: '1.8 MB',
      comment
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '500px', width: '92%' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Upload size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Submit Coursework Solution</h3>
              <p className="text-xs text-slate-500">{targetAssignment?.subject} • {targetAssignment?.section}</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Assignment brief card */}
        <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 text-xs flex flex-col gap-1">
          <span className="font-bold text-slate-900 text-sm">{targetAssignment?.title}</span>
          <div className="flex items-center justify-between text-slate-600 mt-1">
            <span>Faculty: <strong>{targetAssignment?.faculty}</strong></span>
            <span className="badge badge-amber text-[10px]">Due: {targetAssignment?.dueDate}</span>
          </div>
          <span className="text-slate-500 mt-0.5">Maximum Marks: <strong>{targetAssignment?.totalMarks}</strong></span>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          {/* File Upload simulator */}
          <div className="form-group mb-0">
            <label className="form-label">Attach Solution Document (PDF, ZIP, or Code)</label>
            <div
              onClick={() => setFileAttached(!fileAttached)}
              className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                fileAttached ? 'border-emerald-500 bg-emerald-50/50' : 'border-slate-200 hover:border-blue-400 bg-slate-50/50'
              }`}
            >
              {fileAttached ? (
                <div className="flex flex-col items-center gap-1 text-emerald-700 text-xs font-semibold">
                  <CheckCircle2 size={24} className="text-emerald-600" />
                  <span>Ready to upload: {fileName} (1.8 MB)</span>
                  <span className="text-[10px] text-emerald-600 font-normal">Click to change file</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 text-slate-500 text-xs">
                  <Upload size={22} className="text-blue-500" />
                  <span className="font-semibold text-slate-700">Click to select solution file</span>
                  <span className="text-[11px] text-slate-400">PDF, ZIP, IPYNB up to 25MB</span>
                </div>
              )}
            </div>
          </div>

          {/* Submission Note */}
          <div className="form-group mb-0">
            <label className="form-label">Notes for Faculty (Optional)</label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="e.g., Code compiled on GCC 11.2. Included execution outputs in appendices..."
              className="input-field"
              rows={2}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm" id="btn-submit-assignment-confirm">
              Confirm & Submit
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
