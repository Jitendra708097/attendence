/**
 * @module StatCard
 * @description Reusable dark stat card with monospaced animated value display.
 *              Used in dashboard and revenue pages for all key metrics.
 * Props: label, value, unit, trend, trendValue, accentColor, icon, prefix, subtitle
 */

import { useCountUp } from '@hooks/useCountUp.js';

const COLOR_MAP = {
  cyan:   'text-[#00d4ff]',
  green:  'text-[#00ff88]',
  red:    'text-[#ff3366]',
  amber:  'text-[#ffaa00]',
  purple: 'text-[#a855f7]',
};

const BORDER_MAP = {
  cyan:   'hover:border-[#00d4ff]/40 hover:shadow-[0_0_20px_rgba(0,212,255,0.12)]',
  green:  'hover:border-[#00ff88]/40 hover:shadow-[0_0_20px_rgba(0,255,136,0.12)]',
  red:    'hover:border-[#ff3366]/40 hover:shadow-[0_0_20px_rgba(255,51,102,0.12)]',
  amber:  'hover:border-[#ffaa00]/40 hover:shadow-[0_0_20px_rgba(255,170,0,0.12)]',
  purple: 'hover:border-[#a855f7]/40 hover:shadow-[0_0_20px_rgba(168,85,247,0.12)]',
};

const ICON_BG_MAP = {
  cyan:   'bg-[#00d4ff]/10',
  green:  'bg-[#00ff88]/10',
  red:    'bg-[#ff3366]/10',
  amber:  'bg-[#ffaa00]/10',
  purple: 'bg-[#a855f7]/10',
};

export default function StatCard({
  label,
  value,
  unit       = '',
  prefix     = '',
  trend      = null,      // 'up' | 'down' | null
  trendValue = '',
  accentColor = 'cyan',
  icon        = null,
  subtitle    = null,
  animate     = true,
  rawValue    = null,     // pass pre-formatted string to skip animation
}) {
  const numericValue = typeof value === 'number' ? value : 0;
  const animatedNum  = useCountUp(animate && typeof value === 'number' ? numericValue : 0, 900);
  const displayValue = rawValue || (typeof value === 'number' ? animatedNum : value);

  return (
    <div
      className={`
        bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5
        transition-all duration-300 cursor-default group
        ${BORDER_MAP[accentColor]}
      `}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[#6b6b8a] text-[10px] font-sans uppercase tracking-[0.15em]">
          {label}
        </span>
        {icon && (
          <span className={`
            w-7 h-7 rounded-md flex items-center justify-center text-sm
            ${ICON_BG_MAP[accentColor]} ${COLOR_MAP[accentColor]}
            transition-transform duration-200 group-hover:scale-110
          `}>
            {icon}
          </span>
        )}
      </div>

      {/* Value */}
      <div className="flex items-end gap-1.5">
        {prefix && (
          <span className={`font-['JetBrains_Mono'] text-xl font-semibold mb-0.5 ${COLOR_MAP[accentColor]}`}>
            {prefix}
          </span>
        )}
        <span className={`
          font-['JetBrains_Mono'] text-[2rem] font-bold leading-none
          animate-count-up ${COLOR_MAP[accentColor]}
        `}>
          {displayValue}
        </span>
        {unit && (
          <span className="text-[#6b6b8a] text-xs mb-1 font-sans">{unit}</span>
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-[#6b6b8a] text-[11px] mt-1 font-sans">{subtitle}</p>
      )}

      {/* Trend */}
      {trend && (
        <div className={`
          mt-2.5 text-[11px] font-['JetBrains_Mono'] flex items-center gap-1
          ${trend === 'up' ? 'text-[#00ff88]' : 'text-[#ff3366]'}
        `}>
          <span>{trend === 'up' ? '↑' : '↓'}</span>
          <span>{trendValue}</span>
        </div>
      )}
    </div>
  );
}
