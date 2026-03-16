/**
 * @module DeviceExceptionsPage
 * @description Device exception approvals.
 */
import { Card } from 'antd';
import PageHeader from '../../components/common/PageHeader.jsx';
import ExceptionCard from './ExceptionCard.jsx';
import { useGetDeviceExceptionsQuery, useApproveDeviceExceptionMutation, useRejectDeviceExceptionMutation } from '../../store/api/deviceExceptionApi.js';

export default function DeviceExceptionsPage() {
  const { data, isLoading } = useGetDeviceExceptionsQuery();
  const [approveException] = useApproveDeviceExceptionMutation();
  const [rejectException] = useRejectDeviceExceptionMutation();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader title="Device Exceptions" subtitle="Approve device access exceptions" />

      <Card className="m-6">
        {data?.exceptions?.map((exception) => (
          <ExceptionCard
            key={exception.id}
            exception={exception}
            onApprove={(id) => approveException(id)}
            onReject={(id) => rejectException(id)}
            loading={isLoading}
          />
        ))}
      </Card>
    </div>
  );
}