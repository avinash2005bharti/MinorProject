import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useERP } from '../context/ERPContext';
import { aiApi } from '../api/aiApi';
import {
  Bot,
  Sparkles,
  X,
  Send,
  Mic,
  MicOff,
  Paperclip,
  CheckCircle2,
  AlertCircle,
  Clock,
  Calendar,
  FileText,
  User,
  CornerDownLeft,
  ChevronDown,
  RotateCcw,
  Maximize2,
  Download,
  AlertTriangle
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

export default function AIChatWidget() {
  const { currentRole, currentUser } = useERP();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [prompt, setPrompt] = useState('');
  const [attachedFile, setAttachedFile] = useState(null);
  const [isListening, setIsListening] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const conversationIdRef = useRef(`conv-${Date.now()}`);
  const [messages, setMessages] = useState(() => [
    {
      id: 'msg-welcome',
      role: 'assistant',
      text: `👋 Hello ${currentUser?.name ? currentUser.name.split(' ')[0] : 'there'}! I am your **CampusFlow AI Copilot**.\n\nI can analyze your attendance health, retrieve your class timetable, answer engineering & technical questions, explain leave clearances, or check department status. How can I assist you today?`,
      time: 'Just now'
    }
  ]);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);
  const recognitionRef = useRef(null);

  // Auto-scroll chat to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
      textareaRef.current?.focus();
    }
  }, [isOpen, messages]);

  // Suggested quick prompts per role
  const getRoleSuggestions = () => {
    switch (currentRole) {
      case 'student':
        return [
          'What is my attendance standing?',
          'What is my next class and room?',
          'How do I apply for Hackathon leave?'
        ];
      case 'teacher':
        return [
          'Show today\'s teaching schedule',
          'Which students are below the attendance requirement?',
          'Pending assignment evaluations'
        ];
      case 'tg':
        return [
          'Show mentees with attendance < 75%',
          'Pending student clearances in my queue',
          'Office clearance procedures'
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
          'Academic enrollment overview',
          'System health and uptime report',
          'Institutional directory summary'
        ];
    }
  };

  // Web Speech API
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
          textareaRef.current?.focus();
        };

        recognition.onerror = () => setIsListening(false);
        recognition.onend = () => setIsListening(false);

        recognitionRef.current = recognition;
      } catch (e) {
        console.warn('SpeechRecognition unavailable:', e);
      }
    }
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      try { recognitionRef.current.stop(); } catch {}
      setIsListening(false);
    } else {
      setIsListening(true);
      try {
        recognitionRef.current.start();
      } catch {
        setIsListening(false);
      }
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachedFile({
        name: file.name,
        size: (file.size / 1024).toFixed(1) + ' KB'
      });
    }
    e.target.value = '';
  };

  const handleSend = async (textToSend) => {
    const query = (textToSend || prompt).trim();
    if (!query && !attachedFile) return;

    const userMsg = {
      id: `msg-${Date.now()}`,
      role: 'user',
      text: query,
      attachment: attachedFile,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages((prev) => [...prev, userMsg]);
    setPrompt('');
    setAttachedFile(null);
    setIsGenerating(true);

    try {
      const res = await aiApi.chat({
        prompt: query,
        role: currentRole || 'student',
        user_id: currentUser?.id || 'user_default',
        conversation_id: conversationIdRef.current
      });

      const responseText = res?.answer || res?.data?.answer;
      if (!responseText) throw new Error('The AI service returned an empty response.');
      const assistantMsg = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: responseText,
        agent_used: res?.agent_used,
        detected_intent: res?.detected_intent,
        steps: res?.steps || [],
        requires_confirmation: res?.requires_confirmation,
        confirmation_prompt: res?.confirmation_prompt,
        action_to_confirm: res?.action_to_confirm,
        deliverable: res?.deliverable,
        citations: res?.citations || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err) {
      console.warn('[AIChatWidget] AI Service query note:', err.message);
      const assistantMsg = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: 'The AI service is unavailable right now. Please try again later.',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => [...prev, assistantMsg]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleConfirmAction = async (msgId, actionToConfirm) => {
    setIsGenerating(true);
    try {
      const res = await aiApi.chat({
        prompt: `CONFIRM: ${actionToConfirm.tool}`,
        confirmed_action: actionToConfirm,
        role: currentRole || 'student',
        user_id: currentUser?.id || 'user_default',
        conversation_id: conversationIdRef.current
      });

      const responseText = res?.answer || res?.data?.answer || 'Action executed successfully.';
      const confirmReplyMsg = {
        id: `msg-${Date.now()}-ai`,
        role: 'assistant',
        text: responseText,
        steps: res?.steps || [],
        deliverable: res?.deliverable,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };
      setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, requires_confirmation: false } : m).concat(confirmReplyMsg));
    } catch (err) {
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancelAction = (msgId) => {
    setMessages((prev) => prev.map(m => m.id === msgId ? { ...m, requires_confirmation: false } : m).concat({
      id: `msg-${Date.now()}-ai`,
      role: 'assistant',
      text: 'Action cancelled.',
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }));
  };

  const handleClearChat = () => {
    conversationIdRef.current = `conv-${Date.now()}`;
    setMessages([
      {
        id: `msg-welcome-${Date.now()}`,
        role: 'assistant',
        text: `👋 New session started! How can I assist you with your CSE academic queries, timetable, attendance, or technical questions today?`,
        time: 'Just now'
      }
    ]);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <>
      {/* Floating Chat Trigger Button (Fixed Bottom-Right) */}
      <button
        onClick={() => setIsOpen((prev) => !prev)}
        style={{
          position: 'fixed',
          bottom: '1.75rem',
          right: '1.75rem',
          zIndex: 90,
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          backgroundColor: '#1D4ED8',
          color: '#FFFFFF',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 10px 25px -4px rgba(29, 78, 216, 0.5), 0 4px 10px -2px rgba(0, 0, 0, 0.1)',
          border: '2px solid rgba(255, 255, 255, 0.9)',
          cursor: 'pointer',
          transition: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)'
        }}
        className="hover:scale-110 active:scale-95"
        title={isOpen ? 'Close AI Assistant' : 'Chat with CampusFlow AI'}
        aria-label="Toggle AI Chat"
      >
        {isOpen ? <X size={22} /> : <Bot size={24} />}
        {!isOpen && (
          <span
            style={{
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              width: '14px',
              height: '14px',
              borderRadius: '50%',
              backgroundColor: '#10B981',
              border: '2px solid #FFFFFF'
            }}
          />
        )}
      </button>

      {/* Floating Chat Drawer Window */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            bottom: '5.5rem',
            right: '1.75rem',
            zIndex: 95,
            width: '390px',
            maxWidth: 'calc(100vw - 2.5rem)',
            height: '540px',
            maxHeight: 'calc(100vh - 7.5rem)',
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            boxShadow: '0 25px 50px -12px rgba(15, 23, 42, 0.25), 0 0 0 1px rgba(226, 232, 240, 0.8)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            animation: 'scaleUp 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '0.85rem 1rem',
              backgroundColor: '#1E40AF',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 2px 4px rgba(0, 0, 0, 0.08)'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Bot size={20} />
              </div>
              <div>
                <h4 style={{ fontSize: '14px', fontWeight: 800, margin: 0, lineHeight: 1.2, color: '#FFFFFF' }}>
                  CampusFlow AI Copilot
                </h4>
                <span style={{ fontSize: '11px', color: '#BFDBFE', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <span style={{ width: '6px', height: '6px', borderRadius: '50%', backgroundColor: '#34D399', display: 'inline-block' }} />
                  Live Academic Assistant
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <button
                onClick={handleClearChat}
                style={{
                  color: '#FFFFFF',
                  padding: '5px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  border: 'none'
                }}
                title="New Chat Session"
              >
                <RotateCcw size={14} />
              </button>
              <button
                onClick={() => {
                  setIsOpen(false);
                  navigate('/ai-workspace', { state: { conversationId: conversationIdRef.current } });
                }}
                style={{
                  color: '#FFFFFF',
                  padding: '5px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  border: 'none'
                }}
                title="Open Fullscreen AI Workspace"
              >
                <Maximize2 size={14} />
              </button>
              <button
                onClick={() => setIsOpen(false)}
                style={{
                  color: '#FFFFFF',
                  padding: '5px',
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  cursor: 'pointer',
                  border: 'none'
                }}
                title="Close Chat"
              >
                <X size={15} />
              </button>
            </div>
          </div>

          {/* Quick Suggestion Pills */}
          <div
            style={{
              padding: '0.5rem 0.75rem',
              backgroundColor: '#F8FAFC',
              borderBottom: '1px solid #E2E8F0',
              display: 'flex',
              gap: '0.4rem',
              overflowX: 'auto',
              whiteSpace: 'nowrap'
            }}
          >
            {getRoleSuggestions().map((sugg, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(sugg)}
                style={{
                  fontSize: '11px',
                  fontWeight: 600,
                  padding: '0.3rem 0.65rem',
                  borderRadius: '12px',
                  backgroundColor: '#FFFFFF',
                  color: '#1D4ED8',
                  border: '1px solid #DBEAFE',
                  cursor: 'pointer',
                  flexShrink: 0,
                  transition: 'all 0.15s ease'
                }}
                className="hover:bg-blue-50"
              >
                {sugg}
              </button>
            ))}
          </div>

          {/* Messages Stream */}
          <div
            style={{
              flex: 1,
              padding: '1rem',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.85rem',
              backgroundColor: '#F8FAFC'
            }}
          >
            {messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div
                  key={msg.id}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: isUser ? 'flex-end' : 'flex-start',
                    maxWidth: '88%',
                    alignSelf: isUser ? 'flex-end' : 'flex-start'
                  }}
                >
                  <div
                    style={{
                      padding: '0.75rem 0.95rem',
                      borderRadius: isUser ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
                      backgroundColor: isUser ? '#1D4ED8' : '#FFFFFF',
                      color: isUser ? '#FFFFFF' : '#1E293B',
                      fontSize: '12.5px',
                      lineHeight: 1.5,
                      boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
                      border: isUser ? 'none' : '1px solid #E2E8F0',
                      whiteSpace: isUser ? 'pre-wrap' : 'normal'
                    }}
                  >
                    {!isUser && msg.agent_used && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.3rem',
                          marginBottom: '0.45rem',
                          padding: '0.15rem 0.45rem',
                          borderRadius: '4px',
                          backgroundColor: '#EFF6FF',
                          color: '#1D4ED8',
                          fontSize: '10px',
                          fontWeight: 700
                        }}
                      >
                        <Sparkles size={11} />
                        <span>{msg.agent_used}</span>
                      </div>
                    )}
                    {isUser ? (
                      <div>{msg.text}</div>
                    ) : (
                      <div className="ai-markdown-content">
                        <ReactMarkdown
                          remarkPlugins={[remarkMath, remarkGfm]}
                          rehypePlugins={[rehypeKatex]}
                        >
                          {msg.text}
                        </ReactMarkdown>

                        {/* Agent Tool Execution Steps */}
                        {msg.steps && msg.steps.length > 0 && (
                          <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem', display: 'flex', flexDirection: 'column', gap: '3px', background: '#F8FAFC', padding: '6px 8px', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            {msg.steps.map((st, i) => (
                              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '10.5px', color: '#059669', fontWeight: 600 }}>
                                <span>✓</span> <span>{st}</span>
                              </div>
                            ))}
                          </div>
                        )}

                        {/* Destructive Action Confirmation */}
                        {msg.requires_confirmation && (
                          <div style={{ marginTop: '0.6rem', padding: '0.55rem', backgroundColor: '#FFFBEB', border: '1px solid #FDE68A', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: '#B45309', fontWeight: 700, fontSize: '11px', marginBottom: '4px' }}>
                              <AlertTriangle size={12} /> High-Impact Action Confirmation
                            </div>
                            <div style={{ fontSize: '11px', color: '#92400E', marginBottom: '8px' }}>
                              {msg.confirmation_prompt}
                            </div>
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button
                                onClick={() => handleConfirmAction(msg.id, msg.action_to_confirm)}
                                style={{ padding: '4px 9px', backgroundColor: '#DC2626', color: '#FFF', border: 'none', borderRadius: '5px', fontSize: '10.5px', fontWeight: 700, cursor: 'pointer' }}
                              >
                                Confirm & Execute
                              </button>
                              <button
                                onClick={() => handleCancelAction(msg.id)}
                                style={{ padding: '4px 9px', backgroundColor: '#E2E8F0', color: '#475569', border: 'none', borderRadius: '5px', fontSize: '10.5px', fontWeight: 600, cursor: 'pointer' }}
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Downloadable Deliverable */}
                        {msg.deliverable && (
                          <div style={{ marginTop: '0.5rem', padding: '0.5rem 0.65rem', backgroundColor: '#F0FDF4', border: '1px solid #BBF7D0', borderRadius: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                              <span style={{ fontSize: '11px', fontWeight: 600, color: '#166534' }}>{msg.deliverable.filename}</span>
                              <a
                                href={msg.deliverable.url}
                                target="_blank"
                                rel="noreferrer"
                                style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontSize: '11px', color: '#16a34a', textDecoration: 'none', fontWeight: 700 }}
                              >
                                <Download size={12} /> Download
                              </a>
                            </div>
                          </div>
                        )}

                        {/* Source Citations */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div style={{ marginTop: '0.45rem', display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                            {msg.citations.map((c, i) => (
                              <span key={i} style={{ fontSize: '9.5px', backgroundColor: '#EEF2FF', color: '#4338CA', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                                {c}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {msg.attachment && (
                      <div
                        style={{
                          marginTop: '0.5rem',
                          padding: '0.35rem 0.6rem',
                          borderRadius: '8px',
                          backgroundColor: isUser ? 'rgba(255,255,255,0.18)' : '#F1F5F9',
                          fontSize: '11px',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem'
                        }}
                      >
                        <FileText size={13} />
                        <span>{msg.attachment.name}</span>
                      </div>
                    )}
                  </div>
                  <span style={{ fontSize: '10px', color: '#94A3B8', marginTop: '3px', padding: '0 4px' }}>
                    {msg.time}
                  </span>
                </div>
              );
            })}

            {isGenerating && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '12px', padding: '0.5rem' }}>
                <span className="spinner-border spinner-border-sm text-primary" role="status" style={{ width: '14px', height: '14px' }} />
                <span>Thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Attached File Preview */}
          {attachedFile && (
            <div
              style={{
                padding: '0.4rem 0.75rem',
                backgroundColor: '#EFF6FF',
                borderTop: '1px solid #DBEAFE',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '11px',
                color: '#1D4ED8'
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <FileText size={14} />
                <span>{attachedFile.name} ({attachedFile.size})</span>
              </div>
              <button
                onClick={() => setAttachedFile(null)}
                style={{ color: '#E11D48', background: 'none', border: 'none', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
          )}

          {/* Input Box Footer */}
          <div
            style={{
              padding: '0.65rem 0.75rem',
              backgroundColor: '#FFFFFF',
              borderTop: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              gap: '0.45rem'
            }}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              style={{ display: 'none' }}
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: '#F1F5F9',
                color: '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title="Attach Document"
            >
              <Paperclip size={16} />
            </button>

            <button
              type="button"
              onClick={toggleListening}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: isListening ? '#FEE2E2' : '#F1F5F9',
                color: isListening ? '#EF4444' : '#64748B',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0
              }}
              title={isListening ? 'Stop Voice Recording' : 'Voice Input'}
            >
              {isListening ? <MicOff size={16} /> : <Mic size={16} />}
            </button>

            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about timetable, attendance, leave..."
              style={{
                flex: 1,
                padding: '0.45rem 0.65rem',
                fontSize: '12px',
                border: '1px solid #E2E8F0',
                borderRadius: '8px',
                outline: 'none',
                resize: 'none',
                lineHeight: 1.4,
                maxHeight: '75px',
                fontFamily: 'inherit'
              }}
            />

            <button
              type="button"
              disabled={!prompt.trim() && !attachedFile}
              onClick={() => handleSend()}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '8px',
                backgroundColor: (prompt.trim() || attachedFile) ? '#1D4ED8' : '#E2E8F0',
                color: (prompt.trim() || attachedFile) ? '#FFFFFF' : '#94A3B8',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                border: 'none',
                cursor: (prompt.trim() || attachedFile) ? 'pointer' : 'default',
                flexShrink: 0
              }}
              title="Send Message"
            >
              <Send size={15} />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
