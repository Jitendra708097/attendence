/**
 * @module AlertBanner
 * @description Critical alerts strip shown at the top of the layout.
 *              Displays impersonation warning, payment failures, etc.
 *              Auto-dismissable with timeout.
 */

import { useSelector, useDispatch } from 'react-redux';
import { selectAlerts, dismissAlert, selectImpersonation } from '@store/uiSlice.js';
import { CloseOutlined, WarningOutlined, UserSwitchOutlined } from '@ant-design/icons';

const ALERT_STYLES = {
  warning: 'bg-[#ffaa00]/10 border-[#ffaa00]/30 text-[#ffaa00]',
  error:   'bg-[#ff3366]/10 border-[#ff3366]/30 text-[#ff3366]',
  info:    'bg-[#00d4ff]/10 border-[#00d4ff]/30 text-[#00d4ff]',
  purple:  'bg-[#a855f7]/10 border-[#a855f7]/30 text-[#a855f7]',
};

export default function AlertBanner() {
  const dispatch      = useDispatch();
  const alerts        = useSelector(selectAlerts);
  const impersonation = useSelector(selectImpersonation);

  const hasContent = alerts.length > 0 || !!impersonation;
  if (!hasContent) return null;

  return (
    <div className="flex flex-col">
      {/* Impersonation warning */}
      {impersonation && (
        <div className="flex items-center gap-3 px-6 py-2.5 bg-[#a855f7]/10 border-b border-[#a855f7]/30">
          <UserSwitchOutlined className="text-[#a855f7] flex-shrink-0" />
          <p className="text-[#a855f7] text-xs font-sans flex-1">
            <span className="font-['JetBrains_Mono'] font-semibold">IMPERSONATING:</span>
            {' '}Currently viewing as <strong>{impersonation.orgName}</strong> — {impersonation.adminName}.
            All actions are fully logged under [SuperAdmin via Impersonation].
          </p>
        </div>
      )}

      {/* Other alerts */}
      {alerts.map((alert) => (
        <div
          key={alert.id}
          className={`flex items-center gap-3 px-6 py-2 border-b ${ALERT_STYLES[alert.type] || ALERT_STYLES.info}`}
        >
          <WarningOutlined className="flex-shrink-0 text-sm" />
          <p className="text-xs font-sans flex-1">{alert.message}</p>
          <button
            onClick={() => dispatch(dismissAlert(alert.id))}
            className="opacity-60 hover:opacity-100 transition-opacity flex-shrink-0"
          >
            <CloseOutlined className="text-xs" />
          </button>
        </div>
      ))}
    </div>
  );
}
