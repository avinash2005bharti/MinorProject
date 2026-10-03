import React from 'react';

const FILE_ICONS = {
  pdf: '📄',
  xlsx: '📊', xls: '📊', csv: '📊',
  pptx: '📑', ppt: '📑',
  docx: '📝', doc: '📝',
  png: '🖼️', jpg: '🖼️', jpeg: '🖼️', webp: '🖼️',
  txt: '📃',
  other: '📎'
};

const STATUS_LABELS = {
  pending: { text: 'Queued', color: '#94a3b8', icon: '⏳' },
  processing: { text: 'Processing', color: '#f59e0b', icon: '⚙️' },
  completed: { text: 'Ready', color: '#22c55e', icon: '✅' },
  failed: { text: 'Failed', color: '#ef4444', icon: '❌' }
};

function formatFileSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function FileAttachment({ file, compact = false, onRetry, onDelete, onView }) {
  if (!file) return null;

  const icon = FILE_ICONS[file.fileType] || FILE_ICONS.other;
  const status = STATUS_LABELS[file.processingStatus] || STATUS_LABELS.pending;
  const isImage = ['png', 'jpg', 'jpeg', 'webp'].includes(file.fileType);
  const isGenerated = file.source === 'agent_generated';

  if (compact) {
    return (
      <div style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        background: 'rgba(99, 102, 241, 0.08)', borderRadius: 8,
        padding: '4px 10px', fontSize: 13, cursor: 'pointer',
        border: '1px solid rgba(99, 102, 241, 0.15)',
        transition: 'all 0.2s ease'
      }}
        onClick={() => file.storageUrl && window.open(file.storageUrl, '_blank')}
        title={file.filename}
      >
        <span>{icon}</span>
        <span style={{ maxWidth: 150, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {file.filename}
        </span>
        {isGenerated && <span style={{ fontSize: 10, color: '#a78bfa', fontWeight: 600 }}>AI</span>}
        <span style={{ fontSize: 11, color: status.color }}>{status.icon}</span>
      </div>
    );
  }

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 12,
      background: 'rgba(30, 32, 44, 0.6)', borderRadius: 12,
      padding: '10px 14px', border: '1px solid rgba(99, 102, 241, 0.12)',
      backdropFilter: 'blur(8px)', transition: 'all 0.2s ease'
    }}>
      {/* Image preview or icon */}
      <div style={{
        width: 42, height: 42, borderRadius: 10,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(99, 102, 241, 0.1)', fontSize: 20, flexShrink: 0,
        overflow: 'hidden'
      }}>
        {isImage && file.storageUrl ? (
          <img src={file.storageUrl} alt={file.filename}
            style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: 10 }}
            onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.textContent = icon; }}
          />
        ) : (
          <span>{icon}</span>
        )}
      </div>

      {/* File info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: 13, fontWeight: 600, color: '#e2e8f0',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
        }}>
          {file.filename}
          {isGenerated && (
            <span style={{
              fontSize: 10, color: '#a78bfa', marginLeft: 6,
              background: 'rgba(167, 139, 250, 0.12)', padding: '1px 6px', borderRadius: 4
            }}>
              AI Generated
            </span>
          )}
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 2 }}>
          <span style={{ fontSize: 11, color: '#94a3b8' }}>
            {file.fileType?.toUpperCase()} {formatFileSize(file.fileSize)}
          </span>
          <span style={{ fontSize: 11, color: status.color, fontWeight: 500 }}>
            {status.icon} {status.text}
          </span>
          {file.extractedContent?.chunksIndexed > 0 && (
            <span style={{ fontSize: 10, color: '#6366f1' }}>
              📚 {file.extractedContent.chunksIndexed} chunks
            </span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: 4 }}>
        {file.storageUrl && (
          <button
            onClick={() => window.open(file.storageUrl, '_blank')}
            style={{
              background: 'rgba(99, 102, 241, 0.12)', border: 'none', borderRadius: 6,
              padding: '4px 8px', cursor: 'pointer', color: '#a5b4fc', fontSize: 12
            }}
            title="Open file"
          >
            ↗
          </button>
        )}
        {file.processingStatus === 'failed' && onRetry && (
          <button
            onClick={() => onRetry(file)}
            style={{
              background: 'rgba(245, 158, 11, 0.12)', border: 'none', borderRadius: 6,
              padding: '4px 8px', cursor: 'pointer', color: '#fbbf24', fontSize: 12
            }}
            title="Retry processing"
          >
            ↻
          </button>
        )}
      </div>
    </div>
  );
}
