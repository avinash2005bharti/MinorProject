import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { timetableApi } from '../../api/timetableApi';
import { X, Calendar, Clock, MapPin, Layers } from 'lucide-react';

export default function ScheduleLectureModal({ data, onClose }) {
  const { subjects, sections, teachers, addToast, refreshAllData, refreshTimetable } = useERP();

  const matchedSubject = data?.subject
    ? subjects.find((item) => item.name === data.subject || item.code === data.subject)
    : null;

  const [subjectId, setSubjectId] = useState(matchedSubject ? String(matchedSubject.id) : '');
  const [sectionId, setSectionId] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [day, setDay] = useState(data?.day || '');
  const [room, setRoom] = useState(data?.room || '');
  const [startTime, setStartTime] = useState(
    data?.startTime || (data?.time ? data.time.split(' - ')[0]?.trim() : '') || ''
  );
  const [endTime, setEndTime] = useState(
    data?.endTime || (data?.time ? data.time.split(' - ')[1]?.trim() : '') || ''
  );
  const [period, setPeriod] = useState(data?.period ? String(data.period) : '');
  const [lectureType, setLectureType] = useState('Lecture');
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const selectedSubject = subjects.find((item) => String(item.id) === subjectId);
    const selectedSection = sections.find((item) => String(item.id) === sectionId);
    const selectedTeacher = teachers.find((item) => String(item.id) === teacherId);
    if (!selectedSubject || !selectedSection || !selectedTeacher) {
      addToast('Validation Incomplete', 'Please select a subject, section, and faculty member.', 'warning');
      return;
    }

    setSaving(true);
    try {
      await timetableApi.createSlot({
        subject_id: subjectId,
        section_id: sectionId,
        teacher_id: teacherId,
        room,
        day,
        start_time: startTime,
        end_time: endTime,
        period,
        semester: selectedSubject.semester,
        type: lectureType
      });
      addToast('Lecture Scheduled', 'The timetable entry was successfully saved.', 'success');
      await refreshAllData();
      if (typeof refreshTimetable === 'function') {
        await refreshTimetable();
      }
      onClose();
    } catch (err) {
      addToast('Unable to Schedule', err.message || 'The timetable entry could not be saved.', 'error');
    } finally {
      setSaving(false);
    }
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
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
              className="input-field"
              required
            >
              <option value="">Select a subject</option>
              {subjects.map((item) => <option key={item.id} value={item.id}>{item.name} ({item.code})</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Class Section</label>
              <select
                value={sectionId}
                onChange={(e) => setSectionId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a section</option>
                {sections.map((sec) => (
                  <option key={sec.id} value={sec.id}>
                    {sec.name}
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
                placeholder="Room number"
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
                required
              >
                <option value="">Select a day</option>
                {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'].map((weekday) => (
                  <option key={weekday} value={weekday}>{weekday}</option>
                ))}
              </select>
            </div>

            <div className="form-group mb-0">
              <label className="form-label">Teacher</label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value)}
                className="input-field"
                required
              >
                <option value="">Select a teacher</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name || `${teacher.first_name || ''} ${teacher.last_name || ''}`.trim()}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="form-group mb-0">
              <label className="form-label">Start Time</label>
              <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">End Time</label>
              <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="input-field" required />
            </div>
            <div className="form-group mb-0">
              <label className="form-label">Period</label>
              <input type="number" min="1" value={period} onChange={(e) => setPeriod(e.target.value)} className="input-field" required />
            </div>
          </div>

          <div className="form-group mb-0">
            <label className="form-label">Session Type</label>
            <select value={lectureType} onChange={(e) => setLectureType(e.target.value)} className="input-field">
              <option value="Lecture">Lecture</option>
              <option value="Lab">Lab</option>
              <option value="Seminar">Seminar</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-outline text-xs py-2 px-4">
              Cancel
            </button>
            <button type="submit" disabled={saving || !subjects.length || !sections.length || !teachers.length} className="btn btn-primary text-xs py-2 px-5 font-bold shadow-sm disabled:opacity-50">
              Confirm Schedule
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
