/**
 * @module LoginPage
 * @description Super admin login — dark command center aesthetic.
 *              Grid background, glowing cyan branding, dark inputs.
 *              No "forgot password" — founder-only access.
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch } from 'react-redux';
import { Input, Form } from 'antd';
import { EyeInvisibleOutlined, EyeTwoTone, LockOutlined, MailOutlined } from '@ant-design/icons';
import { useSuperAdminLoginMutation } from '@store/api/authApi.js';
import { loginSuccess } from '@store/authSlice.js';
import { parseError } from '@utils/errorHandler.js';

export default function LoginPage() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();
  const location  = useLocation();
  const [form]    = Form.useForm();
  const [error, setError] = useState('');

  const [login, { isLoading }] = useSuperAdminLoginMutation();

  const from = location.state?.from?.pathname || '/dashboard';

  const handleSubmit = async (values) => {
    setError('');
    try {
      const res = await login(values).unwrap();
      dispatch(loginSuccess(res.data));
      navigate(from, { replace: true });
    } catch (err) {
      setError(parseError(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30,30,53,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,30,53,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      {/* Glow orb */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
                      w-96 h-96 bg-[#00d4ff]/5 rounded-full blur-3xl pointer-events-none" />

      {/* Login card */}
      <div className="relative z-10 w-full max-w-sm mx-4 animate-fade-in">
        <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-xl p-8
                        shadow-[0_24px_80px_rgba(0,0,0,0.8)]
                        hover:border-[#00d4ff]/20 transition-colors duration-500">

          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-3 mb-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/30
                                flex items-center justify-center">
                  <span className="text-[#00d4ff] text-lg font-['JetBrains_Mono'] font-bold">A</span>
                </div>
                {/* Glow pulse */}
                <div className="absolute inset-0 rounded-lg bg-[#00d4ff]/10 animate-glow-pulse" />
              </div>
              <span className="text-[#00d4ff] text-xl font-['JetBrains_Mono'] font-bold tracking-tight">
                AttendEase
              </span>
            </div>
            <p className="text-[#6b6b8a] text-[10px] uppercase tracking-[0.25em] font-sans">
              Super Admin Console
            </p>
            <div className="mt-4 h-px bg-gradient-to-r from-transparent via-[#1e1e35] to-transparent" />
          </div>

          {/* Error message */}
          {error && (
            <div className="mb-4 px-3 py-2.5 bg-[#ff3366]/10 border border-[#ff3366]/30
                            rounded-md text-[#ff3366] text-xs font-sans flex items-center gap-2">
              <span className="text-base">⚠</span>
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <Form
            form={form}
            onFinish={handleSubmit}
            layout="vertical"
            requiredMark={false}
          >
            <Form.Item
              name="email"
              rules={[
                { required: true, message: 'Email required' },
                { type: 'email', message: 'Invalid email' },
              ]}
            >
              <Input
                prefix={<MailOutlined className="text-[#6b6b8a] mr-1" />}
                placeholder="admin@attendease.com"
                size="large"
                className="bg-[#161625] border-[#1e1e35] text-[#e8e8f0]
                           placeholder:text-[#6b6b8a] font-sans"
                style={{ fontFamily: 'Geist, sans-serif' }}
              />
            </Form.Item>

            <Form.Item
              name="password"
              rules={[{ required: true, message: 'Password required' }]}
            >
              <Input.Password
                prefix={<LockOutlined className="text-[#6b6b8a] mr-1" />}
                placeholder="Password"
                size="large"
                iconRender={(visible) =>
                  visible
                    ? <EyeTwoTone twoToneColor="#00d4ff" />
                    : <EyeInvisibleOutlined className="text-[#6b6b8a]" />
                }
                style={{ fontFamily: 'Geist, sans-serif' }}
              />
            </Form.Item>

            <Form.Item className="mb-0 mt-6">
              <button
                type="submit"
                disabled={isLoading}
                className={`
                  w-full py-3 rounded-md font-['JetBrains_Mono'] font-bold text-sm
                  text-[#080810] bg-[#00d4ff] tracking-wider uppercase
                  transition-all duration-200 disabled:opacity-60
                  hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] hover:scale-[1.01]
                  active:scale-[0.99]
                `}
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-[#080810]/40 border-t-[#080810]
                                     rounded-full animate-spin" />
                    Authenticating...
                  </span>
                ) : (
                  'Access Console →'
                )}
              </button>
            </Form.Item>
          </Form>
        </div>

        {/* Footer */}
        <div className="text-center mt-6 space-y-1">
          <p className="text-[#6b6b8a] text-[10px] font-['JetBrains_Mono']">
            admin.attendease.com
          </p>
          <p className="text-[#1e1e35] text-[10px] font-sans">
            Access restricted to authorized IP only
          </p>
        </div>
      </div>
    </div>
  );
}
