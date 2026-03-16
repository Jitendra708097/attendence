/**
 * @module AnalyticsPage
 * @description Platform analytics — growth, usage, and retention charts.
 *              New orgs per week, employee growth, check-ins, cohort retention.
 */

import { useGetGrowthMetricsQuery, useGetUsageMetricsQuery, useGetRetentionCohortsQuery } from '@store/api/analyticsApi.js';
import { POLL_DASHBOARD } from '@utils/constants.js';
import { formatNumber, formatPercent } from '@utils/formatters.js';
import { COLORS } from '@theme/colors.js';

import PageHeader   from '@components/common/PageHeader.jsx';
import DarkLineChart from '@components/charts/DarkLineChart.jsx';
import DarkBarChart  from '@components/charts/DarkBarChart.jsx';
import DarkPieChart  from '@components/charts/DarkPieChart.jsx';
import EmptyState    from '@components/common/EmptyState.jsx';

export default function AnalyticsPage() {
  const { data: growthData,    isLoading: growthLoading    } = useGetGrowthMetricsQuery({ weeks: 12 });
  const { data: usageData,     isLoading: usageLoading     } = useGetUsageMetricsQuery({ days: 30 });
  const { data: retentionData, isLoading: retentionLoading } = useGetRetentionCohortsQuery();

  const growth    = growthData?.data    || {};
  const usage     = usageData?.data     || {};
  const retention = retentionData?.data || { cohorts: [] };

  const faceData = [
    { name: 'TensorFlow (Local)', value: usage.localFacePercent || 92 },
    { name: 'AWS Rekognition',    value: usage.cloudFacePercent || 8  },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Analytics" subtitle="Platform growth, usage, and retention metrics" />

      {/* Growth section */}
      <div className="mb-2">
        <h3 className="text-[#6b6b8a] text-[10px] uppercase tracking-[0.15em] mb-3">Growth</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5">
          <div className="mb-4">
            <h4 className="text-[#e8e8f0] text-sm font-sans font-medium">New Orgs per Week</h4>
            <p className="text-[#6b6b8a] text-xs">Last 12 weeks</p>
          </div>
          <DarkBarChart
            data={growth.newOrgsWeekly || []}
            xKey="week"
            bars={[{ key: 'count', color: COLORS.chart.purple, label: 'New Orgs' }]}
            height={200}
            tooltipFormatter={(v) => [v, 'New Orgs']}
          />
        </div>
        <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5">
          <div className="mb-4">
            <h4 className="text-[#e8e8f0] text-sm font-sans font-medium">Employee Growth</h4>
            <p className="text-[#6b6b8a] text-xs">Total employees over 6 months</p>
          </div>
          <DarkLineChart
            data={growth.employeeGrowth || []}
            xKey="month"
            lines={[{ key: 'total', color: COLORS.chart.cyan, label: 'Employees' }]}
            height={200}
            yFormatter={(v) => formatNumber(v)}
            tooltipFormatter={(v) => [formatNumber(v), 'Employees']}
          />
        </div>
      </div>

      {/* Usage section */}
      <div className="mb-2">
        <h3 className="text-[#6b6b8a] text-[10px] uppercase tracking-[0.15em] mb-3">Usage</h3>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        <div className="lg:col-span-2 bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5">
          <div className="mb-4">
            <h4 className="text-[#e8e8f0] text-sm font-sans font-medium">Check-ins per Day</h4>
            <p className="text-[#6b6b8a] text-xs">Last 30 days</p>
          </div>
          <DarkBarChart
            data={usage.checkinsDaily || []}
            xKey="date"
            bars={[{ key: 'count', color: COLORS.chart.green, label: 'Check-ins' }]}
            height={200}
            tooltipFormatter={(v) => [formatNumber(v), 'Check-ins']}
          />
        </div>
        <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5">
          <div className="mb-4">
            <h4 className="text-[#e8e8f0] text-sm font-sans font-medium">Face Recognition Split</h4>
            <p className="text-[#6b6b8a] text-xs">Local vs cloud resolves</p>
          </div>
          <DarkPieChart
            data={faceData}
            colors={[COLORS.chart.cyan, COLORS.chart.purple]}
            height={200}
            tooltipFormatter={(v) => [`${v}%`, '']}
          />
          <div className="mt-3 space-y-1.5">
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6b6b8a]">TensorFlow (Local)</span>
              <span className="font-['JetBrains_Mono'] text-[#00d4ff]">{usage.localFacePercent || 92}%</span>
            </div>
            <div className="flex justify-between text-[11px]">
              <span className="text-[#6b6b8a]">AWS Rekognition</span>
              <span className="font-['JetBrains_Mono'] text-[#a855f7]">{usage.cloudFacePercent || 8}%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Retention cohort table */}
      <div className="mb-2">
        <h3 className="text-[#6b6b8a] text-[10px] uppercase tracking-[0.15em] mb-3">Retention</h3>
      </div>
      <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e35]">
          <h4 className="text-[#e8e8f0] text-sm font-sans font-medium">Monthly Cohort Retention</h4>
          <p className="text-[#6b6b8a] text-xs">% of orgs from signup month still active</p>
        </div>
        {retentionLoading ? (
          <div className="p-6 space-y-2">
            {[1,2,3,4].map((i) => (
              <div key={i} className="h-8 bg-[#161625] rounded animate-pulse" />
            ))}
          </div>
        ) : retention.cohorts.length === 0 ? (
          <EmptyState icon="📊" title="No retention data yet" description="Data will appear after 2+ months of operation" />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs font-['JetBrains_Mono']">
              <thead>
                <tr className="border-b border-[#1e1e35]">
                  <th className="text-left px-5 py-3 text-[#6b6b8a] font-normal">Cohort</th>
                  <th className="text-right px-3 py-3 text-[#6b6b8a] font-normal">Size</th>
                  {['M1','M2','M3','M4','M5','M6'].map((m) => (
                    <th key={m} className="text-right px-3 py-3 text-[#6b6b8a] font-normal">{m}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {retention.cohorts.map((cohort) => (
                  <tr key={cohort.month} className="border-b border-[#1e1e35] last:border-0 hover:bg-[#161625]">
                    <td className="px-5 py-2.5 text-[#e8e8f0]">{cohort.month}</td>
                    <td className="px-3 py-2.5 text-right text-[#6b6b8a]">{cohort.size}</td>
                    {['m1','m2','m3','m4','m5','m6'].map((mk) => {
                      const val = cohort[mk];
                      const getColor = (v) => {
                        if (v == null) return 'text-[#1e1e35]';
                        if (v >= 80) return 'text-[#00ff88]';
                        if (v >= 60) return 'text-[#ffaa00]';
                        return 'text-[#ff3366]';
                      };
                      return (
                        <td key={mk} className={`px-3 py-2.5 text-right ${getColor(val)}`}>
                          {val != null ? `${val}%` : '—'}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
