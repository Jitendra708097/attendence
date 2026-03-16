/**
 * @module PlatformHealthPage
 * @description Full platform health monitoring — DB/Redis/API status,
 *              Bull Queue panels, failed jobs table, API metrics charts.
 *              Polls every 15s. Red alert on any failure.
 */

import { Table } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import {
  useGetPlatformHealthQuery, useGetQueueStatusQuery,
  useGetFailedJobsQuery, useGetApiMetricsQuery,
  useRetryJobMutation,
} from '@store/api/healthApi.js';
import { POLL_HEALTH, POLL_QUEUES, QUEUE_NAMES } from '@utils/constants.js';
import { formatDateTime, formatUptime } from '@utils/formatters.js';
import { parseError } from '@utils/errorHandler.js';
import { message } from 'antd';

import PageHeader  from '@components/common/PageHeader.jsx';
import StatusDot   from '@components/common/StatusDot.jsx';
import MonoValue   from '@components/common/MonoValue.jsx';
import QueuePanel  from './QueuePanel.jsx';
import DarkLineChart from '@components/charts/DarkLineChart.jsx';
import { COLORS } from '@theme/colors.js';

export default function PlatformHealthPage() {
  const { data: healthData, isLoading: healthLoading, refetch } =
    useGetPlatformHealthQuery(undefined, { pollingInterval: POLL_HEALTH });

  const { data: queueData, isLoading: queueLoading } =
    useGetQueueStatusQuery(undefined, { pollingInterval: POLL_QUEUES });

  const { data: failedData, isLoading: failedLoading } =
    useGetFailedJobsQuery(undefined, { pollingInterval: POLL_QUEUES });

  const { data: metricsData, isLoading: metricsLoading } =
    useGetApiMetricsQuery({ hours: 24 });

  const [retryJob] = useRetryJobMutation();

  const health    = healthData?.data  || {};
  const queues    = queueData?.data   || QUEUE_NAMES.map((n) => ({ name: n, waiting: 0, active: 0, completed: 0, failed: 0 }));
  const failed    = failedData?.data?.jobs || [];
  const metrics   = metricsData?.data || {};

  const { text: uptimeText, color: uptimeColor } = formatUptime(health.uptime || 99.9);

  const handleRetry = async (job) => {
    try {
      await retryJob({ queue: job.queue, jobId: job.id }).unwrap();
      message.success(`Job ${job.id} queued for retry`);
    } catch (err) {
      message.error(parseError(err));
    }
  };

  const failedCols = [
    { title: 'Job ID',  dataIndex: 'id',         width: 120,
      render: (v) => <MonoValue value={v} color="cyan" size="xs" /> },
    { title: 'Queue',   dataIndex: 'queue',       width: 120,
      render: (v) => <span className="font-['JetBrains_Mono'] text-xs text-[#ffaa00]">{v}</span> },
    { title: 'Error',   dataIndex: 'error',
      render: (v) => <span className="text-xs text-[#ff3366] truncate max-w-[300px] block">{v}</span> },
    { title: 'Failed',  dataIndex: 'failedAt',    width: 150,
      render: (v) => <MonoValue value={formatDateTime(v)} color="muted" size="xs" /> },
    { title: '',        key: 'retry',             width: 60,
      render: (_, r) => (
        <button
          onClick={() => handleRetry(r)}
          className="flex items-center gap-1 text-[10px] font-['JetBrains_Mono']
                     text-[#00d4ff] hover:text-[#33ddff] transition-colors"
        >
          <ReloadOutlined className="text-[10px]" /> Retry
        </button>
      ),
    },
  ];

  const services = [
    { key: 'database', label: 'PostgreSQL', latency: health.dbLatency },
    { key: 'redis',    label: 'Redis Cache', latency: health.redisLatency },
    { key: 'api',      label: 'API Server',  latency: null },
  ];

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Platform Health"
        subtitle="Real-time infrastructure monitoring"
        actions={
          <button
            onClick={refetch}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans
                       text-[#6b6b8a] hover:text-[#e8e8f0] bg-[#161625] border border-[#1e1e35]
                       hover:border-[#00d4ff]/30 transition-colors"
          >
            <ReloadOutlined />
            Refresh
          </button>
        }
      />

      {/* Top status bar */}
      <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-4 mb-6">
        <div className="flex items-center gap-8 flex-wrap">
          {services.map(({ key, label, latency }) => (
            <div key={key} className="flex items-center gap-3">
              <StatusDot status={health[key] || 'healthy'} showLabel={false} />
              <div>
                <div className="text-[#e8e8f0] text-xs font-sans">{label}</div>
                {latency != null && (
                  <MonoValue value={`${latency}ms`} color="muted" size="xs" />
                )}
              </div>
            </div>
          ))}
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[#6b6b8a] text-xs font-sans">Uptime</span>
            <span className={`font-['JetBrains_Mono'] text-sm font-bold ${uptimeColor}`}>
              {uptimeText}
            </span>
          </div>
        </div>
      </div>

      {/* Queue panels */}
      <div className="mb-6">
        <h3 className="text-[#e8e8f0] text-sm font-sans font-medium mb-3">Bull Queues</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
          {queueLoading
            ? QUEUE_NAMES.map((n) => (
                <div key={n} className="h-28 bg-[#161625] rounded-lg animate-pulse" />
              ))
            : queues.map((q) => <QueuePanel key={q.name} queue={q} />)
          }
        </div>
      </div>

      {/* Failed jobs */}
      {failed.length > 0 && (
        <div className="bg-[#0f0f1a] border border-[#ff3366]/25 rounded-lg overflow-hidden mb-6">
          <div className="px-5 py-4 border-b border-[#ff3366]/20 flex items-center gap-2">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#ff3366] opacity-60" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-[#ff3366]" />
            </span>
            <h3 className="text-[#ff3366] text-sm font-sans font-medium">
              Failed Jobs — {failed.length}
            </h3>
          </div>
          <Table
            columns={failedCols}
            dataSource={failed}
            rowKey="id"
            size="small"
            loading={failedLoading}
            pagination={{ pageSize: 10, size: 'small' }}
          />
        </div>
      )}

      {/* API Metrics charts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {[
          { title: 'Response Time (ms)', dataKey: 'p95', color: COLORS.chart.cyan,  data: metrics.responseTime },
          { title: 'Error Rate (%)',      dataKey: 'rate', color: COLORS.chart.red,   data: metrics.errorRate   },
          { title: 'Request Volume',      dataKey: 'count',color: COLORS.chart.green, data: metrics.requests    },
        ].map(({ title, dataKey, color, data }) => (
          <div key={title} className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5">
            <h4 className="text-[#e8e8f0] text-xs font-sans font-medium mb-4">{title}</h4>
            {metricsLoading ? (
              <div className="h-32 bg-[#161625] rounded animate-pulse" />
            ) : (
              <DarkLineChart
                data={data || []}
                xKey="time"
                lines={[{ key: dataKey, color, label: title }]}
                height={130}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
