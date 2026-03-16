/**
 * @module ExceptionCard
 * @description Device exception approval card.
 */
import { Card, Button, Space, Tag } from 'antd';

export default function ExceptionCard({ exception, onApprove, onReject, loading }) {
  return (
    <Card className="mb-4">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold">{exception.deviceName}</h4>
          <p className="text-gray-600 text-sm">{exception.reason}</p>
          <p className="text-gray-500 text-xs mt-2">
            Requested by: {exception.requestedBy}
          </p>
        </div>
        <Tag>{exception.status}</Tag>
      </div>
      <Space className="mt-4">
        <Button
          type="primary"
          size="small"
          loading={loading}
          onClick={() => onApprove(exception.id)}
        >
          Approve
        </Button>
        <Button
          danger
          size="small"
          loading={loading}
          onClick={() => onReject(exception.id)}
        >
          Reject
        </Button>
      </Space>
    </Card>
  );
}