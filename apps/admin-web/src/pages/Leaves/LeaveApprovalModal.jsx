/**
 * @module LeaveApprovalModal
 * @description Modal for approving/rejecting leave requests.
 */
import { Modal, Form, Input, Button, Space, Card, Statistic, Row, Col, message } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';

export default function LeaveApprovalModal({
  open,
  leave,
  leaveBalance,
  onApprove,
  onReject,
  onClose,
  loading,
}) {
  const [form] = Form.useForm();

  const handleApprove = async () => {
    if (!leave?.id) {
      message.error('Leave request not found');
      return;
    }
    try {
      await onApprove(leave.id);
    } catch (error) {
      message.error('Approval failed: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleReject = async () => {
    if (!leave?.id) {
      message.error('Leave request not found');
      return;
    }
    try {
      const values = await form.validateFields();
      await onReject(leave.id, values.note);
    } catch (error) {
      if (error.errorFields) {
        // Validation error
        message.error('Please enter rejection reason');
      } else {
        message.error('Rejection failed: ' + (error?.message || 'Unknown error'));
      }
    }
  };

  if (!leave) return null;

  return (
    <Modal
      title="Leave Approval"
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        <Button key="reject" danger onClick={handleReject} loading={loading} icon={<CloseOutlined />}>
          Reject
        </Button>,
        <Button key="approve" type="primary" onClick={handleApprove} loading={loading} icon={<CheckOutlined />}>
          Approve
        </Button>,
      ]}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Employee" value={leave.employeeName} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Type" value={leave.leaveType} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="From" value={leave.fromDate} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="To" value={leave.toDate} />
          </Card>
        </Col>
      </Row>

      <h4>Leave Balance</h4>
      <Row gutter={[8, 8]} style={{ marginBottom: 24 }}>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Total" value={leaveBalance?.total || 0} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Used" value={leaveBalance?.used || 0} />
          </Card>
        </Col>
      </Row>

      <Form form={form} layout="vertical">
        <Form.Item name="note" label="Rejection Note (if rejecting)">
          <Input.TextArea rows={3} placeholder="Reason for rejection" />
        </Form.Item>
      </Form>
    </Modal>
  );
}