import React, { useState } from 'react';
import { useERP } from '../context/ERPContext';
import { Sparkles, ArrowRight, CheckCircle2, User, Bot, AlertTriangle, X, Play, BookOpen, Layers, Send, CheckSquare } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function DemoGuideModal({ isOpen, onClose }) {
  const { switchRole } = useERP();
  const [activeTab, setActiveTab] = useState('flow1');
  const navigate = useNavigate();

  if (!isOpen) return null;

  const handleGoToRole = (role, path) => {
    switchRole(role);
    navigate(path);
    onClose();
  };

  const demoFlows = [
    { id: 'flow1', label: 'Flow 1: Leave & TG Clearance' },
    { id: 'flow2', label: 'Flow 2 & 8: Attendance Agent (72%→84%)' },
    { id: 'flow3', label: 'Flow 3: Teacher Mark Attendance' },
    { id: 'flow4', label: 'Flow 4: Create & Submit Assignment' },
    { id: 'flow5', label: 'Flow 5: HOD Add Section' },
    { id: 'flow6', label: 'Flow 6: Timetable AI & Conflict Healing' },
    { id: 'flow7', label: 'Flow 7: Notice Broadcast Agent' }
  ];

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '680px', width: '94%' }}>
        {/* Header */}
        <div className="modal-header">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center">
              <Sparkles size={20} />
            </div>
            <div>
              <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                CampusFlow 8-Flow Demo Guide
              </h3>
              <p className="text-xs text-slate-500">
                Step-by-step interactive walkthrough across all 5 user roles
              </p>
            </div>
          </div>

          <button onClick={onClose} className="modal-close-btn" aria-label="Close modal">
            <X size={18} />
          </button>
        </div>

        {/* Demo Tabs */}
        <div className="flex bg-slate-100 p-1 rounded-xl gap-1 overflow-x-auto text-xs font-semibold">
          {demoFlows.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`py-1.5 px-3 rounded-lg whitespace-nowrap transition-all ${
                activeTab === tab.id ? 'bg-white text-blue-700 shadow-sm font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content based on Active Tab */}
        <div className="py-2 flex flex-col gap-3 text-xs">
          {/* FLOW 1 */}
          {activeTab === 'flow1' && (
            <div className="flex flex-col gap-2.5">
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
                <span className="font-bold text-amber-900 text-sm block">FLOW 1: Student Leave & Multi-Tier Approval</span>
                <p className="text-amber-800 mt-1 leading-relaxed">
                  Student applies for leave → TG mentor reviews and verifies → HOD gives final clearance. (If TG toggles to "On Leave", the Autonomous Fallback Agent routes directly to HOD!).
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 1:</strong> Student applies for leave</span>
                  <button onClick={() => handleGoToRole('student', '/student/requests')} className="btn btn-sm btn-outline text-xs">
                    <Play size={12} /> Student Requests
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 2:</strong> TG verifies and forwards</span>
                  <button onClick={() => handleGoToRole('tg', '/tg')} className="btn btn-sm btn-outline text-xs">
                    <Play size={12} /> TG Dashboard
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 3:</strong> HOD signs final approval</span>
                  <button onClick={() => handleGoToRole('hod', '/hod')} className="btn btn-sm btn-primary text-xs">
                    <Play size={12} /> HOD Approvals
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FLOW 2 & 8 */}
          {activeTab === 'flow2' && (
            <div className="flex flex-col gap-2.5">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900 text-sm block">FLOW 2 & 8: Autonomous Attendance Consideration Agent</span>
                <p className="text-blue-800 mt-1 leading-relaxed">
                  Student requests duty credit for Hackathon participation → HOD approves with 1 click → <strong>Attendance Agent streams live simulation</strong>, adjusting 6 lecture records across 5 subjects, updating Rahul Sharma's attendance from <strong>72% → 84%</strong> without requiring teachers to edit manually!
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 1:</strong> Check Student starting attendance (72% Shortage Alert)</span>
                  <button onClick={() => handleGoToRole('student', '/student')} className="btn btn-sm btn-outline text-xs">
                    <Play size={12} /> Student Dashboard
                  </button>
                </div>
                <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                  <span className="text-emerald-900 font-bold"><strong>Step 2 (Hero Trigger):</strong> HOD Approves → Agent Runs!</span>
                  <button onClick={() => handleGoToRole('hod', '/hod')} className="btn btn-sm btn-primary text-xs font-bold">
                    <Play size={12} /> Go to HOD & Approve
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 3:</strong> Verify Student Attendance is now 84% (Safe Standing)</span>
                  <button onClick={() => handleGoToRole('student', '/student/attendance')} className="btn btn-sm btn-outline text-xs">
                    <Play size={12} /> Verify Attendance
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FLOW 3 */}
          {activeTab === 'flow3' && (
            <div className="flex flex-col gap-2.5">
              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200">
                <span className="font-bold text-emerald-900 text-sm block">FLOW 3: Teacher Marks Live Attendance</span>
                <p className="text-emerald-800 mt-1 leading-relaxed">
                  Teacher selects active Period 2 lecture (Data Structures CS301), marks students Present/Absent with quick pills or 1-click "Mark All Present", and locks the session. Attendance instantly synchronizes with student portals.
                </p>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span>Open Teacher Live Roll Call Interface</span>
                <button onClick={() => handleGoToRole('teacher', '/teacher/attendance')} className="btn btn-sm btn-primary text-xs">
                  <Play size={12} /> Open Roll Call
                </button>
              </div>
            </div>
          )}

          {/* FLOW 4 */}
          {activeTab === 'flow4' && (
            <div className="flex flex-col gap-2.5">
              <div className="p-3 bg-indigo-50 rounded-xl border border-indigo-200">
                <span className="font-bold text-indigo-900 text-sm block">FLOW 4: Teacher Creates Assignment → Student Submits</span>
                <p className="text-indigo-800 mt-1 leading-relaxed">
                  Teacher publishes an assignment from Quick Actions. Student immediately receives notification and sees it in Pending Coursework on their Dashboard and Assignments page!
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 1:</strong> Teacher publishes new assignment</span>
                  <button onClick={() => handleGoToRole('teacher', '/teacher/assignments')} className="btn btn-sm btn-outline text-xs">
                    <Play size={12} /> Teacher Assignments
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 2:</strong> Student views and submits solution archive</span>
                  <button onClick={() => handleGoToRole('student', '/student/assignments')} className="btn btn-sm btn-primary text-xs">
                    <Play size={12} /> Student Assignments
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* FLOW 5 */}
          {activeTab === 'flow5' && (
            <div className="flex flex-col gap-2.5">
              <div className="p-3 bg-purple-50 rounded-xl border border-purple-200">
                <span className="font-bold text-purple-900 text-sm block">FLOW 5: HOD Provisions New Academic Section</span>
                <p className="text-purple-800 mt-1 leading-relaxed">
                  HOD clicks [ Add Section ] (e.g. "CSE-3C"), assigns room venue, TG mentor, and capacity. The section appears dynamically across Teacher roll call selectors, Timetable matrices, and Notice circular scopes!
                </p>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span>Open Classes & Sections Management</span>
                <button onClick={() => handleGoToRole('hod', '/hod/classes')} className="btn btn-sm btn-primary text-xs">
                  <Play size={12} /> HOD Classes & Sections
                </button>
              </div>
            </div>
          )}

          {/* FLOW 6 */}
          {activeTab === 'flow6' && (
            <div className="flex flex-col gap-2.5">
              <div className="p-3 bg-blue-50 rounded-xl border border-blue-200">
                <span className="font-bold text-blue-900 text-sm block">FLOW 6: AI Timetable Generation & Autonomous Conflict Healing</span>
                <p className="text-blue-800 mt-1 leading-relaxed">
                  HOD triggers AI generation with curriculum constraints. Timetable Agent flags 2 collisions (Room 204 double-booking and faculty workload spike). HOD clicks [ Resolve Conflicts Autonomously ] and the AI re-allocates rooms to lock the schedule!
                </p>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl border border-slate-200">
                <span>Open AI Timetable Generator</span>
                <button onClick={() => handleGoToRole('hod', '/hod/timetable')} className="btn btn-sm btn-primary text-xs">
                  <Play size={12} /> Timetable Generator
                </button>
              </div>
            </div>
          )}

          {/* FLOW 7 */}
          {activeTab === 'flow7' && (
            <div className="flex flex-col gap-2.5">
              <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
                <span className="font-bold text-rose-900 text-sm block">FLOW 7: Notice Broadcast Agent</span>
                <p className="text-rose-800 mt-1 leading-relaxed">
                  HOD or Teacher broadcasts circular with scope "Section CSE-3A". Notice Agent automatically dispatches push notification to students and displays it on their portal!
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 1:</strong> Broadcast circular</span>
                  <button onClick={() => handleGoToRole('hod', '/hod/notices')} className="btn btn-sm btn-outline text-xs">
                    <Play size={12} /> HOD Notices
                  </button>
                </div>
                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                  <span><strong>Step 2:</strong> Student receives notification</span>
                  <button onClick={() => handleGoToRole('student', '/student/notices')} className="btn btn-sm btn-primary text-xs">
                    <Play size={12} /> Student Notices
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400">All 8 demo flows interactive with mock data</span>
          <button onClick={onClose} className="btn btn-outline text-xs py-1.5 px-4">
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
