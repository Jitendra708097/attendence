/**
 * @module HolidayForm
 * @description Form to create/edit holidays.
 */
import { Form, Input, Button, Modal, DatePicker } from 'antd';
import { useState, useEffect } from 'react';
import dayjs from 'dayjs';

export default function HolidayForm({ open, holiday, onClose, onSubmit, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (holiday) {
      form.setFieldsValue({
        ...holiday,
        date: dayjs(holiday.date),
      });
    } else {
      form.resetFields();
    }
  }, [holiday, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit({
        ...values,
        date: values.date.format('YYYY-MM-DD'),
      });
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Modal
      title={holiday ? 'Edit Holiday' : 'Add Holiday'}
      open={open}
      onCancel={onClose}
      onOk={handleSubmit}
      confirmLoading={loading}
    >
      <Form form={form} layout="vertical">
        <Form.Item
          name="name"
          label="Holiday Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>
        <Form.Item
          name="date"
          label="Date"
          rules={[{ required: true }]}
        >
          <DatePicker />
        </Form.Item>
        <Form.Item name="description" label="Description">
          <Input.TextArea rows={3} />
        </Form.Item>
      </Form>
    </Modal>
  );
}