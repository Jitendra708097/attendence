/**
 * @module RegularisationsPage
 * @description Regularisation requests list with approval.
 */
import { useState } from 'react';
import { Card, Button, Space } from 'antd';
import PageHeader from '../../components/common/PageHeader.jsx';
import RegTable from './RegTable.jsx';
import RegApprovalModal from './RegApprovalModal.jsx';
import { useGetRegularisationsQuery, useApproveRegularisationMutation, useRejectRegularisationMutation } from '../../store/api/regularisationApi.js';

export default function RegularisationsPage() {
  const [selectedReg, setSelectedReg] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data, isLoading } = useGetRegularisationsQuery({ pagination });
  const [approveReg] = useApproveRegularisationMutation();
  const [rejectReg] = useRejectRegularisationMutation();

  return (
    <div className="space-y-6">
      <PageHeader title="Regularisations" subtitle="Review and approve regularisation requests" />

      <Card style={{ marginTop: 16 }}>
        <RegTable
          data={data?.regularisations || []}
          loading={isLoading}
          onView={(record) => {
            setSelectedReg(record);
            setShowModal(true);
          }}
          onApprove={(id) => approveReg(id)}
          onReject={(id) => rejectReg(id)}
          pagination={pagination}
        />
      </Card>

      <RegApprovalModal
        open={showModal}
        reg={selectedReg}
        onApprove={(id) => {
          approveReg(id);
          setShowModal(false);
        }}
        onReject={(id) => {
          rejectReg(id);
          setShowModal(false);
        }}
        onClose={() => setShowModal(false)}
        loading={false}
      />
    </div>
  );
}
