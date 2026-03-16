/**
 * @module RecentSignups
 * @description Last 5 org signups panel on the dashboard.
 *              Shows org name, employee count, plan badge, time ago.
 */

import { useNavigate } from 'react-router-dom';
import PlanBadge    from '@components/common/PlanBadge.jsx';
import MonoValue    from '@components/common/MonoValue.jsx';
import { formatTimeAgo } from '@utils/formatters.js';

export default function RecentSignups({ signups = [], isLoading }) {
  const navigate = useNavigate();

  return (
    <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg p-5 h-full">
      <div className="mb-4">
        <h3 className="text-[#e8e8f0] text-sm font-sans font-medium">Recent Signups</h3>
        <p className="text-[#6b6b8a] text-xs">Latest org registrations</p>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-[#161625] rounded animate-pulse" />
          ))}
        </div>
      ) : signups.length === 0 ? (
        <p className="text-[#6b6b8a] text-xs font-sans text-center py-6">No signups yet</p>
      ) : (
        <div className="space-y-1">
          {signups.slice(0, 5).map((org) => (
            <button
              key={org.id}
              onClick={() => navigate(`/organisations?id=${org.id}`)}
              className="w-full text-left flex items-center gap-3 px-2 py-2 rounded-md
                         hover:bg-[#161625] transition-colors group"
            >
              {/* Avatar */}
              <div className="w-7 h-7 rounded bg-[#00d4ff]/10 border border-[#00d4ff]/20
                              flex items-center justify-center text-[#00d4ff] text-xs
                              font-['JetBrains_Mono'] font-bold flex-shrink-0
                              group-hover:border-[#00d4ff]/40 transition-colors">
                {org.name?.[0]?.toUpperCase() || '?'}
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-[#e8e8f0] text-xs font-sans truncate">{org.name}</span>
                  <PlanBadge plan={org.plan} />
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                  <MonoValue value={`${org.employeeCount} emp`} color="muted" size="xs" />
                </div>
              </div>

              <span className="text-[#6b6b8a] text-[10px] font-['JetBrains_Mono'] flex-shrink-0">
                {formatTimeAgo(org.createdAt)}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
