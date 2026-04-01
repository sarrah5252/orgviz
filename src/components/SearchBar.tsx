import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useOrgStore } from '../store/useOrgStore';

export const SearchBar: React.FC = () => {
  const setSearchQuery = useOrgStore(s => s.setSearchQuery);
  const searchQuery = useOrgStore(s => s.searchQuery);
  const employees = useOrgStore(s => s.employees);
  const [inputVal, setInputVal] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  // Sync from store (e.g. on reset)
  useEffect(() => {
    if (!searchQuery) setInputVal('');
  }, [searchQuery]);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInputVal(val);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setSearchQuery(val);
    }, 250);
  }, [setSearchQuery]);

  const clearSearch = useCallback(() => {
    setInputVal('');
    setSearchQuery('');
  }, [setSearchQuery]);

  const matchCount = inputVal.trim()
    ? employees.filter(e => e.name.toLowerCase().includes(inputVal.toLowerCase())).length
    : 0;

  return (
    <div className="relative">
      <div className="flex items-center gap-2 bg-surface-800 border border-surface-700 rounded-lg px-3 py-2 
        focus-within:border-surface-500 transition-colors">
        <svg className="w-4 h-4 text-surface-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
        </svg>
        <input
          type="text"
          value={inputVal}
          onChange={handleChange}
          placeholder="Search by name…"
          className="bg-transparent text-sm text-white placeholder-surface-500 outline-none w-40"
          id="search-input"
        />
        {inputVal && (
          <>
            {matchCount > 0 && (
              <span className="text-xs text-surface-400 flex-shrink-0">
                {matchCount} found
              </span>
            )}
            <button onClick={clearSearch} className="text-surface-400 hover:text-surface-300 flex-shrink-0">
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </>
        )}
      </div>
    </div>
  );
};
