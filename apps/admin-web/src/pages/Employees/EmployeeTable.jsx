/**
 * @module EmployeeTable
 * @description Paginated, searchable employee table.
 */
import { Table, Space, Button, Dropdown, Avatar } from 'antd';
import { EditOutlined, DeleteOutlined, MailOutlined, MoreOutlined } from '@ant-design/icons';
import RoleBadge from '../../components/common/RoleBadge.jsx';
import StatusBadge from '../../components/common/StatusBadge.jsx';

export default function EmployeeTable({ data, loading, onEdit, onDelete, onResendInvite, pagination }) {
  const columns = [
    {
      title: 'Name',
      dataIndex: 'name',
      key: 'name',
      render: (name, record) => (
        <Space>
          <Avatar>{name.charAt(0)}</Avatar>
          {name}
        </Space>
      ),
    },
    {
      title: 'Code',
      dataIndex: 'empCode',
      key: 'empCode',
      width: 100,
    },
    {
      title: 'Email',
      dataIndex: 'email',
      key: 'email',
    },
    {
      title: 'Branch',
      dataIndex: 'branchName',
      key: 'branchName',
      width: 120,
    },
    {
      title: 'Shift',
      dataIndex: 'shiftName',
      key: 'shiftName',
      width: 100,
    },
    {
      title: 'Role',
      dataIndex: 'role',
      key: 'role',
      render: (role) => <RoleBadge role={role} />,
      width: 100,
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => <StatusBadge status={status} />,
      width: 100,
    },
    {
      title: 'Face Enrolled',
      dataIndex: 'faceEnrolled',
      key: 'faceEnrolled',
      render: (enrolled) => (enrolled ? 'Yes' : 'No'),
      width: 100,
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Dropdown
          menu={{
            items: [
              {
                key: 'edit',
                icon: <EditOutlined />,
                label: 'Edit',
                onClick: () => onEdit(record),
              },
              {
                key: 'resend',
                icon: <MailOutlined />,
                label: 'Resend Invite',
                onClick: () => onResendInvite(record.id),
              },
              { type: 'divider' },
              {
                key: 'delete',
                icon: <DeleteOutlined />,
                label: 'Delete',
                danger: true,
                onClick: () => onDelete(record.id),
              },
            ],
          }}
        >
          <Button type="text" icon={<MoreOutlined />} />
        </Dropdown>
      ),
    },
  ];

  return (
    <Table columns={columns} dataSource={data} loading={loading} rowKey="id" pagination={pagination} scroll={{ x: 1200 }} />
  );
}
