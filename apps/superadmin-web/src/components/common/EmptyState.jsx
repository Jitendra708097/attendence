/**
 * @module EmptyState
 * @description Dark-themed empty state for tables and panels.
 *              Shows icon, title, description, and optional action button.
 */

export default function EmptyState({ icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      {icon && (
        <div className="w-12 h-12 rounded-full bg-[#161625] border border-[#1e1e35]
                        flex items-center justify-center text-2xl mb-4 text-[#6b6b8a]">
          {icon}
        </div>
      )}
      <p className="text-[#e8e8f0] text-sm font-sans font-medium mb-1">
        {title || 'No data'}
      </p>
      {description && (
        <p className="text-[#6b6b8a] text-xs font-sans max-w-xs">
          {description}
        </p>
      )}
      {action && (
        <div className="mt-4">{action}</div>
      )}
    </div>
  );
}
