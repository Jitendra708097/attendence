/**
 * @module ForgotPasswordPage
 * @description Forgot password page placeholder.
 */
import { Result, Button } from 'antd';
import { useNavigate } from 'react-router-dom';

export default function ForgotPasswordPage() {
  const navigate = useNavigate();

  return (
    <Result
      status="404"
      title="Forgot Password"
      subTitle="This feature is coming soon"
      extra={
        <Button type="primary" onClick={() => navigate('/login')}>
          Back to Login
        </Button>
      }
    />
  );
}
