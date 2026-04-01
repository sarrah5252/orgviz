import React, { useState, useCallback, useRef, useEffect } from 'react';
import { useOrgStore } from '../store/useOrgStore';

interface RowData {
  empId: string;
  name: string;
  title: string;
  department: string;
  managerId: string;
  location: string;
  client: string;
}

const COLUMN_KEYS: (keyof RowData)[] = ['empId', 'name', 'title', 'department', 'managerId', 'location', 'client'];
const COLUMN_LABELS = ['Emp ID', 'Name', 'Job Title', 'Department', 'Reports To', 'Location', 'Client'];

const EMPTY_ROW = (): RowData => ({
  empId: '',
  name: '',
  title: '',
  department: '',
  managerId: '',
  location: '',
  client: '',
});

export const ManualEntry: React.FC = () => {
  const setData = useOrgStore(s => s.setData);
  const [rows, setRows] = useState<RowData[]>(() => Array.from({ length: 10 }, EMPTY_ROW));
  const [error, setError] = useState('');
  const [processing, setProcessing] = useState(false);
  const [activeCell, setActiveCell] = useState<{ row: number; col: number } | null>(null);
  const tableRef = useRef<HTMLDivElement>(null);
  const inputRefs = useRef<Map<string, HTMLInputElement>>(new Map());

  // Register input ref
  const setInputRef = useCallback((row: number, col: number, el: HTMLInputElement | null) => {
    const key = `${row}-${col}`;
    if (el) inputRefs.current.set(key, el);
    else inputRefs.current.delete(key);
  }, []);

  // Focus a cell
  const focusCell = useCallback((row: number, col: number) => {
    const key = `${row}-${col}`;
    const el = inputRefs.current.get(key);
    if (el) {
      el.focus();
      setActiveCell({ row, col });
    }
  }, []);

  const updateCell = useCallback((rowIdx: number, key: keyof RowData, value: string) => {
    setRows(prev => {
      const next = [...prev];
      next[rowIdx] = { ...next[rowIdx], [key]: value };
      return next;
    });
  }, []);

  const addRows = useCallback((count: number) => {
    setRows(prev => [...prev, ...Array.from({ length: count }, EMPTY_ROW)]);
  }, []);

  const removeRow = useCallback((idx: number) => {
    setRows(prev => prev.length > 1 ? prev.filter((_, i) => i !== idx) : [EMPTY_ROW()]);
  }, []);

  const clearAll = useCallback(() => {
    setRows(Array.from({ length: 10 }, EMPTY_ROW));
  }, []);

  // ─── PASTE HANDLER (Excel → Table) ───────────────────────────
  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    const text = e.clipboardData.getData('text/plain');
    if (!text) return;

    // Parse TSV/CSV — Excel copies as tab-separated
    const lines = text.split(/\r?\n/).filter(line => line.trim());
    if (lines.length === 0) return;

    // Check if this looks like multi-cell data (has tabs or multiple lines)
    const hasMultipleCells = lines.length > 1 || lines[0].includes('\t');
    if (!hasMultipleCells) return; // let normal typing handle single values

    e.preventDefault();

    const startRow = activeCell?.row ?? 0;
    const startCol = activeCell?.col ?? 0;

    setRows(prev => {
      const next = [...prev];

      // Expand rows if pasted data is larger than available space
      const neededRows = startRow + lines.length;
      while (next.length < neededRows) {
        next.push(EMPTY_ROW());
      }

      lines.forEach((line, lineIdx) => {
        const cells = line.split('\t');
        const rowIdx = startRow + lineIdx;

        cells.forEach((cellValue, cellIdx) => {
          const colIdx = startCol + cellIdx;
          if (colIdx < COLUMN_KEYS.length) {
            const key = COLUMN_KEYS[colIdx];
            next[rowIdx] = { ...next[rowIdx], [key]: cellValue.trim() };
          }
        });
      });

      return next;
    });
  }, [activeCell]);

  // ─── KEYBOARD NAVIGATION (Arrow keys, Tab, Enter) ───────────
  const handleKeyDown = useCallback((e: React.KeyboardEvent, row: number, col: number) => {
    const maxRow = rows.length - 1;
    const maxCol = COLUMN_KEYS.length - 1;

    switch (e.key) {
      case 'Tab':
        e.preventDefault();
        if (e.shiftKey) {
          // Shift+Tab → previous cell
          if (col > 0) focusCell(row, col - 1);
          else if (row > 0) focusCell(row - 1, maxCol);
        } else {
          // Tab → next cell
          if (col < maxCol) focusCell(row, col + 1);
          else if (row < maxRow) focusCell(row + 1, 0);
          else {
            // At last cell — add a new row and move to it
            addRows(1);
            setTimeout(() => focusCell(row + 1, 0), 50);
          }
        }
        break;
      case 'Enter':
        e.preventDefault();
        if (row < maxRow) focusCell(row + 1, col);
        else {
          addRows(1);
          setTimeout(() => focusCell(row + 1, col), 50);
        }
        break;
      case 'ArrowDown':
        if (row < maxRow) { e.preventDefault(); focusCell(row + 1, col); }
        break;
      case 'ArrowUp':
        if (row > 0) { e.preventDefault(); focusCell(row - 1, col); }
        break;
    }
  }, [rows.length, focusCell, addRows]);

  // ─── GENERATE CHART ──────────────────────────────────────────
  const handleGenerate = useCallback(async () => {
    setError('');
    const validRows = rows.filter(r => r.name.trim());
    if (validRows.length === 0) {
      setError('Please enter at least one employee with a name');
      return;
    }

    setProcessing(true);
    try {
      let autoId = 1;
      const employees = validRows.map(r => ({
        id: r.empId.trim() || String(autoId++),
        name: r.name.trim(),
        title: r.title.trim(),
        department: r.department.trim(),
        managerId: r.managerId.trim(),
        location: r.location.trim(),
        client: r.client.trim(),
        employmentType: '',
      }));

      // Resolve manager names → IDs
      const nameToId: Record<string, string> = {};
      employees.forEach(e => { nameToId[e.name] = e.id; });
      employees.forEach(e => {
        if (e.managerId) {
          if (nameToId[e.managerId]) {
            e.managerId = nameToId[e.managerId];
          } else {
            const match = employees.find(emp => emp.name.toLowerCase() === e.managerId.toLowerCase());
            e.managerId = match ? match.id : '';
          }
        }
      });

      // Build tree
      const nodeMap = new Map<string, any>();
      employees.forEach(emp => nodeMap.set(emp.id, { ...emp, children: [] }));

      const roots: any[] = [];
      const orphans: any[] = [];
      employees.forEach(emp => {
        const node = nodeMap.get(emp.id);
        if (!emp.managerId) roots.push(node);
        else if (nodeMap.has(emp.managerId)) nodeMap.get(emp.managerId).children.push(node);
        else orphans.push(node);
      });
      if (orphans.length > 0) {
        if (roots.length === 1) roots[0].children.push(...orphans);
        else roots.push(...orphans);
      }

      const tree = roots.length === 1
        ? roots[0]
        : { id: 'root', name: 'Organization', title: 'Root', department: '', managerId: '', location: '', client: '', employmentType: '', children: roots };

      const departments = new Set<string>();
      const titles = new Set<string>();
      const locations = new Set<string>();
      const clients = new Set<string>();
      employees.forEach(emp => {
        if (emp.department) departments.add(emp.department);
        if (emp.title) titles.add(emp.title);
        if (emp.location) locations.add(emp.location);
        if (emp.client && emp.client !== '—') clients.add(emp.client);
      });

      setData({
        tree,
        employees,
        filters: {
          departments: [...departments].sort(),
          titles: [...titles].sort(),
          locations: [...locations].sort(),
          clients: [...clients].sort(),
        },
      });
    } catch (err: any) {
      setError(err.message || 'Failed to process data');
    } finally {
      setProcessing(false);
    }
  }, [rows, setData]);

  const filledCount = rows.filter(r => r.name.trim()).length;

  return (
    <div className="w-full max-w-5xl animate-fade-in">
      {/* Paste hint */}
      <div className="flex items-center justify-center gap-2 mb-4 px-4 py-2.5 rounded-xl"
        style={{ background: 'rgba(59, 130, 246, 0.08)', border: '1px solid rgba(59, 130, 246, 0.15)' }}>
        <svg className="w-4 h-4 flex-shrink-0" style={{ color: '#3b82f6' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z" />
        </svg>
        <span className="text-xs" style={{ color: '#3b82f6' }}>
          <strong>Pro tip:</strong> Select cells in Excel → Copy (Ctrl+C) → Click any cell below → Paste (Ctrl+V). Data fills automatically!
        </span>
      </div>

      {/* Spreadsheet */}
      <div
        ref={tableRef}
        className="rounded-xl overflow-hidden"
        style={{ border: '1px solid var(--border-primary)', background: 'var(--bg-secondary)' }}
        onPaste={handlePaste}
      >
        <div className="overflow-x-auto max-h-[50vh] overflow-y-auto">
          <table className="data-table">
            <thead>
              <tr>
                <th className="w-10 text-center">#</th>
                {COLUMN_LABELS.map((label, i) => (
                  <th key={i}>
                    <div className="flex items-center gap-1">
                      {label}
                      {i === 4 && (
                        <span className="text-[10px] font-normal opacity-50">(name)</span>
                      )}
                    </div>
                  </th>
                ))}
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, rowIdx) => (
                <tr key={rowIdx} className={activeCell?.row === rowIdx ? 'ring-1 ring-inset ring-blue-500/20' : ''}>
                  <td className="text-center select-none" style={{ color: 'var(--text-muted)' }}>
                    <span className="text-xs">{rowIdx + 1}</span>
                  </td>
                  {COLUMN_KEYS.map((key, colIdx) => (
                    <td key={key} className={activeCell?.row === rowIdx && activeCell?.col === colIdx ? 'ring-2 ring-inset ring-blue-500/40' : ''}>
                      <input
                        ref={el => setInputRef(rowIdx, colIdx, el)}
                        type="text"
                        value={row[key]}
                        onChange={e => updateCell(rowIdx, key, e.target.value)}
                        onFocus={() => setActiveCell({ row: rowIdx, col: colIdx })}
                        onKeyDown={e => handleKeyDown(e, rowIdx, colIdx)}
                        placeholder={rowIdx === 0 && !row[key] ? COLUMN_LABELS[colIdx] : ''}
                        spellCheck={false}
                        autoComplete="off"
                      />
                    </td>
                  ))}
                  <td>
                    <button
                      onClick={() => removeRow(rowIdx)}
                      className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/10 transition-colors opacity-0 group-hover:opacity-100"
                      style={{ color: 'var(--text-muted)', opacity: rows.length > 1 ? undefined : 0 }}
                      title="Remove row"
                      tabIndex={-1}
                    >
                      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer bar */}
        <div className="flex items-center justify-between px-4 py-3" style={{ borderTop: '1px solid var(--border-secondary)' }}>
          <div className="flex items-center gap-2">
            <button
              onClick={() => addRows(1)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Row
            </button>
            <button
              onClick={() => addRows(10)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
              style={{ background: 'var(--bg-tertiary)', color: 'var(--text-secondary)', border: '1px solid var(--border-primary)' }}
            >
              +10 Rows
            </button>
            <button
              onClick={clearAll}
              className="px-3 py-1.5 rounded-lg text-xs text-red-400 hover:bg-red-500/10 transition-colors"
            >
              Clear All
            </button>
          </div>
          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
            {filledCount} of {rows.length} rows filled
          </span>
        </div>
      </div>

      {error && (
        <div className="mt-3 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm animate-slide-up">
          {error}
        </div>
      )}

      {/* Generate button */}
      <div className="mt-4 flex justify-center">
        <button
          onClick={handleGenerate}
          disabled={processing || filledCount === 0}
          className="flex items-center gap-2 px-6 py-3 rounded-xl text-white font-semibold text-sm transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:hover:scale-100"
          style={{ background: 'linear-gradient(135deg, #3b82f6, #8b5cf6)' }}
        >
          {processing ? (
            <>
              <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              Processing…
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
              </svg>
              Generate Chart ({filledCount} employees)
            </>
          )}
        </button>
      </div>
    </div>
  );
};
