/**
 * @module PageHeader
 * @description Reusable page header with title, subtitle, and action buttons.
 */
import { Row, Col, Space, Button } from 'antd';

export default function PageHeader({ title, subtitle, actions, icon }) {
  return (
    <Row justify="space-between" align="middle" style={{ marginBottom: 24 }}>
      <Col>
        <div>
          <h1 style={{ margin: '0 0 4px 0', fontSize: 24, fontWeight: 600 }}>
            {icon && <span style={{ marginRight: 8 }}>{icon}</span>}
            {title}
          </h1>
          {subtitle && <p style={{ margin: 0, color: '#666' }}>{subtitle}</p>}
        </div>
      </Col>
      <Col>
        <Space>{actions}</Space>
      </Col>
    </Row>
  );
}
