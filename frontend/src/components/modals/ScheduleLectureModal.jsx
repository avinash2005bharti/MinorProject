import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { X, Calendar, Clock, MapPin, Layers } from 'lucide-react';

export default function ScheduleLectureModal({ onClose }) {
  const { scheduleLecture, sections } = useERP();

  const [subject, setSubject] = useState('Data Structures & Algorithms');
  const [section, setSection] = useState('CSE-3A');
  const [day, setDay] = useState('Today (Period 4)');
  const [room, setRoom] = useState('Room 204');
  const [lectureType, setLectureType] = useState('Remedial / Extra Class');

  const handleSubmit = (e) => {
    e.preventDefault();
    scheduleLecture({
      subject,
      section,
      day,
      room,
      lectureType
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
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar size={18} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Schedule / Reschedule Lecture</h3>
              <p className="text-xs text-slate-500">Autonomous room check & timetable update</p>
            </div>
          </div>
          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3.5 mt-2">
          <div className="form-group mb-0">
            <label className="form-label">Subject</label>
            <select
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="input-field"
            >
              <option value="Data Structures & Algorithms">Data Structures & Algorithms (CS301)</option>
              <option value="Database Management Systems">Database Management Systems (CS302)</option>
              <option value="Operating Systems">Operating Systems (CS303)</option>
              <option value="Computer Networks">Computer Networks (CS304)</option>
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Class Section</label>
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

            <div className="form-group mb-0">
              <label className="form-label">Lecture Hall / Lab</label>
              <input
                type="text"
                value={room}
                onChange={(e) => setRoom(e.target.value)}
                className="input-field"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Time Slot / Period</label>
              <select
                value={day}
                onChange={(e) => setDay(e.target.value)}
                className="input-field"
              >
                <option value="Today (Period 4 - 01:15 PM)">Today (Period 4 - 01:15 PM)</option>
                <option value="Today (Period 5 - 02:15 PM)">Today (Period 5 - 02:15 PM)</option>
                <option value="Tomorrow (Period 1 - 09:00 AM)">Tomorrow (Period 1 - 09:00 AM)</option>
                <option value="Saturday (10:00 AM Extra Slot)">Saturday (10:00 AM Extra Slot)</option>
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Session Objective</label>
              <select
                value={lectureType}
                onChange={(e) => setLectureType(e.target.value)}
                className="input-field"
              >
                <option value="Remedial / Extra Class">Remedial / Extra Class</option>
                <option value="Makeup Lecture (Post Leave)">Makeup Lecture (Post Leave)</option>
                <option value="Practical Lab Exam Prep">Practical Lab Exam Prep</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm">
              Confirm Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
