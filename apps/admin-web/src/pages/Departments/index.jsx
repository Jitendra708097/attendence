/**
 * @module DepartmentsPage
 * @description Department hierarchy management.
 */
import { useState } from 'react';
import { Card, Button } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import PageHeader from '../../components/common/PageHeader.jsx';
import DepartmentTree from './DepartmentTree.jsx';
import DepartmentForm from './DepartmentForm.jsx';
import { useGetDepartmentsQuery, useCreateDepartmentMutation, useDeleteDepartmentMutation } from '../../store/api/departmentApi.js';

export default function DepartmentsPage() {
  const [selectedDept, setSelectedDept] = useState(null);
  const [showForm, setShowForm] = useState(false);

  const { data, isLoading } = useGetDepartmentsQuery();
  const [createDept, { isLoading: isCreating }] = useCreateDepartmentMutation();
  const [deleteDept] = useDeleteDepartmentMutation();

  return (
    <div className="min-h-screen bg-gray-50">
      <PageHeader
        title="Departments"
        subtitle="Manage department hierarchy"
        actions={[
          <Button
            key="add"
            type="primary"
            icon={<PlusOutlined />}
            onClick={() => {
              setSelectedDept(null);
              setShowForm(true);
            }}
          >
            Add Department
          </Button>,
        ]}
      />

      <Card className="m-6">
        <DepartmentTree
          data={data?.departments || []}
          onAdd={(parentId) => console.log('Add under:', parentId)}
          onEdit={(dept) => {
            setSelectedDept(dept);
            setShowForm(true);
          }}
          onDelete={(id) => deleteDept(id)}
        />
      </Card>

      <DepartmentForm
        open={showForm}
        department={selectedDept}
        onClose={() => setShowForm(false)}
        onSubmit={(values) => {
          createDept(values);
          setShowForm(false);
        }}
        loading={isCreating}
      />
    </div>
  );
}