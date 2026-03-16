/**
 * @module ExportModal
 * @description Modal for exporting attendance to CSV.
 */
import { Modal, Form, Button, Space, DatePicker, Select, message } from 'antd';
import { DownloadOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';

export default function ExportModal({ open, loading, onExport, onCancel }) {
  const [form] = Form.useForm();

  const handleExport = async () => {
    try {
      const values = await form.validateFields();
      onExport(values);
      message.success('Export started');
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title="Export Attendance"
      open={open}
      onCancel={onCancel}
      width={500}
      footer={[
        <Button key="cancel" onClick={onCancel}>
          Cancel
        </Button>,
        <Button key="export" type="primary" loading={loading} onClick={handleExport} icon={<DownloadOutlined />}>
          Export CSV
        </Button>,
      ]}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="dateRange"
          label="Date Range"
          rules={[{ required: true, message: 'Select date range' }]}
        >
          <DatePicker.RangePicker style={{ width: '100%' }} />
        </Form.Item>

        <Form.Item name="branch" label="Branch">
          <Select placeholder="All branches" />
        </Form.Item>

        <Form.Item name="employee" label="Employee">
          <Select placeholder="All employees" />
        </Form.Item>

        <Form.Item name="format" label="Format" initialValue="csv">
          <Select options={[{ label: 'CSV', value: 'csv' }, { label: 'Excel', value: 'xlsx' }]} />
        </Form.Item>
      </Form>
    </Modal>
  );
}
