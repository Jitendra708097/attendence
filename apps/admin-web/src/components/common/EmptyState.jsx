/**
 * @module EmptyState
 * @description Reusable empty state component for lists/tables.
 */
import { Empty, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';

export default function EmptyState({ title = 'No data', description = '', actionLabel, onAction, icon }) {
  return (
    <Empty
      style={{ marginTop: 48, marginBottom: 48 }}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
      description={<span>{description || 'No records found'}</span>}
    >
      {actionLabel && onAction && (
        <Button type="primary" icon={<PlusOutlined />} onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  );
}
