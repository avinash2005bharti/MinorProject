import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, FileQuestion, Clock, Award, CheckSquare } from 'lucide-react';

export default function CreateTestModal({ onClose }) {
  const { createTest, sections } = useERP();

  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [subjectCode, setSubjectCode] = useState('CS301');
  const [section, setSection] = useState('CSE-3A');
  const [duration, setDuration] = useState('30');
  const [totalQuestions, setTotalQuestions] = useState('15');
  const [totalMarks, setTotalMarks] = useState('30');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!title.trim()) {
      alert('Please enter a test title.');
      return;
    }

    createTest({
      title,
      subject,
      subjectCode,
      section,
      duration,
      totalQuestions,
      totalMarks
    });

    onClose();
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{ maxWidth: '480px', width: '92%' }}
      >
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
              <FileQuestion size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Create Online Assessment</h3>
              <p className="text-xs text-slate-500">Autonomous evaluation & instant score generation</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          <div className="form-group mb-0">
            <label className="form-label">Test Title / Unit</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Unit 3 Quiz: Dynamic Programming & Graphs"
              className="input-field"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Subject</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="input-field"
              >
                <option value="Data Structures & Algorithms">Data Structures & Algorithms</option>
                <option value="Database Management Systems">Database Management Systems</option>
                <option value="Operating Systems">Operating Systems</option>
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
                    {sec.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div className="form-group mb-0">
              <label className="form-label">Duration (min)</label>
              <input
                type="number"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="input-field"
                min="10"
                max="120"
                required
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Questions</label>
              <input
                type="number"
                value={totalQuestions}
                onChange={(e) => setTotalQuestions(e.target.value)}
                className="input-field"
                min="5"
                max="50"
                required
              />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Total Marks</label>
              <input
                type="number"
                value={totalMarks}
                onChange={(e) => setTotalMarks(e.target.value)}
                className="input-field"
                min="10"
                max="100"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm">
              Schedule Test
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
