/**
 * @module PlatformStats
 * @description Top 6 stat cards for the mission control dashboard.
 *              Total Orgs, Active, Employees, Checked In, MRR, New MTD.
 */

import StatCard from '@components/common/StatCard.jsx';
import { formatNumber, formatMRR } from '@utils/formatters.js';

export default function PlatformStats({ stats = {}, isLoading }) {
  const cards = [
    {
      label:       'Total Orgs',
      value:       stats.totalOrgs || 0,
      accentColor: 'cyan',
      icon:        '◫',
      trend:       stats.orgTrend,
      trendValue:  stats.orgTrendValue,
    },
    {
      label:       'Active Orgs',
      value:       stats.activeOrgs || 0,
      accentColor: 'green',
      icon:        '●',
      subtitle:    `${stats.trialOrgs || 0} on trial`,
    },
    {
      label:       'Total Employees',
      value:       stats.totalEmployees || 0,
      accentColor: 'cyan',
      icon:        '⌬',
      trend:       stats.employeeTrend,
      trendValue:  stats.employeeTrendValue,
    },
    {
      label:       'Checked In Now',
      value:       stats.checkedInNow || 0,
      accentColor: 'green',
      icon:        '⏱',
      subtitle:    stats.totalEmployees
        ? `${((stats.checkedInNow / stats.totalEmployees) * 100).toFixed(1)}% of workforce`
        : '',
    },
    {
      label:       'Monthly MRR',
      rawValue:    formatMRR(stats.mrr || 0),
      value:       0,
      accentColor: 'amber',
      icon:        '₹',
      animate:     false,
      trend:       stats.mrrTrend,
      trendValue:  stats.mrrTrendValue,
    },
    {
      label:       'New Orgs MTD',
      value:       stats.newOrgsMTD || 0,
      accentColor: 'purple',
      icon:        '↑',
      subtitle:    `vs ${stats.newOrgsPrev || 0} last month`,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-3 mb-6">
      {cards.map((card) => (
        <StatCard
          key={card.label}
          label={card.label}
          value={isLoading ? '—' : card.value}
          rawValue={isLoading ? null : card.rawValue}
          accentColor={card.accentColor}
          icon={card.icon}
          trend={card.trend}
          trendValue={card.trendValue}
          subtitle={card.subtitle}
          animate={!isLoading && card.animate !== false}
        />
      ))}
    </div>
  );
}
