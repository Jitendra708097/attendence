/**
 * @module NotificationsPage
 * @description Notification center with filtering and management.
 */
import { useGetNotificationsQuery, useMarkNotificationReadMutation } from '../../store/api/notificationApi.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import { Card, List, Button, Space, Empty } from 'antd';
import { DeleteOutlined, CheckOutlined } from '@ant-design/icons';

export default function NotificationsPage() {
  const { data, isLoading } = useGetNotificationsQuery();
  const [markRead] = useMarkNotificationReadMutation();

  const notifications = data?.notifications || [];

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Notifications" subtitle="View and manage notifications" />

      <Card className="m-6">
        {notifications.length === 0 ? (
          <Empty description="No notifications" />
        ) : (
          <List
            dataSource={notifications}
            renderItem={(notification) => (
              <List.Item 
                className="py-4"
                extra={
                  <Space>
                    {!notification.read && (
                      <Button
                        type="text"
                        size="small"
                        icon={<CheckOutlined />}
                        onClick={() => markRead(notification.id)}
                      />
                    )}
                    <Button
                      type="text"
                      danger
                      size="small"
                      icon={<DeleteOutlined />}
                    />
                  </Space>
                }
              >
                <List.Item.Meta
                  title={
                    <span>
                      {notification.title}
                      {!notification.read && <div className="inline-block w-2 h-2 bg-blue-500 rounded-full ml-2" />}
                    </span>
                  }
                  description={notification.message}
                />
                <div>{notification.createdAt}</div>
              </List.Item>
            )}
          />
        )}
      </Card>
    </div>
  );
}