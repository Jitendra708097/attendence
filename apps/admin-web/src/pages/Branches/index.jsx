/**
 * @module BranchesPage
 * @description Branches list with geofence management.
 */
import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import BranchCard from './BranchCard.jsx';
import BranchForm from './BranchForm.jsx';
import GeoFenceDrawer from './GeoFenceDrawer.jsx';
import { useGetBranchesQuery, useCreateBranchMutation, useDeleteBranchMutation } from '../../store/api/branchApi.js';
export default function BranchesPage() {
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showGeofence, setShowGeofence] = useState(false);

  const { data, isLoading } = useGetBranchesQuery();
  const [createBranch, { isLoading: isCreating }] = useCreateBranchMutation();
  const [deleteBranch] = useDeleteBranchMutation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Branches"
        subtitle="Manage organization branches and geofences"
        actions={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedBranch(null);
              setShowForm(true);
            }}
          >
            Add Branch
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.branches?.map((branch) => (
          <BranchCard
            key={branch.id}
            branch={branch}
            onEdit={(b) => {
              setSelectedBranch(b);
              setShowForm(true);
            }}
            onSetGeofence={(b) => {
              setSelectedBranch(b);
              setShowGeofence(true);
            }}
            onDelete={(id) => deleteBranch(id)}
          />
        ))}
      </div>

      <BranchForm
        open={showForm}
        branch={selectedBranch}
        onClose={() => setShowForm(false)}
        onSubmit={(values) => {
          createBranch(values);
          setShowForm(false);
        }}
        loading={isCreating}
      />

      <GeoFenceDrawer
        open={showGeofence}
        branch={selectedBranch}
        onSave={() => setShowGeofence(false)}
        onCancel={() => setShowGeofence(false)}
        loading={false}
      />
    </div>
  );
}
