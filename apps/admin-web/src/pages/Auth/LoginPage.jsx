/**
 * @module LoginPage
 * @description Email + password login form for org admin.
 *              Authenticates user, stores tokens in Redux + localStorage.
 *              Redirects to /dashboard on success.
 */
import { Form, Input, Button, Card, Space, Row, Col, message, Checkbox } from 'antd';
import { LockOutlined, MailOutlined } from '@ant-design/icons';
import { useNavigate, Link } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { useLoginMutation } from '../../store/api/authApi.js';
import { setAuth } from '../../store/authSlice.js';
import { parseApiError } from '../../utils/errorHandler.js';
import styles from './auth.module.css';


export default function LoginPage() {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const [login, { isLoading }] = useLoginMutation();

  const onFinish = async (values) => {
    try {
      const response = await login({ email: values.email, password: values.password }).unwrap();
      dispatch(
        setAuth({
          user: response.user,
          accessToken: response.accessToken,
          refreshToken: response.refreshToken,
          org: response.org,
        })
      );
      message.success('Login successful!');
      navigate('/dashboard');
    } catch (error) {
      message.error(parseApiError(error));
    }
  };

  return (
    <Row justify="center" align="middle" style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
      <Col xs={22} sm={20} md={12} lg={8}>
        <Card className={styles.loginCard}>
          <div className={styles.logoSection}>
            <h1>AttendEase</h1>
            <p>Admin Portal</p>
          </div>

          <Form form={form} layout="vertical" onFinish={onFinish} requiredMark={true}>
            <Form.Item
              name="email"
              label="Email"
              rules={[
                { required: true, message: 'Please enter your email' },
                { type: 'email', message: 'Please enter a valid email' },
              ]}
            >
              <Input prefix={<MailOutlined />} placeholder="admin@company.com" size="large" />
            </Form.Item>

            <Form.Item
              name="password"
              label="Password"
              rules={[{ required: true, message: 'Please enter your password' }]}
            >
              <Input.Password prefix={<LockOutlined />} placeholder="••••••••" size="large" />
            </Form.Item>

            <Form.Item name="remember" valuePropName="checked" initialValue={false}>
              <Checkbox>Remember me</Checkbox>
            </Form.Item>

            <Form.Item>
              <Button type="primary" htmlType="submit" loading={isLoading} block size="large">
                Sign In
              </Button>
            </Form.Item>

            <div className={styles.footer}>
              <Link to="/forgot-password">Forgot password?</Link>
            </div>
          </Form>
        </Card>
      </Col>
    </Row>
  );
}
