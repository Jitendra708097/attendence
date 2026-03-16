/**
 * @module QueuePanel
 * @description Single Bull Queue status card — waiting, active, completed, failed counts.
 *              Shows Retry All button when failed count > 0.
 */

import { message } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { useRetryAllFailedMutation } from '@store/api/healthApi.js';
import MonoValue from '@components/common/MonoValue.jsx';
import { parseError } from '@utils/errorHandler.js';

const METRIC_CONFIG = [
  { key: 'waiting',   label: 'Waiting',   color: 'cyan'  },
  { key: 'active',    label: 'Active',    color: 'green' },
  { key: 'completed', label: 'Done',      color: 'muted' },
  { key: 'failed',    label: 'Failed',    color: 'red'   },
];

export default function QueuePanel({ queue }) {
  const [retryAll, { isLoading }] = useRetryAllFailedMutation();

  const handleRetryAll = async () => {
    try {
      await retryAll({ queue: queue.name }).unwrap();
      message.success(`Retrying all failed jobs in ${queue.name}`);
    } catch (err) {
      message.error(parseError(err));
    }
  };

  const hasFailed = (queue.failed || 0) > 0;

  return (
    <div className={`
      bg-[#0f0f1a] border rounded-lg p-4
      transition-all duration-200
      ${hasFailed
        ? 'border-[#ff3366]/30 shadow-[0_0_12px_rgba(255,51,102,0.06)]'
        : 'border-[#1e1e35] hover:border-[#00d4ff]/20'
      }
    `}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="font-['JetBrains_Mono'] text-xs text-[#e8e8f0] font-semibold uppercase tracking-wider">
            {queue.name}
          </div>
          <div className={`text-[10px] font-['JetBrains_Mono'] mt-0.5 ${
            hasFailed ? 'text-[#ff3366]' : 'text-[#00ff88]'
          }`}>
            {hasFailed ? `${queue.failed} failed` : 'Healthy'}
          </div>
        </div>
        {hasFailed && (
          <button
            onClick={handleRetryAll}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-2.5 py-1 rounded text-[10px]
                       font-['JetBrains_Mono'] bg-[#ff3366]/10 border border-[#ff3366]/30
                       text-[#ff3366] hover:bg-[#ff3366]/20 transition-colors
                       disabled:opacity-50"
          >
            <ReloadOutlined className={`text-[10px] ${isLoading ? 'animate-spin' : ''}`} />
            Retry All
          </button>
        )}
      </div>

      {/* Metrics grid */}
      <div className="grid grid-cols-4 gap-2">
        {METRIC_CONFIG.map(({ key, label, color }) => (
          <div key={key} className="text-center">
            <MonoValue value={queue[key] ?? 0} color={color} size="lg" />
            <div className="text-[9px] text-[#6b6b8a] uppercase tracking-wider mt-0.5 font-sans">
              {label}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
