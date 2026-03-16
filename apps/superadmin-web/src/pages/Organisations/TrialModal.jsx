/**
 * @module TrialModal
 * @description Extend an organisation's trial period by N days with reason.
 */

import { useState } from 'react';
import { Modal, InputNumber, Input, message } from 'antd';
import { ClockCircleOutlined } from '@ant-design/icons';
import { useExtendTrialMutation } from '@store/api/orgApi.js';
import { parseError } from '@utils/errorHandler.js';
import { formatDate } from '@utils/formatters.js';
import dayjs from 'dayjs';

const { TextArea } = Input;
const QUICK_OPTIONS = [7, 14, 30];

export default function TrialModal({ open, org, onClose }) {
  const [days,   setDays]   = useState(14);
  const [reason, setReason] = useState('');
  const [extendTrial, { isLoading }] = useExtendTrialMutation();

  const newEndDate = org?.trialEndsAt
    ? dayjs(org.trialEndsAt).add(days, 'day').format('DD MMM YYYY')
    : dayjs().add(days, 'day').format('DD MMM YYYY');

  const handleConfirm = async () => {
    if (!days || days < 1)   { message.error('Enter valid days'); return; }
    if (!reason.trim())      { message.error('Reason is required'); return; }

    try {
      await extendTrial({ id: org.id, days, reason: reason.trim() }).unwrap();
      message.success(`Trial extended by ${days} days for ${org.name}`);
      setDays(14);
      setReason('');
      onClose();
    } catch (err) {
      message.error(parseError(err));
    }
  };

  const handleCancel = () => {
    setDays(14);
    setReason('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={420}
      centered
    >
      <div className="p-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#ffaa00]/10 border border-[#ffaa00]/30
                          flex items-center justify-center flex-shrink-0">
            <ClockCircleOutlined className="text-[#ffaa00] text-base" />
          </div>
          <div>
            <h3 className="text-[#e8e8f0] font-sans font-semibold text-sm">Extend Trial</h3>
            <p className="text-[#6b6b8a] text-xs mt-0.5">
              {org?.name} · current end: <span className="text-[#ffaa00]">{formatDate(org?.trialEndsAt)}</span>
            </p>
          </div>
        </div>

        {/* Quick selectors */}
        <div className="mb-4">
          <label className="block text-[10px] text-[#6b6b8a] uppercase tracking-widest mb-2">
            Extend by
          </label>
          <div className="flex gap-2 mb-3">
            {QUICK_OPTIONS.map((d) => (
              <button
                key={d}
                onClick={() => setDays(d)}
                className={`
                  flex-1 py-2 rounded-md text-xs font-['JetBrains_Mono'] font-semibold
                  border transition-colors duration-150
                  ${days === d
                    ? 'bg-[#ffaa00]/15 border-[#ffaa00]/50 text-[#ffaa00]'
                    : 'bg-[#161625] border-[#1e1e35] text-[#6b6b8a] hover:border-[#ffaa00]/30'
                  }
                `}
              >
                {d}d
              </button>
            ))}
            <InputNumber
              min={1}
              max={365}
              value={QUICK_OPTIONS.includes(days) ? undefined : days}
              onChange={(v) => v && setDays(v)}
              placeholder="Custom"
              className="flex-1"
              size="small"
            />
          </div>
          <div className="text-[11px] font-['JetBrains_Mono'] text-[#6b6b8a]">
            New end date:{' '}
            <span className="text-[#ffaa00]">{newEndDate}</span>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-5">
          <label className="block text-[10px] text-[#6b6b8a] uppercase tracking-widest mb-2">
            Reason <span className="text-[#ff3366]">*</span>
          </label>
          <TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Client requested more time, onboarding delay..."
            rows={2}
            maxLength={300}
            showCount
          />
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={handleCancel}
            className="px-4 py-1.5 rounded text-sm font-sans text-[#6b6b8a]
                       hover:text-[#e8e8f0] hover:bg-[#161625] transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            disabled={isLoading || !reason.trim()}
            className="px-4 py-1.5 rounded text-sm font-sans font-medium
                       bg-[#ffaa00] text-[#080810] hover:bg-[#ffbb33]
                       disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Extending...' : `Extend by ${days} days`}
          </button>
        </div>
      </div>
    </Modal>
  );
}
