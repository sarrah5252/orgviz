import React from 'react';

interface BatchExportModalProps {
  progress: {
    current: number;
    total: number;
    label: string;
  };
}

export const BatchExportModal: React.FC<BatchExportModalProps> = ({ progress }) => {
  const percentage = Math.round((progress.current / progress.total) * 100);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center"
      style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="w-full max-w-md rounded-2xl p-8 text-center animate-fade-in"
        style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)', boxShadow: '0 24px 80px rgba(0,0,0,0.5)' }}>

        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-5"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
          <svg className="w-8 h-8 text-white animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
          </svg>
        </div>

        <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
          Generating Organogram PPT
        </h3>

        <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
          Capturing department charts…
        </p>

        {/* Current task */}
        <div className="mb-4 px-4 py-2.5 rounded-lg" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
          <p className="text-xs font-medium" style={{ color: 'var(--text-muted)' }}>
            {progress.current} of {progress.total}
          </p>
          <p className="text-sm font-semibold mt-1 truncate" style={{ color: 'var(--text-primary)' }}>
            {progress.label}
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-full h-2 rounded-full overflow-hidden" style={{ background: 'var(--bg-tertiary)' }}>
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${percentage}%`,
              background: 'linear-gradient(90deg, #3b82f6, #8b5cf6)',
            }}
          />
        </div>

        <p className="text-xs mt-2" style={{ color: 'var(--text-muted)' }}>
          {percentage}% complete
        </p>
      </div>
    </div>
  );
};
