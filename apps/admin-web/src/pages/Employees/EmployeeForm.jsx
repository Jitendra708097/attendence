/**
 * @module EmployeeForm
 * @description Create/edit employee drawer form.
 */
import { Drawer, Form, Input, Select, Button, message, Space } from 'antd';
import { useGetBranchesQuery } from '../../store/api/branchApi.js';
import { useGetShiftsQuery } from '../../store/api/shiftApi.js';
import { useGetDepartmentsQuery } from '../../store/api/departmentApi.js';

const ROLES = [
  { label: 'Employee', value: 'employee' },
  { label: 'Manager', value: 'manager' },
  { label: 'Admin', value: 'admin' },
];

export default function EmployeeForm({ open, employee, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();
  const { data: branches } = useGetBranchesQuery();
  const { data: shifts } = useGetShiftsQuery();
  const { data: departments } = useGetDepartmentsQuery();

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  const handleClose = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Drawer
      title={employee ? 'Edit Employee' : 'Add Employee'}
      placement="right"
      onClose={handleClose}
      open={open}
      width={500}
      footer={
        <Space style={{ float: 'right' }}>
          <Button onClick={handleClose}>Cancel</Button>
          <Button type="primary" loading={loading} onClick={handleSubmit}>
            Save
          </Button>
        </Space>
      }
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={employee || { role: 'employee' }}
      >
        <Form.Item name="name" label="Name" rules={[{ required: true, message: 'Name is required' }]}>
          <Input placeholder="Employee name" />
        </Form.Item>

        <Form.Item name="email" label="Email" rules={[{ required: true, type: 'email' }]}>
          <Input placeholder="employee@company.com" />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input placeholder="+91 90000 00000" />
        </Form.Item>

        <Form.Item name="empCode" label="Employee Code">
          <Input placeholder="EMP001" />
        </Form.Item>

        <Form.Item name="role" label="Role" rules={[{ required: true }]}>
          <Select options={ROLES} />
        </Form.Item>

        <Form.Item name="branchId" label="Branch" rules={[{ required: true }]}>
          <Select
            placeholder="Select branch"
            options={branches?.branches?.map((b) => ({ label: b.name, value: b.id })) || []}
          />
        </Form.Item>

        <Form.Item name="shiftId" label="Shift" rules={[{ required: true }]}>
          <Select placeholder="Select shift" options={shifts?.shifts?.map((s) => ({ label: s.name, value: s.id })) || []} />
        </Form.Item>

        <Form.Item name="departmentId" label="Department">
          <Select
            placeholder="Select department"
            options={departments?.departments?.map((d) => ({ label: d.name, value: d.id })) || []}
          />
        </Form.Item>

        <Form.Item name="managerId" label="Manager">
          <Select placeholder="Select manager" />
        </Form.Item>
      </Form>
    </Drawer>
  );
}
