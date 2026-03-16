/**
 * @module FeatureFlagsPage
 * @description Feature flag control panel — global toggles and per-org overrides.
 *              Cards for each flag. Org search to add overrides.
 */

import { useState } from 'react';
import { Switch, Select, Popconfirm, message, Tooltip } from 'antd';
import { CloseOutlined } from '@ant-design/icons';
import {
  useGetAllFlagsQuery, useSetGlobalFlagMutation,
  useSetOrgFlagOverrideMutation, useRemoveOrgFlagOverrideMutation,
} from '@store/api/featureFlagApi.js';
import { useSearchOrgsQuery } from '@store/api/orgApi.js';
import { useDebounce } from '@hooks/useDebounce.js';
import { FEATURE_FLAGS } from '@utils/constants.js';
import { parseError } from '@utils/errorHandler.js';
import PageHeader from '@components/common/PageHeader.jsx';

const TIER_COLORS = {
  V2:       { bg: 'bg-[#00d4ff]/10', text: 'text-[#00d4ff]', border: 'border-[#00d4ff]/20' },
  V3:       { bg: 'bg-[#a855f7]/10', text: 'text-[#a855f7]', border: 'border-[#a855f7]/20' },
  Internal: { bg: 'bg-[#ffaa00]/10', text: 'text-[#ffaa00]', border: 'border-[#ffaa00]/20' },
};

function FlagCard({ flagDef, flagState, onToggleGlobal, onAddOverride, onRemoveOverride }) {
  const [orgSearch, setOrgSearch] = useState('');
  const [overrideEnabled, setOverrideEnabled] = useState(true);
  const debouncedQ = useDebounce(orgSearch, 300);

  const { data: searchData } = useSearchOrgsQuery(
    { q: debouncedQ },
    { skip: debouncedQ.length < 2 }
  );

  const orgOptions = (searchData?.data?.orgs || []).map((o) => ({
    value: o.id,
    label: `${o.name} (@${o.slug})`,
    org:   o,
  }));

  const tierCfg = TIER_COLORS[flagDef.tier] || TIER_COLORS.V2;
  const isEnabled = flagState?.globalEnabled ?? false;
  const overrides = flagState?.orgOverrides  ?? [];

  return (
    <div className={`
      bg-[#0f0f1a] border rounded-lg p-5 transition-all duration-200
      ${isEnabled ? 'border-[#00d4ff]/20' : 'border-[#1e1e35]'}
    `}>
      {/* Header */}
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-['JetBrains_Mono'] text-xs font-semibold text-[#e8e8f0] uppercase tracking-wider">
              {flagDef.key}
            </span>
            <span className={`
              text-[9px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded border
              ${tierCfg.bg} ${tierCfg.text} ${tierCfg.border}
            `}>
              {flagDef.tier}
            </span>
          </div>
          <p className="text-[#6b6b8a] text-xs font-sans">{flagDef.description}</p>
        </div>
        <div className="ml-3 flex-shrink-0">
          <Tooltip title={isEnabled ? 'Disable globally' : 'Enable globally'}>
            <Switch
              checked={isEnabled}
              onChange={(val) => onToggleGlobal(flagDef.key, val)}
              size="small"
            />
          </Tooltip>
        </div>
      </div>

      {/* Global status */}
      <div className="text-[10px] font-['JetBrains_Mono'] mb-3">
        <span className="text-[#6b6b8a]">Global: </span>
        <span className={isEnabled ? 'text-[#00ff88]' : 'text-[#6b6b8a]'}>
          {isEnabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>

      {/* Org overrides */}
      <div className="border-t border-[#1e1e35] pt-3">
        <div className="text-[9px] text-[#6b6b8a] uppercase tracking-[0.15em] mb-2">
          Org Overrides ({overrides.length})
        </div>

        {overrides.map((ov) => (
          <div key={ov.orgId} className="flex items-center justify-between py-1.5 border-b border-[#1e1e35] last:border-0">
            <div className="flex items-center gap-2">
              <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${ov.enabled ? 'bg-[#00ff88]' : 'bg-[#ff3366]'}`} />
              <span className="text-[#e8e8f0] text-xs">{ov.orgName}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className={`text-[10px] font-['JetBrains_Mono'] ${ov.enabled ? 'text-[#00ff88]' : 'text-[#ff3366]'}`}>
                {ov.enabled ? 'ON' : 'OFF'}
              </span>
              <button
                onClick={() => onRemoveOverride(flagDef.key, ov.orgId)}
                className="text-[#6b6b8a] hover:text-[#ff3366] transition-colors"
              >
                <CloseOutlined className="text-[10px]" />
              </button>
            </div>
          </div>
        ))}

        {/* Add override */}
        <div className="flex gap-2 mt-2">
          <Select
            showSearch
            placeholder="Add org override..."
            onSearch={setOrgSearch}
            filterOption={false}
            onChange={(val, opt) => {
              if (opt?.org) onAddOverride(flagDef.key, opt.org, overrideEnabled);
            }}
            options={orgOptions}
            style={{ flex: 1 }}
            size="small"
            notFoundContent={
              debouncedQ.length < 2
                ? <span className="text-[#6b6b8a] text-xs px-2">Type to search...</span>
                : null
            }
          />
          <Switch
            checked={overrideEnabled}
            onChange={setOverrideEnabled}
            size="small"
            checkedChildren="ON"
            unCheckedChildren="OFF"
          />
        </div>
      </div>
    </div>
  );
}

export default function FeatureFlagsPage() {
  const { data: flagsData, isLoading } = useGetAllFlagsQuery();
  const [setGlobal]        = useSetGlobalFlagMutation();
  const [setOverride]      = useSetOrgFlagOverrideMutation();
  const [removeOverride]   = useRemoveOrgFlagOverrideMutation();

  const flagsState = flagsData?.data?.flags || {};

  const handleToggleGlobal = async (key, enabled) => {
    try {
      await setGlobal({ key, enabled }).unwrap();
      message.success(`${key} ${enabled ? 'enabled' : 'disabled'} globally`);
    } catch (err) {
      message.error(parseError(err));
    }
  };

  const handleAddOverride = async (key, org, enabled) => {
    try {
      await setOverride({ key, orgId: org.id, enabled }).unwrap();
      message.success(`Override set for ${org.name}`);
    } catch (err) {
      message.error(parseError(err));
    }
  };

  const handleRemoveOverride = async (key, orgId) => {
    try {
      await removeOverride({ key, orgId }).unwrap();
      message.success('Override removed');
    } catch (err) {
      message.error(parseError(err));
    }
  };

  return (
    <div className="animate-fade-in">
      <PageHeader
        title="Feature Flags"
        subtitle="Global toggles and per-org overrides"
        count={FEATURE_FLAGS.length}
      />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURE_FLAGS.map((_, i) => (
            <div key={i} className="h-52 bg-[#0f0f1a] border border-[#1e1e35] rounded-lg animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {FEATURE_FLAGS.map((flagDef) => (
            <FlagCard
              key={flagDef.key}
              flagDef={flagDef}
              flagState={flagsState[flagDef.key]}
              onToggleGlobal={handleToggleGlobal}
              onAddOverride={handleAddOverride}
              onRemoveOverride={handleRemoveOverride}
            />
          ))}
        </div>
      )}
    </div>
  );
}
