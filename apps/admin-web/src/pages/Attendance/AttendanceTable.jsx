/**
 * @module AttendanceTable
 * @description Attendance records table component with full implementation.
 */
import { Table, Button, Space, Tooltip, Empty, Spin } from 'antd';
import { EyeOutlined, FlagOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { StatusBadge } from '../../components/common/index.js';

export default function AttendanceTable({
  data = [],
  loading = false,
  onViewDetail = () => {},
  onFlagAnomaly = () => {},
  pagination = {},
  onPaginationChange = () => {},
}) {
  const columns = [
    {
      title: 'Date',
      key: 'date',
      width: 120,
      render: (_, record) => dayjs(record.date).format('DD/MM/YYYY'),
    },
    {
      title: 'Employee',
      dataIndex: ['employee', 'name'],
      key: 'employee',
      width: 150,
    },
    {
      title: 'Check-In',
      key: 'checkIn',
      width: 100,
      render: (_, record) =>
        record.checkInTime ? dayjs(record.checkInTime).format('HH:mm') : <span className="text-gray-400">-</span>,
    },
    {
      title: 'Check-Out',
      key: 'checkOut',
      width: 100,
      render: (_, record) =>
        record.checkOutTime ? dayjs(record.checkOutTime).format('HH:mm') : <span className="text-gray-400">-</span>,
    },
    {
      title: 'Status',
      key: 'status',
      width: 110,
      render: (_, record) => <StatusBadge status={record.status} />,
    },
    {
      title: 'Duration',
      key: 'duration',
      width: 100,
      render: (_, record) => (record.workingHours ? `${record.workingHours.toFixed(1)}h` : '-'),
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 150,
      render: (_, record) => (
        <Space size="small">
          <Tooltip title="View Details">
            <Button
              type="text"
              size="small"
              icon={<EyeOutlined />}
              onClick={() => onViewDetail(record)}
            />
          </Tooltip>
          <Tooltip title="Flag Anomaly">
            <Button
              type="text"
              size="small"
              icon={<FlagOutlined />}
              onClick={() => onFlagAnomaly(record)}
              className="text-orange-500"
            />
          </Tooltip>
        </Space>
      ),
    },
  ];

  if (loading) return <Spin className="py-12" />;
  if (!data || data.length === 0) return <Empty description="No attendance records" className="py-12" />;

  return (
    <Table
      columns={columns}
      dataSource={data}
      pagination={pagination}
      onChange={onPaginationChange}
      rowKey="id"
      size="small"
      scroll={{ x: 1000 }}
    />
  );
}
