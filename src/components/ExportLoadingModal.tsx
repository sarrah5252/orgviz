import React from 'react';
import { useOrgStore } from '../store/useOrgStore';

export const ExportLoadingModal: React.FC = () => {
  const exportProgress = useOrgStore(s => s.exportProgress);

  if (!exportProgress || !exportProgress.isExporting) {
    return null;
  }

  const { title, stage, percent, current, total, done } = exportProgress;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in">
      <div 
        className="w-full max-w-md overflow-hidden rounded-2xl shadow-2xl transition-all"
        style={{
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          boxShadow: '0 25px 60px -15px rgba(0, 0, 0, 0.7)',
        }}
      >
        {/* Top brand accent bar */}
        <div 
          className="h-1.5 w-full"
          style={{
            background: done
              ? 'linear-gradient(90deg, #10b981, #059669)'
              : 'linear-gradient(90deg, #135C8B, #C48A28, #135C8B)',
            backgroundSize: '200% 100%',
            animation: done ? 'none' : 'gradientMove 3s ease infinite',
          }}
        />

        <div className="p-6 sm:p-7">
          {/* Animated Icon Badge */}
          <div className="flex justify-center mb-4">
            {done ? (
              <div className="w-14 h-14 rounded-2xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shadow-lg shadow-emerald-500/10">
                <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </div>
            ) : (
              <div className="relative">
                {/* Outer spinning ring */}
                <div 
                  className="w-16 h-16 rounded-2xl flex items-center justify-center shadow-xl shadow-red-500/15"
                  style={{
                    background: 'linear-gradient(135deg, rgba(220, 38, 38, 0.15), rgba(196, 138, 40, 0.15))',
                    border: '1px solid rgba(220, 38, 38, 0.3)',
                  }}
                >
                  <svg className="w-7 h-7 text-red-500 animate-pulse" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12l3 3m0 0l3-3m-3 3v-6m-1.5-9H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
                  </svg>
                </div>
                {/* Rotating dot */}
                <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 border-2 border-[var(--bg-secondary)] flex items-center justify-center">
                  <span className="w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                </div>
              </div>
            )}
          </div>

          {/* Title & Stage Status */}
          <div className="text-center">
            <h3 className="text-base sm:text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              {done ? 'Presentation Ready!' : title}
            </h3>
            <p 
              className="text-xs sm:text-sm mt-1 px-2 h-5 truncate font-medium"
              style={{ color: done ? '#10b981' : 'var(--text-secondary)' }}
            >
              {stage}
            </p>
          </div>

          {/* Progress Bar */}
          <div className="mt-5 mb-2">
            <div 
              className="w-full h-2.5 rounded-full overflow-hidden p-0.5"
              style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
            >
              <div 
                className="h-full rounded-full transition-all duration-300 relative overflow-hidden"
                style={{
                  width: `${Math.min(100, Math.max(4, percent))}%`,
                  background: done
                    ? 'linear-gradient(90deg, #10b981, #059669)'
                    : 'linear-gradient(90deg, #135C8B 0%, #3b82f6 50%, #C48A28 100%)',
                }}
              >
                {!done && (
                  <div 
                    className="absolute inset-0 w-full h-full opacity-35"
                    style={{
                      background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.8) 50%, transparent 100%)',
                      animation: 'shimmerSweep 1.6s infinite',
                    }}
                  />
                )}
              </div>
            </div>

            {/* Progress stats */}
            <div className="flex items-center justify-between text-xs mt-2 px-0.5">
              <span style={{ color: 'var(--text-muted)' }}>
                {total && current ? (
                  <>Slide <strong>{current}</strong> of <strong>{total}</strong></>
                ) : (
                  done ? 'Download initiated' : 'Generating vector slides...'
                )}
              </span>
              <span className="font-semibold tabular-nums" style={{ color: 'var(--text-primary)' }}>
                {Math.round(percent)}%
              </span>
            </div>
          </div>

          {/* Feature Badges */}
          <div 
            className="mt-5 pt-4 border-t flex items-center justify-center gap-3 text-[11px]"
            style={{ borderColor: 'var(--border-secondary)', color: 'var(--text-muted)' }}
          >
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Native Shapes
            </span>
            <span className="text-surface-600">•</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Single-Slide Teams
            </span>
            <span className="text-surface-600">•</span>
            <span className="flex items-center gap-1">
              <svg className="w-3.5 h-3.5 text-emerald-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Experience Colors
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
