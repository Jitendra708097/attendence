/**
 * @module AppLayout
 * @description Main layout wrapper with sidebar, header, and content area.
 */
import { Outlet } from 'react-router-dom';
import { Layout } from 'antd';
import Sidebar from './Sidebar.jsx';
import Header from './Header.jsx';

const { Content } = Layout;

export default function AppLayout() {
  return (
    <Layout className="min-h-screen bg-gray-50">
      <Sidebar />
      <Layout className="flex flex-col">
        <Header />
        <Content className="flex-1 p-6 overflow-auto bg-gray-50">
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  );
}
