/**
 * @module ShiftsPage
 * @description Shift management with card grid view and threshold settings.
 */
import { useState } from 'react';
import { Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import ShiftCard from './ShiftCard.jsx';
import ShiftForm from './ShiftForm.jsx';
import { useGetShiftsQuery, useCreateShiftMutation, useDeleteShiftMutation } from '../../store/api/shiftApi.js';
export default function ShiftsPage() {
  const [selectedShift, setSelectedShift] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useGetShiftsQuery();
  const [createShift, { isLoading: isCreating }] = useCreateShiftMutation();
  const [deleteShift] = useDeleteShiftMutation();

  return (
    <div className="space-y-6">
      <PageHeader
        title="Shifts"
        subtitle="Manage shift timings and thresholds"
        actions={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedShift(null);
              setShowForm(true);
            }}
          >
            Add Shift
          </Button>,
        ]}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {data?.shifts?.map((shift) => (
          <ShiftCard
            key={shift.id}
            shift={shift}
            onEdit={(s) => {
              setSelectedShift(s);
              setShowForm(true);
            }}
            onDelete={(id) => deleteShift(id)}
          />
        ))}
      </div>

      <ShiftForm
        open={showForm}
        shift={selectedShift}
        onClose={() => setShowForm(false)}
        onSubmit={(values) => {
          createShift(values);
          setShowForm(false);
        }}
        loading={isCreating}
      />
    </div>
  );
}
