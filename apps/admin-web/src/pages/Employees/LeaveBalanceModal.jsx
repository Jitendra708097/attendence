/**
 * @module LeaveBalanceModal
 * @description Modal to adjust employee leave balance.
 */
import { Modal, Form, Input, Button, Space, message, Row, Col, Card, Statistic } from 'antd';

export default function LeaveBalanceModal({ open, employee, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={`Leave Balance - ${employee?.name}`}
      open={open}
      onCancel={onClose}
      width={600}
      footer={[
        <Button key="cancel" onClick={onClose}>
          Cancel
        </Button>,
        <Button key="submit" type="primary" loading={loading} onClick={handleSubmit}>
          Update
        </Button>,
      ]}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Casual - Total" value={employee?.casualTotal || 0} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Casual - Used" value={employee?.casualUsed || 0} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Sick - Total" value={employee?.sickTotal || 0} />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Sick - Used" value={employee?.sickUsed || 0} />
          </Card>
        </Col>
      </Row>

      <Form form={form} layout="vertical" initialValues={employee || {}}>
        <Form.Item name="casualTotal" label="Casual Leave Total">
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item name="sickTotal" label="Sick Leave Total">
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item name="earnedTotal" label="Earned Leave Total">
          <Input type="number" min={0} />
        </Form.Item>

        <Form.Item name="notes" label="Notes">
          <Input.TextArea rows={3} placeholder="Reason for adjustment" />
        </Form.Item>
      </Form>
    </Modal>
  );
}
