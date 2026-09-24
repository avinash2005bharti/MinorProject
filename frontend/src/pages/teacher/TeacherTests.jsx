import React from 'react';
import { useERP } from '../../context/ERPContext';
import { FileQuestion, PlusCircle, Clock, Award, CheckCircle2, Users } from 'lucide-react';

export default function TeacherTests() {
  const { tests, openModal } = useERP();

  return (
    <div className="page-wrapper">
      <div className="flex flex-col gap-5">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Online Assessments & Quizzes</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Create multiple-choice unit tests, set timers & view auto-evaluated score analytics
            </p>
          </div>

          <button
            onClick={() => openModal('createTest')}
            className="btn btn-primary text-xs py-2 px-4 shadow-sm"
          >
            <PlusCircle size={15} />
            <span>Create New Test</span>
          </button>
        </div>

        {/* Tests List */}
        <div className="flex flex-col gap-3.5">
          {tests.map((tst) => (
            <div key={tst.id} className="card flex flex-col gap-3">
              <div className="flex items-start justify-between flex-wrap gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-slate-900">{tst.title}</h3>
                    <span className={`badge ${tst.status === 'Completed' ? 'badge-emerald' : 'badge-amber'} text-xs`}>
                      {tst.status}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Course: <strong>{tst.subject} ({tst.subjectCode})</strong> • Target: <strong>{tst.section}</strong> • Scheduled: <strong>{tst.date}</strong>
                  </p>
                </div>

                <div className="flex items-center gap-2 text-xs">
                  <span className="p-2 bg-slate-100 rounded-xl font-bold text-slate-700">
                    {tst.duration}
                  </span>
                  <span className="p-2 bg-slate-100 rounded-xl font-bold text-slate-700">
                    {tst.totalQuestions} Questions
                  </span>
                  <span className="p-2 bg-blue-50 text-blue-700 rounded-xl font-bold">
                    Max: {tst.totalMarks} Marks
                  </span>
                </div>
              </div>

              {/* Assessment Stats */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Submissions</span>
                  <span className="text-base font-bold text-slate-800">{tst.submissionCount} Completed</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Average Score</span>
                  <span className="text-base font-bold text-emerald-600">
                    {tst.averageScore ? `${tst.averageScore} / ${tst.totalMarks}` : 'Pending Evaluation'}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px] uppercase font-bold">Evaluation Engine</span>
                  <span className="text-xs font-semibold text-blue-600">Autonomous Instant Key Check</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
