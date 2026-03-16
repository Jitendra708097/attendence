/**
 * @module EmployeeDetailPage
 * @description Employee profile with attendance, leaves, and regularisations.
 */
import { Card } from 'antd';
import { useParams } from 'react-router-dom';
import PageHeader from '../../components/common/PageHeader.jsx';

export default function EmployeeDetailPage() {
  const { id } = useParams();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Employee Profile" subtitle={`Employee ID: ${id}`} />
      <Card className="m-6">Employee Detail Page - Coming Soon</Card>
    </div>
  );
}