/**
 * @module AttendanceSettings
 * @description Attendance system settings.
 */
import { Form, Input, Button, Card, Checkbox, Row, Col, InputNumber } from 'antd';
import { useState, useEffect } from 'react';

export default function AttendanceSettings({ settings, onSubmit, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (settings) {
      form.setFieldsValue(settings);
    }
  }, [settings, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Card title="Attendance Settings">
      <Form form={form} layout="vertical" initialValues={settings || {}}>
        <Form.Item
          name="checkInTime"
          label="Check-In Time"
          rules={[{ required: true }]}
        >
          <Input type="time" />
        </Form.Item>

        <Form.Item
          name="checkOutTime"
          label="Check-Out Time"
          rules={[{ required: true }]}
        >
          <Input type="time" />
        </Form.Item>

        <Form.Item
          name="allowedLateMinutes"
          label="Allowed Late Minutes"
          rules={[{ required: true, type: 'number' }]}
        >
          <InputNumber />
        </Form.Item>

        <Form.Item name="geofencingEnabled" valuePropName="checked">
          <Checkbox>Enable Geofencing</Checkbox>
        </Form.Item>

        <Form.Item name="faceRecognitionEnabled" valuePropName="checked">
          <Checkbox>Enable Face Recognition</Checkbox>
        </Form.Item>

        <Button type="primary" loading={loading} onClick={handleSubmit}>
          Save Settings
        </Button>
      </Form>
    </Card>
  );
}