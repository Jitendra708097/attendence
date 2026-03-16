/**
 * @module AlertsFeed
 * @description Live alerts feed — payment failures, expiring trials, failed jobs.
 *              Each row is clickable and color-coded by severity.
 */

import { useNavigate } from 'react-router-dom';
import { formatTimeAgo } from '@utils/formatters.js';

const ALERT_TYPE_CONFIG = {
  payment_failed:  { color: 'text-[#ff3366]', bg: 'hover:bg-[#ff3366]/5', dot: 'bg-[#ff3366]', label: 'Payment Failed' },
  trial_expiring:  { color: 'text-[#ffaa00]', bg: 'hover:bg-[#ffaa00]/5', dot: 'bg-[#ffaa00]', label: 'Trial Expiring' },
  queue_failed:    { color: 'text-[#ff3366]', bg: 'hover:bg-[#ff3366]/5', dot: 'bg-[#ff3366]', label: 'Queue Failed'  },
  org_suspended:   { color: 'text-[#6b6b8a]', bg: 'hover:bg-[#161625]',  dot: 'bg-[#6b6b8a]', label: 'Suspended'    },
  new_signup:      { color: 'text-[#00ff88]', bg: 'hover:bg-[#00ff88]/5', dot: 'bg-[#00ff88]', label: 'New Signup'   },
};

export default function AlertsFeed({ alerts = [], isLoading }) {
  const navigate = useNavigate();

  const handleClick = (alert) => {
    if (alert.type === 'payment_failed' || alert.type === 'trial_expiring') {
      navigate(`/organisations?id=${alert.orgId}`);
    } else if (alert.type === 'queue_failed') {
      navigate('/health');
    }
  };

  return (
    <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5 h-full">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">Alerts</h3>
        {alerts.length > 0 && (
          <span className="font-['JetBrains_Mono'] text-[10px] text-[#ff3366] bg-[#ff3366]/10
                           border border-[#ff3366]/30 px-1.5 py-0.5 rounded">
            {alerts.length}
          </span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 bg-[#161625] rounded animate-pulse" />
          ))}
        </div>
      ) : alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="text-[#00ff88] text-2xl mb-2">✓</div>
          <p className="text-[#6b6b8a] text-xs font-sans">No active alerts</p>
        </div>
      ) : (
        <div className="space-y-1 max-h-52 overflow-y-auto">
          {alerts.map((alert, idx) => {
            const cfg = ALERT_TYPE_CONFIG[alert.type] || ALERT_TYPE_CONFIG.org_suspended;
            return (
              <button
                key={idx}
                onClick={() => handleClick(alert)}
                className={`w-full text-left flex items-start gap-2.5 px-2 py-2 rounded-md
                            transition-colors ${cfg.bg}`}
              >
                <span className={`mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className={`text-[10px] font-['JetBrains_Mono'] uppercase ${cfg.color}`}>
                      {cfg.label}
                    </span>
                    {alert.orgName && (
                      <span className="text-[#e8e8f0] text-xs truncate">{alert.orgName}</span>
                    )}
                  </div>
                  {alert.detail && (
                    <p className="text-[#6b6b8a] text-[10px] mt-0.5 truncate">{alert.detail}</p>
                  )}
                </div>
                <span className="text-[#6b6b8a] text-[10px] font-mono flex-shrink-0">
                  {formatTimeAgo(alert.createdAt)}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
