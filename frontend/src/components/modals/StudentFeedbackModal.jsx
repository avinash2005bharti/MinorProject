import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, MessageSquarePlus, User, Award, ShieldAlert } from 'lucide-react';

export default function StudentFeedbackModal({ data, onClose }) {
  const { createFeedback, students } = useERP();

  const [studentRoll, setStudentRoll] = useState(data?.studentRoll || '21CSE084');
  const [category, setCategory] = useState('Academic');
  const [feedback, setFeedback] = useState('');

  const selectedStudent = students.find((s) => s.rollNo === studentRoll) || students[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!feedback.trim()) {
      alert('Please enter feedback observation.');
      return;
    }

    createFeedback({
      studentRoll,
      studentName: selectedStudent.name,
      category,
      feedback
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
            <div className="w-9 h-9 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <MessageSquarePlus size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Student Academic Feedback</h3>
              <p className="text-xs text-slate-500">Recorded on student permanent record & TG feed</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          <div className="form-group mb-0">
            <label className="form-label">Student</label>
            <select
              value={studentRoll}
              onChange={(e) => setStudentRoll(e.target.value)}
              className="input-field"
            >
              {students.map((st) => (
                <option key={st.id} value={st.rollNo}>
                  {st.name} ({st.rollNo}) - Att: {st.attendance}%
                </option>
              ))}
            </select>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Feedback Category</label>
            <div className="grid grid-cols-3 gap-2">
              {['Academic', 'Attendance', 'Behaviour / General'].map((cat) => (
                <button
                  type="button"
                  key={cat}
                  onClick={() => setCategory(cat)}
                  className={`py-2 px-2 rounded-xl text-xs font-semibold border transition-all ${
                    category === cat
                      ? 'bg-purple-600 text-white border-purple-600 shadow-sm'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Faculty Remarks & Advisory</label>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="e.g. Demonstrated exceptional conceptual clarity in binary heap implementations. Recommended for advanced competitive programming..."
              className="input-field"
              rows={3}
              required
            />
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm">
              Save Feedback
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
