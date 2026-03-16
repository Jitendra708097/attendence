/**
 * @module BulkUpload
 * @description Excel upload modal for bulk employee import.
 */
import { Modal, Upload, Button, Progress, Table, Empty, message } from 'antd';
import { UploadOutlined, CheckCircleOutlined, CloseCircleOutlined } from '@ant-design/icons';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const ALLOWED_TYPES = ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'];
const ALLOWED_EXTENSIONS = ['.xlsx', '.xls'];

export default function BulkUpload({ open, loading, onUpload, onClose, results }) {
  const columns = [
    { title: 'Row', dataIndex: 'row', key: 'row', width: 60 },
    { title: 'Email', dataIndex: 'email', key: 'email' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) =>
        status === 'success' ? (
          <CheckCircleOutlined style={{ color: '#52c41a' }} />
        ) : (
          <CloseCircleOutlined style={{ color: '#ff4d4f' }} />
        ),
    },
    { title: 'Message', dataIndex: 'message', key: 'message' },
  ];

  const validateAndUpload = ({ file }) => {
    // Validate file type
    if (!ALLOWED_TYPES.includes(file.type)) {
      message.error('Invalid file type. Only Excel files (.xlsx, .xls) are allowed.');
      return;
    }

    // Check file extension
    const fileName = file.name.toLowerCase();
    if (!ALLOWED_EXTENSIONS.some(ext => fileName.endsWith(ext))) {
      message.error('Invalid file extension. Only .xlsx and .xls files are allowed.');
      return;
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      message.error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit. Current size: ${(file.size / 1024 / 1024).toFixed(2)}MB`);
      return;
    }

    // File validation passed, proceed with upload
    onUpload(file);
  };

  return (
    <Modal
      title="Bulk Upload Employees"
      open={open}
      onCancel={onClose}
      width={700}
      footer={<Button onClick={onClose}>Done</Button>}
    >
      {!results ? (
        <Upload
          accept=".xlsx,.xls"
          maxCount={1}
          customRequest={validateAndUpload}
        >
          <Button icon={<UploadOutlined />} loading={loading}>
            Click to Upload Excel File
          </Button>
        </Upload>
      ) : (
        <>
          <Progress
            percent={
              ((results.filter((r) => r.status === 'success').length / results.length) * 100).toFixed(0)
            }
            status={results.every((r) => r.status === 'success') ? 'success' : 'exception'}
          />
          <Table columns={columns} dataSource={results} pagination={false} size="small" rowKey="row" style={{ marginTop: 16 }} />
        </>
      )}
    </Modal>
  );
}
