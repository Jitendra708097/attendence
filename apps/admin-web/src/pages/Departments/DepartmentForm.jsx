/**
 * @module DepartmentForm
 * @description Form to create/edit departments.
 */
import { Form, Input, Button, Modal } from 'antd';
import { useState, useEffect } from 'react';

export default function DepartmentForm({ open, department, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (department) {
      form.setFieldsValue(department);
    } else {
      form.resetFields();
    }
  }, [department, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={department ? 'Edit Department' : 'Add Department'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Department Name"
          rules={[{ required: true, message: 'Please enter department name' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="code" label="Department Code">
          <Input />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}