import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, PlusCircle, Building2, UserCheck, Layers, Users } from 'lucide-react';

export default function AddSectionModal({ onClose }) {
  const { addSection, classes } = useERP();

  const [classId, setClassId] = useState(classes[0]?.id || 'cls-1');
  const [sectionName, setSectionName] = useState('CSE-3C');
  const [room, setRoom] = useState('Room 206');
  const [tgName, setTgName] = useState('Prof. Raman Verma');
  const [studentsCount, setStudentsCount] = useState('55');

  const selectedClass = classes.find((c) => c.id === classId) || classes[0];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sectionName.trim()) {
      alert('Please enter a section name.');
      return;
    }

    addSection({
      name: sectionName,
      classId: selectedClass.id,
      className: selectedClass.name,
      semester: selectedClass.semester,
      tgName,
      room,
      studentsCount: parseInt(studentsCount) || 55
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
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Add New Academic Section</h3>
              <p className="text-xs text-slate-500">Autonomous timetable & roll call provisioning</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          {/* Class Selection */}
          <div className="form-group mb-0">
            <label className="form-label">Parent Academic Class</label>
            <select
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              className="input-field"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} ({cls.semester})
                </option>
              ))}
            </select>
          </div>

          {/* Section Name & Room */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Section Identifier</label>
              <input
                type="text"
                value={sectionName}
                onChange={(e) => setSectionName(e.target.value)}
                placeholder="e.g. CSE-3C"
                className="input-field"
                required
                id="input-new-section-name"
              />
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Allocated Lecture Hall</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                placeholder="e.g. Room 206 / Lab-4"
                className="input-field"
                required
              />
            </div>
          </div>

          {/* TG Mentor & Student Capacity */}
          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Tutor Guardian (TG)</label>
              <select
                value={tgName}
                onChange={(e) => setTgName(e.target.value)}
                className="input-field"
              >
                <option value="Prof. Raman Verma">Prof. Raman Verma</option>
                <option value="Prof. K. Sen">Prof. K. Sen</option>
                <option value="Prof. Amit K.">Prof. Amit K.</option>
                <option value="Dr. Meenakshi S.">Dr. Meenakshi S.</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Enrolled Student Count</label>
              <input
                type="number"
                value={studentsCount}
                onChange={(e) => setStudentsCount(e.target.value)}
                className="input-field"
                min="10"
                max="100"
                required
              />
            </div>
          </div>

          <div className="bg-slate-50 p-2.5 rounded-xl border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
            <Layers size={15} className="text-blue-600 shrink-0" />
            <span>Adding this section will register it immediately for attendance marking, AI timetable generation, and notice broadcasts.</span>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm" id="btn-add-section-confirm">
              Provision Section
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
