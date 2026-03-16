/**
 * @module LeavesPage
 * @description Leave requests management with approval workflow and calendar view.
 */
import { useState } from 'react';
import { Card, Tabs } from 'antd';
import PageHeader from '../../components/common/PageHeader.jsx';
import LeaveTable from './LeaveTable.jsx';
import LeaveCalendar from './LeaveCalendar.jsx';
import LeaveApprovalModal from './LeaveApprovalModal.jsx';
import { useGetLeavesQuery, useApproveLeavesMutation, useRejectLeavesMutation } from '../../store/api/leaveApi.js';

export default function LeavesPage() {
  const [selectedLeave, setSelectedLeave] = useState(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data, isLoading } = useGetLeavesQuery({ pagination });
  const [approveLeave] = useApproveLeavesMutation();
  const [rejectLeave] = useRejectLeavesMutation();

  const items = [
    {
      key: 'list',
      label: 'List View',
      children: (
        <Card>
          <LeaveTable
            data={data?.leaves || []}
            loading={isLoading}
            onApprove={(id) => approveLeave(id)}
            onReject={(id) => rejectLeave(id)}
            pagination={pagination}
          />
        </Card>
      ),
    },
    {
      key: 'calendar',
      label: 'Calendar View',
      children: (
        <Card>
          <LeaveCalendar leaves={data?.leaves || []} />
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Leaves" subtitle="Manage and approve employee leave requests" />

      <Tabs items={items} />

      <LeaveApprovalModal
        open={showApprovalModal}
        leave={selectedLeave}
        leaveBalance={{}}
        onApprove={(id) => {
          approveLeave(id);
          setShowApprovalModal(false);
        }}
        onReject={(id, note) => {
          rejectLeave(id);
          setShowApprovalModal(false);
        }}
        onClose={() => setShowApprovalModal(false)}
        loading={false}
      />
    </div>
  );
}
