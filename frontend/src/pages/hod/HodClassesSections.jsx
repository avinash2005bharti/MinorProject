import React, { useState } from 'react';
import { useERP } from '../../context/ERPContext';
import {
  Building2,
  PlusCircle,
  Users,
  MapPin,
  UserCheck,
  BookOpen,
  Layers,
  ChevronRight
} from 'lucide-react';

export default function HodClassesSections() {
  const { classes, sections, openModal } = useERP();
  const [selectedClassId, setSelectedClassId] = useState(classes[0]?.id || 'cls-1');

  const selectedClass = classes.find((c) => c.id === selectedClassId) || classes[0];
  const classSections = sections.filter((s) => s.classId === selectedClass?.id);

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Classes & Sections Management</h1>
              <span className="badge badge-emerald">HOD Office</span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Provision academic cohorts, assign classroom venues, designate TG mentors & curriculum tracks
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => openModal('addSection')}
              className="btn btn-primary text-xs py-2 px-4 shadow-sm"
              id="btn-hod-add-section-page"
            >
              <PlusCircle size={15} />
              <span>Add New Section</span>
            </button>
          </div>
        </div>

        {/* Classes Carousel / Selector */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {classes.map((cls) => (
            <div
              key={cls.id}
              onClick={() => setSelectedClassId(cls.id)}
              className={`card cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                selectedClassId === cls.id
                  ? 'border-blue-500 bg-blue-50/30 ring-1 ring-blue-500'
                  : 'hover:bg-slate-50'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[11px] font-bold text-blue-700 bg-blue-100/60 px-2 py-0.5 rounded">
                    {cls.semester}
                  </span>
                  <h3 className="text-base font-bold text-slate-900 mt-1">{cls.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Batch: {cls.batch} • Dept: {cls.department}</p>
                </div>

                <span className="badge badge-slate text-xs font-mono">
                  {cls.studentsCount} Students
                </span>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-600">
                <span>Sections: <strong>{cls.sections.join(', ')}</strong></span>
                <span className="text-blue-600 font-semibold flex items-center gap-1">
                  Manage Cohort <ChevronRight size={14} />
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Sections under Selected Class */}
        <div className="card flex flex-col gap-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Sections under {selectedClass?.name} ({selectedClass?.semester})
              </h2>
              <span className="text-xs text-slate-500">
                {classSections.length} Sections Provisioned
              </span>
            </div>

            <button
              onClick={() => openModal('addSection')}
              className="btn btn-sm btn-outline text-xs py-1.5 px-3"
            >
              <PlusCircle size={14} />
              <span>Provision Section</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
            {classSections.map((sec) => (
              <div key={sec.id} className="p-4 bg-slate-50 rounded-2xl border border-slate-200 flex flex-col justify-between gap-3">
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-extrabold text-slate-900">
                          Section {sec.name}
                        </span>
                        <span className="badge badge-indigo text-xs">{sec.className}</span>
                      </div>
                      <span className="text-xs text-slate-500 mt-0.5 block">
                        Venue: <strong>{sec.room}</strong>
                      </span>
                    </div>

                    <span className="badge badge-emerald text-xs">
                      {sec.studentsCount} Enrolled
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-slate-200/60 text-xs">
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Tutor Guardian (TG)</span>
                      <span className="font-bold text-slate-800">{sec.tgName}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px] uppercase font-bold">Curriculum Load</span>
                      <span className="font-bold text-blue-700">5 Core Subjects</span>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-xs">
                  <span className="text-slate-500 text-[11px]">
                    Subjects: {sec.subjects ? sec.subjects.slice(0, 3).join(', ') : 'DSA, DBMS, OS'}...
                  </span>
                  <span className="text-emerald-700 font-semibold text-[11px]">Roster Active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
