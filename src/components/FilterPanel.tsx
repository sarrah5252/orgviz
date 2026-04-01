import React, { useState, useRef, useEffect } from 'react';
import { useOrgStore } from '../store/useOrgStore';

interface MultiSelectProps {
  label: string;
  options: string[];
  selected: string[];
  onChange: (values: string[]) => void;
  colorClass?: string;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ label, options, selected, onChange, colorClass }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggle = (val: string) => {
    onChange(
      selected.includes(val)
        ? selected.filter(s => s !== val)
        : [...selected, val]
    );
  };

  const clearAll = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange([]);
  };

  return (
    <div className="filter-dropdown" ref={ref}>
      <button
        className={`filter-trigger ${selected.length > 0 ? 'filter-trigger--active' : ''}`}
        onClick={() => setOpen(!open)}
      >
        <span className="truncate">{label}</span>
        {selected.length > 0 && (
          <span className="flex items-center gap-1">
            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${colorClass || 'bg-accent-500/20 text-accent-300'}`}>
              {selected.length}
            </span>
            <span className="text-surface-500 hover:text-surface-300 cursor-pointer text-xs" onClick={clearAll}>✕</span>
          </span>
        )}
        <svg className={`w-3.5 h-3.5 text-surface-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
        </svg>
      </button>

      {open && (
        <div className="filter-menu animate-fade-in">
          {options.length === 0 ? (
            <div className="px-3 py-2 text-xs text-surface-500">No options</div>
          ) : (
            options.map(opt => (
              <label key={opt} className={`filter-option ${selected.includes(opt) ? 'filter-option--selected' : ''}`}>
                <input
                  type="checkbox"
                  checked={selected.includes(opt)}
                  onChange={() => toggle(opt)}
                  className="sr-only"
                />
                <span className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${
                  selected.includes(opt) ? 'bg-accent-500 border-accent-500' : 'border-surface-600'
                }`}>
                  {selected.includes(opt) && (
                    <svg className="w-2.5 h-2.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                    </svg>
                  )}
                </span>
                <span className="truncate text-xs">{opt}</span>
              </label>
            ))
          )}
        </div>
      )}
    </div>
  );
};

export const FilterPanel: React.FC = () => {
  const filterOptions = useOrgStore(s => s.filterOptions);
  const activeFilters = useOrgStore(s => s.activeFilters);
  const setFilters = useOrgStore(s => s.setFilters);

  const hasActiveFilters = Object.values(activeFilters).some(arr => arr.length > 0);

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <MultiSelect
        label="Department"
        options={filterOptions.departments}
        selected={activeFilters.departments}
        onChange={(v) => setFilters({ departments: v })}
        colorClass="bg-violet-500/20 text-violet-300"
      />
      <MultiSelect
        label="Job Title"
        options={filterOptions.titles}
        selected={activeFilters.titles}
        onChange={(v) => setFilters({ titles: v })}
        colorClass="bg-blue-500/20 text-blue-300"
      />
      <MultiSelect
        label="Location"
        options={filterOptions.locations}
        selected={activeFilters.locations}
        onChange={(v) => setFilters({ locations: v })}
        colorClass="bg-emerald-500/20 text-emerald-300"
      />
      <MultiSelect
        label="Client"
        options={filterOptions.clients}
        selected={activeFilters.clients}
        onChange={(v) => setFilters({ clients: v })}
        colorClass="bg-amber-500/20 text-amber-300"
      />

      {hasActiveFilters && (
        <button
          onClick={() => setFilters({ departments: [], titles: [], locations: [], clients: [] })}
          className="px-2 py-1 rounded-lg text-xs text-red-400 hover:text-red-300 hover:bg-red-500/10 transition-colors"
        >
          Clear all
        </button>
      )}
    </div>
  );
};
