/**
 * @module BranchForm
 * @description Form to create/edit branches.
 */
import { Form, Input, Button, Modal, message } from 'antd';
import { useState, useEffect } from 'react';

export default function BranchForm({ open, branch, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (branch) {
      form.setFieldsValue(branch);
    } else {
      form.resetFields();
    }
  }, [branch, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      // Validation errors are automatically shown in form
      // Only show message for other errors
      if (error.errorFields) {
        // Validation errors from form
        return;
      }
      message.error('Failed to validate form. Please check your input.');
    }
  };

  return (
    <Modal
      title={branch ? 'Edit Branch' : 'Add Branch'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Branch Name"
          rules={[{ required: true, message: 'Please enter branch name' }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="location"
          label="Location"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item name="address" label="Address">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}