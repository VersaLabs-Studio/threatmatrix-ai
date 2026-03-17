'use client';

// ═══════════════════════════════════════════════════════
// ThreatMatrix AI — PCAPUpload
// Drag-and-drop zone for network capture files
// ═══════════════════════════════════════════════════════

import { useState } from 'react';
import { Upload, File, CheckCircle, AlertCircle } from 'lucide-react';

export function PCAPUpload() {
  const [isDragging, setIsDragging] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [file, setFile] = useState<File | null>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(e.type === 'dragover');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFile = e.dataTransfer.files[0];
    if (droppedFile && (droppedFile.name.endsWith('.pcap') || droppedFile.name.endsWith('.pcapng'))) {
      startUpload(droppedFile);
    }
  };

  const startUpload = (f: File) => {
    setFile(f);
    setUploading(true);
    setProgress(0);
    
    // Smooth progress simulation
    const interval = setInterval(() => {
      setProgress(p => {
        if (p >= 100) {
          clearInterval(interval);
          setUploading(false);
          return 100;
        }
        return p + 5;
      });
    }, 100);
  };

  return (
    <div
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
      style={{
        border: `1px dashed ${isDragging ? 'var(--cyan)' : 'var(--border)'}`,
        background: isDragging ? 'rgba(0, 255, 255, 0.05)' : 'rgba(0,0,0,0.2)',
        borderRadius: 'var(--radius-sm)',
        padding: 'var(--space-8)',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        cursor: 'pointer',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {!uploading && !file && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--bg-tertiary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={24} color="var(--cyan)" />
          </div>
          <div>
            <h3 style={{ fontFamily: 'var(--font-data)', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px 0' }}>PCAP ANALYZER</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Drag and drop .pcap or .pcapng files to start deep packet inspection</p>
          </div>
          <button style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border)',
            padding: '6px 16px',
            borderRadius: 'var(--radius-sm)',
            fontSize: '0.65rem',
            fontFamily: 'var(--font-data)',
            color: 'var(--text-secondary)',
            fontWeight: 600,
            cursor: 'pointer'
          }}>
            BROWSE FILES
          </button>
        </div>
      )}

      {uploading && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-4)' }}>
          <File size={32} color="var(--cyan)" className="pulse" />
          <div style={{ width: '100%', maxWidth: 300 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontFamily: 'var(--font-data)', marginBottom: 4 }}>
              <span style={{ color: 'var(--text-muted)' }}>Uploading: {file?.name}</span>
              <span style={{ color: 'var(--cyan)' }}>{progress}%</span>
            </div>
            <div style={{ height: 4, background: 'var(--bg-tertiary)', borderRadius: 2, overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: 'var(--cyan)', transition: 'width 0.1s ease' }} />
            </div>
          </div>
        </div>
      )}

      {file && !uploading && progress === 100 && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 'var(--space-3)' }}>
          <CheckCircle size={32} color="var(--success)" />
          <div>
            <h3 style={{ fontFamily: 'var(--font-data)', fontSize: '0.85rem', fontWeight: 700, margin: '0 0 4px 0', color: 'var(--success)' }}>UPLOAD COMPLETE</h3>
            <p style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>{file.name} is ready for forensic analysis</p>
          </div>
          <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
            <button 
               onClick={() => {setFile(null); setProgress(0);}}
               style={{ background: 'none', border: '1px solid var(--border)', padding: '6px 12px', borderRadius: 'var(--radius-sm)', fontSize: '0.6rem', fontFamily: 'var(--font-data)', color: 'var(--text-muted)', cursor: 'pointer' }}
            >
              CLEAR
            </button>
            <button style={{ background: 'var(--cyan)', border: 'none', padding: '6px 16px', borderRadius: 'var(--radius-sm)', fontSize: '0.6rem', fontFamily: 'var(--font-data)', color: 'var(--bg-dark)', fontWeight: 700, cursor: 'pointer' }}>
              RUN FORENSIC JOB
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
