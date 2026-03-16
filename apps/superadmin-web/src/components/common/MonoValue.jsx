/**
 * @module MonoValue
 * @description JetBrains Mono number/data display component.
 *              Used for all numeric data: IDs, counts, currency, timestamps.
 * Props: value, color, size, dim
 */

const SIZE_MAP = {
  xs:  'text-[11px]',
  sm:  'text-xs',
  md:  'text-sm',
  lg:  'text-base',
  xl:  'text-lg',
  '2xl': 'text-2xl',
  '3xl': 'text-3xl',
};

const COLOR_MAP = {
  cyan:   'text-[#00d4ff]',
  green:  'text-[#00ff88]',
  red:    'text-[#ff3366]',
  amber:  'text-[#ffaa00]',
  purple: 'text-[#a855f7]',
  muted:  'text-[#6b6b8a]',
  white:  'text-[#e8e8f0]',
};

export default function MonoValue({ value, color = 'cyan', size = 'sm', className = '' }) {
  return (
    <span
      className={`
        font-['JetBrains_Mono'] font-medium
        ${SIZE_MAP[size] || SIZE_MAP.sm}
        ${COLOR_MAP[color] || COLOR_MAP.cyan}
        ${className}
      `}
    >
      {value ?? '—'}
    </span>
  );
}
