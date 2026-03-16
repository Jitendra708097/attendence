/**
 * @module InvoiceTable
 * @description Invoice payment history table.
 */
import { Table, Button, Tag, Space } from 'antd';

export default function InvoiceTable({ data, loading, onDownload }) {
  const columns = [
    {
      title: 'Invoice #',
      dataIndex: 'invoiceNumber',
      key: 'invoiceNumber',
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      render: (amount) => `$${amount}`,
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        const color = status === 'paid' ? 'green' : 'orange';
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_, record) => (
        <Space>
          <Button type="link" onClick={() => onDownload(record.id)}>
            Download
          </Button>
        </Space>
      ),
    },
  ];

  return <Table columns={columns} dataSource={data} loading={loading} />;
}