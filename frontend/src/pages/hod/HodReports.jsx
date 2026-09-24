import React from 'react';
import { useERP } from '../../context/ERPContext';
import { Activity, Download, Users, Award, ShieldCheck, CheckSquare, BarChart2 } from 'lucide-react';

export default function HodReports() {
  const { students, subjects, classes, addToast } = useERP();

  const handleExport = () => {
    addToast('Report Exported', 'Departmental Attendance & Academic Audit Report downloaded (CSV).', 'success');
  };

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Department Reports & Analytics</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Attendance aggregates, faculty teaching loads & clearance performance audit
            </p>
          </div>

          <button
            onClick={handleExport}
            className="btn btn-primary text-xs py-2 px-4 shadow-sm"
          >
            <Download size={15} />
            <span>Export Department Audit</span>
          </button>
        </div>

        {/* High-level KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <ShieldCheck size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Department Aggregate Attendance</span>
              <div className="text-2xl font-extrabold text-emerald-600">81.4%</div>
              <span className="text-[11px] text-slate-400">Above 75% statutory threshold</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Users size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Active Student Cohorts</span>
              <div className="text-2xl font-extrabold text-slate-900">340 Students</div>
              <span className="text-[11px] text-blue-600">6 Sections in CSE</span>
            </div>
          </div>

          <div className="card flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Activity size={20} />
            </div>
            <div>
              <span className="text-[11px] text-slate-500 block">Clearance Resolution Speed</span>
              <div className="text-2xl font-extrabold text-indigo-700">18.4 Hours</div>
              <span className="text-[11px] text-emerald-600">Fast 3-tier turnaround</span>
            </div>
          </div>
        </div>

        {/* Subject-Wise Attendance Overview */}
        <div className="card flex flex-col gap-3">
          <h2 className="text-base font-bold text-slate-900">Course-Wise Attendance Breakdown</h2>
          <div className="flex flex-col gap-2">
            {subjects.map((sub) => {
              const pct = Math.round((sub.attended / sub.totalHeld) * 100);
              return (
                <div key={sub.id} className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-bold text-slate-900 text-sm block">{sub.name}</span>
                    <span className="text-slate-500">{sub.code} • Faculty: {sub.faculty}</span>
                  </div>
                  <div className="text-right">
                    <span className={`text-sm font-extrabold ${pct >= 75 ? 'text-emerald-600' : 'text-rose-600'}`}>
                      {pct}%
                    </span>
                    <span className="text-slate-400 block text-[10px]">{sub.attended}/{sub.totalHeld} lectures held</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
