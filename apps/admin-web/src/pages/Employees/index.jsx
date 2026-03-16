/**
 * @module EmployeesPage
 * @description Employee list with search, filters, and bulk upload.
 */
import { useState } from 'react';
import { Card, Button, Space, Input, Select, Row, Col } from 'antd';
import { PlusOutlined, UploadOutlined, SearchOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import EmployeeTable from './EmployeeTable.jsx';
import EmployeeForm from './EmployeeForm.jsx';
import BulkUpload from './BulkUpload.jsx';
import LeaveBalanceModal from './LeaveBalanceModal.jsx';
import { useGetEmployeesQuery, useCreateEmployeeMutation, useDeleteEmployeeMutation, useResendInviteMutation, useUpdateLeaveBalanceMutation } from '../../store/api/employeeApi.js';
import { useDebounce } from '../../hooks/useDebounce.js';
export default function EmployeesPage() {
  const [search, setSearch] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showBulk, setShowBulk] = useState(false);
  const [showLeaveBalance, setShowLeaveBalance] = useState(false);
  const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

  const debouncedSearch = useDebounce(search);
  const { data, isLoading } = useGetEmployeesQuery({ search: debouncedSearch, pagination });
  const [createEmployee, { isLoading: isCreating }] = useCreateEmployeeMutation();
  const [deleteEmployee] = useDeleteEmployeeMutation();
  const [resendInvite] = useResendInviteMutation();
  const [updateLeaveBalance] = useUpdateLeaveBalanceMutation();

  const actions = [
    <Button key="bulk" icon={<UploadOutlined />} onClick={() => setShowBulk(true)}>
      Bulk Upload
    </Button>,
    <Button key="add" type="primary" icon={<PlusOutlined />} onClick={() => {
      setSelectedEmployee(null);
      setShowForm(true);
    }}>
      Add Employee
    </Button>,
  ];

  return (
    <div className="space-y-6">
      <PageHeader title="Employees" subtitle="Manage organization employees" actions={actions} />

      <div className="bg-white p-4 rounded-lg shadow border border-gray-100">
        <Row gutter={16}>
          <Col xs={24} md={12}>
            <Input
              placeholder="Search by name or email..."
              prefix={<SearchOutlined />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Branch" style={{ width: '100%' }} />
          </Col>
          <Col xs={24} md={6}>
            <Select placeholder="Role" style={{ width: '100%' }} />
          </Col>
        </Row>
      </div>

      <Card className="bg-white shadow border border-gray-100">
        <EmployeeTable
          data={data?.employees || []}
          loading={isLoading}
          onEdit={(emp) => {
            setSelectedEmployee(emp);
            setShowForm(true);
          }}
          onDelete={(id) => deleteEmployee(id)}
          onResendInvite={(id) => resendInvite(id)}
          pagination={pagination}
        />
      </Card>

      <EmployeeForm
        open={showForm}
        employee={selectedEmployee}
        onClose={() => setShowForm(false)}
        onSubmit={(values) => {
          createEmployee(values);
          setShowForm(false);
        }}
        loading={isCreating}
      />

      <BulkUpload
        open={showBulk}
        loading={false}
        onUpload={(file) => console.log('Upload:', file)}
        onClose={() => setShowBulk(false)}
        results={null}
      />

      <LeaveBalanceModal
        open={showLeaveBalance}
        employee={selectedEmployee}
        onClose={() => setShowLeaveBalance(false)}
        onSubmit={(values) => {
          updateLeaveBalance(values);
          setShowLeaveBalance(false);
        }}
        loading={false}
      />
    </div>
  );
}
