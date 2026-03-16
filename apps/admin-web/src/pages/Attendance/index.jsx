/**
 * @module AttendancePage
 * @description Attendance list with filters, date range picker, and export options.
 */
import { useState } from 'react';
import { Card, Button, Space, Row, Col, DatePicker, Select } from 'antd';
import { DownloadOutlined, FilterOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import AttendanceTable from './AttendanceTable.jsx';
import AttendanceDetail from './AttendanceDetail.jsx';
import ExportModal from './ExportModal.jsx';
import { useGetAttendanceQuery } from '../../store/api/attendanceApi.js';
export default function AttendancePage() {
  const [dateRange, setDateRange] = useState(null);
  const [filters, setFilters] = useState({});
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showExport, setShowExport] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const { data, isLoading } = useGetAttendanceQuery({ ...filters, pagination });

  const handleExport = (values) => {
    console.log('Exporting with:', values);
    setShowExport(false);
  };

  const actions = [
    <Button key="export" icon={<DownloadOutlined />} onClick={() => setShowExport(true)}>
      Export
    </Button>,
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Attendance"
        subtitle="View and manage employee attendance records"
        actions={actions}
      />

      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <Row gutter={[16, 16]}>
          <Col xs={24} md={6}>
            <DatePicker.RangePicker
              style={{ width: '100%' }}
              onChange={setDateRange}
              placeholder={['From', 'To']}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Branch" style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Status" style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Employee" style={{ width: '100%' }} />
          </Col>
        </Row>
      </div>

      <Card className="bg-white shadow border border-gray-100">
        <AttendanceTable
          data={data?.attendance || []}
          loading={isLoading}
          onViewDetail={(record) => {
            setSelectedRecord(record);
            setShowDetail(true);
          }}
          onFlagAnomaly={(record) => console.log('Flag anomaly:', record)}
          pagination={pagination}
        />
      </Card>

      <AttendanceDetail
        open={showDetail}
        data={selectedRecord}
        onClose={() => setShowDetail(false)}
      />

      <ExportModal
        open={showExport}
        loading={false}
        onExport={handleExport}
        onCancel={() => setShowExport(false)}
      />
    </div>
  );
}
