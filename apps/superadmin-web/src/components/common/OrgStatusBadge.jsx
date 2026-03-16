/**
 * @module OrgStatusBadge
 * @description Inline badge for org status: active/suspended/trial/cancelled.
 *              Small pill with colored background and matching text.
 */

import { ORG_STATUS_COLORS, ORG_STATUS_LABELS } from '@utils/constants.js';

export default function OrgStatusBadge({ status }) {
  const color = ORG_STATUS_COLORS[status] || '#6b6b8a';
  const label = ORG_STATUS_LABELS[status] || status;

  return (
    <span
      style={{
        color,
        backgroundColor: `${color}18`,
        border:          `1px solid ${color}40`,
      }}
      className="inline-flex items-center px-2 py-0.5 rounded text-[11px]
                 font-['JetBrains_Mono'] uppercase tracking-wider whitespace-nowrap"
    >
      {label}
    </span>
  );
}
