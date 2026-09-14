import React, { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { useOrgStore } from '../store/useOrgStore';
import { getDeptColor, getExpColor } from '../utils/constants';
import type { TreeNode } from '../types';

interface OrgNodeData {
  employee: TreeNode;
  hasChildren: boolean;
  isExpanded: boolean;
  isHighlighted: boolean;
  isSearchMatch: boolean;
  childCount: number;
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

      <div className="flex flex-col h-[calc(100%-4px)] p-5 justify-between">
        {/* Name, ID and Title section */}
        <div className="flex flex-col gap-1 min-h-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-[21px] leading-snug truncate flex-1" style={{ color: primaryTextColor, fontWeight: 800, letterSpacing: '0.02em' }} title={employee.name}>
              {employee.name}
            </p>
            {employee.id && employee.id !== 'root' && (
              <span className="text-[12px] px-2 py-0.5 rounded font-mono flex-shrink-0 font-bold"
                style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-secondary)', letterSpacing: '0.03em' }}>
                #{employee.id}
              </span>
            )}
          </div>
          <p className="text-[16px] leading-snug truncate" style={{ color: 'var(--text-secondary)', fontWeight: 600, letterSpacing: '0.03em' }} title={employee.title}>
            {employee.title}
          </p>
        </div>

        {/* Divider */}
        <div className="my-2" style={{ height: '1px', background: 'var(--border-secondary)' }} />

        {/* Badges row */}
        <div className="flex flex-wrap gap-2">
          {employee.department && (
            <span className="badge badge--dept text-[13px] px-2.5 py-1" style={{ backgroundColor: `${deptColor}20`, color: deptColor, fontWeight: 700, letterSpacing: '0.02em' }}>
              {employee.department}
            </span>
          )}
          {employee.location && (
            <span className="badge badge--location text-[13px] px-2.5 py-1 font-bold" style={{ letterSpacing: '0.02em' }}>
              {employee.location}
            </span>
          )}
          {employee.client && employee.client !== '-' && employee.client !== '—' && (
            <span className="badge badge--client text-[13px] px-2.5 py-1 font-bold" style={{ backgroundColor: '#f59e0b20', color: '#f59e0b', letterSpacing: '0.02em' }}>
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
