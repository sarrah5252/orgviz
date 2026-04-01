import React, { useCallback, useMemo, useRef } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  type NodeTypes,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { toPng } from 'html-to-image';
import { OrgNode } from './OrgNode';
import { useTreeLayout } from '../hooks/useTreeLayout';
import { useOrgStore } from '../store/useOrgStore';

const nodeTypes: NodeTypes = {
  orgNode: OrgNode as any,
};

const OrgChartInner: React.FC = () => {
  const { nodes, edges } = useTreeLayout();
  const { fitView } = useReactFlow();
  const expandAll = useOrgStore(s => s.expandAll);
  const collapseAll = useOrgStore(s => s.collapseAll);
  const reset = useOrgStore(s => s.reset);
  const employees = useOrgStore(s => s.employees);
  const flowRef = useRef<HTMLDivElement>(null);

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
  }, [fitView]);

  const handleScreenshot = useCallback(async () => {
    if (!flowRef.current) return;
    const el = flowRef.current.querySelector('.react-flow__viewport') as HTMLElement;
    if (!el) return;
    try {
      const dataUrl = await toPng(el, {
        backgroundColor: '#020617',
        quality: 1,
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = 'org-chart-screenshot.png';
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  }, []);

  return (
    <div className="h-full w-full relative" ref={flowRef}>
      {/* Toolbar */}
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <span className="text-xs text-surface-400 mr-2">
          {employees.length} employees
        </span>
        <button onClick={() => expandAll()} className="toolbar-btn" title="Expand All">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15" />
          </svg>
        </button>
        <button onClick={() => collapseAll()} className="toolbar-btn" title="Collapse All">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 9V4.5M9 9H4.5M9 9L3.75 3.75M9 15v4.5M9 15H4.5M9 15l-5.25 5.25M15 9h4.5M15 9V4.5M15 9l5.25-5.25M15 15h4.5M15 15v4.5m0-4.5l5.25 5.25" />
          </svg>
        </button>
        <button onClick={handleScreenshot} className="toolbar-btn" title="Screenshot">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" />
          </svg>
        </button>
        <div className="w-px h-5 bg-surface-700 mx-1" />
        <button onClick={() => reset()} className="toolbar-btn text-red-400 hover:!text-red-300" title="Upload New File">
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onInit={onInit}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.1}
        maxZoom={2}
        defaultEdgeOptions={{
          type: 'smoothstep',
          style: { stroke: '#334155', strokeWidth: 1.5 },
        }}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} color="#1e293b" gap={20} size={1} />
        <MiniMap
          nodeColor={() => '#3b82f6'}
          maskColor="rgba(0, 0, 0, 0.7)"
          style={{ width: 150, height: 100 }}
        />
        <Controls showInteractive={false} />
      </ReactFlow>
    </div>
  );
};

export const OrgChart: React.FC = () => (
  <ReactFlowProvider>
    <OrgChartInner />
  </ReactFlowProvider>
);
