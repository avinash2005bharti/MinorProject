import React, { useRef, useState } from 'react';
import { Upload, FileText, CheckCircle2, X, RefreshCw } from 'lucide-react';

export default function DocumentUploader({
  onFileSelect,
  onFileRemove,
  selectedFileName = '',
  selectedFileSize = '',
  accept = '.pdf,.png,.jpg,.jpeg,.doc,.docx,.zip,.txt',
  label = 'Supporting Document / Proof',
  hint = 'PDF, DOCX, PNG, JPG up to 25 MB',
  required = false
}) {
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);
  const [currentFileName, setCurrentFileName] = useState(selectedFileName);
  const [currentFileSize, setCurrentFileSize] = useState(selectedFileSize);

  const formatFileSize = (bytes) => {
    if (!bytes) return '0 KB';
    const kb = bytes / 1024;
    if (kb < 1024) return `${kb.toFixed(1)} KB`;
    return `${(kb / 1024).toFixed(1)} MB`;
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const formatted = formatFileSize(file.size);
      setCurrentFileName(file.name);
      setCurrentFileSize(formatted);
      if (onFileSelect) {
        onFileSelect({
          name: file.name,
          size: formatted,
          rawSize: file.size,
          type: file.type,
          file
        });
      }
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      const formatted = formatFileSize(file.size);
      setCurrentFileName(file.name);
      setCurrentFileSize(formatted);
      if (onFileSelect) {
        onFileSelect({
          name: file.name,
          size: formatted,
          rawSize: file.size,
          type: file.type,
          file
        });
      }
    }
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setCurrentFileName('');
    setCurrentFileSize('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    if (onFileRemove) {
      onFileRemove();
    }
  };

  const hasFile = Boolean(currentFileName || selectedFileName);
  const displayName = currentFileName || selectedFileName;
  const displaySize = currentFileSize || selectedFileSize || 'Ready';

  return (
    <div className="document-uploader-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {label && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <label style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {label} {required && <span style={{ color: 'var(--error)' }}>*</span>}
          </label>
          {hasFile && (
            <span style={{ fontSize: '11px', color: '#10B981', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '3px' }}>
              <CheckCircle2 size={12} /> File Attached
            </span>
          )}
        </div>
      )}

      {/* Hidden Native File Input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={accept}
        style={{ display: 'none' }}
      />

      {/* Interactive Dropzone / Upload Box */}
      <div
        onClick={() => fileInputRef.current && fileInputRef.current.click()}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{
          border: hasFile
            ? '1.5px solid #10B981'
            : isDragging
            ? '2px dashed var(--primary)'
            : '1.5px dashed var(--border-subtle)',
          borderRadius: '12px',
          padding: '0.85rem 1rem',
          backgroundColor: hasFile
            ? 'rgba(16, 185, 129, 0.05)'
            : isDragging
            ? 'rgba(37, 99, 235, 0.06)'
            : 'var(--surface-low)',
          cursor: 'pointer',
          transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '0.75rem'
        }}
        className="doc-uploader-box"
      >
        {hasFile ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', minWidth: 0 }}>
              <div
                style={{
                  width: '34px',
                  height: '34px',
                  borderRadius: '10px',
                  backgroundColor: '#D1FAE5',
                  color: '#059669',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <FileText size={18} />
              </div>
              <div style={{ minWidth: 0, textAlign: 'left' }}>
                <p
                  style={{
                    fontSize: '12.5px',
                    fontWeight: 700,
                    color: 'var(--text-primary)',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    maxWidth: '280px',
                    margin: 0
                  }}
                  title={displayName}
                >
                  {displayName}
                </p>
                <span style={{ fontSize: '11px', color: '#059669', fontWeight: 600 }}>
                  {displaySize} • Valid document attached
                </span>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', flexShrink: 0 }}>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  fileInputRef.current && fileInputRef.current.click();
                }}
                className="btn btn-outline"
                style={{
                  fontSize: '11px',
                  padding: '0.3rem 0.6rem',
                  borderRadius: '8px',
                  height: '28px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '4px'
                }}
                title="Change File"
              >
                <RefreshCw size={12} />
                <span>Change</span>
              </button>

              <button
                type="button"
                onClick={handleRemove}
                className="btn btn-outline"
                style={{
                  fontSize: '11px',
                  padding: '0.3rem 0.5rem',
                  borderRadius: '8px',
                  height: '28px',
                  color: '#EF4444',
                  borderColor: 'rgba(239, 68, 68, 0.3)',
                  display: 'flex',
                  alignItems: 'center'
                }}
                title="Remove File"
              >
                <X size={13} />
              </button>
            </div>
          </>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', width: '100%', justifyContent: 'center' }}>
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '10px',
                backgroundColor: 'rgba(37, 99, 235, 0.08)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}
            >
              <Upload size={18} />
            </div>
            <div style={{ textAlign: 'left' }}>
              <p style={{ fontSize: '12.5px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>
                Click to browse document <span style={{ fontWeight: 400, color: 'var(--text-secondary)' }}>or drag & drop</span>
              </p>
              <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                {hint}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
