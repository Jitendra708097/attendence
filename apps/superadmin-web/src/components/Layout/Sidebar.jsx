/**
 * @module Sidebar
 * @description Dark command center navigation sidebar.
 *              Collapsible, cyan active state with left border indicator.
 *              Shows badge counts for orgs, alerts, active impersonation.
 */

import { NavLink, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { Tooltip } from 'antd';
import {
  DashboardOutlined, ApartmentOutlined, DollarOutlined,
  UserSwitchOutlined, AuditOutlined, MonitorOutlined,
  BarChartOutlined, ControlOutlined, LogoutOutlined,
  MenuFoldOutlined, MenuUnfoldOutlined,
} from '@ant-design/icons';
import { selectSidebarCollapsed, toggleSidebar } from '@store/uiSlice.js';
import { selectImpersonation } from '@store/uiSlice.js';
import { logout } from '@store/authSlice.js';
import { useGetDashboardStatsQuery } from '@store/api/analyticsApi.js';
import { useGetPlatformHealthQuery } from '@store/api/healthApi.js';
import StatusDot from '@components/common/StatusDot.jsx';

const NAV_ITEMS = [
  { path: '/dashboard',     label: 'Dashboard',       Icon: DashboardOutlined    },
  { path: '/organisations', label: 'Organisations',   Icon: ApartmentOutlined,   badgeKey: 'orgCount'       },
  { path: '/revenue',       label: 'Revenue',          Icon: DollarOutlined       },
  { path: '/impersonation', label: 'Impersonation',   Icon: UserSwitchOutlined,  badgeKey: 'impersonation'  },
  { path: '/audit-logs',    label: 'Audit Logs',       Icon: AuditOutlined        },
  { path: '/health',        label: 'Platform Health', Icon: MonitorOutlined,     badgeKey: 'healthIssues'   },
  { path: '/analytics',     label: 'Analytics',        Icon: BarChartOutlined     },
  { path: '/feature-flags', label: 'Feature Flags',   Icon: ControlOutlined      },
];

export default function Sidebar() {
  const dispatch      = useDispatch();
  const navigate      = useNavigate();
  const collapsed     = useSelector(selectSidebarCollapsed);
  const impersonation = useSelector(selectImpersonation);

  const { data: dashData } = useGetDashboardStatsQuery(undefined, {
    pollingInterval: 60000,
  });
  const { data: healthData } = useGetPlatformHealthQuery(undefined, {
    pollingInterval: 30000,
  });

  const stats = dashData?.data || {};
  const health = healthData?.data || {};

  const getBadge = (key) => {
    if (key === 'impersonation' && impersonation) return '●';
    if (key === 'healthIssues') {
      const hasIssues = health.status === 'degraded' || health.status === 'down';
      return hasIssues ? '!' : null;
    }
    return null;
  };

  const handleLogout = async () => {
    dispatch(logout());
    navigate('/login');
  };

  return (
    <aside
      className={`
        flex flex-col bg-[#0a0a14] border-r border-[#1e1e35]
        transition-all duration-300 h-full flex-shrink-0
        ${collapsed ? 'w-14' : 'w-52'}
      `}
    >
      {/* Logo */}
      <div className={`
        flex items-center border-b border-[#1e1e35] h-14 flex-shrink-0
        ${collapsed ? 'justify-center px-3' : 'px-4 gap-3'}
      `}>
        <div className="relative flex-shrink-0">
          <div className="w-7 h-7 rounded-md bg-[#00d4ff]/10 border border-[#00d4ff]/30
                          flex items-center justify-center">
            <span className="text-[#00d4ff] text-xs font-['JetBrains_Mono'] font-bold">A</span>
          </div>
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00d4ff]
                           animate-ping opacity-60" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#00d4ff]" />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className="text-[#e8e8f0] text-sm font-['JetBrains_Mono'] font-bold tracking-tight leading-none">
              AttendEase
            </div>
            <div className="text-[#6b6b8a] text-[9px] uppercase tracking-[0.15em] mt-0.5">
              Super Admin
            </div>
          </div>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto overflow-x-hidden">
        {NAV_ITEMS.map(({ path, label, Icon, badgeKey }) => {
          const badge = badgeKey ? getBadge(badgeKey) : null;

          return (
            <Tooltip key={path} title={collapsed ? label : ''} placement="right">
              <NavLink
                to={path}
                className={({ isActive }) => `
                  flex items-center mx-2 mb-0.5 px-2.5 py-2 rounded-md
                  font-sans text-[13px] transition-all duration-150 relative
                  ${isActive
                    ? 'bg-[#00d4ff]/10 text-[#00d4ff] border-l-2 border-[#00d4ff]'
                    : 'text-[#6b6b8a] hover:text-[#e8e8f0] hover:bg-[#161625] border-l-2 border-transparent'
                  }
                  ${collapsed ? 'justify-center' : 'gap-3'}
                `}
              >
                <Icon className="text-base flex-shrink-0" />
                {!collapsed && (
                  <span className="flex-1 truncate">{label}</span>
                )}
                {!collapsed && badge && (
                  <span className={`
                    ml-auto text-[10px] font-['JetBrains_Mono'] font-bold px-1.5 py-0.5 rounded
                    ${badge === '!' ? 'bg-[#ff3366] text-white' : 'bg-[#a855f7] text-white'}
                  `}>
                    {badge}
                  </span>
                )}
                {collapsed && badge && (
                  <span className={`
                    absolute top-1 right-1 w-2 h-2 rounded-full
                    ${badge === '!' ? 'bg-[#ff3366]' : 'bg-[#a855f7]'}
                  `} />
                )}
              </NavLink>
            </Tooltip>
          );
        })}
      </nav>

      {/* Bottom */}
      <div className="border-t border-[#1e1e35] p-3">
        {/* Health indicator */}
        {!collapsed && (
          <div className="mb-3 px-1">
            <div className="flex items-center gap-2">
              <StatusDot status={health.overall || 'healthy'} showLabel={false} />
              <span className="text-[10px] font-['JetBrains_Mono'] text-[#6b6b8a]">
                {health.overall === 'degraded' ? 'Degraded' : health.overall === 'down' ? 'Down' : 'All systems go'}
              </span>
            </div>
          </div>
        )}

        {/* Platform version */}
        {!collapsed && (
          <div className="text-[10px] font-['JetBrains_Mono'] text-[#6b6b8a] px-1 mb-2">
            v1.0.0
          </div>
        )}

        {/* Logout */}
        <Tooltip title={collapsed ? 'Logout' : ''} placement="right">
          <button
            onClick={handleLogout}
            className={`
              w-full flex items-center rounded-md px-2.5 py-2
              text-[#6b6b8a] hover:text-[#ff3366] hover:bg-[#ff3366]/10
              transition-all duration-150 font-sans text-[13px]
              ${collapsed ? 'justify-center' : 'gap-3'}
            `}
          >
            <LogoutOutlined className="text-base flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </Tooltip>

        {/* Collapse toggle */}
        <button
          onClick={() => dispatch(toggleSidebar())}
          className="w-full flex items-center justify-center mt-2 py-1.5
                     text-[#6b6b8a] hover:text-[#00d4ff] transition-colors"
        >
          {collapsed
            ? <MenuUnfoldOutlined className="text-sm" />
            : <MenuFoldOutlined   className="text-sm" />
          }
        </button>
      </div>
    </aside>
  );
}
