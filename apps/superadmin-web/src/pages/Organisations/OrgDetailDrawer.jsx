/**
 * @module OrgDetailDrawer
 * @description Slide-in org detail panel — 640px wide, tabbed.
 *              Tabs: Overview, Employees, Attendance, Billing, Audit.
 */

import { useState } from 'react';
import { Drawer, Tabs, Table, Spin } from 'antd';
import {
  useGetOrgByIdQuery, useGetOrgEmployeesQuery,
  useGetOrgAttendanceSummaryQuery, useGetOrgBillingHistoryQuery,
} from '@store/api/orgApi.js';
import { useGetOrgAuditLogsQuery } from '@store/api/auditApi.js';
import OrgStatusBadge from '@components/common/OrgStatusBadge.jsx';
import PlanBadge      from '@components/common/PlanBadge.jsx';
import MonoValue      from '@components/common/MonoValue.jsx';
import StatusDot      from '@components/common/StatusDot.jsx';
import { formatINR, formatDate, formatDateTime, formatNumber } from '@utils/formatters.js';
import { AUDIT_ACTION_COLORS } from '@utils/constants.js';

function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between py-2 border-b border-[#1e1e35] last:border-0">
      <span className="text-[#6b6b8a] text-xs font-sans">{label}</span>
      {mono
        ? <MonoValue value={value} color="cyan" size="xs" />
        : <span className="text-[#e8e8f0] text-xs font-sans text-right max-w-[240px] truncate">{value || '—'}</span>
      }
    </div>
  );
}

export default function OrgDetailDrawer({ orgId, open, onClose }) {
  const [activeTab, setActiveTab] = useState('overview');

  const { data: orgData, isLoading: orgLoading } = useGetOrgByIdQuery(orgId, { skip: !orgId });
  const { data: empData,   isLoading: empLoading   } = useGetOrgEmployeesQuery({ id: orgId, params: { limit: 20 } }, { skip: !orgId || activeTab !== 'employees' });
  const { data: attData,   isLoading: attLoading   } = useGetOrgAttendanceSummaryQuery(orgId, { skip: !orgId || activeTab !== 'attendance' });
  const { data: billData,  isLoading: billLoading  } = useGetOrgBillingHistoryQuery({ id: orgId, params: {} }, { skip: !orgId || activeTab !== 'billing' });
  const { data: auditData, isLoading: auditLoading } = useGetOrgAuditLogsQuery({ orgId, params: { limit: 20 } }, { skip: !orgId || activeTab !== 'audit' });

  const org     = orgData?.data;
  const emps    = empData?.data?.employees || [];
  const att     = attData?.data || {};
  const bills   = billData?.data?.invoices || [];
  const audits  = auditData?.data?.logs    || [];

  const empColumns = [
    { title: 'Name',  dataIndex: 'name',  render: (v) => <span className="text-xs text-[#e8e8f0]">{v}</span> },
    { title: 'Email', dataIndex: 'email', render: (v) => <MonoValue value={v} color="muted" size="xs" /> },
    { title: 'Dept',  dataIndex: 'department', render: (v) => <span className="text-xs text-[#6b6b8a]">{v?.name || '—'}</span> },
    { title: 'Status', dataIndex: 'status', render: (v) => <OrgStatusBadge status={v} /> },
  ];

  const billColumns = [
    { title: 'Date',   dataIndex: 'date',   render: (v) => <MonoValue value={formatDate(v)} color="muted" size="xs" /> },
    { title: 'Amount', dataIndex: 'amount', render: (v) => <span className="font-['JetBrains_Mono'] text-xs text-[#ffaa00]">{formatINR(v)}</span> },
    { title: 'Status', dataIndex: 'status', render: (v) => (
      <span className={`text-[10px] font-['JetBrains_Mono'] uppercase ${v === 'paid' ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>{v}</span>
    )},
  ];

  const auditColumns = [
    { title: 'Time',   dataIndex: 'createdAt', width: 140, render: (v) => <MonoValue value={formatDateTime(v)} color="muted" size="xs" /> },
    { title: 'Action', dataIndex: 'action',    render: (v) => (
      <span style={{ color: AUDIT_ACTION_COLORS[v] || '#6b6b8a' }} className="text-[10px] font-['JetBrains_Mono']">{v}</span>
    )},
    { title: 'By', dataIndex: 'performedByName', render: (v) => <span className="text-xs text-[#6b6b8a]">{v || 'System'}</span> },
  ];

  const tabs = [
    {
      key:   'overview',
      label: 'Overview',
      children: orgLoading ? (
        <div className="flex justify-center py-10"><Spin /></div>
      ) : org ? (
        <div className="space-y-1">
          <DetailRow label="Org ID"         value={org.id}                  mono />
          <DetailRow label="Name"           value={org.name}                     />
          <DetailRow label="Slug"           value={`@${org.slug}`}               />
          <DetailRow label="Owner Email"    value={org.ownerEmail}               />
          <DetailRow label="Plan"           value={<PlanBadge plan={org.plan} />} />
          <DetailRow label="Status"         value={<OrgStatusBadge status={org.status} />} />
          <DetailRow label="Employees"      value={formatNumber(org.employeeCount)} mono />
          <DetailRow label="Branches"       value={org.branchCount}          mono />
          <DetailRow label="MRR"            value={formatINR(org.mrr || 0)}       />
          <DetailRow label="Joined"         value={formatDate(org.createdAt)}     />
          <DetailRow label="Trial Ends"     value={formatDate(org.trialEndsAt)}   />
          <DetailRow label="Timezone"       value={org.settings?.timezone}        />
          <DetailRow label="Country"        value={org.settings?.country}         />
        </div>
      ) : null,
    },
    {
      key:   'employees',
      label: 'Employees',
      children: (
        <Table
          columns={empColumns}
          dataSource={emps}
          rowKey="id"
          size="small"
          loading={empLoading}
          pagination={{ pageSize: 10, size: 'small' }}
        />
      ),
    },
    {
      key:   'attendance',
      label: 'Attendance',
      children: attLoading ? (
        <div className="flex justify-center py-10"><Spin /></div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: 'Present Today',  value: att.present,   color: 'text-[#00ff88]' },
            { label: 'Absent',         value: att.absent,    color: 'text-[#ff3366]' },
            { label: 'Late',           value: att.late,      color: 'text-[#ffaa00]' },
            { label: 'Checked In Now', value: att.checkedIn, color: 'text-[#00d4ff]' },
          ].map(({ label, value, color }) => (
            <div key={label} className="bg-[#161625] rounded-md p-3 border border-[#1e1e35]">
              <div className="text-[#6b6b8a] text-[10px] uppercase tracking-widest mb-1">{label}</div>
              <div className={`font-['JetBrains_Mono'] text-2xl font-bold ${color}`}>{value ?? '—'}</div>
            </div>
          ))}
        </div>
      ),
    },
    {
      key:   'billing',
      label: 'Billing',
      children: (
        <Table
          columns={billColumns}
          dataSource={bills}
          rowKey="id"
          size="small"
          loading={billLoading}
          pagination={{ pageSize: 10, size: 'small' }}
        />
      ),
    },
    {
      key:   'audit',
      label: 'Audit',
      children: (
        <Table
          columns={auditColumns}
          dataSource={audits}
          rowKey="id"
          size="small"
          loading={auditLoading}
          pagination={{ pageSize: 10, size: 'small' }}
        />
      ),
    },
  ];

  return (
    <Drawer
      open={open}
      onClose={onClose}
      width={640}
      title={null}
      closeIcon={null}
      styles={{ body: { padding: 0, background: '#0f0f1a' }, header: { display: 'none' } }}
    >
      {/* Drawer header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-[#1e1e35]
                      bg-[#0f0f1a] sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-[#00d4ff]/10 border border-[#00d4ff]/20
                          flex items-center justify-center text-[#00d4ff] text-sm
                          font-['JetBrains_Mono'] font-bold">
            {org?.name?.[0]?.toUpperCase() || '?'}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[#e8e8f0] font-sans font-semibold text-sm">
                {org?.name || 'Loading...'}
              </span>
              {org && <OrgStatusBadge status={org.status} />}
              {org && <PlanBadge plan={org.plan} />}
            </div>
            {org && (
              <span className="font-['JetBrains_Mono'] text-[10px] text-[#6b6b8a]">
                @{org.slug}
              </span>
            )}
          </div>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 flex items-center justify-center rounded text-[#6b6b8a]
                     hover:text-[#e8e8f0] hover:bg-[#161625] transition-colors text-lg"
        >
          ×
        </button>
      </div>

      {/* Tabs */}
      <div className="px-6 pt-4">
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabs}
          size="small"
        />
      </div>
    </Drawer>
  );
}
