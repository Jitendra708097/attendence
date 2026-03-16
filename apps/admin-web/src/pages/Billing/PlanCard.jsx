/**
 * @module PlanCard
 * @description Subscription plan display card.
 */
import { Card, Button, List } from 'antd';
import { CheckOutlined } from '@ant-design/icons';

export default function PlanCard({ plan, onUpgrade, loading }) {
  const features = plan?.features || [];

  return (
    <Card title="Current Plan" loading={loading}>
      <div className="mb-4">
        <h3 className="text-xl font-semibold">{plan?.name}</h3>
        <p className="text-2xl font-bold text-blue-600">${plan?.price}/month</p>
      </div>

      <List
        dataSource={features}
        renderItem={(feature) => (
          <List.Item>
            <CheckOutlined className="mr-2 text-green-600" />
            {feature}
          </List.Item>
        )}
      />

      <Button type="primary" className="mt-4" onClick={onUpgrade}>
        Upgrade Plan
      </Button>
    </Card>
  );
}