/**
 * @module LiveBoardPage
 * @description Real-time attendance live board updated via Socket.io.
 */
import { Card } from 'antd';
import PageHeader from '../../components/common/PageHeader.jsx';

export default function LiveBoardPage() {
  return (
    <div>
      <PageHeader title="Live Attendance Board" subtitle="Real-time employee check-in/out status" />
      <Card>Live Board Page - Coming Soon</Card>
    </div>
  );
}
