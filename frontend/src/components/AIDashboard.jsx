import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../context/ERPContext';
import {
  Paperclip,
  Mic,
  MicOff,
  Send,
  X,
  FileText,
  Sparkles,
  Bot,
  ChevronDown,
  ChevronUp,
  CornerDownLeft,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

export default function AIDashboard({ isSidebarOpen }) {
  const { currentRole, currentUser, students, assignments, timetable } = useERP();

  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isResponseOpen, setIsResponseOpen] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [messages, setMessages] = useState([]);

  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Suggested quick prompts per role
  const getRoleSuggestions = () => {
    switch (currentRole) {
      case 'student':
        return [
          'What is my current attendance in CS301?',
          'What is my next class and room?',
          'How do I apply for Hackathon duty leave?'
        ];
      case 'teacher':
        return [
          'Show today\'s teaching schedule',
          'Which students in CSE-3A are at attendance risk?',
          'Pending assignment evaluations'
        ];
      case 'tg':
        return [
          'Show mentees with attendance < 75%',
          'Pending student clearances in my queue',
          'Toggle office availability status'
        ];
      case 'hod':
        return [
          'Summary of pending leave approvals',
          'Run AI timetable conflict diagnosis',
          'Department attendance health report'
        ];
      case 'admin':
      default:
        return [
          'Autonomous agent telemetry status',
          'Institutional enrollment statistics',
          'System health and uptime report'
        ];
    }
  };

  // Setup Web Speech API if supported
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = 'en-US';

        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setPrompt((prev) => (prev ? `${prev} ${transcript}` : transcript));
          setIsListening(false);
          if (textareaRef.current) {
            textareaRef.current.focus();
            setTimeout(autoResizeTextarea, 50);
          }
        };

        recognition.onerror = () => {
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition initialization error:', e);
      }
    }
  }, []);

  // Auto-resize textarea to fit multiline prompts up to 120px
  const autoResizeTextarea = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const newHeight = Math.min(Math.max(textareaRef.current.scrollHeight, 38), 120);
      textareaRef.current.style.height = `${newHeight}px`;
    }
  };

  const handlePromptChange = (e) => {
    setPrompt(e.target.value);
    autoResizeTextarea();
  };

  // Toggle voice input
  const handleToggleVoice = () => {
    if (isListening) {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
    } else {
      setIsListening(true);
      if (recognitionRef.current) {
        try {
          recognitionRef.current.start();
        } catch (e) {
          console.warn('SpeechRecognition start error:', e);
          fallbackSimulateSpeech();
        }
      } else {
        fallbackSimulateSpeech();
      }
    }
  };

  // Fallback voice simulation if browser does not support Web Speech API
  const fallbackSimulateSpeech = () => {
    setTimeout(() => {
      const simulatedPhrases = [
        'Check my attendance standing in CS301',
        'Show my next scheduled class slot',
        'Draft duty leave application for Hackathon',
        'Show timetable conflicts for tomorrow'
      ];
      const randomPhrase = simulatedPhrases[Math.floor(Math.random() * simulatedPhrases.length)];
      setPrompt((prev) => (prev ? `${prev} ${randomPhrase}` : randomPhrase));
      setIsListening(false);
      if (textareaRef.current) {
        textareaRef.current.focus();
        setTimeout(autoResizeTextarea, 50);
      }
    }, 2200);
  };

  // File Attachment Handling
  const handleAttachmentClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB',
        type: file.type || 'document'
      });
    }
    e.target.value = '';
  };

  const handleRemoveAttachment = () => {
    setAttachedFile(null);
  };

  // Generate smart college ERP assistant response based on role & prompt
  const generateAIResponse = (userQuery, fileInfo) => {
    const q = userQuery.toLowerCase();
    const student = currentUser;

    if (q.includes('attendance') || q.includes('shortage') || q.includes('eligibility')) {
      if (currentRole === 'student') {
        return `📊 **Attendance Health Analysis for ${student.name} (${student.rollNo}):**\n\n` +
          `• **Current Overall Attendance:** ${student.attendance}% (Statutory threshold is 75%).\n` +
          `• **Status:** ${student.attendance < 75 ? '⚠️ Warning: Attendance is below mandatory threshold.' : '✅ Safe Exam Standing.'}\n` +
          `• **Pending Adjustment:** You have an active Hackathon OD leave pending approval. Once HOD Dr. S. Roy clears it, the Autonomous Attendance Agent will raise your attendance to **84%** automatically.\n` +
          `• **Next Step:** You can view detailed subject-wise breakdown under the **Attendance** ledger.`;
      } else if (currentRole === 'tg' || currentRole === 'hod') {
        const atRisk = students ? students.filter((s) => s.attendance < 75) : [];
        return `📋 **Attendance Roster Overview:**\n\n` +
          `• **Section:** CSE-3A\n` +
          `• **Students Below 75% Threshold:** ${atRisk.length} students (${atRisk.map((s) => s.name).join(', ')}).\n` +
          `• **Automated Alerts:** Warning notifications have been dispatched to student portals and assigned TG mentors.`;
      } else {
        return `📊 **Faculty Attendance Record:** CS301 (Data Structures) overall average is 79.4%. Live roll call for Period 2 is ready to be marked.`;
      }
    }

    if (q.includes('class') || q.includes('lecture') || q.includes('timetable') || q.includes('room') || q.includes('schedule')) {
      return `📅 **Schedule Briefing:**\n\n` +
        `• **Current Live Session:** Data Structures & Algorithms (CS301) in **Room 204** (10:30 AM – 11:30 AM).\n` +
        `• **Faculty:** Dr. Rajesh Verma.\n` +
        `• **Upcoming:** Computer Networks (CS304) at 02:00 PM in Room 204.\n` +
        `• **Room Conflict Status:** Zero timetable collisions detected for today.`;
    }

    if (q.includes('leave') || q.includes('od') || q.includes('hackathon') || q.includes('apply')) {
      return `📝 **Leave Application & Duty Credit Routing:**\n\n` +
        `• **Workflow:** Student Application ➔ TG Mentor Review ➔ HOD Approval ➔ Autonomous Agent Sync.\n` +
        `• **Current Request:** REQ-ATT-101 (SIH 2025 Grand Finale, 10-15 Sept) is awaiting TG Prof. K. Sen's clearance.\n` +
        `• **Fallback Mechanism:** If your TG is marked unavailable, the system automatically routes directly to HOD office without delays.\n` +
        (fileInfo ? `• **Attached File:** "${fileInfo.name}" (${fileInfo.size}) has been verified and attached as supporting proof.` : '• **Tip:** Use the paperclip icon to attach duty certificates or medical prescriptions.');
    }

    if (q.includes('conflict') || q.includes('generator') || q.includes('agent')) {
      return `🤖 **Autonomous CampusFlow AI System Status:**\n\n` +
        `• **Attendance Agent:** Active & listening for HOD approvals.\n` +
        `• **Timetable Generator Agent:** Genetic constraint solver ready; no hall or faculty double-bookings.\n` +
        `• **Escalation Monitor:** Fallback routing rules active. Zero bottlenecks detected across departments.`;
    }

    // Default intelligent assistant response
    return `👋 **CampusFlow AI Assistant:**\n\n` +
      `I processed your query regarding: *"${userQuery}"*.\n\n` +
      (fileInfo ? `📎 **Attached Document:** \`${fileInfo.name}\` (${fileInfo.size}) analyzed.\n\n` : '') +
      `Here is what you can do right now:\n` +
      `• Check live academic data or submit requests through the dashboard quick actions.\n` +
      `• View your personalized schedule, attendance metrics, or approvals ledger.\n` +
      `• Feel free to ask me to check attendance, draft leave requests, inspect room schedules, or review pending tasks!`;
  };

  // Submit Prompt
  const handleSubmit = (e) => {
    if (e) e.preventDefault();
    const trimmed = prompt.trim();
    if (!trimmed && !attachedFile) return;

    const userMsg = {
      id: Date.now(),
      sender: 'user',
      text: trimmed || (attachedFile ? `Shared document: ${attachedFile.name}` : ''),
      file: attachedFile,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setAttachedFile(null);
    setIsResponseOpen(true);
    setIsGenerating(true);

    if (textareaRef.current) {
      textareaRef.current.style.height = '38px';
    }

    // Simulate instant AI reasoning and response
    setTimeout(() => {
      const responseText = generateAIResponse(trimmed, userMsg.file);
      const aiMsg = {
        id: Date.now() + 1,
        sender: 'ai',
        text: responseText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, aiMsg]);
      setIsGenerating(false);
    }, 600);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSuggestionClick = (suggestionText) => {
    setPrompt(suggestionText);
    if (textareaRef.current) {
      textareaRef.current.focus();
      setTimeout(autoResizeTextarea, 30);
    }
  };

  const hasContent = prompt.trim().length > 0 || attachedFile !== null;

  return (
    <>
      {/* Hidden File Input for Paperclip attachment */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.txt,.csv"
      />

      {/* Floating AI Response Drawer (Opens when a prompt is asked) */}
      {isResponseOpen && (
        <div
          className={`ai-response-drawer ${isSidebarOpen ? 'sidebar-open-offset' : ''}`}
          role="region"
          aria-label="AI Assistant Conversation"
        >
          <div className="ai-response-header">
            <div className="flex items-center gap-2">
              <div className="ai-bot-avatar">
                <Bot size={16} />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold text-slate-900">CampusFlow AI Assistant</span>
                  <span className="badge badge-indigo text-[10px] py-0 px-1.5">Online</span>
                </div>
                <span className="text-[10px] text-slate-500">Autonomous College Intelligence • OIST CSE</span>
              </div>
            </div>

            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setMessages([])}
                className="ai-drawer-btn text-[11px] text-slate-400 hover:text-slate-600 px-2 py-1"
                title="Clear conversation"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => setIsResponseOpen(false)}
                className="ai-drawer-btn p-1 text-slate-500 hover:text-slate-800"
                aria-label="Close response panel"
                title="Minimize panel"
              >
                <ChevronDown size={18} />
              </button>
            </div>
          </div>

          <div className="ai-response-body">
            {messages.length === 0 ? (
              <div className="ai-empty-state">
                <Bot size={28} className="text-blue-600 opacity-60 mb-2" />
                <p className="text-xs font-semibold text-slate-700">How can I assist your campus workflow?</p>
                <p className="text-[11px] text-slate-500 mt-1 max-w-sm">
                  Ask about attendance calculations, class schedules, timetable generation, or leave approvals.
                </p>
                <div className="ai-suggestions-list mt-3">
                  {getRoleSuggestions().map((s, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSuggestionClick(s)}
                      className="ai-suggestion-chip"
                    >
                      <span>{s}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="ai-messages-flow">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`ai-message-bubble ${msg.sender === 'user' ? 'ai-msg-user' : 'ai-msg-assistant'}`}
                  >
                    {msg.sender === 'ai' && (
                      <div className="ai-msg-icon">
                        <Bot size={14} />
                      </div>
                    )}
                    <div className="ai-msg-content">
                      {msg.file && (
                        <div className="ai-file-preview-card">
                          <FileText size={14} className="text-blue-600 shrink-0" />
                          <span className="truncate">{msg.file.name}</span>
                          <span className="text-[10px] text-slate-400">({msg.file.size})</span>
                        </div>
                      )}
                      <div className="ai-msg-text whitespace-pre-line">{msg.text}</div>
                      <span className="ai-msg-time">{msg.timestamp}</span>
                    </div>
                  </div>
                ))}

                {isGenerating && (
                  <div className="ai-message-bubble ai-msg-assistant">
                    <div className="ai-msg-icon">
                      <Bot size={14} />
                    </div>
                    <div className="ai-msg-content">
                      <div className="ai-typing-indicator">
                        <span />
                        <span />
                        <span />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* FIXED AI DASHBOARD PANEL (Bottom of screen on every page) */}
      <aside
        className={`ai-fixed-bottom-dashboard ${isSidebarOpen ? 'sidebar-open-offset' : ''}`}
        aria-label="Fixed AI Assistant Bottom Dock"
      >
        <div className="ai-dock-container">
          {/* Active File Attachment / Voice Listening Banner */}
          {(attachedFile || isListening) && (
            <div className="ai-dock-status-bar">
              {attachedFile && (
                <div className="ai-attachment-pill">
                  <Paperclip size={13} className="text-blue-600" />
                  <span className="truncate font-semibold">{attachedFile.name}</span>
                  <span className="text-[10px] text-slate-400">({attachedFile.size})</span>
                  <button
                    type="button"
                    onClick={handleRemoveAttachment}
                    className="ai-attachment-remove"
                    title="Remove attachment"
                    aria-label="Remove attachment"
                  >
                    <X size={12} />
                  </button>
                </div>
              )}

              {isListening && (
                <div className="ai-listening-pulse-banner">
                  <span className="ai-listening-dot" />
                  <span className="text-xs font-semibold text-rose-700">Listening to voice command... Click microphone to finish</span>
                </div>
              )}
            </div>
          )}

          {/* MAIN DOCK ROW: 📎 | [ Type your message here... ] | 🎤 | ➤ */}
          <form onSubmit={handleSubmit} className="ai-dock-form">
            {/* 1. Attachment Button (Paperclip on the left) */}
            <button
              type="button"
              onClick={handleAttachmentClick}
              className={`ai-dock-btn ai-dock-btn-attach ${attachedFile ? 'active' : ''}`}
              title="Attach document or file (PDF, Doc, Image)"
              aria-label="Attach document or file"
            >
              <Paperclip size={18} />
            </button>

            {/* 2. Multiline Text Area */}
            <div className="ai-textarea-wrapper">
              <textarea
                ref={textareaRef}
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                rows={1}
                placeholder="Type your message here... (Shift+Enter for newline)"
                className="ai-multiline-textarea"
                aria-label="Type your message or prompt"
              />
            </div>

            {/* 3. Microphone Button for Voice Input */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`ai-dock-btn ai-dock-btn-mic ${isListening ? 'listening' : ''}`}
              title={isListening ? 'Stop voice recording' : 'Voice input (click to speak)'}
              aria-label={isListening ? 'Stop voice recording' : 'Voice input'}
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            {/* 4. Send Button on the right */}
            <button
              type="submit"
              disabled={!hasContent}
              className={`ai-dock-btn ai-dock-btn-send ${hasContent ? 'enabled' : 'disabled'}`}
              title="Send prompt to AI Assistant"
              aria-label="Send prompt"
            >
              <Send size={16} />
            </button>
          </form>

          {/* Subtle suggestions pill toggle on desktop / tablet */}
          <div className="ai-dock-footer">
            <div className="ai-dock-branding">
              <Sparkles size={11} className="text-blue-600" />
              <span>Antigravity AI Assistant</span>
              <span className="text-slate-400">•</span>
              <span className="text-slate-500">Autonomous ERP Intelligence</span>
            </div>

            <div className="ai-quick-hints">
              <button
                type="button"
                onClick={() => setIsResponseOpen(!isResponseOpen)}
                className="ai-history-toggle"
              >
                <span>{isResponseOpen ? 'Hide Assistant Dialogue' : 'Open Assistant Dialogue'}</span>
                {isResponseOpen ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
              </button>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
