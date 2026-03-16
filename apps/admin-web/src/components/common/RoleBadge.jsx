/**
 * @module RoleBadge
 * @description Reusable role badge component.
 */
import { Tag } from 'antd';
import { CrownOutlined, TeamOutlined, UserOutlined } from '@ant-design/icons';

const ROLE_CONFIG = {
  admin: { color: 'red', label: 'Admin', icon: <CrownOutlined /> },
  manager: { color: 'orange', label: 'Manager', icon: <TeamOutlined /> },
  employee: { color: 'blue', label: 'Employee', icon: <UserOutlined /> },
};

export default function RoleBadge({ role }) {
  const config = ROLE_CONFIG[role] || ROLE_CONFIG.employee;
  return (
    <Tag color={config.color} icon={config.icon}>
      {config.label}
    </Tag>
  );
}
