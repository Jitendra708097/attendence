/**
 * @module DashboardPage
 * @description Main dashboard with stats, trends, pending approvals, and recent activity.
 */
import { Row, Col, Card, Statistic, Spin } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import { useGetOrgStatsQuery } from '../../store/api/orgApi.js';
import PageHeader from '../../components/common/PageHeader.jsx';
import AttendanceLineChart from '../../components/charts/AttendanceLineChart.jsx';
import StatusPieChart from '../../components/charts/StatusPieChart.jsx';

export default function DashboardPage() {
  const { data: stats, isLoading } = useGetOrgStatsQuery();

  const chartData = [
    { date: 'Mon', present: 200, absent: 20, leave: 10 },
    { date: 'Tue', present: 210, absent: 15, leave: 12 },
    { date: 'Wed', present: 205, absent: 18, leave: 15 },
    { date: 'Thu', present: 215, absent: 12, leave: 10 },
    { date: 'Fri', present: 220, absent: 10, leave: 8 },
    { date: 'Sat', present: 180, absent: 30, leave: 5 },
    { date: 'Sun', present: 150, absent: 35, leave: 10 },
  ];

  const pieData = [
    { name: 'Present', value: stats?.presentCount || 0 },
    { name: 'Absent', value: stats?.absentCount || 0 },
    { name: 'On Leave', value: stats?.leaveCount || 0 },
    { name: 'Late', value: stats?.lateCount || 0 },
  ];

  if (isLoading) return <Spin className="py-12" />;

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" />

      {/* Stats Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Total Employees"
              value={stats?.employeeCount || 0}
              prefix={<UserOutlined />}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Checked In Today"
              value={stats?.checkedInCount || 0}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Absent Today"
              value={stats?.absentCount || 0}
              valueStyle={{ color: '#ff4d4f' }}
            />
          </Card>
        </Col>
        <Col xs={24} sm={12} md={6}>
          <Card>
            <Statistic
              title="Late Today"
              value={stats?.lateCount || 0}
              valueStyle={{ color: '#faad14' }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row */}
      <Row gutter={[16, 16]}>
        <Col xs={24} md={12}>
          <Card title="Attendance Trend (Last 7 Days)">
            <AttendanceLineChart data={chartData} />
          </Card>
        </Col>
        <Col xs={24} md={12}>
          <Card title="Status Distribution">
            <StatusPieChart data={pieData} />
          </Card>
        </Col>
      </Row>

      {/* Pending Approvals */}
      <Row gutter={[16, 16]}>
        <Col xs={24}>
          <Card title="Pending Approvals">
            <Row gutter={[16, 16]}>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Pending Leaves"
                    value={stats?.pendingLeaves || 0}
                    valueStyle={{ color: '#1890ff' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Pending Regularisations"
                    value={stats?.pendingRegularisations || 0}
                    valueStyle={{ color: '#722ed1' }}
                  />
                </Card>
              </Col>
              <Col xs={24} md={8}>
                <Card size="small">
                  <Statistic
                    title="Pending Device Exceptions"
                    value={stats?.pendingExceptions || 0}
                    valueStyle={{ color: '#faad14' }}
                  />
                </Card>
              </Col>
            </Row>
          </Card>
        </Col>
      </Row>
    </div>
  );
}
