/**
 * @module PlanModal
 * @description Change an organisation's subscription plan with reason.
 *              Shows current plan, available options, and requires reason.
 */

import { useState } from 'react';
import { Modal, Select, Input, message } from 'antd';
import { SwapOutlined } from '@ant-design/icons';
import { useChangePlanMutation } from '@store/api/orgApi.js';
import { PLAN_TIERS, PLAN_LABELS, PLAN_COLORS, PLAN_PRICES } from '@utils/constants.js';
import { formatINR } from '@utils/formatters.js';
import { parseError } from '@utils/errorHandler.js';
import PlanBadge from '@components/common/PlanBadge.jsx';

const { TextArea } = Input;

const PLAN_OPTIONS = [
  PLAN_TIERS.TRIAL,
  PLAN_TIERS.STARTER,
  PLAN_TIERS.GROWTH,
  PLAN_TIERS.ENTERPRISE,
];

export default function PlanModal({ open, org, onClose }) {
  const [newPlan, setNewPlan] = useState('');
  const [reason,  setReason]  = useState('');
  const [changePlan, { isLoading }] = useChangePlanMutation();

  const handleConfirm = async () => {
    if (!newPlan)        { message.error('Select a plan'); return; }
    if (!reason.trim())  { message.error('Reason is required'); return; }
    if (newPlan === org?.plan) { message.warning('Plan unchanged'); return; }

    try {
      await changePlan({ id: org.id, plan: newPlan, reason: reason.trim() }).unwrap();
      message.success(`${org.name} moved to ${PLAN_LABELS[newPlan]}`);
      setNewPlan('');
      setReason('');
      onClose();
    } catch (err) {
      message.error(parseError(err));
    }
  };

  const handleCancel = () => {
    setNewPlan('');
    setReason('');
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      footer={null}
      width={460}
      centered
    >
      <div className="p-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30
                          flex items-center justify-center flex-shrink-0">
            <SwapOutlined className="text-[#00d4ff] text-base" />
          </div>
          <div>
            <h3 className="text-[#e8e8f0] font-sans font-semibold text-sm">Change Plan</h3>
            <p className="text-[#6b6b8a] text-xs mt-0.5">
              {org?.name} — current plan:{' '}
              <span className="inline-flex ml-1"><PlanBadge plan={org?.plan} /></span>
            </p>
          </div>
        </div>

        {/* Plan picker */}
        <div className="mb-4">
          <label className="block text-[10px] text-[#6b6b8a] uppercase tracking-widest mb-2">
            New Plan
          </label>
          <div className="grid grid-cols-2 gap-2">
            {PLAN_OPTIONS.map((plan) => {
              const cfg      = PLAN_COLORS[plan];
              const price    = PLAN_PRICES[plan];
              const selected = newPlan === plan;
              return (
                <button
                  key={plan}
                  onClick={() => setNewPlan(plan)}
                  disabled={plan === org?.plan}
                  style={selected ? {
                    backgroundColor: cfg.bg,
                    borderColor:     cfg.border,
                    color:           cfg.text,
                  } : undefined}
                  className={`
                    p-3 rounded-md border text-left transition-all duration-150
                    disabled:opacity-40 disabled:cursor-not-allowed
                    ${selected
                      ? ''
                      : 'bg-[#161625] border-[#1e1e35] text-[#6b6b8a] hover:border-[#00d4ff]/30'
                    }
                  `}
                >
                  <div className="font-['JetBrains_Mono'] text-xs font-semibold uppercase">
                    {PLAN_LABELS[plan]}
                  </div>
                  {price && (
                    <div className="text-[10px] mt-0.5 opacity-70">
                      {formatINR(price)}/emp/mo
                    </div>
                  )}
                  {plan === org?.plan && (
                    <div className="text-[10px] mt-0.5 opacity-50">Current</div>
                  )}
                </button>
              );
            })}
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
            placeholder="e.g. Upgrade request from client, special arrangement..."
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
            disabled={isLoading || !newPlan || !reason.trim()}
            className="px-4 py-1.5 rounded text-sm font-sans font-medium
                       bg-[#00d4ff] text-[#080810] hover:bg-[#33ddff]
                       disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Updating...' : 'Change Plan'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
