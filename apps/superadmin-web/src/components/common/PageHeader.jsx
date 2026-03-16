/**
 * @module PageHeader
 * @description Page title bar with optional subtitle, count badge, and actions.
 *              Used at the top of every page in the portal.
 */

export default function PageHeader({ title, subtitle, count, actions, children }) {
  return (
    <div className="flex items-start justify-between mb-6">
      <div>
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-['Geist'] font-semibold text-[#e8e8f0] tracking-tight">
            {title}
          </h1>
          {count != null && (
            <span className="font-['JetBrains_Mono'] text-xs text-[#6b6b8a] bg-[#161625]
                             border border-[#1e1e35] px-2 py-0.5 rounded">
              {count}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-[#6b6b8a] text-sm mt-0.5 font-sans">{subtitle}</p>
        )}
        {children}
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 ml-4">
          {actions}
        </div>
      )}
    </div>
  );
}
