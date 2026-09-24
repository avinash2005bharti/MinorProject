import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Send, PlusCircle, Compass, Pin, User } from 'lucide-react';

export default function HodNotices() {
  const { notices, openModal, currentUser } = useERP();

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Circulars & Bulletins</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Broadcast administrative decrees, exam schedules & student advisories
            </p>
          </div>

          <button
            onClick={() => openModal('sendNotice', { defaultTarget: 'Department', targetValue: 'All Students & Faculty' })}
            className="btn btn-primary text-xs py-2 px-4 shadow-sm"
            id="btn-hod-send-notice"
          >
            <Send size={15} />
            <span>Broadcast Circular</span>
          </button>
        </div>

        <div className="flex flex-col gap-3.5">
          {notices.map((notice) => (
            <div key={notice.id} className="card flex flex-col gap-2.5">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2 flex-wrap">
                  {notice.pinned && (
                    <span className="badge badge-indigo text-xs flex items-center gap-1">
                      <Pin size={11} /> Pinned
                    </span>
                  )}
                  <span
                    className={`badge text-xs ${
                      notice.priority === 'urgent'
                        ? 'badge-rose'
                        : notice.priority === 'info'
                        ? 'badge-slate'
                        : 'badge-amber'
                    }`}
                  >
                    {notice.priority.toUpperCase()}
                  </span>
                  <span className="text-xs font-bold text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
                    Scope: {notice.targetType} ({notice.targetValue})
                  </span>
                </div>
                <span className="text-xs text-slate-400">{notice.date}</span>
              </div>

              <h3 className="text-base font-bold text-slate-900">{notice.title}</h3>
              <p className="text-xs text-slate-700 leading-relaxed">{notice.content}</p>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                <span className="flex items-center gap-1.5">
                  <User size={13} className="text-slate-400" />
                  Origin: <strong className="text-slate-700">{notice.authorName}</strong> ({notice.authorRole})
                </span>
                <span className="text-[11px] text-blue-600 font-semibold">Broadcast via Notice Agent</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
