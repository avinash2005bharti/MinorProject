import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, FileText, Calendar, Layers, BookOpen, Upload, Check } from 'lucide-react';
import DocumentUploader from '../common/DocumentUploader';

export default function CreateAssignmentModal({ onClose }) {
  const { createAssignment, sections, classes } = useERP();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [subjectCode, setSubjectCode] = useState('CS301');
  const [section, setSection] = useState('CSE-3A');
  const [dueDate, setDueDate] = useState('2025-10-15');
  const [totalMarks, setTotalMarks] = useState('20');
  const [description, setDescription] = useState('');
  const [attachedFile, setAttachedFile] = useState({ name: '', size: '' });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter assignment title.');
      return;
    }

    createAssignment({
      title,
      subject,
      subjectCode,
      section,
      className: 'CSE 3rd Year',
      dueDate,
      totalMarks,
      description: description || 'Complete the exercises and upload PDF or ZIP.',
      attachmentName: attachedFile.name || (title ? `${title.replace(/\s+/g, '_')}_Spec.pdf` : 'Coursework_Spec.pdf')
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '540px', width: '92%' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <FileText size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Create Course Assignment</h3>
              <p className="text-xs text-slate-500">Autonomous delivery to student submissions portal</p>
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

          {/* Subject & Section Row */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Subject</label>
              <select
                value={subject}
                onChange={(e) => {
                  setSubject(e.target.value);
                  if (e.target.value.includes('DBMS')) setSubjectCode('CS302');
                  else if (e.target.value.includes('Operating')) setSubjectCode('CS303');
                  else setSubjectCode('CS301');
                }}
                className="input-field"
              >
                <option value="Data Structures & Algorithms">Data Structures & Algorithms (CS301)</option>
                <option value="Database Management Systems">Database Management Systems (CS302)</option>
                <option value="Operating Systems">Operating Systems (CS303)</option>
                <option value="Computer Networks">Computer Networks (CS304)</option>
                <option value="Software Engineering">Software Engineering (CS305)</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Target Section</label>
              <select
                value={section}
                onChange={(e) => setSection(e.target.value)}
                className="input-field"
              >
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.name}>
                    {sec.name} ({sec.className})
                  </option>
                ))}
              </select>
            </div>
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
                min="5"
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
              selectedFileName={attachedFile.name}
              selectedFileSize={attachedFile.size}
              onFileSelect={(fileInfo) => {
                setAttachedFile({ name: fileInfo.name, size: fileInfo.size });
                if (!title.trim()) {
                  setTitle(fileInfo.name.replace(/\.[^/.]+$/, ''));
                }
              }}
              onFileRemove={() => setAttachedFile({ name: '', size: '' })}
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm" id="btn-create-assignment-confirm">
              Publish Assignment
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
