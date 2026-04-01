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

const OrgNodeComponent: React.FC<NodeProps> = ({ data }) => {
  const { employee, hasChildren, isExpanded, isHighlighted, isSearchMatch, childCount } = data as unknown as OrgNodeData;
  const toggleExpand = useOrgStore(s => s.toggleExpand);
  const setSelectedNode = useOrgStore(s => s.setSelectedNode);
  const highlightChain = useOrgStore(s => s.highlightChain);

  const deptColor = getDeptColor(employee.department);

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

  return (
    <div className={nodeClass} onClick={handleClick}>
      <Handle type="target" position={Position.Top} className="!w-2 !h-2" style={{ background: 'var(--border-primary)', borderColor: 'var(--text-muted)' }} />

      {/* Dept color bar */}
      <div className="h-1 rounded-t-xl" style={{ background: deptColor }} />

      <div className="px-3 py-2.5">
        {/* Name */}
        <div className="flex items-center gap-1.5">
          <p className="font-semibold text-sm leading-tight truncate" style={{ color: 'var(--text-primary)' }} title={employee.name}>
            {employee.name}
          </p>
          {employee.id && employee.id !== 'root' && (
            <span className="text-[10px] px-1.5 py-0.5 rounded font-mono flex-shrink-0"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)', border: '1px solid var(--border-secondary)' }}>
              {employee.id}
            </span>
          )}
        </div>
        {/* Title */}
        <p className="text-xs mt-0.5 leading-tight truncate" style={{ color: 'var(--text-muted)' }} title={employee.title}>
          {employee.title}
        </p>

        {/* Badges row */}
        <div className="flex flex-wrap gap-1 mt-2">
          {employee.department && (
            <span className="badge badge--dept" style={{ backgroundColor: `${deptColor}20`, color: deptColor }}>
              {employee.department}
            </span>
          )}
          {employee.location && (
            <span className="badge badge--location">
              {employee.location}
            </span>
          )}
        </div>
      </div>

      {/* Expand/Collapse toggle */}
      {hasChildren && (
        <button
          className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 rounded-full 
            flex items-center justify-center transition-colors text-xs z-10"
          style={{
            background: 'var(--bg-tertiary)',
            border: '1px solid var(--border-primary)',
            color: 'var(--text-secondary)',
          }}
          onClick={handleToggle}
          title={isExpanded ? 'Collapse' : `Expand (${childCount})`}
        >
          {isExpanded ? '−' : `+${childCount}`}
        </button>
      )}

      <Handle type="source" position={Position.Bottom} className="!w-2 !h-2" style={{ background: 'var(--border-primary)', borderColor: 'var(--text-muted)' }} />
    </div>
  );
};

export const OrgNode = memo(OrgNodeComponent);
