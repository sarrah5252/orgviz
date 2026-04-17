import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useOrgStore } from '../store/useOrgStore';
import type { TreeNode } from '../types';

interface OrgNodeData {
  employee: TreeNode;
  hasChildren: boolean;
  isExpanded: boolean;
  isHighlighted: boolean;
  isSearchMatch: boolean;
  childCount: number;
}

const DEPT_COLORS: Record<string, string> = {
  'Executive': '#8b5cf6',
  'Underwriting': '#ec4899',
  'Claims': '#f97316',
  'Sales & Distribution': '#06b6d4',
  'Actuarial': '#14b8a6',
  'Finance & Accounting': '#eab308',
  'Information Technology': '#3b82f6',
  'Human Resources': '#a855f7',
  'Risk Management': '#ef4444',
  'Compliance & Legal': '#64748b',
  'Marketing': '#f43f5e',
  'Customer Service': '#22c55e',
  'Internal Audit': '#78716c',
  'Product Development': '#0ea5e9',
  'Administration': '#6b7280',
  'Operations': '#8b5cf6',
  'General': '#64748b',
};

function getDeptColor(dept: string): string {
  return DEPT_COLORS[dept] || '#64748b';
}

// ─── Experience-based color scheme ───────────────────────────
interface ExpColor {
  bg: string;
  text: string;
  label: string;
}

function getExpColor(years: number | undefined): ExpColor | null {
  if (years === undefined || years === null) return null;
  if (years < 2) return { bg: '#22c55e', text: '#052e16', label: '< 2 yrs' };          // Green
  if (years < 4) return { bg: '#f97316', text: '#431407', label: '2-4 yrs' };           // Orange
  if (years < 8) return { bg: '#38bdf8', text: '#0c4a6e', label: '4-8 yrs' };           // Light blue
  if (years < 16) return { bg: '#eab308', text: '#422006', label: '8-16 yrs' };         // Yellow
  return { bg: '#a855f7', text: '#3b0764', label: '16+ yrs' };                           // Purple
}

const OrgNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const { employee, hasChildren, isExpanded, isHighlighted, isSearchMatch, childCount, orientation } = data as any;
  const toggleExpand = useOrgStore(s => s.toggleExpand);
  const setSelectedNode = useOrgStore(s => s.setSelectedNode);
  const highlightChain = useOrgStore(s => s.highlightChain);

  const isVertical = orientation === 'vertical';

  const deptColor = getDeptColor(employee.department);
  const expColor = getExpColor(employee.yearsOfExperience);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedNode(employee);
    highlightChain(employee.id);
  };

  const handleToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    toggleExpand(employee.id);
  };

  let nodeClass = 'org-node';
  if (isSearchMatch) nodeClass += ' org-node--search-match';
  else if (isHighlighted) nodeClass += ' org-node--highlighted';

  const hasExpColor = !!expColor;
  const nodeBodyStyle: React.CSSProperties = hasExpColor
    ? { borderColor: expColor.bg, borderWidth: '4px' }
    : {};

  const primaryTextColor = 'var(--text-primary)';

  const targetPosition = isVertical ? Position.Top : Position.Left;
  const sourcePosition = isVertical ? Position.Bottom : Position.Right;

  return (
    <div className={nodeClass} onClick={handleClick} style={{ ...nodeBodyStyle, width: '100%', height: '100%' }}>
      <Handle 
        type="target" 
        position={targetPosition} 
        className="!w-2 !h-2" 
        style={{ 
          background: hasExpColor ? `${expColor.text}40` : 'var(--border-primary)', 
          borderColor: hasExpColor ? expColor.text : 'var(--text-muted)' 
        }} 
      />

      {/* Dept color bar */}
      <div className="h-1 rounded-t-xl" style={{ background: deptColor }} />

      <div className="px-3 py-2.5">
        {/* Name */}
        <div className="flex items-start justify-between gap-1.5">
          <p className="text-sm leading-normal whitespace-nowrap flex-shrink-0" style={{ color: primaryTextColor, fontWeight: 800 }} title={employee.name}>
            {employee.name}
          </p>
          {employee.id && employee.id !== 'root' && (
            <span className="text-[11px] px-1.5 py-0.5 rounded font-mono flex-shrink-0 font-bold"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid var(--border-secondary)' }}>
              #{employee.id}
            </span>
          )}
        </div>
        {/* Title */}
        <p className="text-xs mt-1.5 leading-normal whitespace-nowrap flex-shrink-0" style={{ color: primaryTextColor, fontWeight: 700 }} title={employee.title}>
          {employee.title}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1 mt-2">
          {employee.department && (
            <span className="badge badge--dept" style={{ backgroundColor: `${deptColor}20`, color: deptColor, fontWeight: 700 }}>
              {employee.department}
            </span>
          )}
          {employee.location && (
            <span className="badge badge--location font-bold">
              {employee.location}
            </span>
          )}
          {employee.client && employee.client !== '-' && employee.client !== '—' && (
            <span className="badge badge--client font-bold" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b' }}>
              {employee.client}
            </span>
          )}
        </div>
      </div>

      {/* Expand/Collapse toggle */}
      {hasChildren && (
        <button
          className={`absolute flex items-center justify-center transition-colors text-xs z-10 w-6 h-6 rounded-full 
            ${isVertical ? '-bottom-3 left-1/2 -translate-x-1/2' : '-right-3 top-1/2 -translate-y-1/2'}`}
          style={{
            background: hasExpColor ? 'var(--bg-card)' : 'var(--bg-tertiary)',
            border: `1.5px solid ${hasExpColor ? expColor.bg : 'var(--border-primary)'}`,
            color: hasExpColor ? expColor.bg : 'var(--text-secondary)',
          }}
          onClick={handleToggle}
          title={isExpanded ? 'Collapse' : `Expand (${childCount})`}
        >
          {isExpanded ? '−' : `+${childCount}`}
        </button>
      )}

      <Handle 
        type="source" 
        position={sourcePosition} 
        className="!w-2 !h-2" 
        style={{ 
          background: hasExpColor ? expColor.bg : 'var(--border-primary)', 
          borderColor: 'var(--bg-primary)' 
        }} 
      />
    </div>
  );
};

export const OrgNode = memo(OrgNodeComponent);
