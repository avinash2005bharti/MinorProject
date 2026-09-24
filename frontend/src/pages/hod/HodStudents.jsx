import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import { Users, Search, AlertTriangle, ShieldCheck, ChevronRight, Filter } from 'lucide-react';

export default function HodStudents() {
  const { students, openModal } = useERP();
  const [search, setSearch] = useState('');
  const [filterRisk, setFilterRisk] = useState(false);

  const filteredStudents = students.filter((st) => {
    const matches =
      st.name.toLowerCase().includes(search.toLowerCase()) ||
      st.rollNo.toLowerCase().includes(search.toLowerCase());
    if (!matches) return false;
    if (filterRisk) return st.attendance < 75;
    return true;
  });

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Students Roster</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              340 Enrolled CSE students across Section CSE-3A, 3B, 2A & 2B
            </p>
          </div>

          <button
            onClick={() => setFilterRisk(!filterRisk)}
            className={`btn btn-sm ${filterRisk ? 'btn-danger' : 'btn-outline'} text-xs`}
          >
            <AlertTriangle size={14} />
            <span>{filterRisk ? 'Showing At-Risk (<75%)' : 'Filter Shortage (<75%)'}</span>
          </button>
        </div>

        {/* Search */}
        <div className="card flex items-center gap-3 py-2.5">
          <Search size={18} className="text-slate-400" />
          <input
            type="text"
            placeholder="Search student by name or roll number..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full text-xs outline-none bg-transparent"
          />
        </div>

        {/* Student Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {filteredStudents.map((st) => (
            <div key={st.id} className="card flex flex-col justify-between gap-3">
              <div>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-800 font-extrabold flex items-center justify-center text-sm">
                      {st.name.split(' ').map((n) => n[0]).join('')}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-slate-900">{st.name}</h4>
                      <span className="text-[11px] font-mono text-slate-500">{st.rollNo}</span>
                    </div>
                  </div>

                  <span className={`badge ${st.attendance >= 75 ? 'badge-emerald' : 'badge-rose'} text-xs`}>
                    {st.attendance}% Att
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-100 text-xs">
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Academic CGPA</span>
                    <span className="text-sm font-bold text-slate-800">{st.cgpa} / 10</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px] uppercase font-bold">Status</span>
                    <span className={`text-xs font-semibold ${st.attendance >= 75 ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {st.attendance >= 75 ? 'Eligible' : 'Shortage Alert'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                <button
                  onClick={() => openModal('studentDetail', { student: st })}
                  className="btn btn-sm btn-primary text-xs py-1.5 px-3 w-full"
                >
                  <span>Inspect 360° Profile</span>
                  <ChevronRight size={13} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
