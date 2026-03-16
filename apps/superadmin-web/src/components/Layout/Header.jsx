/**
 * @module Header
 * @description Top bar with live clock, platform status, and Cmd+K search hint.
 *              Shows impersonation warning banner when session is active.
 */

import { useState, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { openCommandSearch } from '@store/uiSlice.js';
import { SearchOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function Header({ title }) {
  const dispatch = useDispatch();
  const [now, setNow] = useState(dayjs());

  useEffect(() => {
    const t = setInterval(() => setNow(dayjs()), 1000);
    return () => clearInterval(t);
  }, []);

  return (
    <header className="h-14 flex items-center justify-between px-6
                        border-b border-[#1e1e35] bg-[#0a0a14] flex-shrink-0">
      {/* Left — page title */}
      <div className="flex items-center gap-3">
        <h2 className="text-[#e8e8f0] text-sm font-sans font-medium">{title}</h2>
      </div>

      {/* Right — clock + search */}
      <div className="flex items-center gap-4">
        {/* Cmd+K hint */}
        <button
          onClick={() => dispatch(openCommandSearch())}
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md
                     bg-[#161625] border border-[#1e1e35] text-[#6b6b8a]
                     hover:text-[#e8e8f0] hover:border-[#00d4ff]/30
                     transition-colors text-xs font-sans"
        >
          <SearchOutlined className="text-xs" />
          <span>Search orgs</span>
          <kbd className="flex items-center gap-0.5 text-[10px] font-mono">
            <span>⌘K</span>
          </kbd>
        </button>

        {/* Live clock */}
        <div className="flex flex-col items-end">
          <span className="font-['JetBrains_Mono'] text-sm text-[#00d4ff] leading-none">
            {now.format('HH:mm:ss')}
          </span>
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#6b6b8a] leading-none mt-0.5">
            {now.format('DD MMM YYYY')}
          </span>
        </div>

        {/* Online indicator */}
        <div className="flex items-center gap-1.5">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00ff88] opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00ff88]" />
          </span>
        </div>
      </div>
    </header>
  );
}
