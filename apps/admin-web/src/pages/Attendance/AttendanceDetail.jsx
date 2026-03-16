/**
 * @module AttendanceDetail
 * @description Single day attendance detail modal with all sessions.
 */
import { Modal, Table, Empty, Tag, Statistic, Row, Col, Card } from 'antd';

export default function AttendanceDetail({ open, data, onClose }) {
  if (!data) return null;

  const columns = [
    { title: 'Check-in', dataIndex: 'checkInTime', key: 'checkInTime' },
    { title: 'Check-out', dataIndex: 'checkOutTime', key: 'checkOutTime' },
    { title: 'Duration', dataIndex: 'duration', key: 'duration' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <Tag>{status}</Tag>,
    },
  ];

  return (
    <Modal
      title={`${data.employeeName} - ${data.date}`}
      open={open}
      onCancel={onClose}
      width={700}
      footer={null}
    >
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Total Hours" value={data.totalHours} suffix="h" />
          </Card>
        </Col>
        <Col xs={12}>
          <Card size="small">
            <Statistic title="Sessions" value={data.sessionCount} />
          </Card>
        </Col>
      </Row>

      <h3>Sessions Detail</h3>
      {data.sessions && data.sessions.length > 0 ? (
        <Table columns={columns} dataSource={data.sessions} pagination={false} size="small" rowKey="id" />
      ) : (
        <Empty description="No sessions" />
      )}
    </Modal>
  );
}
