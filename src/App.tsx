import React, { useEffect, useState, useRef } from 'react';
import { useOrgStore } from './store/useOrgStore';
import { FileUpload } from './components/FileUpload';
import { OrgChart } from './components/OrgChart';
import { FilterPanel } from './components/FilterPanel';
import { SearchBar } from './components/SearchBar';
import { DetailModal } from './components/DetailModal';

const ThemeToggle: React.FC = () => {
  const theme = useOrgStore(s => s.theme);
  const toggleTheme = useOrgStore(s => s.toggleTheme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.documentElement.classList.toggle('light', theme === 'light');
  }, [theme]);

  return (
    <button onClick={toggleTheme} className="toolbar-btn" title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}>
      {theme === 'dark' ? (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />
        </svg>
      ) : (
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21.752 15.002A9.718 9.718 0 0118 15.75c-5.385 0-9.75-4.365-9.75-9.75 0-1.33.266-2.597.748-3.752A9.753 9.753 0 003 11.25C3 16.635 7.365 21 12.75 21a9.753 9.753 0 009.002-5.998z" />
        </svg>
      )}
    </button>
  );
};

// ─── Editable chart title ───────────────────────────────────
const ChartTitle: React.FC = () => {
  const chartTitle = useOrgStore(s => s.chartTitle);
  const setChartTitle = useOrgStore(s => s.setChartTitle);
  const [editing, setEditing] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editing && inputRef.current) inputRef.current.focus();
  }, [editing]);

  if (editing) {
    return (
      <input
        ref={inputRef}
        type="text"
        value={chartTitle}
        onChange={e => setChartTitle(e.target.value)}
        onBlur={() => setEditing(false)}
        onKeyDown={e => { if (e.key === 'Enter') setEditing(false); }}
        placeholder="Enter chart title…"
        className="text-sm font-semibold px-2 py-1 rounded-lg outline-none max-w-[200px]"
        style={{ background: 'var(--bg-tertiary)', color: 'var(--text-primary)', border: '1px solid #3b82f6' }}
      />
    );
  }

  return (
    <button
      onClick={() => setEditing(true)}
      className="flex items-center gap-1 px-2 py-1 rounded-lg text-sm font-medium transition-colors"
      style={{ color: chartTitle ? 'var(--text-primary)' : 'var(--text-muted)' }}
      title="Click to edit chart title"
    >
      {chartTitle || 'Untitled Chart'}
      <svg className="w-3 h-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L6.832 19.82a4.5 4.5 0 01-1.897 1.13l-2.685.8.8-2.685a4.5 4.5 0 011.13-1.897L16.863 4.487z" />
      </svg>
    </button>
  );
};

// ─── Saved Charts Dropdown ──────────────────────────────────
const SavedChartsMenu: React.FC = () => {
  const savedCharts = useOrgStore(s => s.savedCharts);
  const loadChart = useOrgStore(s => s.loadChart);
  const deleteChart = useOrgStore(s => s.deleteChart);
  const saveChart = useOrgStore(s => s.saveChart);
  const newChart = useOrgStore(s => s.newChart);
  const tree = useOrgStore(s => s.tree);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <div className="flex items-center gap-1">
        {/* Save current */}
        {tree && (
          <button
            onClick={() => { saveChart(); }}
            className="toolbar-btn"
            title="Save current chart"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.593 3.322c1.1.128 1.907 1.077 1.907 2.185V21L12 17.25 4.5 21V5.507c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0z" />
            </svg>
          </button>
        )}
        {/* New chart */}
        <button
          onClick={() => { newChart(); setOpen(false); }}
          className="toolbar-btn"
          title="Save current & create new chart"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>
        {/* Saved charts list */}
        {savedCharts.length > 0 && (
          <button
            onClick={() => setOpen(!open)}
            className={`toolbar-btn ${open ? 'ring-1 ring-blue-500' : ''}`}
            title="View saved charts"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12.75V12A2.25 2.25 0 014.5 9.75h15A2.25 2.25 0 0121.75 12v.75m-8.69-6.44l-2.12-2.12a1.5 1.5 0 00-1.061-.44H4.5A2.25 2.25 0 002.25 6v12a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9a2.25 2.25 0 00-2.25-2.25h-5.379a1.5 1.5 0 01-1.06-.44z" />
            </svg>
            <span className="text-xs ml-0.5 opacity-60">{savedCharts.length}</span>
          </button>
        )}
      </div>

      {/* Dropdown */}
      {open && (
        <div className="absolute top-full right-0 mt-1 w-72 rounded-xl shadow-2xl z-50 overflow-hidden"
          style={{ background: 'var(--bg-secondary)', border: '1px solid var(--border-primary)' }}>
          <div className="px-3 py-2 text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)', borderBottom: '1px solid var(--border-secondary)' }}>
            Saved Charts
          </div>
          <div className="max-h-60 overflow-y-auto">
            {savedCharts.map(chart => (
              <div key={chart.id}
                className="flex items-center gap-2 px-3 py-2 cursor-pointer transition-colors"
                style={{ borderBottom: '1px solid var(--border-secondary)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-tertiary)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div
                  className="flex-1 min-w-0"
                  onClick={() => { loadChart(chart.id); setOpen(false); }}
                >
                  <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>{chart.title}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    {chart.employees.length} employees · {new Date(chart.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); deleteChart(chart.id); }}
                  className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 flex-shrink-0"
                  style={{ color: 'var(--text-muted)' }}
                  title="Delete"
                >
                  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// ─── Main App ───────────────────────────────────────────────
const App: React.FC = () => {
  const tree = useOrgStore(s => s.tree);
  const editingData = useOrgStore(s => s.editingData);
  const setEditingData = useOrgStore(s => s.setEditingData);
  const employees = useOrgStore(s => s.employees);

  // Show input view if no tree OR if user clicked "Edit Data"
  if (!tree || editingData) {
    return <FileUpload />;
  }

  return (
    <div className="h-screen w-screen flex flex-col" style={{ background: 'var(--bg-primary)' }}>
      {/* Top bar */}
      <header className="flex-shrink-0 flex items-center justify-between px-4 py-3 z-20"
        style={{ borderBottom: '1px solid var(--border-secondary)', background: 'var(--bg-secondary)' }}>
        <div className="flex items-center gap-3">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h1.5m-1.5 3h1.5m-1.5 3h1.5m3-6H15m-1.5 3H15m-1.5 3H15M9 21v-3.375c0-.621.504-1.125 1.125-1.125h3.75c.621 0 1.125.504 1.125 1.125V21" />
              </svg>
            </div>
            <span className="font-semibold text-sm tracking-tight" style={{ color: 'var(--text-primary)' }}>
              Org<span className="text-transparent bg-clip-text"
                style={{ backgroundImage: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}>Viz</span>
            </span>
          </div>

          <div className="w-px h-6" style={{ background: 'var(--border-primary)' }} />

          {/* Chart title */}
          <ChartTitle />

          <div className="w-px h-6" style={{ background: 'var(--border-primary)' }} />

          {/* Search */}
          <SearchBar />

          <div className="w-px h-6" style={{ background: 'var(--border-primary)' }} />

          {/* Edit data button */}
          <button
            onClick={() => setEditingData(true)}
            className="toolbar-btn"
            title="Edit input data"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" />
            </svg>
          </button>

          {/* Theme toggle */}
          <ThemeToggle />

          {/* Save / New / Saved charts */}
          <SavedChartsMenu />
        </div>

        {/* Filters + employee count */}
        <div className="flex items-center gap-3">
          <FilterPanel />
          <span className="text-xs font-medium px-2 py-1 rounded-full" style={{ background: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>
            {employees.length} employees
          </span>
        </div>
      </header>

      {/* Chart */}
      <main className="flex-1 relative">
        <OrgChart />
      </main>

      {/* Detail Modal */}
      <DetailModal />
    </div>
  );
};

export default App;
