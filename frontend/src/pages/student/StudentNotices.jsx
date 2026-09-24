import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Compass, Bell, AlertTriangle, Pin, Calendar, User, Search } from 'lucide-react';

export default function StudentNotices() {
  const { notices, currentUser } = useERP();
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');

  const filteredNotices = notices.filter((n) => {
    const matchesSearch =
      n.title.toLowerCase().includes(search.toLowerCase()) ||
      n.content.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'urgent') return n.priority === 'urgent';
    if (filter === 'section') return n.targetType === 'Section';
    if (filter === 'department') return n.targetType === 'Department';
    return true;
  });

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Campus Notices & Circulars</h1>
              <span className="badge badge-emerald">Live Telemetry</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Official institutional notifications, exam dates & department announcements
            </p>
          </div>

          <span className="text-xs text-slate-500">
            Active Circulars: <strong>{notices.length}</strong>
          </span>
        </div>

        {/* Search & Filter Bar */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto">
            {[
              { id: 'all', label: 'All Notices' },
              { id: 'section', label: `Section ${currentUser.section}` },
              { id: 'department', label: 'Department Wide' },
              { id: 'urgent', label: 'Urgent Circulars' }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setFilter(tab.id)}
                className={`py-1.5 px-3.5 rounded-full text-xs font-semibold border transition-all whitespace-nowrap ${
                  filter === tab.id
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="w-full sm:w-64">
            <input
              type="text"
              placeholder="Search circulars..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input-field text-xs h-9"
            />
          </div>
        </div>

        {/* Notices List */}
        <div className="flex flex-col gap-3.5">
          {filteredNotices.length === 0 ? (
            <div className="card text-center py-12 text-slate-400">
              <Compass size={36} className="mx-auto mb-2 opacity-40 text-slate-400" />
              <p className="text-sm font-semibold">No circulars found matching your criteria.</p>
            </div>
          ) : (
            filteredNotices.map((notice) => (
              <div
                key={notice.id}
                className={`card flex flex-col gap-2.5 transition-all ${
                  notice.pinned ? 'border-blue-300 bg-blue-50/20' : ''
                }`}
              >
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
                    <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded">
                      To: {notice.targetType} ({notice.targetValue})
                    </span>
                  </div>

                  <span className="text-xs text-slate-400 whitespace-nowrap">{notice.date}</span>
                </div>

                <h3 className="text-base font-bold text-slate-900 leading-snug">{notice.title}</h3>

                <p className="text-xs text-slate-700 leading-relaxed">{notice.content}</p>

                <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500">
                  <span className="flex items-center gap-1.5">
                    <User size={13} className="text-slate-400" />
                    Issued by: <strong className="text-slate-700">{notice.authorName}</strong> ({notice.authorRole})
                  </span>
                  <span className="text-[11px] text-emerald-600 font-semibold">Verified Circular</span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
