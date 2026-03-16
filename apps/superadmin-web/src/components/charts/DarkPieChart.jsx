/**
 * @module DarkPieChart
 * @description Recharts donut/pie chart pre-configured with dark theme.
 */

import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
} from 'recharts';
import { COLORS, CHART_TOOLTIP_STYLE } from '@theme/colors.js';

const DEFAULT_COLORS = [
  COLORS.chart.cyan,
  COLORS.chart.green,
  COLORS.chart.amber,
  COLORS.chart.purple,
  COLORS.chart.red,
];

const RADIAN = Math.PI / 180;

function CustomLabel({ cx, cy, midAngle, innerRadius, outerRadius, percent }) {
  if (percent < 0.05) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x} y={y}
      fill="#e8e8f0"
      textAnchor="middle"
      dominantBaseline="central"
      style={{ fontSize: '11px', fontFamily: 'JetBrains Mono', fontWeight: 600 }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

export default function DarkPieChart({
  data         = [],
  nameKey      = 'name',
  valueKey     = 'value',
  colors       = DEFAULT_COLORS,
  height       = 240,
  innerRadius  = 55,
  outerRadius  = 90,
  showLegend   = true,
  showLabel    = true,
  tooltipFormatter = (v) => v,
}) {
  return (
    <ResponsiveContainer width="100%" height={height}>
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          dataKey={valueKey}
          nameKey={nameKey}
          paddingAngle={2}
          labelLine={false}
          label={showLabel ? CustomLabel : false}
        >
          {data.map((entry, index) => (
            <Cell
              key={`cell-${index}`}
              fill={colors[index % colors.length]}
              stroke="transparent"
            />
          ))}
        </Pie>
        <Tooltip
          contentStyle={CHART_TOOLTIP_STYLE}
          formatter={tooltipFormatter}
        />
        {showLegend && (
          <Legend
            iconType="circle"
            iconSize={8}
            wrapperStyle={{
              fontSize:   '11px',
              fontFamily: 'JetBrains Mono',
              color:      COLORS.chart.text,
              paddingTop: '8px',
            }}
          />
        )}
      </PieChart>
    </ResponsiveContainer>
  );
}
