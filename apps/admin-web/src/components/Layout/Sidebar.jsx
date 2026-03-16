/**
 * @module Sidebar
 * @description Main navigation sidebar with menu items.
 */
import { Layout, Menu, Badge } from 'antd';
import {
  DashboardOutlined,
  BgColorsOutlined,
  CalendarOutlined,
  UserOutlined,
  CheckOutlined,
  ReloadOutlined,
  ClockCircleOutlined,
  BankOutlined,
  FolderOutlined,
  GiftOutlined,
  FileTextOutlined,
  BellOutlined,
  PhoneOutlined,
  CreditCardOutlined,
  SettingOutlined,
} from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';

const { Sider } = Layout;

export default function Sidebar() {
  const navigate = useNavigate();
  const sidebarCollapsed = useSelector((state) => state.ui?.sidebarCollapsed || false);
  const orgInfo = useSelector((state) => state.auth?.orgInfo || {});

  const menuItems = [
    {
      key: '/dashboard',
      icon: <DashboardOutlined />,
      label: 'Dashboard',
      onClick: () => navigate('/dashboard'),
    },
    {
      key: '/attendance/live',
      icon: <BgColorsOutlined />,
      label: 'Live Board',
      badge: 0,
      onClick: () => navigate('/attendance/live'),
    },
    {
      key: '/attendance',
      icon: <CalendarOutlined />,
      label: 'Attendance',
      onClick: () => navigate('/attendance'),
    },
    {
      key: '/employees',
      icon: <UserOutlined />,
      label: 'Employees',
      onClick: () => navigate('/employees'),
    },
    {
      key: '/leaves',
      icon: <CheckOutlined />,
      label: 'Leave Requests',
      badge: 0,
      onClick: () => navigate('/leaves'),
    },
    {
      key: '/regularisations',
      icon: <ReloadOutlined />,
      label: 'Regularisations',
      badge: 0,
      onClick: () => navigate('/regularisations'),
    },
    {
      key: '/shifts',
      icon: <ClockCircleOutlined />,
      label: 'Shifts',
      onClick: () => navigate('/shifts'),
    },
    {
      key: '/branches',
      icon: <BankOutlined />,
      label: 'Branches',
      onClick: () => navigate('/branches'),
    },
    {
      key: '/departments',
      icon: <FolderOutlined />,
      label: 'Departments',
      onClick: () => navigate('/departments'),
    },
    {
      key: '/holidays',
      icon: <GiftOutlined />,
      label: 'Holidays',
      onClick: () => navigate('/holidays'),
    },
    {
      key: '/reports',
      icon: <FileTextOutlined />,
      label: 'Reports',
      onClick: () => navigate('/reports'),
    },
    {
      key: '/notifications',
      icon: <BellOutlined />,
      label: 'Notifications',
      badge: 0,
      onClick: () => navigate('/notifications'),
    },
    {
      key: '/device-exceptions',
      icon: <PhoneOutlined />,
      label: 'Device Exceptions',
      badge: 0,
      onClick: () => navigate('/device-exceptions'),
    },
    {
      key: '/billing',
      icon: <CreditCardOutlined />,
      label: 'Billing',
      onClick: () => navigate('/billing'),
    },
    {
      key: '/settings',
      icon: <SettingOutlined />,
      label: 'Settings',
      onClick: () => navigate('/settings'),
    },
  ];

  return (
    <Sider
      collapsible
      collapsed={sidebarCollapsed}
      width={250}
      className="bg-gray-900"
    >
      <div className="p-4 text-white text-center border-b border-gray-700 mb-4">
        <h2 className="m-0 text-base font-semibold">
          {sidebarCollapsed ? 'AE' : 'AttendEase'}
        </h2>
      </div>

      <Menu
        theme="dark"
        mode="inline"
        items={menuItems}
        style={{ border: 'none' }}
      />

      <div className="p-4 border-t border-gray-700 absolute bottom-0 w-full text-white text-xs">
        {!sidebarCollapsed && (
          <>
            <p className="m-0 mb-2 font-semibold">{orgInfo?.name}</p>
          </>
        )}
      </div>
    </Sider>
  );
}
