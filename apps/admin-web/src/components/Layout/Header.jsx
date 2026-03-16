/**
 * @module Header
 * @description Top header bar with notifications, profile, and admin info.
 */
import { Layout, Dropdown, Badge, Space, Button, Avatar } from 'antd';
import { LogoutOutlined, SettingOutlined, LockOutlined, BellOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../store/authSlice.js';
import NotificationBell from './NotificationBell.jsx';

const { Header } = Layout;

export default function AppHeader() {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const profileMenu = {
    items: [
      {
        key: 'settings',
        icon: <SettingOutlined />,
        label: 'Settings',
        onClick: () => navigate('/settings'),
      },
      {
        key: 'password',
        icon: <LockOutlined />,
        label: 'Change Password',
        onClick: () => navigate('/settings?tab=password'),
      },
      { type: 'divider' },
      {
        key: 'logout',
        icon: <LogoutOutlined />,
        label: 'Logout',
        onClick: () => {
          dispatch(logout());
          navigate('/login');
        },
      },
    ],
  };

  return (
    <Header className="bg-white shadow-sm px-6 py-4 flex justify-between items-center border-b border-gray-200">
      <div>
        <h2 className="m-0 text-lg font-semibold text-gray-900">AttendEase Admin</h2>
      </div>

      <Space size="large">
        <NotificationBell />

        <Dropdown menu={profileMenu} trigger={['click']}>
          <Button type="text" size="large">
            <Avatar size="small" style={{ backgroundColor: '#1677ff' }}>
              {user?.name?.[0]?.toUpperCase()}
            </Avatar>
            <span className="ml-2">{user?.name}</span>
          </Button>
        </Dropdown>
      </Space>
    </Header>
  );
}
