import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Calendar,
  Clock,
  MapPin,
  PlusCircle,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Sparkles,
  Bot
} from 'lucide-react';

export default function TeacherLectures() {
  const { timetable, openModal, addToast } = useERP();
  const [selectedDay, setSelectedDay] = useState('Wednesday');

  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const daySchedule = timetable[selectedDay] || [];

  const handleCancelLecture = (subject, period) => {
    if (confirm(`Are you sure you want to cancel ${subject} (Period ${period})?`)) {
      addToast(
        'Lecture Cancelled',
        `${subject} (Period ${period}) on ${selectedDay} cancelled. Affected students notified.`,
        'warning'
      );
    }
  };

  const handleReschedule = (subject) => {
    openModal('scheduleLecture', { subject, day: selectedDay });
  };

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Lecture Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Review assigned course sessions, schedule remedial classes & manage lecture hall bookings
            </p>
          </div>

          <button
            onClick={() => openModal('scheduleLecture')}
            className="btn btn-primary text-xs py-2 px-4 shadow-sm"
          >
            <PlusCircle size={15} />
            <span>Schedule Lecture</span>
          </button>
        </div>

        {/* Day Selector Tabs */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
          {days.map((day) => (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`py-2 px-5 rounded-full text-xs font-bold border transition-all ${
                selectedDay === day
                  ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
              }`}
            >
              {day}
            </button>
          ))}
        </div>

        {/* Lecture Grid */}
        <div className="flex flex-col gap-3">
          {daySchedule.map((lec) => (
            <div
              key={lec.period}
              className={`card flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-all ${
                lec.isLive ? 'border-blue-300 bg-blue-50/30' : ''
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-slate-100 flex flex-col items-center justify-center shrink-0">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Period</span>
                  <span className="text-base font-extrabold text-slate-800">{lec.period}</span>
                </div>

                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-sm font-bold text-slate-900 truncate">{lec.subject}</h3>
                    <span className="text-xs font-mono text-blue-700 bg-blue-100/60 px-1.5 py-0.2 rounded font-semibold">
                      {lec.code}
                    </span>
                    {lec.isLive && (
                      <span className="badge badge-emerald text-[10px]">Live Session</span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                    <span className="flex items-center gap-1 font-medium">
                      <Clock size={13} /> {lec.time}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 font-medium">
                      <MapPin size={13} /> {lec.room}
                    </span>
                    <span>•</span>
                    <span>Faculty: <strong>{lec.faculty}</strong></span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                <button
                  onClick={() => handleReschedule(lec.subject)}
                  className="btn btn-sm btn-outline text-xs py-1.5 px-3"
                >
                  Reschedule
                </button>
                <button
                  onClick={() => handleCancelLecture(lec.subject, lec.period)}
                  className="btn btn-sm btn-danger text-xs py-1.5 px-3"
                >
                  <XCircle size={13} />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
