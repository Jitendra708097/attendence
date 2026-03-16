/**
 * @module SuspendModal
 * @description Suspend an organisation with mandatory reason text.
 *              Calls suspendOrg mutation on confirm.
 */

import { useState } from 'react';
import { Modal, Input, message } from 'antd';
import { StopOutlined } from '@ant-design/icons';
import { useSuspendOrgMutation } from '@store/api/orgApi.js';
import { parseError } from '@utils/errorHandler.js';

const { TextArea } = Input;

export default function SuspendModal({ open, org, onClose }) {
  const [reason, setReason] = useState('');
  const [suspend, { isLoading }] = useSuspendOrgMutation();

  const handleConfirm = async () => {
    if (!reason.trim()) {
      message.error('Reason is required');
      return;
    }
    try {
      await suspend({ id: org.id, reason: reason.trim() }).unwrap();
      message.success(`${org.name} suspended`);
      setReason('');
      onClose();
    } catch (err) {
      message.error(parseError(err));
    }
  };

  const handleCancel = () => {
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
      title={null}
    >
      <div className="p-1">
        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-9 h-9 rounded-lg bg-[#ff3366]/10 border border-[#ff3366]/30
                          flex items-center justify-center flex-shrink-0">
            <StopOutlined className="text-[#ff3366] text-base" />
          </div>
          <div>
            <h3 className="text-[#e8e8f0] font-sans font-semibold text-sm">
              Suspend Organisation
            </h3>
            <p className="text-[#6b6b8a] text-xs mt-0.5">
              This will immediately block all logins for{' '}
              <span className="text-[#e8e8f0] font-medium">{org?.name}</span>.
            </p>
          </div>
        </div>

        {/* Reason */}
        <div className="mb-5">
          <label className="block text-[10px] text-[#6b6b8a] uppercase tracking-widest mb-2 font-sans">
            Reason for suspension <span className="text-[#ff3366]">*</span>
          </label>
          <TextArea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Payment overdue, Terms of service violation..."
            rows={3}
            maxLength={500}
            showCount
            className="font-sans text-sm"
          />
        </div>

        {/* Warning */}
        <div className="bg-[#ff3366]/8 border border-[#ff3366]/20 rounded-md px-3 py-2.5 mb-5">
          <p className="text-[#ff3366] text-xs font-sans">
            ⚠ All active sessions will be terminated. Employees cannot check in.
            Admins cannot log in. This action is logged.
          </p>
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
                       bg-[#ff3366] text-white hover:bg-[#ff5580]
                       disabled:opacity-50 transition-colors"
          >
            {isLoading ? 'Suspending...' : 'Suspend Organisation'}
          </button>
        </div>
      </div>
    </Modal>
  );
}
