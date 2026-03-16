/**
 * @module MonthlySummary
 * @description Monthly attendance summary statistics.
 */
import { Card, Row, Col, Statistic } from 'antd';
import { UserOutlined, CheckOutlined, CloseOutlined } from '@ant-design/icons';

export default function MonthlySummary({ summary = {} }) {
  return (
    <Card title="Monthly Summary" className="mb-6">
      <Row gutter={16}>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="Total Employees"
            value={summary.totalEmployees || 0}
            prefix={<UserOutlined />}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="Present"
            value={summary.present || 0}
            prefix={<CheckOutlined />}
            valueStyle={{ color: '#52c41a' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="Absent"
            value={summary.absent || 0}
            prefix={<CloseOutlined />}
            valueStyle={{ color: '#f5222d' }}
          />
        </Col>
        <Col xs={24} sm={12} lg={6}>
          <Statistic
            title="Leave"
            value={summary.onLeave || 0}
            Style={{ color: '#1890ff' }}
          />
        </Col>
      </Row>
    </Card>
  );
}