/**
 * @module AuditLogsPage
 * @description Full audit log explorer — dense table, filtering by org/action/date.
 *              Click row to expand full JSON detail. Color-coded actions.
 *              Export to CSV. Pre-filters from navigation state.
 */

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Table, Select, DatePicker, Tooltip, message } from 'antd';
import { DownloadOutlined, ExpandAltOutlined } from '@ant-design/icons';
import { useGetAuditLogsQuery } from '@store/api/auditApi.js';
import { useDebounce } from '@hooks/useDebounce.js';
import { AUDIT_ACTION_COLORS, AUDIT_ACTIONS, PAGE_SIZE } from '@utils/constants.js';
import { formatDateTime, formatTimeAgo } from '@utils/formatters.js';
import PageHeader from '@components/common/PageHeader.jsx';
import MonoValue  from '@components/common/MonoValue.jsx';

const { RangePicker } = DatePicker;

export default function AuditLogsPage() {
  const location = useLocation();
  const preOrgId   = location.state?.orgId   || '';
  const preOrgName = location.state?.orgName || '';

  const [orgSearch,  setOrgSearch]  = useState(preOrgId);
  const [actionType, setActionType] = useState('');
  const [dateRange,  setDateRange]  = useState(null);
  const [page,       setPage]       = useState(1);
  const [expanded,   setExpanded]   = useState({});

  const debouncedOrg = useDebounce(orgSearch, 300);

  const { data, isLoading, isFetching } = useGetAuditLogsQuery({
    page,
    limit:     PAGE_SIZE,
    orgId:     debouncedOrg || undefined,
    action:    actionType   || undefined,
    startDate: dateRange?.[0]?.toISOString(),
    endDate:   dateRange?.[1]?.toISOString(),
  });

  const logs  = data?.data?.logs  || [];
  const total = data?.data?.total || 0;

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const columns = [
    {
      title:     'Timestamp',
      dataIndex: 'createdAt',
      width:     150,
      render:    (v) => (
        <Tooltip title={formatDateTime(v)}>
          <MonoValue value={formatTimeAgo(v)} color="muted" size="xs" />
        </Tooltip>
      ),
    },
    {
      title:     'Org',
      dataIndex: 'orgName',
      width:     150,
      render:    (v, r) => (
        <div>
          <div className="text-[#e8e8f0] text-xs truncate max-w-[140px]">{v || 'System'}</div>
          {r.orgSlug && <MonoValue value={`@${r.orgSlug}`} color="muted" size="xs" />}
        </div>
      ),
    },
    {
      title:     'Action',
      dataIndex: 'action',
      width:     180,
      render:    (v) => (
        <span
          style={{ color: AUDIT_ACTION_COLORS[v] || '#6b6b8a' }}
          className="text-[10px] font-['JetBrains_Mono'] uppercase tracking-wider"
        >
          {v}
        </span>
      ),
    },
    {
      title:     'Performed By',
      dataIndex: 'performedByName',
      width:     140,
      render:    (v, r) => (
        <div>
          <span className="text-xs text-[#e8e8f0]">{v || 'System'}</span>
          {r.impersonatedBy && (
            <div className="text-[#a855f7] text-[10px] font-['JetBrains_Mono']">via Impersonation</div>
          )}
        </div>
      ),
    },
    {
      title:     'Target',
      dataIndex: 'targetName',
      width:     130,
      render:    (v) => <span className="text-[#6b6b8a] text-xs">{v || '—'}</span>,
    },
    {
      title:     'IP',
      dataIndex: 'ipAddress',
      width:     110,
      render:    (v) => <MonoValue value={v || '—'} color="muted" size="xs" />,
    },
    {
      title:  '⋯',
      key:    'expand',
      width:  40,
      render: (_, r) => (
        <button
          onClick={() => toggleExpand(r.id)}
          className="text-[#6b6b8a] hover:text-[#00d4ff] transition-colors"
        >
          <ExpandAltOutlined className="text-xs" />
        </button>
      ),
    },
  ];

  const actionOptions = Object.values(AUDIT_ACTIONS).map((a) => ({
    value: a,
    label: (
      <span style={{ color: AUDIT_ACTION_COLORS[a] || '#6b6b8a' }} className="text-[11px] font-['JetBrains_Mono']">
        {a}
      </span>
    ),
  }));

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Audit Logs"
        count={total}
        subtitle={preOrgName ? `Filtered: ${preOrgName}` : 'All platform activity'}
        actions={
          <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-sans
                             text-[#6b6b8a] hover:text-[#e8e8f0] bg-[#161625] border border-[#1e1e35]
                             hover:border-[#00d4ff]/30 transition-colors">
            <DownloadOutlined />
            Export CSV
          </button>
        }
      />

      {/* Filters */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <input
          value={orgSearch}
          onChange={(e) => { setOrgSearch(e.target.value); setPage(1); }}
          placeholder="Filter by Org ID or name..."
          className="px-3 py-2 bg-[#161625] border border-[#1e1e35] rounded-md
                     text-[#e8e8f0] text-xs font-sans placeholder-[#6b6b8a] outline-none
                     focus:border-[#00d4ff]/50 transition-colors w-52"
        />
        <Select
          value={actionType || undefined}
          placeholder="All Actions"
          allowClear
          onChange={(v) => { setActionType(v || ''); setPage(1); }}
          style={{ width: 220 }}
          options={actionOptions}
          optionLabelProp="label"
        />
        <RangePicker
          onChange={(dates) => { setDateRange(dates); setPage(1); }}
          size="small"
          style={{ borderColor: '#1e1e35' }}
        />
      </div>

      {/* Table with expandable rows */}
      <div className="bg-[#0f0f1a] border border-[#1e1e35] rounded-lg overflow-hidden">
        <Table
          columns={columns}
          dataSource={logs}
          rowKey="id"
          size="small"
          loading={isLoading || isFetching}
          scroll={{ x: 900 }}
          expandable={{
            expandedRowKeys: Object.keys(expanded).filter((k) => expanded[k]),
            expandedRowRender: (record) => (
              <div className="bg-[#161625] rounded-md p-4 m-2 font-['JetBrains_Mono'] text-xs text-[#00d4ff]">
                <pre className="whitespace-pre-wrap break-all">
                  {JSON.stringify(record.metadata || {}, null, 2)}
                </pre>
              </div>
            ),
            expandIcon: () => null, // We use our own expand button
          }}
          pagination={{
            current:  page,
            pageSize: PAGE_SIZE,
            total,
            onChange: setPage,
            showTotal: (t) => (
              <span className="font-['JetBrains_Mono'] text-xs text-[#6b6b8a]">{t} entries</span>
            ),
            showSizeChanger: false,
          }}
        />
      </div>
    </div>
  );
}
