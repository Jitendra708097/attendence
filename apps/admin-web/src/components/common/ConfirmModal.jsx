/**
 * @module ConfirmModal
 * @description Reusable confirm dialog component.
 */
import { Modal } from "antd";

export default function ConfirmModal({
  open = false,
  title = "Confirm Action",
  message = "Are you sure?",
  okText = "Confirm",
  cancelText = "Cancel",
  loading = false,
  onOk,
  onCancel,
}) {
  return (
    <Modal
      title={title}
      open={open}
      onOk={onOk}
      onCancel={onCancel}
      confirmLoading={loading}
      okText={okText}
      cancelText={cancelText}
      centered
    >
      <p>{message}</p>
    </Modal>
  );
}
