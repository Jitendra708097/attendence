/**
 * @module NotificationBell
 * @description Notification bell icon with dropdown and unread count.
 */
import { Badge, Dropdown, List, Empty, Button, Spin } from 'antd';
import { BellOutlined } from '@ant-design/icons';
import { useNotifications } from '../../hooks/useNotifications.js';

export default function NotificationBell() {
  const { notifications, unreadCount, bellOpen, setBellOpen } = useNotifications();

  const notificationMenu = {
    items: [
      {
        key: 'notifications-dropdown',
        label: (
          <div className="w-80 max-h-96 overflow-auto">
            {notifications && notifications.length > 0 ? (
              <List
                dataSource={notifications}
                renderItem={(item) => (
                  <List.Item className="py-2">
                    <List.Item.Meta
                      title={item.title}
                      description={item.body}
                    />
                  </List.Item>
                )}
              />
            ) : (
              <Empty description="No notifications" />
            )}
          </div>
        ),
      },
    ],
  };

  return (
    <Dropdown menu={notificationMenu} trigger={['click']} open={bellOpen} onOpenChange={setBellOpen}>
      <Badge count={unreadCount} color="#ff4d4f">
        <BellOutlined className="text-lg cursor-pointer" />
      </Badge>
    </Dropdown>
  );
}
