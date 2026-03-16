/**
 * @module DarkBarChart
 * @description Recharts bar chart pre-configured with dark command center theme.
 */

import {
  ResponsiveContainer, BarChart, Bar,
  CartesianGrid, XAxis, YAxis, Tooltip, Legend, Cell,
} from 'recharts';
import { COLORS, CHART_TOOLTIP_STYLE } from '@theme/colors.js';

export default function DarkBarChart({
  data          = [],
  bars          = [{ key: 'value', color: COLORS.chart.cyan, label: 'Value' }],
  xKey          = 'label',
  height        = 240,
  showGrid      = true,
  showLegend    = false,
  yFormatter    = (v) => v,
  xFormatter    = (v) => v,
  tooltipFormatter = (v) => v,
  radius        = [3, 3, 0, 0],
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <BarChart data={data} margin={{ top: 4, right: 8, bottom: 0, left: -8 }} barCategoryGap="30%">
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
          cursor={{ fill: 'rgba(255,255,255,0.03)' }}
        />
        {showLegend && (
          <Legend
            wrapperStyle={{ fontSize: '11px', fontFamily: 'JetBrains Mono', color: COLORS.chart.text }}
          />
        )}
        {bars.map(({ key, color, label }) => (
          <Bar key={key} dataKey={key} name={label} fill={color || COLORS.chart.cyan} radius={radius} />
        ))}
      </BarChart>
    </ResponsiveContainer>
  );
}
