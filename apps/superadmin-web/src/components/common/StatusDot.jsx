/**
 * @module StatusDot
 * @description Pulsing animated status indicator dot.
 *              Used for org status, service health, and queue states.
 * Props: status, showLabel, size
 */

const STATUS_CONFIG = {
  active:    { color: 'bg-[#00ff88]', label: 'Active'    },
  suspended: { color: 'bg-[#ff3366]', label: 'Suspended' },
  trial:     { color: 'bg-[#ffaa00]', label: 'Trial'     },
  cancelled: { color: 'bg-[#6b6b8a]', label: 'Cancelled' },
  healthy:   { color: 'bg-[#00ff88]', label: 'Healthy'   },
  degraded:  { color: 'bg-[#ffaa00]', label: 'Degraded'  },
  down:      { color: 'bg-[#ff3366]', label: 'Down'      },
  online:    { color: 'bg-[#00ff88]', label: 'Online'    },
  offline:   { color: 'bg-[#ff3366]', label: 'Offline'   },
};

export default function StatusDot({ status, showLabel = true, size = 'sm' }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
  const dotSize = size === 'sm' ? 'h-2 w-2' : 'h-2.5 w-2.5';

  return (
    <div className="flex items-center gap-2">
      <span className={`relative flex ${dotSize}`}>
        <span className={`
          animate-ping absolute inline-flex h-full w-full
          rounded-full ${config.color} opacity-60
        `} />
        <span className={`
          relative inline-flex rounded-full ${dotSize} ${config.color}
        `} />
      </span>
      {showLabel && (
        <span className="text-[11px] font-sans text-[#6b6b8a] uppercase tracking-wider">
          {config.label}
        </span>
      )}
    </div>
  );
}
