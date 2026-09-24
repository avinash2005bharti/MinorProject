import React from 'react';
import { useERP } from '../context/ERPContext';
import { Bot, CheckCircle2, Loader2, Sparkles, X, ArrowRight } from 'lucide-react';

export default function AgentSimulationModal() {
  const { agentModal, closeAgentModal } = useERP();

  if (!agentModal.isOpen) return null;

  const { title, subtitle, steps, activeStepIndex, isComplete, agentType } = agentModal;
  const progressPercent = steps.length > 0 ? Math.min(100, Math.round((activeStepIndex / steps.length) * 100)) : 0;

  return (
    <div className="modal-backdrop">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: 'var(--radius-xl)',
                backgroundColor: 'var(--primary-container)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Bot size={24} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h3 style={{ fontSize: '18px', fontWeight: 700, color: 'var(--text-primary)' }}>
                  {title}
                </h3>
                <span className="agent-pulse" />
              </div>
              <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '2px' }}>
                {subtitle}
              </p>
            </div>
          </div>

          {isComplete && (
            <button
              onClick={closeAgentModal}
              style={{
                color: 'var(--text-muted)',
                padding: '4px',
                borderRadius: 'var(--radius-md)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <X size={18} />
            </button>
          )}
        </div>

        {/* Progress Bar */}
        <div style={{ marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
              {isComplete ? 'Automation Completed' : 'Agent Execution Stream'}
            </span>
            <span style={{ fontSize: '12px', fontWeight: 700, color: isComplete ? 'var(--secondary)' : 'var(--primary)' }}>
              {progressPercent}%
            </span>
          </div>
          <div style={{ width: '100%', height: '8px', backgroundColor: 'var(--surface-high)', borderRadius: 'var(--radius-full)', overflow: 'hidden' }}>
            <div
              style={{
                width: `${progressPercent}%`,
                height: '100%',
                backgroundColor: isComplete ? 'var(--secondary)' : 'var(--primary)',
                borderRadius: 'var(--radius-full)',
                transition: 'width 0.4s ease-out'
              }}
            />
          </div>
        </div>

        {/* Step-by-Step Execution Feed */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            backgroundColor: 'var(--surface-low)',
            padding: '1rem',
            borderRadius: 'var(--radius-xl)',
            marginBottom: '1.25rem',
            maxHeight: '280px',
            overflowY: 'auto'
          }}
        >
          {steps.map((step, idx) => {
            const isDone = activeStepIndex > idx;
            const isCurrent = activeStepIndex === idx;

            return (
              <div
                key={step.id}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  fontSize: '13px',
                  fontWeight: isCurrent ? 600 : 400,
                  color: isDone ? 'var(--text-primary)' : isCurrent ? 'var(--primary)' : 'var(--text-muted)',
                  transition: 'all 0.2s ease',
                  opacity: isDone || isCurrent ? 1 : 0.4
                }}
              >
                <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {isDone ? (
                    <CheckCircle2 size={16} color="var(--secondary)" />
                  ) : isCurrent ? (
                    <Loader2 size={16} color="var(--primary)" className="animate-spin" />
                  ) : (
                    <div
                      style={{
                        width: '14px',
                        height: '14px',
                        borderRadius: '50%',
                        border: '1.5px solid var(--text-muted)'
                      }}
                    />
                  )}
                </div>
                <span style={{ lineHeight: 1.4 }}>{step.text}</span>
              </div>
            );
          })}
        </div>

        {/* Footer / Completion State */}
        {isComplete ? (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              backgroundColor: 'var(--secondary-container)',
              padding: '0.75rem 1rem',
              borderRadius: 'var(--radius-xl)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--on-secondary-container)' }}>
              <Sparkles size={18} />
              <span style={{ fontSize: '13px', fontWeight: 600 }}>
                Workflow propagated across sections and databases
              </span>
            </div>
            <button
              onClick={closeAgentModal}
              className="btn btn-sm btn-primary"
              style={{ backgroundColor: 'var(--secondary)' }}
            >
              <span>Done</span>
              <ArrowRight size={14} />
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: 'var(--text-muted)', fontSize: '12px' }}>
            <Loader2 size={14} className="animate-spin" />
            <span>Autonomous agent performing multi-system sync...</span>
          </div>
        )}
      </div>
    </div>
  );
}
