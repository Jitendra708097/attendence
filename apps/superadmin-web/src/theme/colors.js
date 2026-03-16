/**
 * @module colors
 * @description Brand color constants for AttendEase Super Admin.
 *              Import these in JS files; use Tailwind classes in JSX.
 */

export const COLORS = {
  // Backgrounds
  bgBase:     '#080810',
  bgSurface:  '#0f0f1a',
  bgElevated: '#161625',
  bgBorder:   '#1e1e35',

  // Accents
  cyan:   '#00d4ff',
  green:  '#00ff88',
  red:    '#ff3366',
  amber:  '#ffaa00',
  purple: '#a855f7',

  // Text
  textPrimary:   '#e8e8f0',
  textSecondary: '#6b6b8a',

  // Chart colors (Recharts)
  chart: {
    cyan:   '#00d4ff',
    green:  '#00ff88',
    red:    '#ff3366',
    amber:  '#ffaa00',
    purple: '#a855f7',
    grid:   '#1e1e35',
    text:   '#6b6b8a',
  },
};

export const CHART_TOOLTIP_STYLE = {
  background:   '#161625',
  border:       '1px solid #1e1e35',
  borderRadius: '6px',
  color:        '#e8e8f0',
  fontFamily:   'JetBrains Mono',
  fontSize:     '12px',
};
