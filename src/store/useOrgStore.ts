import { create } from 'zustand';
import type { TreeNode, Employee, FilterOptions, FilterState, OrgData, SavedChart } from '../types';

interface OrgStore {
  // Data
  tree: TreeNode | null;
  employees: Employee[];
  filterOptions: FilterOptions;

  // Chart metadata
  chartTitle: string;
  savedCharts: SavedChart[];
  editingData: boolean; // true = show input view even if tree exists

  // UI State
  theme: 'dark' | 'light';
  activeFilters: FilterState;
  searchQuery: string;
  selectedNode: TreeNode | null;
  expandedNodes: Set<string>;
  highlightedPath: Set<string>;
  orientation: 'vertical' | 'horizontal';

  // Chart capture function (set by OrgChart component which has ReactFlow context)
  captureChartFn: (() => Promise<string | undefined>) | null;
  setCaptureChartFn: (fn: (() => Promise<string | undefined>) | null) => void;

  // Actions
  setData: (data: OrgData) => void;
  reset: () => void;
  setChartTitle: (title: string) => void;
  setEditingData: (editing: boolean) => void;
  saveChart: (imageData?: string) => void;
  loadChart: (id: string) => void;
  deleteChart: (id: string) => void;
  newChart: () => void;
  setFilters: (filters: Partial<FilterState>) => void;
  setSearchQuery: (query: string) => void;
  setSelectedNode: (node: TreeNode | null) => void;
  toggleExpand: (nodeId: string) => void;
  expandAll: () => void;
  collapseAll: () => void;
  highlightChain: (nodeId: string) => void;
  clearHighlight: () => void;
  toggleTheme: () => void;
  setOrientation: (orientation: 'vertical' | 'horizontal') => void;
}

function collectAllIds(node: TreeNode): string[] {
  const ids = [node.id];
  node.children.forEach(child => ids.push(...collectAllIds(child)));
  return ids;
}

function findPathToRoot(nodeId: string, employees: Employee[]): Set<string> {
  const empMap = new Map<string, Employee>();
  employees.forEach(e => empMap.set(e.id, e));
  const path = new Set<string>();
  let current = nodeId;
  let safety = 0;
  while (current && safety < 100) {
    path.add(current);
    const emp = empMap.get(current);
    if (!emp || !emp.managerId || emp.managerId === current) break;
    current = emp.managerId;
    safety++;
  }
  return path;
}

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
}

// Load saved charts from localStorage
function loadSavedCharts(): SavedChart[] {
  try {
    const raw = localStorage.getItem('orgviz-saved-charts');
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function persistCharts(charts: SavedChart[]) {
  try {
    // Strip imageData before saving to localStorage to prevent 5MB QuotaExceededError crash.
    // The image data remains in the in-memory Zustand store so PPT export still works within the active session.
    const stripped = charts.map(c => ({ ...c, imageData: undefined }));
    localStorage.setItem('orgviz-saved-charts', JSON.stringify(stripped));
  } catch (err) {
    console.error("Failed to save charts to localStorage:", err);
  }
}

export const useOrgStore = create<OrgStore>((set, get) => ({
  tree: null,
  employees: [],
  filterOptions: { departments: [], directReports: [], locations: [], clients: [], experience: [] },
  chartTitle: '',
  savedCharts: loadSavedCharts(),
  editingData: false,
  theme: (typeof window !== 'undefined' && localStorage.getItem('orgviz-theme') === 'light') ? 'light' : 'dark',
  activeFilters: { departments: [], directReports: [], locations: [], clients: [], experience: [] },
  searchQuery: '',
  selectedNode: null,
  expandedNodes: new Set<string>(),
  highlightedPath: new Set<string>(),
  orientation: 'vertical',
  captureChartFn: null,
  setCaptureChartFn: (fn) => set({ captureChartFn: fn }),

  setData: (data) => {
    const expanded = new Set<string>();
    if (data.tree) {
      expanded.add(data.tree.id);
      data.tree.children.forEach(child => {
        expanded.add(child.id);
      });
    }
    set({
      tree: data.tree,
      employees: data.employees,
      filterOptions: data.filters,
      activeFilters: { departments: [], directReports: [], locations: [], clients: [], experience: [] },
      searchQuery: '',
      selectedNode: null,
      expandedNodes: expanded,
      highlightedPath: new Set(),
      editingData: false,
    });
  },

  reset: () => set({
    tree: null,
    employees: [],
    filterOptions: { departments: [], directReports: [], locations: [], clients: [], experience: [] },
    activeFilters: { departments: [], directReports: [], locations: [], clients: [], experience: [] },
    searchQuery: '',
    selectedNode: null,
    expandedNodes: new Set(),
    highlightedPath: new Set(),
    chartTitle: '',
    editingData: false,
  }),

  setChartTitle: (title) => set({ chartTitle: title }),

  setOrientation: (orientation) => set({ orientation }),

  setEditingData: (editing) => set({ editingData: editing }),

  saveChart: (imageData?: string) => {
    const { tree, employees, filterOptions, chartTitle, savedCharts } = get();
    if (!tree) return;
    const chart: SavedChart = {
      id: generateId(),
      title: chartTitle || `Chart — ${new Date().toLocaleDateString()}`,
      tree,
      employees,
      filters: filterOptions,
      createdAt: Date.now(),
      imageData,
      // @ts-ignore - extending SavedChart type for orientation
      orientation: get().orientation
    };
    const updated = [chart, ...savedCharts];
    persistCharts(updated);
    set({ savedCharts: updated });
  },

  loadChart: (id) => {
    const { savedCharts } = get();
    const chart = savedCharts.find(c => c.id === id);
    if (!chart) return;
    const expanded = new Set<string>();
    expanded.add(chart.tree.id);
    chart.tree.children.forEach(child => expanded.add(child.id));
    set({
      tree: chart.tree,
      employees: chart.employees,
      filterOptions: chart.filters,
      chartTitle: chart.title,
      activeFilters: { departments: [], directReports: [], locations: [], clients: [], experience: [] },
      searchQuery: '',
      selectedNode: null,
      expandedNodes: expanded,
      highlightedPath: new Set(),
      editingData: false,
      // @ts-ignore - orientation might not be in old saved charts
      orientation: chart.orientation || 'vertical',
    });
  },

  deleteChart: (id) => {
    const { savedCharts } = get();
    const updated = savedCharts.filter(c => c.id !== id);
    persistCharts(updated);
    set({ savedCharts: updated });
  },

  newChart: () => {
    // Save current if exists, then reset
    const { tree } = get();
    if (tree) get().saveChart();
    get().reset();
  },

  setFilters: (filters) => set(state => ({
    activeFilters: { ...state.activeFilters, ...filters },
  })),

  setSearchQuery: (query) => {
    set({ searchQuery: query });
    if (query.trim()) {
      const { employees } = get();
      const matches = employees.filter(e =>
        e.name.toLowerCase().includes(query.toLowerCase())
      );
      const allPaths = new Set<string>();
      matches.forEach(m => {
        const path = findPathToRoot(m.id, employees);
        path.forEach(id => allPaths.add(id));
      });
      set(state => ({
        highlightedPath: allPaths,
        expandedNodes: new Set([...state.expandedNodes, ...allPaths]),
      }));
    } else {
      set({ highlightedPath: new Set() });
    }
  },

  setSelectedNode: (node) => set({ selectedNode: node }),

  toggleExpand: (nodeId) => set(state => {
    const next = new Set(state.expandedNodes);
    if (next.has(nodeId)) next.delete(nodeId);
    else next.add(nodeId);
    return { expandedNodes: next };
  }),

  expandAll: () => set(state => {
    if (!state.tree) return {};
    return { expandedNodes: new Set(collectAllIds(state.tree)) };
  }),

  collapseAll: () => set(state => {
    if (!state.tree) return {};
    return { expandedNodes: new Set([state.tree.id]) };
  }),

  highlightChain: (nodeId) => {
    const { employees } = get();
    set({ highlightedPath: findPathToRoot(nodeId, employees) });
  },

  clearHighlight: () => set({ highlightedPath: new Set() }),

  toggleTheme: () => set(state => {
    const next = state.theme === 'dark' ? 'light' : 'dark';
    localStorage.setItem('orgviz-theme', next);
    document.documentElement.classList.toggle('dark', next === 'dark');
    document.documentElement.classList.toggle('light', next === 'light');
    return { theme: next };
  }),
}));
