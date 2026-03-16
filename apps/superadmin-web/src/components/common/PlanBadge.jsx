/**
 * @module PlanBadge
 * @description Inline badge for plan tier: trial/starter/growth/enterprise.
 *              Each tier has a unique color identity.
 */

import { PLAN_COLORS, PLAN_LABELS } from '@utils/constants.js';

export default function PlanBadge({ plan }) {
  const config = PLAN_COLORS[plan] || PLAN_COLORS.trial;
  const label  = PLAN_LABELS[plan]  || plan;

  return (
    <span
      style={{
        color:           config.text,
        backgroundColor: config.bg,
        border:          `1px solid ${config.border}`,
      }}
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px]
                 font-['JetBrains_Mono'] uppercase tracking-wider whitespace-nowrap"
    >
      {label}
    </span>
  );
}
