/**
 * @module AttendanceReport
 * @description Attendance report display component.
 */
import { Table, Tag } from 'antd';

export default function AttendanceReport({ data = [], loading }) {
  const columns = [
    {
      title: 'Employee',
      dataIndex: 'employeeName',
      key: 'employeeName',
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Check In',
      dataIndex: 'checkIn',
      key: 'checkIn',
    },
    {
      title: 'Check Out',
      dataIndex: 'checkOut',
      key: 'checkOut',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'present' ? 'green' : status === 'absent' ? 'red' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
  ];

  return <Table columns={columns} dataSource={data} loading={loading} />;
}