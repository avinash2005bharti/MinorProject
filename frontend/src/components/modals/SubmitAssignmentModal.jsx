import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Upload, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
import DocumentUploader from '../common/DocumentUploader';

export default function SubmitAssignmentModal({ data, onClose }) {
  const { submitAssignment, currentUser, assignments } = useERP();

  const targetAssignment = data?.assignment || assignments[0];
  const [comment, setComment] = useState('');
  const [uploadedFile, setUploadedFile] = useState({
    name: `${currentUser.name.replace(/\s+/g, '_')}_${targetAssignment?.subjectCode || 'Solution'}.pdf`,
    size: '1.8 MB'
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!targetAssignment) return;

    submitAssignment(targetAssignment.id, {
      fileName: uploadedFile.name || 'Student_Solution_Archive.pdf',
      fileSize: uploadedFile.size || '1.8 MB',
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
          {/* Workable Document Upload */}
          <div className="form-group mb-0">
            <DocumentUploader
              label="Attach Solution Document"
              hint="PDF, ZIP, IPYNB, DOCX, or Code archive up to 25 MB"
              selectedFileName={uploadedFile.name}
              selectedFileSize={uploadedFile.size}
              accept=".pdf,.zip,.ipynb,.py,.java,.cpp,.doc,.docx"
              onFileSelect={(fileInfo) => setUploadedFile({ name: fileInfo.name, size: fileInfo.size })}
              onFileRemove={() => setUploadedFile({ name: '', size: '' })}
              required={true}
            />
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
