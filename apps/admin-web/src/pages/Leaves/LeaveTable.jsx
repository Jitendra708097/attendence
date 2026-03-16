/**
 * @module LeaveTable
 * @description Paginated leave requests table with filters.
 */
import { Table, Space, Button, Tag, Popconfirm } from 'antd';
import { CheckOutlined, CloseOutlined } from '@ant-design/icons';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function LeaveTable({ data, loading, onApprove, onReject, pagination }) {
  const columns = [
    { title: 'Employee', dataIndex: 'employeeName', key: 'employeeName' },
    {
      title: 'Type',
      dataIndex: 'leaveType',
      key: 'leaveType',
      render: (type) => <Tag>{type.toUpperCase()}</Tag>,
    },
    { title: 'From', dataIndex: 'fromDate', key: 'fromDate' },
    { title: 'To', dataIndex: 'toDate', key: 'toDate' },
    { title: 'Days', dataIndex: 'days', key: 'days', width: 60 },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
    },
    { title: 'Requested On', dataIndex: 'requestedDate', key: 'requestedDate' },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) =>
        record.status === 'pending' ? (
          <Space>
            <Popconfirm
              title="Approve leave?"
              onConfirm={() => onApprove(record.id)}
              okText="Yes"
              cancelText="No"
            >
              <Button type="text" icon={<CheckOutlined />} size="small" />
            </Popconfirm>
            <Button
              type="text"
              danger
              icon={<CloseOutlined />}
              size="small"
              onClick={() => onReject(record.id)}
            />
          </Space>
        ) : null,
    },
  ];

  return (
    <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={pagination} scroll={{ x: 1000 }} />
  );
}
