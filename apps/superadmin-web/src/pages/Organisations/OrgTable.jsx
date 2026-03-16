/**
 * @module OrgTable
 * @description Dense paginated organisation table with filtering and actions.
 *              Row tints for suspended/trial-expiring orgs.
 *              Actions: View, Impersonate, Suspend/Activate, Change Plan, Extend Trial, Audit Log.
 */

import { useState } from 'react';
import { Table, Dropdown, Tooltip } from 'antd';
import {
  MoreOutlined, EyeOutlined, UserSwitchOutlined, StopOutlined,
  CheckCircleOutlined, SwapOutlined, ClockCircleOutlined, AuditOutlined,
} from '@ant-design/icons';
import OrgStatusBadge from '@components/common/OrgStatusBadge.jsx';
import PlanBadge      from '@components/common/PlanBadge.jsx';
import MonoValue      from '@components/common/MonoValue.jsx';
import { formatINR, formatDate, formatTrialEnd, formatNumber } from '@utils/formatters.js';
import { PAGE_SIZE } from '@utils/constants.js';
import dayjs from 'dayjs';

export default function OrgTable({
  data        = [],
  total       = 0,
  loading     = false,
  page        = 1,
  onPageChange,
  onViewDetail,
  onSuspend,
  onActivate,
  onChangePlan,
  onExtendTrial,
  onImpersonate,
  onViewAudit,
}) {
  const columns = [
    {
      title:     '#',
      dataIndex: 'rowNum',
      width:     44,
      render:    (_, __, idx) => (
        <MonoValue value={(page - 1) * PAGE_SIZE + idx + 1} color="muted" size="xs" />
      ),
    },
    {
      title:     'Organisation',
      dataIndex: 'name',
      width:     200,
      render:    (name, record) => (
        <div>
          <div className="text-[#e8e8f0] text-xs font-sans font-medium truncate max-w-[180px]">
            {name}
          </div>
          <MonoValue value={`@${record.slug}`} color="muted" size="xs" />
        </div>
      ),
    },
    {
      title:     'Plan',
      dataIndex: 'plan',
      width:     90,
      render:    (plan) => <PlanBadge plan={plan} />,
    },
    {
      title:     'Status',
      dataIndex: 'status',
      width:     100,
      render:    (status) => <OrgStatusBadge status={status} />,
    },
    {
      title:     'Employees',
      dataIndex: 'employeeCount',
      width:     90,
      align:     'right',
      render:    (v) => <MonoValue value={formatNumber(v)} color="cyan" size="xs" />,
    },
    {
      title:     'MRR',
      dataIndex: 'mrr',
      width:     100,
      align:     'right',
      render:    (v) => (
        <span className="font-['JetBrains_Mono'] text-xs text-[#ffaa00]">
          {formatINR(v || 0)}
        </span>
      ),
    },
    {
      title:     'Joined',
      dataIndex: 'createdAt',
      width:     100,
      render:    (v) => <MonoValue value={formatDate(v)} color="muted" size="xs" />,
    },
    {
      title:     'Trial Ends',
      dataIndex: 'trialEndsAt',
      width:     100,
      render:    (v, record) => {
        if (record.plan !== 'trial' || !v) return <span className="text-[#6b6b8a] text-xs">—</span>;
        const { text, isUrgent } = formatTrialEnd(v);
        return (
          <span className={`font-['JetBrains_Mono'] text-xs ${isUrgent ? 'text-[#ff3366]' : 'text-[#ffaa00]'}`}>
            {text}
          </span>
        );
      },
    },
    {
      title:  'Actions',
      key:    'actions',
      width:  56,
      fixed:  'right',
      render: (_, record) => {
        const isActive    = record.status === 'active' || record.status === 'trial';
        const isTrial     = record.status === 'trial';

        const items = [
          {
            key:   'view',
            icon:  <EyeOutlined />,
            label: 'View Details',
            onClick: () => onViewDetail?.(record),
          },
          {
            key:   'impersonate',
            icon:  <UserSwitchOutlined className="text-[#a855f7]" />,
            label: <span className="text-[#a855f7]">Impersonate</span>,
            onClick: () => onImpersonate?.(record),
          },
          { type: 'divider' },
          isActive ? {
            key:     'suspend',
            icon:    <StopOutlined className="text-[#ff3366]" />,
            label:   <span className="text-[#ff3366]">Suspend</span>,
            onClick: () => onSuspend?.(record),
          } : {
            key:     'activate',
            icon:    <CheckCircleOutlined className="text-[#00ff88]" />,
            label:   <span className="text-[#00ff88]">Activate</span>,
            onClick: () => onActivate?.(record),
          },
          {
            key:   'plan',
            icon:  <SwapOutlined />,
            label: 'Change Plan',
            onClick: () => onChangePlan?.(record),
          },
          isTrial && {
            key:   'trial',
            icon:  <ClockCircleOutlined />,
            label: 'Extend Trial',
            onClick: () => onExtendTrial?.(record),
          },
          { type: 'divider' },
          {
            key:   'audit',
            icon:  <AuditOutlined />,
            label: 'View Audit Log',
            onClick: () => onViewAudit?.(record),
          },
        ].filter(Boolean);

        return (
          <Dropdown menu={{ items }} trigger={['click']} placement="bottomRight">
            <button className="w-7 h-7 flex items-center justify-center rounded
                               text-[#6b6b8a] hover:text-[#e8e8f0] hover:bg-[#161625]
                               transition-colors">
              <MoreOutlined />
            </button>
          </Dropdown>
        );
      },
    },
  ];

  const getRowClassName = (record) => {
    if (record.status === 'suspended') return 'ant-table-row-suspended';
    const { isUrgent } = formatTrialEnd(record.trialEndsAt);
    if (record.plan === 'trial' && isUrgent) return 'ant-table-row-trial-expiring';
    return '';
  };

  return (
    <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg overflow-hidden">
      <Table
        columns={columns}
        dataSource={data}
        rowKey="id"
        size="small"
        loading={loading}
        rowClassName={getRowClassName}
        scroll={{ x: 900 }}
        pagination={{
          current:   page,
          pageSize:  PAGE_SIZE,
          total,
          onChange:  onPageChange,
          showTotal: (t) => (
            <span className="font-['JetBrains_Mono'] text-xs text-[#6b6b8a]">
              {formatNumber(t)} orgs
            </span>
          ),
          showSizeChanger: false,
          className: 'px-4',
        }}
        onRow={(record) => ({
          onDoubleClick: () => onViewDetail?.(record),
        })}
      />
    </div>
  );
}
