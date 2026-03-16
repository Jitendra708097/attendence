/**
 * @module DarkLineChart
 * @description Recharts line chart pre-configured with dark command center theme.
 *              Accepts data array and dataKey props.
 */

import {
  ResponsiveContainer, LineChart, Line,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend,
} from 'recharts';
import { COLORS, CHART_TOOLTIP_STYLE } from '@theme/colors.js';

export default function DarkLineChart({
  data        = [],
  lines       = [{ key: 'value', color: COLORS.chart.cyan, label: 'Value' }],
  xKey        = 'date',
  height      = 260,
  showGrid    = true,
  showLegend  = false,
  yFormatter  = (v) => v,
  xFormatter  = (v) => v,
  tooltipFormatter = (v) => v,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <LineChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
        {showGrid && (
          <CartesianGrid strokeDasharray="3 3" stroke={COLORS.chart.grid} vertical={false} />
        )}
        <XAxis
          dataKey={xKey}
          stroke={COLORS.chart.text}
          tick={{ fill: COLORS.chart.text, fontSize: 11, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={xFormatter}
        />
        <YAxis
          stroke={COLORS.chart.text}
          tick={{ fill: COLORS.chart.text, fontSize: 11, fontFamily: 'JetBrains Mono' }}
          tickLine={false}
          axisLine={false}
          tickFormatter={yFormatter}
          width={52}
        />
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          labelStyle={{ color: COLORS.textPrimary, marginBottom: 4 }}
          formatter={tooltipFormatter}
          cursor={{ stroke: '#1e1e35', strokeWidth: 1 }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: COLORS.chart.text }}
          />
        )}
        {lines.map(({ key, color, label }) => (
          <Line
            key={key}
            type="monotone"
            dataKey={key}
            name={label}
            stroke={color || COLORS.chart.cyan}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: color || COLORS.chart.cyan, strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
