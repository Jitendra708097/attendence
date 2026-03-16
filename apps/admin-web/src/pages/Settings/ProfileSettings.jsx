/**
 * @module ProfileSettings
 * @description Organization profile settings.
 */
import { Form, Input, Button, Space, Card, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { useState, useEffect } from 'react';

export default function ProfileSettings({ org, onSubmit, loading }) {
  const [form] = Form.useForm();

  useEffect(() => {
    if (org) {
      form.setFieldsValue(org);
    }
  }, [org, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      onSubmit(values);
    } catch (error) {
      console.error('Validation failed:', error);
    }
  };

  return (
    <Card title="Organization Profile">
      <Form form={form} layout="vertical" initialValues={org || {}}>
        <Form.Item
          name="name"
          label="Organization Name"
          rules={[{ required: true }]}
        >
          <Input />
        </Form.Item>

        <Form.Item
          name="email"
          label="Email"
          rules={[{ required: true, type: 'email' }]}
        >
          <Input />
        </Form.Item>

        <Form.Item name="phone" label="Phone">
          <Input />
        </Form.Item>

        <Form.Item name="address" label="Address">
          <Input.TextArea rows={3} />
        </Form.Item>

        <Form.Item name="timezone" label="Timezone">
          <Input />
        </Form.Item>

        <Form.Item name="logo" label="Logo">
          <Upload accept="image/*" maxCount={1}>
            <Button icon={<UploadOutlined />}>Upload Logo</Button>
          </Upload>
        </Form.Item>

        <Button type="primary" loading={loading} onClick={handleSubmit}>
          Save Changes
        </Button>
      </Form>
    </Card>
  );
}