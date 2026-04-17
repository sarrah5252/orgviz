import React, { useCallback, useMemo, useRef, useState, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  BackgroundVariant,
  useReactFlow,
  ReactFlowProvider,
  getNodesBounds,
  getViewportForBounds,
  useNodes,
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

const EXP_LEGEND = [
  { color: '#22c55e', label: '< 2 years' },
  { color: '#f97316', label: '2 – 4 years' },
  { color: '#38bdf8', label: '4 – 8 years' },
  { color: '#eab308', label: '8 – 16 years' },
  { color: '#a855f7', label: '16+ years' },
];

const OrgChartInner: React.FC = () => {
  const { nodes, edges } = useTreeLayout();
  const { fitView, getNodes } = useReactFlow();
  const expandAll = useOrgStore(s => s.expandAll);
  const collapseAll = useOrgStore(s => s.collapseAll);
  const reset = useOrgStore(s => s.reset);
  const employees = useOrgStore(s => s.employees);
  const setCaptureChartFn = useOrgStore(s => s.setCaptureChartFn);
  const flowRef = useRef<HTMLDivElement>(null);
  const [legendOpen, setLegendOpen] = useState(true);

  const hasExpData = useMemo(() =>
    employees.some(e => e.yearsOfExperience !== undefined && e.yearsOfExperience !== null),
    [employees]
  );

  const [legendPos, setLegendPos] = useState({ x: 20, y: 80 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });

  const handlePointerDown = (e: React.PointerEvent) => {
    // Only drag on left click
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStart.current = {
      x: e.clientX - legendPos.x,
      y: e.clientY - legendPos.y
    };
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging) return;
    setLegendPos({
      x: e.clientX - dragStart.current.x,
      y: e.clientY - dragStart.current.y
    });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onInit = useCallback(() => {
    setTimeout(() => fitView({ padding: 0.2, duration: 500 }), 100);
  }, [fitView]);



  /**
   * Captures the chart perfectly cropped around the nodes without any math distortion.
   * This forces the DOM wrapper into an absolute rigid box matching the tree bounds,
   * lets ReactFlow native fitView handle the camera natively, takes the crisp shot,
   * and invisibly restores the UI. This eliminates empty screen margins and flexbox squish bugs!
   */
  const captureFullChart = useCallback(async (): Promise<string | undefined> => {
    if (!flowRef.current) return undefined;

    const rfWrapper = flowRef.current;
    const nodes = getNodes();
    if (nodes.length === 0) return undefined;

    // Yield to the event loop so any pending state changes or DOM updates complete
    await new Promise(resolve => setTimeout(resolve, 300));
    const freshNodes = getNodes();

    // 1. Calculate safe tightly padded boundaries
    const rawBounds = getNodesBounds(freshNodes);
    const padding = 150; // Safety margin for wide nodes
    const targetWidth = rawBounds.width + padding;
    const targetHeight = rawBounds.height + padding;
    
    // Save original bounds to restore user state invisibly
    const originalStyle = {
      position: rfWrapper.style.position,
      width: rfWrapper.style.width,
      height: rfWrapper.style.height,
      zIndex: rfWrapper.style.zIndex,
    };

    // 2. Dynamically calculate pixel ratio to prevent browser canvas sizing limits
    let safePixelRatio = 2.0;
    const MAX_DIMENSION = 10000;
    if (targetWidth * safePixelRatio > MAX_DIMENSION) safePixelRatio = MAX_DIMENSION / targetWidth;
    if (targetHeight * safePixelRatio > MAX_DIMENSION) safePixelRatio = Math.min(safePixelRatio, MAX_DIMENSION / targetHeight);
    safePixelRatio = Math.max(1.5, safePixelRatio); // High crispness floor

    try {
      // 3. Force the container into a rigid physical box perfectly hugging the tree.
      rfWrapper.style.position = 'absolute';
      rfWrapper.style.zIndex = '9999'; 
      rfWrapper.style.width = `${targetWidth}px`;
      rfWrapper.style.height = `${targetHeight}px`;

      // 4. Let React Flow natively calculate the layout into this perfectly-sized wrapper
      // We use a very small padding here because we already added physical padding to the wrapper
      fitView({ duration: 0, padding: 0.02 });
      await new Promise(resolve => setTimeout(resolve, 400)); // wait for redraw

      // 5. Native tightly cropped capture!
      const dataUrl = await toPng(rfWrapper, {
        width: targetWidth,
        height: targetHeight,
        pixelRatio: safePixelRatio,
        skipFonts: true,
        backgroundColor: 'rgba(0,0,0,0)', 
        filter: (node: HTMLElement) => {
          // Exclude floating UI overlays and background dots from the captured crop
          if (node?.classList?.contains) {
            const exclusionClasses = ['react-flow__panel', 'exp-legend', 'app-toolbar', 'react-flow__background'];
            for (const cls of exclusionClasses) {
              if (node.classList.contains(cls)) return false;
            }
          }
          return true;
        }
      });

      return dataUrl;
    } catch (err) {
      console.error('Chart capture failed:', err);
      return undefined;
    } finally {
      // 6. Seamlessly restore user interface silently
      Object.assign(rfWrapper.style, originalStyle);
      fitView({ padding: 0.2, duration: 0 });
    }
  }, [getNodes, fitView]);

  const orientation = useOrgStore(s => s.orientation);
  const setOrientation = useOrgStore(s => s.setOrientation);

  // Register the capture function in the store so App.tsx can call it
  useEffect(() => {
    setCaptureChartFn(captureFullChart);
    return () => setCaptureChartFn(null);
  }, [captureFullChart, setCaptureChartFn]);

  const handleScreenshot = useCallback(async () => {
    const dataUrl = await captureFullChart();
    if (dataUrl) {
      const link = document.createElement('a');
      link.download = `org-chart-${orientation}.png`;
      link.href = dataUrl;
      link.click();
    }
  }, [captureFullChart, orientation]);

  const toggleOrientation = () => {
    setOrientation(orientation === 'vertical' ? 'horizontal' : 'vertical');
  };

  return (
    <div className="h-full w-full relative" ref={flowRef}>
      {/* Toolbar */}
      <div className="app-toolbar absolute top-4 right-4 z-10 flex items-center gap-2">
        <span className="text-xs text-surface-400 mr-2">
          {employees.length} employees
        </span>

        <button 
          onClick={toggleOrientation} 
          className={`toolbar-btn ${orientation === 'horizontal' ? 'text-accent-400' : ''}`} 
          title={`Switch to ${orientation === 'vertical' ? 'Horizontal' : 'Vertical'} Layout`}
        >
          {orientation === 'vertical' ? (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
            </svg>
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 4.5v15m6-15v15m-11.25-15v15" />
            </svg>
          )}
        </button>

        <div className="w-px h-5 bg-surface-700 mx-1" />

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
        <Controls showInteractive={false} />
      </ReactFlow>

      {/* Experience Color Legend */}
      {hasExpData && (
        <div
          className="exp-legend absolute z-50 rounded-xl transition-shadow"
          style={{
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border-primary)',
            backdropFilter: 'blur(12px)',
            boxShadow: isDragging ? '0 12px 30px rgba(0,0,0,0.4)' : '0 4px 20px rgba(0,0,0,0.3)',
            top: '0px',
            left: '0px',
            transform: `translate(${legendPos.x}px, ${legendPos.y}px)`,
            cursor: isDragging ? 'grabbing' : 'grab',
            touchAction: 'none'
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
        >
          <div className="flex items-center justify-between px-3 py-2 w-full select-none cursor-inherit">
            <button
              onClick={(e) => { e.stopPropagation(); setLegendOpen(prev => !prev); }}
              className="flex items-center gap-2 text-left bg-transparent border-none outline-none cursor-pointer p-0"
              title="Toggle legend"
            >
              <div className="flex gap-1">
                {EXP_LEGEND.map(item => (
                  <div
                    key={item.color}
                    className="w-2.5 h-2.5 rounded-sm"
                    style={{ backgroundColor: item.color }}
                  />
                ))}
              </div>
              <span className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                Experience Legend
              </span>
              <svg
                className={`w-3 h-3 transition-transform ${legendOpen ? 'rotate-180' : ''}`}
                style={{ color: 'var(--text-muted)' }}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
              </svg>
            </button>
            <div className="text-xs text-surface-500 ml-3 opacity-50">|||</div>
          </div>
          {legendOpen && (
            <div className="px-3 pb-3 pt-1 space-y-1.5 border-t" style={{ borderColor: 'var(--border-secondary)', cursor: 'default' }} onPointerDown={e => e.stopPropagation()}>
              {EXP_LEGEND.map(item => (
                <div key={item.color} className="flex items-center gap-2.5">
                  <div
                    className="w-4 h-3 rounded-sm flex-shrink-0"
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                    {item.label}
                  </span>
                </div>
              ))}
              <div className="flex items-center gap-2.5 pt-1" style={{ borderTop: '1px solid var(--border-secondary)' }}>
                <div
                  className="w-4 h-3 rounded-sm flex-shrink-0"
                  style={{ background: 'var(--bg-tertiary)', border: '1px solid var(--border-primary)' }}
                />
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  No data
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const OrgChart: React.FC = () => (
  <ReactFlowProvider>
    <OrgChartInner />
  </ReactFlowProvider>
);
