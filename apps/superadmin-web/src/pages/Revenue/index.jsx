/**
 * @module RevenuePage
 * @description Full revenue dashboard — MRR, ARR, plan breakdown, churn, invoices.
 *              All values in INR. Charts: area MRR growth, pie plan distribution.
 */

import { Table } from 'antd';
import {
  useGetRevenueSummaryQuery, useGetMRRHistoryQuery,
  useGetPlanBreakdownQuery, useGetChurnedOrgsQuery,
  useGetAllInvoicesQuery, useGetTopOrgsByMRRQuery,
} from '@store/api/billingApi.js';
import { POLL_DASHBOARD, PLAN_COLORS } from '@utils/constants.js';
import { formatINR, formatMRR, formatDate, formatNumber, formatPercent } from '@utils/formatters.js';

import PageHeader  from '@components/common/PageHeader.jsx';
import StatCard    from '@components/common/StatCard.jsx';
import MonoValue   from '@components/common/MonoValue.jsx';
import PlanBadge   from '@components/common/PlanBadge.jsx';
import DarkPieChart from '@components/charts/DarkPieChart.jsx';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip
} from 'recharts';
import { COLORS, CHART_TOOLTIP_STYLE } from '@theme/colors.js';

export default function RevenuePage() {
  const { data: summaryData, isLoading: summaryLoading } =
    useGetRevenueSummaryQuery(undefined, { pollingInterval: POLL_DASHBOARD });

  const { data: mrrData,   isLoading: mrrLoading   } = useGetMRRHistoryQuery({ months: 12 });
  const { data: planData,  isLoading: planLoading   } = useGetPlanBreakdownQuery();
  const { data: churnData, isLoading: churnLoading  } = useGetChurnedOrgsQuery({ limit: 10 });
  const { data: topData,   isLoading: topLoading    } = useGetTopOrgsByMRRQuery({ limit: 10 });
  const { data: invoiceData, isLoading: invoiceLoading } = useGetAllInvoicesQuery({ page: 1, limit: 20 });

  const summary  = summaryData?.data  || {};
  const mrrHist  = mrrData?.data      || [];
  const plans    = planData?.data      || [];
  const churned  = churnData?.data?.orgs    || [];
  const topOrgs  = topData?.data?.orgs      || [];
  const invoices = invoiceData?.data?.invoices || [];

  const pieData  = plans.map((p) => ({
    name:  p.plan,
    value: p.revenue,
    count: p.count,
  }));

  const pieColors = plans.map((p) => PLAN_COLORS[p.plan]?.text || '#6b6b8a');

  const topOrgCols = [
    { title: '#',    dataIndex: 'rank',         width: 36, render: (v) => <MonoValue value={v} color="muted" size="xs" /> },
    { title: 'Org',  dataIndex: 'name',         render: (v) => <span className="text-xs text-[#e8e8f0]">{v}</span> },
    { title: 'Plan', dataIndex: 'plan',         width: 90, render: (v) => <PlanBadge plan={v} /> },
    { title: 'Emps', dataIndex: 'employeeCount',width: 60, align: 'right',
      render: (v) => <MonoValue value={formatNumber(v)} color="muted" size="xs" /> },
    { title: 'MRR',  dataIndex: 'mrr',          width: 110, align: 'right',
      render: (v) => <span className="font-['JetBrains_Mono'] text-xs text-[#ffaa00]">{formatINR(v)}</span> },
  ];

  const churnCols = [
    { title: 'Org',      dataIndex: 'name',      render: (v) => <span className="text-xs text-[#e8e8f0]">{v}</span> },
    { title: 'Lost MRR', dataIndex: 'mrr',       width: 100, align: 'right',
      render: (v) => <span className="font-['JetBrains_Mono'] text-xs text-[#ff3366]">-{formatINR(v)}</span> },
    { title: 'Churned',  dataIndex: 'cancelledAt', width: 100,
      render: (v) => <MonoValue value={formatDate(v)} color="muted" size="xs" /> },
  ];

  const invoiceCols = [
    { title: 'Invoice',  dataIndex: 'invoiceNo',    width: 110, render: (v) => <MonoValue value={v} color="cyan" size="xs" /> },
    { title: 'Org',      dataIndex: 'orgName',      render: (v) => <span className="text-xs text-[#e8e8f0]">{v}</span> },
    { title: 'Date',     dataIndex: 'date',         width: 100, render: (v) => <MonoValue value={formatDate(v)} color="muted" size="xs" /> },
    { title: 'Amount',   dataIndex: 'amount',       width: 110, align: 'right',
      render: (v) => <span className="font-['JetBrains_Mono'] text-xs text-[#ffaa00]">{formatINR(v)}</span> },
    { title: 'Status',   dataIndex: 'status',       width: 80,
      render: (v) => (
        <span className={`text-[10px] font-['JetBrains_Mono'] uppercase ${v === 'paid' ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>{v}</span>
      )},
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader title="Revenue" subtitle="Platform-wide billing and MRR data" />

      {/* Stats row */}
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
        {[
          { label: 'MRR',              rawValue: formatMRR(summary.mrr), accentColor: 'amber'  },
          { label: 'ARR',              rawValue: formatMRR((summary.mrr || 0) * 12), accentColor: 'amber' },
          { label: 'Paying Orgs',      value: summary.payingOrgs,          accentColor: 'green'  },
          { label: 'ARPU',             rawValue: formatMRR(summary.arpu),  accentColor: 'cyan'   },
          { label: 'New Rev MTD',      rawValue: formatMRR(summary.newRevMTD), accentColor: 'green' },
          { label: 'Churned Rev MTD',  rawValue: formatMRR(summary.churnedRevMTD), accentColor: 'red'  },
        ].map((c) => (
          <StatCard
            key={c.label}
            label={c.label}
            value={summaryLoading ? 0 : (c.value || 0)}
            rawValue={summaryLoading ? null : c.rawValue}
            accentColor={c.accentColor}
            animate={!summaryLoading && !c.rawValue}
          />
        ))}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* MRR area chart */}
        <div className="lg:col-span-2 bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">MRR Growth</h3>
            <p className="text-[#6b6b8a] text-xs">Last 12 months</p>
          </div>
          {mrrLoading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-amber border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={210}>
              <AreaChart data={mrrHist} margin={{ top: 4, right: 8, bottom: 0, left: -8 }}>
                <defs>
                  <linearGradient id="mrrGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%"  stopColor="#ffaa00" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ffaa00" stopOpacity={0}    />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e1e35" vertical={false} />
                <XAxis dataKey="month" stroke="#6b6b8a" tick={{ fill: '#6b6b8a', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} />
                <YAxis stroke="#6b6b8a" tick={{ fill: '#6b6b8a', fontSize: 11, fontFamily: 'JetBrains Mono' }} tickLine={false} axisLine={false} tickFormatter={formatMRR} width={64} />
                <Tooltip contentStyle={CHART_TOOLTIP_STYLE} formatter={(v) => [formatMRR(v), 'MRR']} />
                <Area type="monotone" dataKey="mrr" stroke="#ffaa00" strokeWidth={2} fill="url(#mrrGrad)" dot={false} activeDot={{ r: 4, fill: '#ffaa00', strokeWidth: 0 }} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Plan breakdown pie */}
        <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5">
          <div className="mb-4">
            <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">Revenue by Plan</h3>
            <p className="text-[#6b6b8a] text-xs">Current distribution</p>
          </div>
          {planLoading ? (
            <div className="h-52 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-cyan border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <DarkPieChart
              data={pieData}
              colors={pieColors}
              height={210}
              tooltipFormatter={(v, name) => [formatINR(v), name]}
            />
          )}
        </div>
      </div>

      {/* Tables row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
        {/* Top orgs */}
        <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e35]">
            <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">Top Orgs by MRR</h3>
          </div>
          <Table columns={topOrgCols} dataSource={topOrgs} rowKey="id" size="small"
            loading={topLoading} pagination={false} />
        </div>

        {/* Churn */}
        <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg overflow-hidden">
          <div className="px-5 py-4 border-b border-[#1e1e35]">
            <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">Recent Churn</h3>
            <p className="text-[#6b6b8a] text-xs">Cancelled orgs this month</p>
          </div>
          <Table columns={churnCols} dataSource={churned} rowKey="id" size="small"
            loading={churnLoading} pagination={false} />
        </div>
      </div>

      {/* All invoices */}
      <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1e1e35]">
          <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">All Invoices</h3>
        </div>
        <Table columns={invoiceCols} dataSource={invoices} rowKey="id" size="small"
          loading={invoiceLoading} pagination={{ pageSize: 20, size: 'small' }} />
      </div>
    </div>
  );
}
