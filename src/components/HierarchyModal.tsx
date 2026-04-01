import React, { useMemo, useRef, useCallback } from 'react';
import { toPng } from 'html-to-image';
import { useOrgStore } from '../store/useOrgStore';
import type { Employee } from '../types';

interface HierarchyModalProps {
  employee: Employee;
  onClose: () => void;
}

interface MiniTreeNode {
  employee: Employee;
  children: MiniTreeNode[];
  isTarget: boolean;
  isAncestor: boolean;
}

export const HierarchyModal: React.FC<HierarchyModalProps> = ({ employee, onClose }) => {
  const employees = useOrgStore(s => s.employees);
  const treeRef = useRef<HTMLDivElement>(null);

  // Build: ancestors (path to root) + current employee + all descendants
  const tree = useMemo(() => {
    const empMap = new Map<string, Employee>();
    employees.forEach(e => empMap.set(e.id, e));

    // Get ancestors chain
    const ancestors: Employee[] = [];
    let curr = employee;
    let safety = 0;
    while (safety < 100) {
      const mgr = empMap.get(curr.managerId);
      if (!mgr || mgr.id === curr.id) break;
      ancestors.unshift(mgr);
      curr = mgr;
      safety++;
    }

    // Build subtree for a given employee
    function buildSubtree(emp: Employee): MiniTreeNode {
      const children = employees
        .filter(e => e.managerId === emp.id)
        .map(c => buildSubtree(c));
      return {
        employee: emp,
        children,
        isTarget: emp.id === employee.id,
        isAncestor: false,
      };
    }

    // Build chain: nest ancestors → current subtree
    const targetSubtree = buildSubtree(employee);

    if (ancestors.length === 0) {
      return targetSubtree;
    }

    // Build from root ancestor down
    let current: MiniTreeNode = {
      employee: ancestors[0],
      children: [],
      isTarget: false,
      isAncestor: true,
    };
    const root = current;

    for (let i = 1; i < ancestors.length; i++) {
      const child: MiniTreeNode = {
        employee: ancestors[i],
        children: [],
        isTarget: false,
        isAncestor: true,
      };
      current.children = [child];
      current = child;
    }
    current.children = [targetSubtree];

    return root;
  }, [employee, employees]);

  const handleScreenshot = useCallback(async () => {
    if (!treeRef.current) return;
    try {
      const dataUrl = await toPng(treeRef.current, {
        backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-secondary').trim() || '#0f172a',
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `hierarchy-${employee.name}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  }, [employee]);

  return (
    <div className="hierarchy-overlay" onClick={onClose}>
      <div className="hierarchy-modal" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4" style={{ borderBottom: '1px solid var(--border-primary)' }}>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>
              Hierarchy — {employee.name}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Reporting chain + direct reports tree
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={handleScreenshot} className="toolbar-btn" title="Download as image">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
              </svg>
            </button>
            <button onClick={onClose} className="toolbar-btn">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Tree */}
        <div ref={treeRef} className="p-6 overflow-auto">
          <TreeBranch node={tree} isLast={true} depth={0} />
        </div>
      </div>
    </div>
  );
};

const TreeBranch: React.FC<{ node: MiniTreeNode; isLast: boolean; depth: number }> = ({ node, isLast, depth }) => {
  const { employee, children, isTarget, isAncestor } = node;

  let borderColor = 'var(--border-primary)';
  let bg = 'var(--bg-tertiary)';
  if (isTarget) {
    borderColor = '#3b82f6';
    bg = 'rgba(59, 130, 246, 0.1)';
  } else if (isAncestor) {
    borderColor = '#8b5cf6';
    bg = 'rgba(139, 92, 246, 0.07)';
  }

  return (
    <div className={`${depth > 0 ? 'ml-6' : ''}`}>
      {/* Connector line */}
      {depth > 0 && (
        <div className="flex items-center mb-1">
          <div className="w-4 border-b-2" style={{ borderColor: isTarget ? '#3b82f6' : isAncestor ? '#8b5cf6' : 'var(--border-primary)' }} />
        </div>
      )}

      {/* Node card */}
      <div
        className="rounded-lg px-3 py-2 mb-2 transition-all"
        style={{
          border: `2px solid ${borderColor}`,
          background: bg,
          boxShadow: isTarget ? '0 0 16px rgba(59, 130, 246, 0.2)' : 'none',
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{
              background: isTarget ? '#3b82f6' : isAncestor ? '#8b5cf6' : 'var(--border-primary)',
              color: '#fff',
            }}
          >
            {employee.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
              {employee.name}
              {isTarget && <span className="ml-1.5 text-xs text-blue-400 font-normal">(selected)</span>}
            </p>
            <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{employee.title}</p>
          </div>
          {employee.department && (
            <span className="badge badge--dept text-xs flex-shrink-0">{employee.department}</span>
          )}
        </div>
      </div>

      {/* Children */}
      {children.length > 0 && (
        <div className="border-l-2 ml-4 pl-0" style={{ borderColor: isTarget ? 'rgba(59, 130, 246, 0.3)' : 'var(--border-secondary)' }}>
          {children.map((child, i) => (
            <TreeBranch key={child.employee.id} node={child} isLast={i === children.length - 1} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
};
