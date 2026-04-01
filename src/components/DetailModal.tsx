import React, { useRef, useCallback, useState } from 'react';
import { toPng } from 'html-to-image';
import { useOrgStore } from '../store/useOrgStore';
import { HierarchyModal } from './HierarchyModal';
import type { Employee } from '../types';

export const DetailModal: React.FC = () => {
  const selectedNode = useOrgStore(s => s.selectedNode);
  const setSelectedNode = useOrgStore(s => s.setSelectedNode);
  const clearHighlight = useOrgStore(s => s.clearHighlight);
  const employees = useOrgStore(s => s.employees);
  const highlightChain = useOrgStore(s => s.highlightChain);
  const modalRef = useRef<HTMLDivElement>(null);
  const [showHierarchy, setShowHierarchy] = useState(false);

  const close = useCallback(() => {
    setSelectedNode(null);
    clearHighlight();
    setShowHierarchy(false);
  }, [setSelectedNode, clearHighlight]);

  const handleScreenshot = useCallback(async () => {
    if (!modalRef.current) return;
    try {
      const bgColor = getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#0f172a';
      const dataUrl = await toPng(modalRef.current, {
        backgroundColor: bgColor,
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `employee-${selectedNode?.name || 'detail'}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  }, [selectedNode]);

  if (!selectedNode) return null;

  const emp = selectedNode;
  const manager = employees.find(e => e.id === emp.managerId);
  const directReports = employees.filter(e => e.managerId === emp.id);

  // Build reporting chain (upward)
  const chain: Employee[] = [];
  let current = emp;
  let safety = 0;
  while (safety < 50) {
    const mgr = employees.find(e => e.id === current.managerId);
    if (!mgr || mgr.id === current.id) break;
    chain.push(mgr);
    current = mgr;
    safety++;
  }
  chain.reverse();

  return (
    <>
      <div className="modal-overlay" onClick={close}>
        <div className="modal-panel" onClick={e => e.stopPropagation()}>
          <div ref={modalRef} className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex-1">
                <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{emp.name}</h2>
                <p className="text-sm mt-0.5" style={{ color: 'var(--text-muted)' }}>{emp.title}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => setShowHierarchy(true)} className="toolbar-btn" title="View hierarchy tree">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 6.75h12M8.25 12h12M8.25 17.25h12M3.75 6.75h.007v.008H3.75V6.75zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zM3.75 12h.007v.008H3.75V12zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm-.375 5.25h.007v.008H3.75v-.008zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" />
                  </svg>
                </button>
                <button onClick={handleScreenshot} className="toolbar-btn" title="Screenshot this card">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
                  </svg>
                </button>
                <button onClick={close} className="toolbar-btn">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>

            {/* View Hierarchy button — prominent */}
            <button
              onClick={() => setShowHierarchy(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all hover:scale-[1.01] active:scale-[0.99] mb-6"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)', color: '#fff' }}
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              View Hierarchy Tree
            </button>

            {/* Info grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <InfoCard label="Department" value={emp.department} />
              <InfoCard label="Location" value={emp.location} />
              <InfoCard label="Client" value={emp.client && emp.client !== '—' ? emp.client : '—'} />
              <InfoCard label="Employee ID" value={emp.id} />
              {emp.employmentType && <InfoCard label="Employment Type" value={emp.employmentType} />}
              {manager && <InfoCard label="Reports To" value={manager.name} />}
            </div>

            {/* Reporting chain */}
            {chain.length > 0 && (
              <div className="mb-6">
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Reporting Chain
                </h3>
                <div className="space-y-0">
                  {chain.map((person, i) => (
                    <div key={person.id} className="flex items-start gap-2">
                      <div className="flex flex-col items-center">
                        <div className="w-2 h-2 rounded-full bg-accent-500 mt-1.5" style={{ background: '#8b5cf6' }} />
                        {i < chain.length - 1 && <div className="w-px h-6" style={{ background: 'var(--border-primary)' }} />}
                        {i === chain.length - 1 && <div className="w-px h-6" style={{ background: '#3b82f6' }} />}
                      </div>
                      <div className="pb-2">
                        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{person.name}</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{person.title}</p>
                      </div>
                    </div>
                  ))}
                  {/* Current person */}
                  <div className="flex items-start gap-2">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full mt-1 ring-2" style={{ background: '#3b82f6', boxShadow: '0 0 0 3px rgba(59,130,246,0.3)' }} />
                    </div>
                    <div>
                      <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{emp.name}</p>
                      <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{emp.title}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Direct reports */}
            {directReports.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider mb-3" style={{ color: 'var(--text-muted)' }}>
                  Direct Reports ({directReports.length})
                </h3>
                <div className="space-y-1">
                  {directReports.map(person => (
                    <button
                      key={person.id}
                      className="w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors text-left"
                      style={{ color: 'var(--text-primary)' }}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                      onClick={() => {
                        const node = { ...person, children: [] };
                        setSelectedNode(node as any);
                        highlightChain(person.id);
                      }}
                    >
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
                        style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)', color: 'var(--text-secondary)' }}>
                        {person.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{person.name}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{person.title}</p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Hierarchy Tree Modal */}
      {showHierarchy && (
        <HierarchyModal employee={emp} onClose={() => setShowHierarchy(false)} />
      )}
    </>
  );
};

const InfoCard: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="rounded-lg px-3 py-2.5" style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-secondary)' }}>
    <p className="text-xs mb-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{value || '—'}</p>
  </div>
);
