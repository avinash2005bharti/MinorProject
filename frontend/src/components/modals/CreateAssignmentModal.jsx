import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { apiClient } from '../../api/client';
import { X, FileText, Calendar, Layers, BookOpen, Upload, Check } from 'lucide-react';
import DocumentUploader from '../common/DocumentUploader';

export default function CreateAssignmentModal({ onClose }) {
  const { subjects, addToast, refreshAllData } = useERP();

  const [title, setTitle] = useState('');
  const [subjectId, setSubjectId] = useState('');
  const [dueDate, setDueDate] = useState(() => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]);
  const [totalMarks, setTotalMarks] = useState('');
  const [description, setDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !subjectId || !dueDate || !totalMarks) return;

    const payload = new FormData();
    payload.append('title', title.trim());
    payload.append('subject_id', subjectId);
    payload.append('deadline', new Date(`${dueDate}T23:59:00`).toISOString());
    payload.append('max_marks', totalMarks);
    payload.append('description', description.trim());
    if (attachedFile) payload.append('file', attachedFile);

    setSaving(true);
    try {
      await apiClient.post('/assignments', payload);
      addToast('Assignment Published', 'The assignment was saved.', 'success');
      await refreshAllData();
      onClose();
    } catch (err) {
      addToast('Unable to Publish', err.message || 'The assignment could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92%' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary-50 text-primary-700 flex items-center justify-center flex-shrink-0">
              <FileText size={20} />
            </div>
            <div>
              <h3 className="modal-title">Create Course Assignment</h3>
              <p className="modal-subtitle">Autonomous delivery to student submissions portal</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          {/* Assignment Title */}
          <div className="form-group mb-0">
            <label className="form-label">Assignment Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., AVL Tree Balancing & Graph Traversals (Problem Set 3)"
              className="input-field"
              required
              id="input-assignment-title"
            />
          </div>

          <div className="form-group mb-0">
              <label className="form-label">Subject</label>
              <select
                value={subjectId}
                onChange={(e) => setSubjectId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a subject</option>
                {subjects.map((item) => (
                  <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                ))}
              </select>
          </div>

          {/* Due Date & Marks */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Submission Deadline</label>
              <input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="input-field"
                required
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Maximum Marks</label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="input-field"
                min="1"
                max="100"
                required
              />
            </div>
          </div>

          {/* Description */}
          <div className="form-group mb-0">
            <label className="form-label">Instructions & Guidelines</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="State problem statements, expected outputs, plagiarism policy, and format instructions..."
              className="input-field"
              rows={3}
            />
          </div>

          {/* File Attachment */}
          <div className="form-group mb-0">
            <DocumentUploader
              label="Attachment Specification (Problem PDF / Lab Data)"
              hint="Attach question paper, lab problem statement, or code skeleton (PDF/ZIP/DOCX)"
              selectedFileName={attachedFile?.name || ''}
              selectedFileSize={attachedFile?.size || ''}
              onFileSelect={(fileInfo) => {
                setAttachedFile(fileInfo.file);
                if (!title.trim()) {
                  setTitle(fileInfo.name.replace(/\.[^/.]+$/, ''));
                }
              }}
              onFileRemove={() => setAttachedFile(null)}
            />
          </div>

          <div className="modal-footer">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4 font-semibold">
              Cancel
            </button>
            <button type="submit" disabled={saving || subjects.length === 0} className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm disabled:opacity-50" id="btn-create-assignment-confirm">
              Publish Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
