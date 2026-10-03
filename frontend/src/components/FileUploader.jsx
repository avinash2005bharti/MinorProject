import React, { useRef, useState } from 'react';

const ACCEPTED_TYPES = '.png,.jpg,.jpeg,.webp,.pdf,.xlsx,.xls,.csv,.pptx,.ppt,.docx,.doc,.txt';
const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50MB

const TYPE_LABELS = {
  'image/png': 'PNG Image', 'image/jpeg': 'JPEG Image', 'image/webp': 'WebP Image',
  'application/pdf': 'PDF Document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'Excel Spreadsheet',
  'application/vnd.ms-excel': 'Excel Spreadsheet', 'text/csv': 'CSV File',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': 'PowerPoint',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'Word Document',
  'text/plain': 'Text File'
};

export default function FileUploader({ onFileSelected, onFileRemove, selectedFile, disabled = false }) {
  const fileInputRef = useRef(null);
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState('');

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) validateAndSelect(file);
  };

  const validateAndSelect = (file) => {
    setError('');
    if (file.size > MAX_FILE_SIZE) {
      setError(`File too large (${(file.size / (1024 * 1024)).toFixed(1)}MB). Maximum: 50MB.`);
      return;
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowed = ACCEPTED_TYPES.replace(/\./g, '').split(',');
    if (!allowed.includes(ext)) {
      setError(`Unsupported file type: .${ext}`);
      return;
    }
    onFileSelected(file);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    const file = e.dataTransfer?.files?.[0];
    if (file) validateAndSelect(file);
  };

  // If a file is already selected, show it
  if (selectedFile) {
    const typeLabel = TYPE_LABELS[selectedFile.type] || selectedFile.name.split('.').pop()?.toUpperCase();
    return (
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        background: 'rgba(99, 102, 241, 0.08)', borderRadius: 10,
        padding: '6px 12px', border: '1px solid rgba(99, 102, 241, 0.2)'
      }}>
        <span style={{ fontSize: 16 }}>📎</span>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{
            fontSize: 12, fontWeight: 600, color: '#e2e8f0',
            overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
          }}>
            {selectedFile.name}
          </div>
          <div style={{ fontSize: 10, color: '#94a3b8' }}>
            {typeLabel} · {(selectedFile.size / 1024).toFixed(0)} KB
          </div>
        </div>
        <button
          onClick={() => {
            onFileRemove();
            if (fileInputRef.current) fileInputRef.current.value = '';
          }}
          style={{
            background: 'rgba(239, 68, 68, 0.12)', border: 'none', borderRadius: 6,
            padding: '2px 8px', cursor: 'pointer', color: '#f87171', fontSize: 14,
            lineHeight: 1
          }}
          title="Remove file"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPTED_TYPES}
        onChange={handleFileChange}
        style={{ display: 'none' }}
        disabled={disabled}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={handleDrop}
        disabled={disabled}
        style={{
          background: dragActive ? 'rgba(99, 102, 241, 0.15)' : 'rgba(99, 102, 241, 0.06)',
          border: `1.5px dashed ${dragActive ? '#6366f1' : 'rgba(99, 102, 241, 0.25)'}`,
          borderRadius: 10, padding: '6px 12px', cursor: disabled ? 'not-allowed' : 'pointer',
          color: '#a5b4fc', fontSize: 13, display: 'flex', alignItems: 'center', gap: 6,
          transition: 'all 0.2s ease', opacity: disabled ? 0.5 : 1
        }}
        title="Attach a file (PDF, Image, Excel, PowerPoint, Word, Text)"
      >
        <span style={{ fontSize: 16 }}>📎</span>
        <span>Attach</span>
      </button>
      {error && (
        <div style={{ fontSize: 11, color: '#f87171', marginTop: 4, paddingLeft: 4 }}>
          {error}
        </div>
      )}
    </div>
  );
}
