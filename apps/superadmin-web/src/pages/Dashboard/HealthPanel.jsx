/**
 * @module HealthPanel
 * @description Platform health panel — DB, Redis, Bull Queues, API uptime.
 *              Pulsing status dots for each service.
 */

import StatusDot from '@components/common/StatusDot.jsx';
import MonoValue from '@components/common/MonoValue.jsx';
import { formatUptime } from '@utils/formatters.js';

export default function HealthPanel({ health = {}, isLoading }) {
  const services = [
    { label: 'PostgreSQL',   status: health.database || 'healthy',  value: health.dbLatency ? `${health.dbLatency}ms` : null },
    { label: 'Redis',        status: health.redis    || 'healthy',  value: health.redisLatency ? `${health.redisLatency}ms` : null },
    { label: 'API',          status: health.api      || 'healthy',  value: null },
  ];

  const { text: uptimeText, color: uptimeColor } = formatUptime(health.uptime || 99.9);

  return (
    <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">Platform Health</h3>
        <span className={`font-['JetBrains_Mono'] text-xs font-semibold ${uptimeColor}`}>
          {uptimeText} uptime
        </span>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-8 bg-[#161625] rounded animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="space-y-3">
          {services.map(({ label, status, value }) => (
            <div key={label} className="flex items-center justify-between
                                        py-2 border-b border-[#1e1e35] last:border-0">
              <div className="flex items-center gap-3">
                <StatusDot status={status} showLabel={false} />
                <span className="text-[#e8e8f0] text-xs font-sans">{label}</span>
              </div>
              <div className="flex items-center gap-3">
                {value && <MonoValue value={value} color="muted" size="xs" />}
                <span className={`text-[10px] font-['JetBrains_Mono'] uppercase ${
                  status === 'healthy' ? 'text-[#00ff88]' :
                  status === 'degraded' ? 'text-[#ffaa00]' : 'text-[#ff3366]'
                }`}>
                  {status}
                </span>
              </div>
            </div>
          ))}

          {/* Queues summary */}
          <div className="mt-2 pt-2 border-t border-[#1e1e35]">
            <div className="flex items-center justify-between">
              <span className="text-[#6b6b8a] text-xs font-sans">Bull Queues</span>
              <span className={`text-[10px] font-['JetBrains_Mono'] uppercase ${
                health.failedJobs > 0 ? 'text-[#ff3366]' : 'text-[#00ff88]'
              }`}>
                {health.failedJobs > 0 ? `${health.failedJobs} failed` : 'All clear'}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
