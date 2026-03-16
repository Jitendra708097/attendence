/**
 * @module ConfirmModal
 * @description Dark-themed confirmation dialog with danger/warning/info variants.
 *              Wraps Ant Design Modal for consistent dark styling.
 */

import { Modal, Button } from 'antd';
import { ExclamationCircleOutlined, WarningOutlined, InfoCircleOutlined } from '@ant-design/icons';

const VARIANT_CONFIG = {
  danger: {
    iconClass: 'text-[#ff3366]',
    Icon:      ExclamationCircleOutlined,
    btnClass:  'bg-[#ff3366] hover:bg-[#ff5580] border-none text-white',
  },
  warning: {
    iconClass: 'text-[#ffaa00]',
    Icon:      WarningOutlined,
    btnClass:  'bg-[#ffaa00] hover:bg-[#ffbb33] border-none text-[#080810]',
  },
  info: {
    iconClass: 'text-[#00d4ff]',
    Icon:      InfoCircleOutlined,
    btnClass:  'bg-[#00d4ff] hover:bg-[#33ddff] border-none text-[#080810]',
  },
};

export default function ConfirmModal({
  open,
  onConfirm,
  onCancel,
  title,
  description,
  confirmText = 'Confirm',
  cancelText  = 'Cancel',
  variant     = 'danger',
  loading     = false,
}) {
  const config = VARIANT_CONFIG[variant] || VARIANT_CONFIG.danger;

  return (
    <Modal
      open={open}
      onCancel={onCancel}
      footer={null}
      width={420}
      centered
      closable={false}
    >
      <div className="p-2">
        <div className="flex gap-4 mb-5">
          <div className={`text-2xl mt-0.5 flex-shrink-0 ${config.iconClass}`}>
            <config.Icon />
          </div>
          <div>
            <h3 className="text-[#e8e8f0] font-sans font-semibold text-base mb-1">
              {title}
            </h3>
            {description && (
              <p className="text-[#6b6b8a] text-sm font-sans leading-relaxed">
                {description}
              </p>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-2 border-t border-[#1e1e35]">
          <button
            onClick={onCancel}
            disabled={loading}
            className="px-4 py-1.5 rounded text-sm font-sans text-[#6b6b8a]
                       hover:text-[#e8e8f0] hover:bg-[#161625] transition-colors
                       disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            onClick={onConfirm}
            disabled={loading}
            className={`
              px-4 py-1.5 rounded text-sm font-sans font-medium
              transition-all duration-150 disabled:opacity-50
              ${config.btnClass}
            `}
          >
            {loading ? 'Processing...' : confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
}
