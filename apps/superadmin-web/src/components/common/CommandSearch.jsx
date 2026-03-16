/**
 * @module CommandSearch
 * @description Global Cmd+K command search palette.
 *              Searches orgs by name/email. Keyboard navigable.
 *              Results open org detail or navigate to page.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { closeCommandSearch, selectCommandSearchOpen, openCommandSearch } from '@store/uiSlice.js';
import { useCommandSearch } from '@hooks/useKeyboard.js';
import { useDebounce }      from '@hooks/useDebounce.js';
import { useSearchOrgsQuery } from '@store/api/orgApi.js';
import OrgStatusBadge from './OrgStatusBadge.jsx';
import PlanBadge      from './PlanBadge.jsx';

export default function CommandSearch() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const isOpen    = useSelector(selectCommandSearchOpen);
  const [query, setQuery]         = useState('');
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef(null);
  const debouncedQ = useDebounce(query, 250);

  const { data, isFetching } = useSearchOrgsQuery(
    { q: debouncedQ },
    { skip: !isOpen || debouncedQ.length < 2 }
  );

  const results = data?.data?.orgs || [];

  // Cmd+K to open
  useCommandSearch(useCallback(() => dispatch(openCommandSearch()), [dispatch]));

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setActiveIdx(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Keyboard nav
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[activeIdx]) {
      selectOrg(results[activeIdx]);
    } else if (e.key === 'Escape') {
      dispatch(closeCommandSearch());
    }
  };

  const selectOrg = (org) => {
    dispatch(closeCommandSearch());
    navigate(`/organisations?id=${org.id}`);
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh]"
      onClick={() => dispatch(closeCommandSearch())}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-[#080810]/80 backdrop-blur-sm" />

      {/* Panel */}
      <div
        className="relative w-full max-w-xl mx-4 bg-[#0f0f1a] border border-[#1e1e35]
                   rounded-xl shadow-[0_24px_64px_rgba(0,0,0,0.8)] overflow-hidden
                   animate-slide-in"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1e1e35]">
          <svg className="w-4 h-4 text-[#6b6b8a] flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => { setQuery(e.target.value); setActiveIdx(0); }}
            onKeyDown={handleKeyDown}
            placeholder="Search organisations by name or email..."
            className="flex-1 bg-transparent text-[#e8e8f0] text-sm font-sans
                       placeholder-[#6b6b8a] outline-none"
          />
          {isFetching && (
            <div className="w-4 h-4 border border-cyan border-t-transparent rounded-full animate-spin flex-shrink-0" />
          )}
          <kbd className="hidden sm:flex items-center gap-1 px-1.5 py-0.5 bg-[#161625]
                          border border-[#1e1e35] rounded text-[10px] font-mono
                          text-[#6b6b8a] flex-shrink-0">
            ESC
          </kbd>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="max-h-80 overflow-y-auto py-1">
            {results.map((org, idx) => (
              <button
                key={org.id}
                onClick={() => selectOrg(org)}
                className={`
                  w-full text-left px-4 py-2.5 flex items-center gap-3
                  transition-colors duration-100
                  ${idx === activeIdx ? 'bg-[#161625]' : 'hover:bg-[#161625]/60'}
                `}
              >
                {/* Org avatar */}
                <div className="w-7 h-7 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/20
                                flex items-center justify-center text-[#00d4ff] text-xs
                                font-['JetBrains_Mono'] font-bold flex-shrink-0">
                  {org.name?.[0]?.toUpperCase() || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[#e8e8f0] text-sm font-sans truncate">{org.name}</span>
                    <OrgStatusBadge status={org.status} />
                    <PlanBadge plan={org.plan} />
                  </div>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-[#6b6b8a] text-xs font-['JetBrains_Mono']">
                      @{org.slug}
                    </span>
                    <span className="text-[#6b6b8a] text-xs">
                      {org.employeeCount} employees
                    </span>
                  </div>
                </div>
                {idx === activeIdx && (
                  <kbd className="text-[#6b6b8a] text-[10px] font-mono flex-shrink-0">↵</kbd>
                )}
              </button>
            ))}
          </div>
        )}

        {/* Empty state */}
        {query.length >= 2 && !isFetching && results.length === 0 && (
          <div className="py-8 text-center text-[#6b6b8a] text-sm font-sans">
            No organisations found for &ldquo;{query}&rdquo;
          </div>
        )}

        {/* Footer hint */}
        <div className="px-4 py-2 border-t border-[#1e1e35] flex items-center gap-4">
          <span className="text-[#6b6b8a] text-[10px] font-mono">↑↓ navigate</span>
          <span className="text-[#6b6b8a] text-[10px] font-mono">↵ select</span>
          <span className="text-[#6b6b8a] text-[10px] font-mono">esc close</span>
        </div>
      </div>
    </div>
  );
}
