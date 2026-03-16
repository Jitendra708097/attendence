/**
 * @module RevenueChart
 * @description MRR trend line chart for the dashboard — last 6 months.
 *              Uses DarkLineChart with INR formatter.
 */

import DarkLineChart from '@components/charts/DarkLineChart.jsx';
import { formatMRR } from '@utils/formatters.js';
import { COLORS } from '@theme/colors.js';

export default function RevenueChart({ data = [], isLoading }) {
  return (
    <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">MRR Trend</h3>
          <p className="text-[#6b6b8a] text-xs">Last 6 months</p>
        </div>
        {data.length > 0 && (
          <span className="font-['JetBrains_Mono'] text-base text-[#ffaa00] font-bold">
            {formatMRR(data[data.length - 1]?.mrr || 0)}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="h-[220px] flex items-center justify-center">
          <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <DarkLineChart
          data={data}
          xKey="month"
          lines={[{ key: 'mrr', color: COLORS.chart.amber, label: 'MRR' }]}
          height={220}
          yFormatter={(v) => formatMRR(v)}
          tooltipFormatter={(v) => [formatMRR(v), 'MRR']}
        />
      )}
    </div>
  );
}
