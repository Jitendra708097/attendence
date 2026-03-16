/**
 * @module HolidaysPage
 * @description Holidays list with calendar view.
 */
import { useState } from 'react';
import { Card, Button, Tabs } from 'antd';
import { PlusOutlined, UploadOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import HolidayCalendar from './HolidayCalendar.jsx';
import HolidayForm from './HolidayForm.jsx';
import { useGetHolidaysQuery, useCreateHolidayMutation, useDeleteHolidayMutation } from '../../store/api/holidayApi.js';
export default function HolidaysPage() {
  const [selectedHoliday, setSelectedHoliday] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useGetHolidaysQuery();
  const [createHoliday, { isLoading: isCreating }] = useCreateHolidayMutation();
  const [deleteHoliday] = useDeleteHolidayMutation();

  const items = [
    {
      key: 'calendar',
      label: 'Calendar View',
      children: (
        <Card className="bg-white shadow border border-gray-100">
          <HolidayCalendar holidays={data?.holidays || []} />
        </Card>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Holidays"
        subtitle="Manage organization holidays"
        actions={[
          <Button key="import" icon={<UploadOutlined />}>
            Bulk Import
          </Button>,
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedHoliday(null);
              setShowForm(true);
            }}
          >
            Add Holiday
          </Button>,
        ]}
      />

      <Tabs items={items} />

      <HolidayForm
        open={showForm}
        holiday={selectedHoliday}
        onClose={() => setShowForm(false)}
        onSubmit={(values) => {
          createHoliday(values);
          setShowForm(false);
        }}
        loading={isCreating}
      />
    </div>
  );
}
