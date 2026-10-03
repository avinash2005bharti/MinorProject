import React, { useState, useRef, useEffect } from 'react';
import { useERP } from '../../context/ERPContext';
import { aiApi } from '../../api/aiApi';
import { fileApi } from '../../api/fileApi';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import {
  Bot,
  Sparkles,
  Send,
  Paperclip,
  X,
  FileText,
  FileSpreadsheet,
  FileImage,
  Presentation,
  Download,
  CheckCircle2,
  AlertTriangle,
  RotateCcw,
  Plus,
  Trash2,
  Search,
  ArrowLeft,
  ChevronRight,
  ChevronDown,
  Layers,
  Wrench,
  Activity,
  User,
  Shield,
  Clock,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';

export default function AIWorkspace() {
  const { currentRole, currentUser } = useERP();
  const navigate = useNavigate();
  const location = useLocation();

  // Active conversation state
  const [conversationId, setConversationId] = useState(() => {
    return location.state?.conversationId || `conv-${Date.now()}`;
  });
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'documents' | 'agents' | 'tools'
  const [userDocuments, setUserDocuments] = useState([]);
  const [loadingDocs, setLoadingDocs] = useState(false);
  const [observabilityOpen, setObservabilityOpen] = useState(false);
  const [observabilityStats, setObservabilityStats] = useState(null);

  // Chat message thread
  const [messages, setMessages] = useState(() => [
    {
      id: 'welcome',
      role: 'assistant',
      agentUsed: 'ERPAssistantAgent',
      text: `## 🚀 Welcome to CampusFlow AI Workspace\n\nI am your **Universal Departmental AI Operating Layer**. I execute real ERP actions, analyze files, reason over timetables and attendance, and coordinate departmental operations under **${(currentRole || 'Student').toUpperCase()}** authorization.\n\n### What would you like me to do today?\n- **Files:** Attach PDFs, Excel sheets, PPTs, or images for immediate reasoning.\n- **ERP Actions:** Ask me to check attendance, view or generate schedules, process leaves, or inspect faculty workloads.\n- **Destructive Operations:** High-impact modifications will always prompt for your explicit confirmation first.`,
      time: 'Just now'
    }
  ]);

  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [attachedFile, setAttachedFile] = useState(null);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);
  const [selectedAgent, setSelectedAgent] = useState(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const messagesEndRef = useRef(null);
  const textareaRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Load user conversation list
  const loadConversations = async () => {
    try {
      const res = await aiApi.getConversations();
      if (res && res.conversations) {
        setConversations(res.conversations);
      }
    } catch (e) {
      console.warn('Could not load conversations:', e.message);
    }
  };

  // Load uploaded documents
  const loadUserDocuments = async () => {
    setLoadingDocs(true);
    try {
      const res = await fileApi.getFiles({ limit: 30 });
      if (res && res.files) {
        setUserDocuments(res.files);
      }
    } catch (e) {
      console.warn('Could not load documents:', e.message);
    } finally {
      setLoadingDocs(false);
    }
  };

  // Load observability data
  const loadObservability = async () => {
    try {
      const res = await aiApi.getObservability();
      if (res && res.stats) {
        setObservabilityStats(res.stats);
      }
    } catch (e) {
      console.warn('Could not load observability:', e.message);
    }
  };

  useEffect(() => {
    loadConversations();
    loadUserDocuments();
  }, []);

  // Specialized 10 Agents registry for sidebar
  const specializedAgents = [
    { id: 'erp_assistant', name: 'General ERP Assistant', desc: 'Central coordinator for departmental navigation and inquiries', roles: ['ALL'] },
    { id: 'timetable', name: 'Timetable Optimizer Agent', desc: 'CSP scheduling engine, room allocation & timetable draft generation', roles: ['HOD', 'ADMIN'] },
    { id: 'teacher_absence', name: 'Absence & Substitution Agent', desc: 'Detects absent faculty, finds feasible substitutes and resolves clashes', roles: ['HOD', 'ADMIN', 'TEACHER'] },
    { id: 'teacher_scheduling', name: 'Workload & Allocation Agent', desc: 'Monitors teaching capacities, period distributions and lab allocations', roles: ['HOD', 'ADMIN'] },
    { id: 'attendance', name: 'Attendance Ledger Agent', desc: 'Audits student attendance percentages, shortage alerts and sessions', roles: ['ALL'] },
    { id: 'leave_management', name: 'Leave Workflow Agent', desc: 'Applies, reviews, and sanctions teacher & student leave applications', roles: ['ALL'] },
    { id: 'rag', name: 'Document Intelligence Agent', desc: 'Performs semantic retrieval over syllabus, PDFs, policies in Qdrant', roles: ['ALL'] },
    { id: 'spreadsheet', name: 'Spreadsheet Intelligence Agent', desc: 'Direct pandas calculation over XLSX/CSV data with zero hallucination', roles: ['ALL'] },
    { id: 'vision', name: 'Vision Intelligence Agent', desc: 'Qwen 2.7B visual reasoning over timetables, diagrams, handwritten charts', roles: ['ALL'] },
    { id: 'file_generation', name: 'Report & Export Agent', desc: 'Generates downloadable Excel spreadsheets and printable official PDFs', roles: ['ALL'] }
  ];

  // Role-aware tool capabilities
  const getRoleTools = () => {
    const role = (currentRole || 'student').toLowerCase();
    if (role === 'hod') {
      return [
        { name: 'Generate Timetable', prompt: 'Generate timetable for semester 5 section A' },
        { name: 'Teachers On Leave Today', prompt: 'Show all teachers on leave today' },
        { name: 'Faculty Workload Excel', prompt: 'Create an Excel report of teachers and their weekly workload' },
        { name: 'Attendance Shortage Report', prompt: 'Generate attendance report for semester 5' },
        { name: 'Check Classroom Availability', prompt: 'Check room availability for Monday Period 2' },
        { name: 'Export Timetable Excel', prompt: 'Export timetable excel for semester 5 section A' },
        { name: 'Export Timetable PDF', prompt: 'Export timetable pdf for semester 5 section A' }
      ];
    } else if (role === 'teacher' || role === 'tg') {
      return [
        { name: 'Mark Me On Leave Tomorrow', prompt: 'Put me on leave tomorrow' },
        { name: 'My Schedule Today', prompt: 'Show my schedule for today' },
        { name: 'My Assigned Subjects', prompt: 'Show my assigned subjects and sections' },
        { name: 'Check Room Vacancies', prompt: 'Check classroom availability' }
      ];
    } else if (role === 'admin') {
      return [
        { name: 'System Observability', prompt: 'Show system observability statistics' },
        { name: 'Audit User Directory', prompt: 'Show recent teachers and students' },
        { name: 'All Classrooms', prompt: 'Show all classrooms and capacities' }
      ];
    } else {
      // Student
      return [
        { name: 'My Real Attendance', prompt: 'Show my attendance' },
        { name: 'Today\'s Timetable', prompt: 'What classes do I have today?' },
        { name: 'Attendance Formula', prompt: 'How is university attendance calculated?' }
      ];
    }
  };

  // Start a new chat
  const handleNewChat = () => {
    const newId = `conv-${Date.now()}`;
    setConversationId(newId);
    setAttachedFile(null);
    setSelectedAgent(null);
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        role: 'assistant',
        agentUsed: 'ERPAssistantAgent',
        text: `### 💬 New AI Session Initialized\n\nReady to assist you with departmental records, document intelligence, or autonomous ERP operations. What would you like to do?`,
        time: 'Just now'
      }
    ]);
    textareaRef.current?.focus();
  };

  // Select an existing conversation
  const handleSelectConversation = async (conv) => {
    try {
      setConversationId(conv.conversationId);
      const res = await aiApi.getConversation(conv.conversationId);
      if (res && res.conversation && res.conversation.messages) {
        const mapped = res.conversation.messages.map((m, idx) => ({
          id: `db-msg-${idx}`,
          role: m.sender === 'user' ? 'user' : 'assistant',
          text: m.content,
          citations: m.citations || [],
          toolCalls: m.toolCalls || [],
          time: new Date(m.timestamp || Date.now()).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }));
        setMessages(mapped);
      }
    } catch (e) {
      console.warn('Error loading conversation:', e.message);
    }
  };

  // Delete a conversation
  const handleDeleteConversation = async (e, id) => {
    e.stopPropagation();
    try {
      await aiApi.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.conversationId !== id));
      if (conversationId === id) {
        handleNewChat();
      }
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  // File Upload Handling
  const handleFileSelect = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingFile(true);
    setUploadProgress('Uploading to ImageKit & queueing processing...');

    try {
      const res = await fileApi.upload(file, conversationId);
      if (res && res.file) {
        setAttachedFile({
          id: res.file.id,
          name: res.file.filename,
          size: `${(file.size / 1024).toFixed(1)} KB`,
          type: res.file.fileType,
          status: 'processing'
        });

        // Add upload confirmation in conversation
        setMessages(prev => [
          ...prev,
          {
            id: `sys-upload-${Date.now()}`,
            role: 'assistant',
            agentUsed: 'DocumentIntelligenceAgent',
            text: `📁 **File Uploaded:** \`${file.name}\` (${(file.size / 1024).toFixed(1)} KB)\n\nThe Universal File Intelligence Pipeline has queued this document for extraction, chunking, and Qdrant vector indexing. You can now ask questions directly about this document!`,
            time: 'Just now'
          }
        ]);

        // Refresh user documents list
        loadUserDocuments();
      }
    } catch (err) {
      alert(`File upload failed: ${err.message}`);
    } finally {
      setUploadingFile(false);
      setUploadProgress(null);
      e.target.value = '';
    }
  };

  // Send message
  const handleSendMessage = async (textToSend, confirmedAction = null) => {
    const query = (textToSend !== undefined ? textToSend : prompt).trim();
    if (!query && !attachedFile && !confirmedAction) return;

    const userMessage = {
      id: `usr-${Date.now()}`,
      role: 'user',
      text: query || (confirmedAction ? `[Confirmed ${confirmedAction.tool}]` : 'Analyze uploaded file'),
      attachment: attachedFile ? { ...attachedFile } : null,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages(prev => [...prev, userMessage]);
    setPrompt('');
    setAttachedFile(null);
    setIsGenerating(true);

    try {
      const res = await aiApi.chat({
        prompt: query,
        message: query,
        conversation_id: conversationId,
        role: currentRole || 'student',
        user_id: currentUser?.id || 'user_default',
        confirmed_action: confirmedAction
      });

      const answerText = res?.answer || res?.response || 'Operation processed by ERP agent.';
      const assistantMessage = {
        id: `ai-${Date.now()}`,
        role: 'assistant',
        text: answerText,
        agentUsed: res?.agent_used || (selectedAgent ? selectedAgent.name : 'ERPAssistantAgent'),
        detectedIntent: res?.detected_intent,
        toolCalls: res?.tool_calls || [],
        actionsTaken: res?.actions_taken || [],
        requiresConfirmation: Boolean(res?.requires_confirmation),
        confirmationAction: res?.confirmation_action || null,
        generatedFiles: res?.generated_files || [],
        citations: res?.citations || [],
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setMessages(prev => [...prev, assistantMessage]);
      loadConversations();
    } catch (err) {
      setMessages(prev => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          role: 'assistant',
          text: `⚠️ **Agent Execution Error:** ${err.message || 'The AI service encountered an issue. Please try again.'}`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  // Keyboard shortcut (Enter to send)
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Filter conversations
  const filteredConversations = conversations.filter(c =>
    (c.title || c.conversationId).toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div style={{ display: 'flex', height: '100vh', width: '100vw', backgroundColor: '#F8FAFC', overflow: 'hidden', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* ----------------- SIDEBAR ----------------- */}
      <aside
        style={{
          width: isSidebarOpen ? '320px' : '0px',
          minWidth: isSidebarOpen ? '320px' : '0px',
          backgroundColor: '#0F172A',
          color: '#F8FAFC',
          display: 'flex',
          flexDirection: 'column',
          transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
          overflow: 'hidden',
          zIndex: 30,
          borderRight: '1px solid rgba(255, 255, 255, 0.1)'
        }}
      >
        {/* Brand Header */}
        <div style={{ padding: '1.25rem 1.25rem 1rem', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '10px', backgroundColor: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(37, 99, 235, 0.4)' }}>
              <Bot size={22} color="#FFFFFF" />
            </div>
            <div>
              <div style={{ fontSize: '15px', fontWeight: 800, letterSpacing: '-0.02em', color: '#FFFFFF' }}>CampusFlow AI</div>
              <div style={{ fontSize: '11px', color: '#94A3B8', fontWeight: 500 }}>Universal ERP Operating Layer</div>
            </div>
          </div>
          <button
            onClick={() => setIsSidebarOpen(false)}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            title="Collapse sidebar"
          >
            <ChevronRight size={18} />
          </button>
        </div>

        {/* New Chat Button */}
        <div style={{ padding: '0.85rem 1.25rem' }}>
          <button
            onClick={handleNewChat}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1rem',
              backgroundColor: '#1E293B',
              color: '#FFFFFF',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              borderRadius: '12px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
          >
            <Plus size={16} />
            <span>New Chat Session</span>
          </button>
        </div>

        {/* Navigation Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid rgba(255, 255, 255, 0.08)', padding: '0 0.75rem' }}>
          {[
            { id: 'chats', label: 'Chats', icon: MessageSquare },
            { id: 'documents', label: 'Docs', icon: FileText },
            { id: 'agents', label: 'Agents', icon: Layers },
            { id: 'tools', label: 'Tools', icon: Wrench }
          ].map(tab => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                style={{
                  flex: 1,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.35rem',
                  padding: '0.65rem 0.25rem',
                  background: 'none',
                  border: 'none',
                  borderBottom: active ? '2px solid #3B82F6' : '2px solid transparent',
                  color: active ? '#FFFFFF' : '#94A3B8',
                  fontSize: '12px',
                  fontWeight: active ? 700 : 500,
                  cursor: 'pointer'
                }}
              >
                <Icon size={14} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Tab 1: Recent Chats */}
        {activeTab === 'chats' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            <div style={{ padding: '0.75rem 1.25rem 0.5rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#1E293B', padding: '0.45rem 0.75rem', borderRadius: '8px' }}>
                <Search size={14} color="#64748B" />
                <input
                  type="text"
                  placeholder="Search chats..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  style={{ background: 'none', border: 'none', outline: 'none', color: '#FFFFFF', fontSize: '12px', width: '100%' }}
                />
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '0.5rem 0.75rem' }}>
              {filteredConversations.length === 0 ? (
                <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                  No saved conversations found.
                </div>
              ) : (
                filteredConversations.map(c => {
                  const isCurrent = c.conversationId === conversationId;
                  return (
                    <div
                      key={c._id || c.conversationId}
                      onClick={() => handleSelectConversation(c)}
                      style={{
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        marginBottom: '4px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        cursor: 'pointer',
                        backgroundColor: isCurrent ? '#2563EB' : 'transparent',
                        color: isCurrent ? '#FFFFFF' : '#CBD5E1',
                        transition: 'background 0.15s ease'
                      }}
                      onMouseOver={(e) => !isCurrent && (e.currentTarget.style.backgroundColor = '#1E293B')}
                      onMouseOut={(e) => !isCurrent && (e.currentTarget.style.backgroundColor = 'transparent')}
                    >
                      <div style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontSize: '13px', fontWeight: isCurrent ? 600 : 400 }}>
                        {c.title || c.conversationId}
                      </div>
                      <button
                        onClick={(e) => handleDeleteConversation(e, c.conversationId)}
                        style={{ background: 'none', border: 'none', color: isCurrent ? 'rgba(255,255,255,0.7)' : '#64748B', cursor: 'pointer', padding: '2px' }}
                        title="Delete chat"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        )}

        {/* Tab 2: User Documents */}
        {activeTab === 'documents' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, padding: '0 0.5rem 0.5rem' }}>
              Indexed Documents ({userDocuments.length})
            </div>
            {userDocuments.length === 0 ? (
              <div style={{ padding: '2rem 1rem', textAlign: 'center', color: '#64748B', fontSize: '13px' }}>
                No uploaded documents yet. Use the "+ Attach" button below to upload course files.
              </div>
            ) : (
              userDocuments.map(doc => (
                <div
                  key={doc._id}
                  onClick={() => handleSendMessage(`Analyze ${doc.originalName || doc.filename} and summarize its key contents.`)}
                  style={{
                    backgroundColor: '#1E293B',
                    padding: '0.75rem',
                    borderRadius: '10px',
                    marginBottom: '8px',
                    cursor: 'pointer',
                    transition: 'border 0.2s ease',
                    border: '1px solid rgba(255,255,255,0.06)'
                  }}
                  onMouseOver={(e) => e.currentTarget.style.borderColor = '#3B82F6'}
                  onMouseOut={(e) => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.06)'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '4px' }}>
                    {doc.fileType === 'pdf' && <FileText size={15} color="#EF4444" />}
                    {['xlsx', 'xls', 'csv'].includes(doc.fileType) && <FileSpreadsheet size={15} color="#10B981" />}
                    {['pptx', 'ppt'].includes(doc.fileType) && <Presentation size={15} color="#F59E0B" />}
                    {['png', 'jpg', 'jpeg'].includes(doc.fileType) && <FileImage size={15} color="#3B82F6" />}
                    <span style={{ fontSize: '13px', fontWeight: 600, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {doc.originalName || doc.filename}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#94A3B8' }}>
                    <span>{doc.extractedContent?.chunksIndexed || 0} vectors</span>
                    <span style={{
                      backgroundColor: doc.processingStatus === 'completed' ? 'rgba(16,185,129,0.15)' : 'rgba(245,158,11,0.15)',
                      color: doc.processingStatus === 'completed' ? '#10B981' : '#F59E0B',
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontWeight: 700
                    }}>
                      {doc.processingStage || doc.processingStatus}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Specialized Agents */}
        {activeTab === 'agents' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, padding: '0 0.5rem 0.5rem' }}>
              10 Specialized Agents
            </div>
            {specializedAgents.map(ag => (
              <div
                key={ag.id}
                onClick={() => setSelectedAgent(ag)}
                style={{
                  backgroundColor: selectedAgent?.id === ag.id ? '#2563EB' : '#1E293B',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  cursor: 'pointer',
                  border: '1px solid rgba(255,255,255,0.06)'
                }}
              >
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF', marginBottom: '2px' }}>{ag.name}</div>
                <div style={{ fontSize: '11px', color: selectedAgent?.id === ag.id ? '#E0E7FF' : '#94A3B8', lineHeight: 1.4 }}>{ag.desc}</div>
              </div>
            ))}
          </div>
        )}

        {/* Tab 4: Role-Based Quick Tools */}
        {activeTab === 'tools' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '0.75rem' }}>
            <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 700, padding: '0 0.5rem 0.5rem' }}>
              Available Tools ({currentRole?.toUpperCase()})
            </div>
            {getRoleTools().map((t, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(t.prompt)}
                style={{
                  width: '100%',
                  textAlign: 'left',
                  backgroundColor: '#1E293B',
                  border: '1px solid rgba(255,255,255,0.06)',
                  color: '#F1F5F9',
                  padding: '0.75rem',
                  borderRadius: '10px',
                  marginBottom: '8px',
                  fontSize: '12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between'
                }}
                onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2563EB'}
                onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#1E293B'}
              >
                <span>{t.name}</span>
                <ChevronRight size={13} color="#94A3B8" />
              </button>
            ))}
          </div>
        )}

        {/* Sidebar Footer User Info */}
        <div style={{ padding: '0.85rem 1.25rem', borderTop: '1px solid rgba(255, 255, 255, 0.08)', backgroundColor: '#0B1120', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#3B82F6', color: '#FFFFFF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '12px' }}>
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <div>
              <div style={{ fontSize: '13px', fontWeight: 700, color: '#FFFFFF' }}>{currentUser?.name || 'Authorized User'}</div>
              <div style={{ fontSize: '10px', textTransform: 'uppercase', color: '#10B981', fontWeight: 800 }}>{currentRole}</div>
            </div>
          </div>
          <button
            onClick={() => {
              loadObservability();
              setObservabilityOpen(true);
            }}
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '4px' }}
            title="System Observability"
          >
            <Activity size={18} />
          </button>
        </div>
      </aside>

      {/* ----------------- MAIN WORKSPACE ----------------- */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden', position: 'relative' }}>
        
        {/* Top Header Bar */}
        <header style={{
          height: '60px',
          backgroundColor: '#FFFFFF',
          borderBottom: '1px solid #E2E8F0',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 1.5rem',
          zIndex: 10
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {!isSidebarOpen && (
              <button
                onClick={() => setIsSidebarOpen(true)}
                style={{ background: '#F1F5F9', border: 'none', padding: '6px 10px', borderRadius: '8px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px', fontSize: '12px', fontWeight: 600 }}
              >
                <Bot size={16} color="#2563EB" />
                <span>Menu</span>
              </button>
            )}
            <Link
              to={`/${currentRole}`}
              style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748B', textDecoration: 'none', fontSize: '13px', fontWeight: 600 }}
            >
              <ArrowLeft size={16} />
              <span>Back to Dashboard</span>
            </Link>
            <span style={{ color: '#CBD5E1' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#10B981' }} />
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A' }}>
                {selectedAgent ? selectedAgent.name : 'Universal Agentic Operating Layer'}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span style={{
              fontSize: '11px',
              backgroundColor: '#EFF6FF',
              color: '#1D4ED8',
              padding: '4px 10px',
              borderRadius: '20px',
              fontWeight: 700,
              border: '1px solid #BFDBFE'
            }}>
              Qwen Vision + GPT-OSS Active
            </span>
          </div>
        </header>

        {/* Conversation Thread Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id || index}
                style={{
                  display: 'flex',
                  justifyContent: isUser ? 'flex-end' : 'flex-start',
                  width: '100%'
                }}
              >
                <div style={{
                  maxWidth: isUser ? '75%' : '85%',
                  backgroundColor: isUser ? '#2563EB' : '#FFFFFF',
                  color: isUser ? '#FFFFFF' : '#0F172A',
                  padding: '1.25rem 1.5rem',
                  borderRadius: isUser ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                  boxShadow: isUser
                    ? '0 4px 14px rgba(37, 99, 235, 0.25)'
                    : '0 2px 8px rgba(15, 23, 42, 0.05), 0 0 0 1px #E2E8F0',
                  lineHeight: 1.6
                }}>
                  {/* Assistant Header Badge */}
                  {!isUser && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', paddingBottom: '0.5rem', borderBottom: '1px solid #F1F5F9' }}>
                      <div style={{ width: '22px', height: '22px', borderRadius: '6px', backgroundColor: '#EFF6FF', color: '#2563EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Bot size={14} />
                      </div>
                      <span style={{ fontSize: '12px', fontWeight: 700, color: '#334155' }}>
                        {msg.agentUsed || 'ERPAssistantAgent'}
                      </span>
                      {msg.detectedIntent && (
                        <span style={{ fontSize: '10px', backgroundColor: '#F1F5F9', color: '#64748B', padding: '2px 6px', borderRadius: '4px', fontWeight: 600 }}>
                          {msg.detectedIntent}
                        </span>
                      )}
                    </div>
                  )}

                  {/* Attachment indicator if user attached a file */}
                  {msg.attachment && (
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', backgroundColor: 'rgba(255,255,255,0.2)', padding: '4px 10px', borderRadius: '8px', marginBottom: '0.5rem', fontSize: '12px', fontWeight: 600 }}>
                      <Paperclip size={13} />
                      <span>{msg.attachment.name}</span>
                    </div>
                  )}

                  {/* Visual Tool Execution Step Indicators (Section 6) */}
                  {msg.toolCalls && msg.toolCalls.length > 0 && (
                    <div style={{
                      backgroundColor: '#F8FAFC',
                      border: '1px solid #E2E8F0',
                      borderRadius: '10px',
                      padding: '0.75rem 1rem',
                      marginBottom: '1rem'
                    }}>
                      <div style={{ fontSize: '11px', textTransform: 'uppercase', color: '#64748B', fontWeight: 800, marginBottom: '6px' }}>
                        ⚡ Autonomous Tool Execution
                      </div>
                      {msg.toolCalls.map((tc, tcIdx) => (
                        <div key={tcIdx} style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ fontSize: '12px', fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <CheckCircle2 size={14} color="#10B981" />
                            <span>Tool: <code>{tc.tool}</code></span>
                          </div>
                          {tc.steps && tc.steps.map((st, sIdx) => (
                            <div key={sIdx} style={{ fontSize: '12px', color: '#475569', paddingLeft: '1.25rem' }}>
                              ✓ {st}
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Main Markdown Content */}
                  <div className="prose max-w-none" style={{ fontSize: '14px' }}>
                    <ReactMarkdown
                      remarkPlugins={[remarkGfm, remarkMath]}
                      rehypePlugins={[rehypeKatex]}
                      components={{
                        table: ({ node, ...props }) => (
                          <div style={{ overflowX: 'auto', margin: '1rem 0' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', border: '1px solid #E2E8F0' }} {...props} />
                          </div>
                        ),
                        th: ({ node, ...props }) => (
                          <th style={{ backgroundColor: '#F8FAFC', padding: '8px 12px', textAlign: 'left', fontWeight: 700, border: '1px solid #E2E8F0', color: '#0F172A' }} {...props} />
                        ),
                        td: ({ node, ...props }) => (
                          <td style={{ padding: '8px 12px', border: '1px solid #E2E8F0', color: '#334155' }} {...props} />
                        ),
                        code: ({ node, inline, ...props }) => (
                          inline
                            ? <code style={{ backgroundColor: isUser ? 'rgba(255,255,255,0.25)' : '#F1F5F9', padding: '2px 5px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }} {...props} />
                            : <pre style={{ backgroundColor: '#0F172A', color: '#F8FAFC', padding: '1rem', borderRadius: '8px', overflowX: 'auto', fontSize: '13px' }} {...props} />
                        )
                      }}
                    >
                      {msg.text}
                    </ReactMarkdown>
                  </div>

                  {/* Destructive Action Interactive Confirmation Card (Section 5) */}
                  {msg.requiresConfirmation && msg.confirmationAction && (
                    <div style={{
                      marginTop: '1rem',
                      padding: '1rem',
                      backgroundColor: '#FEF2F2',
                      border: '1px solid #FCA5A5',
                      borderRadius: '12px',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.75rem'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#B91C1C', fontWeight: 700, fontSize: '13px' }}>
                        <AlertTriangle size={16} />
                        <span>High-Impact Action Verification</span>
                      </div>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button
                          onClick={() => handleSendMessage('Confirm', msg.confirmationAction)}
                          style={{
                            padding: '0.5rem 1.25rem',
                            backgroundColor: '#DC2626',
                            color: '#FFFFFF',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 700,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Confirm & Execute
                        </button>
                        <button
                          onClick={() => setMessages(prev => [...prev, { id: `cancel-${Date.now()}`, role: 'assistant', text: 'Action cancelled.', time: 'Just now' }])}
                          style={{
                            padding: '0.5rem 1.25rem',
                            backgroundColor: '#E2E8F0',
                            color: '#475569',
                            border: 'none',
                            borderRadius: '8px',
                            fontWeight: 600,
                            fontSize: '12px',
                            cursor: 'pointer'
                          }}
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Generated Files Card (Section 14) */}
                  {msg.generatedFiles && msg.generatedFiles.length > 0 && (
                    <div style={{ marginTop: '1rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {msg.generatedFiles.map((gf, gIdx) => (
                        <div
                          key={gIdx}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            backgroundColor: '#F0FDF4',
                            border: '1px solid #BBF7D0',
                            padding: '0.75rem 1rem',
                            borderRadius: '10px'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                            <FileSpreadsheet size={18} color="#15803D" />
                            <div>
                              <div style={{ fontSize: '13px', fontWeight: 700, color: '#166534' }}>{gf.name}</div>
                              <div style={{ fontSize: '11px', color: '#15803D' }}>Real generated deliverable ready</div>
                            </div>
                          </div>
                          <a
                            href={gf.url}
                            download={gf.name}
                            style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.35rem',
                              backgroundColor: '#166534',
                              color: '#FFFFFF',
                              padding: '6px 12px',
                              borderRadius: '6px',
                              textDecoration: 'none',
                              fontSize: '12px',
                              fontWeight: 700
                            }}
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </a>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Source Citations Pills (Section 24) */}
                  {msg.citations && msg.citations.length > 0 && (
                    <div style={{ marginTop: '0.85rem', paddingTop: '0.5rem', borderTop: '1px solid #F1F5F9', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                      {msg.citations.map((c, cIdx) => (
                        <div
                          key={cIdx}
                          style={{
                            fontSize: '11px',
                            backgroundColor: '#F1F5F9',
                            color: '#475569',
                            padding: '3px 8px',
                            borderRadius: '6px',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px',
                            border: '1px solid #E2E8F0'
                          }}
                        >
                          <FileCheck size={11} color="#3B82F6" />
                          <span>{c.sourceCitation || `Source: ${c.title}`}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div style={{ fontSize: '10px', color: isUser ? 'rgba(255,255,255,0.7)' : '#94A3B8', textAlign: 'right', marginTop: '4px' }}>
                    {msg.time}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Thinking / Streaming Indicator */}
          {isGenerating && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#64748B', fontSize: '13px', padding: '0.5rem 1rem' }}>
              <div className="spinner-border text-primary" role="status" style={{ width: '1.25rem', height: '1.25rem' }} />
              <span>Orchestrating agent, checking permissions, and querying PostgreSQL...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Uploading Status Overlay */}
        {uploadingFile && (
          <div style={{ padding: '0.5rem 1.5rem', backgroundColor: '#EFF6FF', color: '#1D4ED8', fontSize: '12px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div className="spinner-border text-primary" style={{ width: '1rem', height: '1rem' }} />
            <span>{uploadProgress || 'Processing document through AI pipeline...'}</span>
          </div>
        )}

        {/* Bottom Input Area */}
        <div style={{ padding: '1rem 1.5rem 1.25rem', backgroundColor: '#FFFFFF', borderTop: '1px solid #E2E8F0' }}>
          
          {/* File attachment preview pill */}
          {attachedFile && (
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#F1F5F9', padding: '6px 12px', borderRadius: '10px', marginBottom: '0.5rem', fontSize: '12px', border: '1px solid #CBD5E1' }}>
              <FileText size={14} color="#2563EB" />
              <span style={{ fontWeight: 600, color: '#0F172A' }}>{attachedFile.name}</span>
              <span style={{ color: '#64748B' }}>({attachedFile.size})</span>
              <button onClick={() => setAttachedFile(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                <X size={13} />
              </button>
            </div>
          )}

          <div style={{
            display: 'flex',
            alignItems: 'flex-end',
            gap: '0.75rem',
            backgroundColor: '#F8FAFC',
            border: '1.5px solid #CBD5E1',
            borderRadius: '16px',
            padding: '0.5rem 0.75rem',
            boxShadow: '0 2px 6px rgba(0,0,0,0.03)'
          }}>
            {/* Hidden file input */}
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileSelect}
              accept=".pdf,.xlsx,.xls,.csv,.pptx,.ppt,.docx,.png,.jpg,.jpeg,.webp,.txt"
              style={{ display: 'none' }}
            />

            {/* Attach button */}
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.35rem',
                backgroundColor: '#FFFFFF',
                border: '1px solid #E2E8F0',
                padding: '8px 12px',
                borderRadius: '10px',
                color: '#334155',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer'
              }}
              title="Attach PDF, Excel, PPTX, or Image"
            >
              <Paperclip size={14} />
              <span>Attach</span>
            </button>

            {/* Input textarea */}
            <textarea
              ref={textareaRef}
              rows={1}
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={`Ask anything as ${currentRole?.toUpperCase()} (e.g. "Show teachers on leave today", "Generate timetable for 5A")...`}
              style={{
                flex: 1,
                background: 'none',
                border: 'none',
                outline: 'none',
                fontSize: '14px',
                color: '#0F172A',
                lineHeight: 1.5,
                maxHeight: '120px',
                resize: 'none',
                padding: '6px 0'
              }}
            />

            {/* Send button */}
            <button
              onClick={() => handleSendMessage()}
              disabled={isGenerating || (!prompt.trim() && !attachedFile)}
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: isGenerating || (!prompt.trim() && !attachedFile) ? '#CBD5E1' : '#2563EB',
                color: '#FFFFFF',
                border: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: isGenerating || (!prompt.trim() && !attachedFile) ? 'not-allowed' : 'pointer',
                transition: 'background 0.2s ease'
              }}
            >
              <Send size={16} />
            </button>
          </div>
        </div>

      </main>

      {/* ----------------- OBSERVABILITY MODAL (Section 30) ----------------- */}
      {observabilityOpen && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(15, 23, 42, 0.6)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100
        }}>
          <div style={{
            backgroundColor: '#FFFFFF',
            borderRadius: '20px',
            width: '600px',
            maxWidth: '90vw',
            maxHeight: '85vh',
            overflowY: 'auto',
            padding: '2rem',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.5rem', borderBottom: '1px solid #E2E8F0', paddingBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Activity size={22} color="#2563EB" />
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
                  Admin Observability & Vector Health
                </h3>
              </div>
              <button
                onClick={() => setObservabilityOpen(false)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#64748B' }}
              >
                <X size={20} />
              </button>
            </div>

            {observabilityStats ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem' }}>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Total Documents</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#0F172A' }}>{observabilityStats.totalDocuments}</div>
                    <div style={{ fontSize: '11px', color: '#10B981', marginTop: '2px' }}>{observabilityStats.completedDocuments} Indexed & Ready</div>
                  </div>
                  <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                    <div style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>Qdrant Chunks (Vectors)</div>
                    <div style={{ fontSize: '24px', fontWeight: 800, color: '#2563EB' }}>{observabilityStats.totalChunksIndexed}</div>
                    <div style={{ fontSize: '11px', color: '#64748B', marginTop: '2px' }}>{observabilityStats.qdrantStatus}</div>
                  </div>
                </div>

                <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>Active LLM & Vision Models</div>
                  <div style={{ fontSize: '12px', color: '#475569', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                    <div><strong>Reasoning LLM:</strong> <code>{observabilityStats.models?.llm}</code></div>
                    <div><strong>Vision Engine:</strong> <code>{observabilityStats.models?.vision}</code></div>
                    <div><strong>Embeddings:</strong> <code>{observabilityStats.models?.embeddings}</code></div>
                  </div>
                </div>

                <div>
                  <div style={{ fontSize: '13px', fontWeight: 700, color: '#0F172A', marginBottom: '8px' }}>Recent Agent Tool Executions</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '200px', overflowY: 'auto' }}>
                    {observabilityStats.recentExecutions?.map((ex, idx) => (
                      <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 10px', backgroundColor: '#F1F5F9', borderRadius: '6px', fontSize: '12px' }}>
                        <div>
                          <strong style={{ color: '#1E293B' }}>{ex.agent}:</strong> <span style={{ color: '#475569' }}>{ex.action}</span>
                        </div>
                        <span style={{ fontSize: '11px', color: '#64748B' }}>{ex.durationMs}ms</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                Loading real observability statistics...
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}
