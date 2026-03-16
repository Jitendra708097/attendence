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
        <Form.Item name="allowRemoteCheckIn" valuePropName="checked">
          <Checkbox>Allow Remote Check-in</Checkbox>
        </Form.Item>

        <Form.Item name="requireGeofence" valuePropName="checked">
          <Checkbox>Require Geofence Validation</Checkbox>
        </Form.Item>

        <Form.Item name="requireFaceRecognition" valuePropName="checked">
          <Checkbox>Require Face Recognition</Checkbox>
        </Form.Item>

        <Form.Item name="toleranceMinutes" label="Late Tolerance (minutes)">
          <InputNumber />
        </Form.Item>

        <Button type="primary" loading={loading} onClick={handleSubmit} className="mt-4">
          Save Settings
        </Button>
      </Form>
    </Card>
  );
}