/**
 * @module NotFoundPage
 * @description Dark-themed 404 page with glitch effect and navigation back.
 */

import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#080810] flex items-center justify-center relative overflow-hidden">
      {/* Grid background */}
      <div
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `
            linear-gradient(rgba(30,30,53,0.8) 1px, transparent 1px),
            linear-gradient(90deg, rgba(30,30,53,0.8) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />

      <div className="relative z-10 text-center px-6 animate-fade-in">
        {/* 404 */}
        <div className="font-['JetBrains_Mono'] text-[120px] font-bold leading-none
                        text-[#00d4ff]/10 select-none mb-2"
             style={{ textShadow: '0 0 40px rgba(0,212,255,0.1)' }}>
          404
        </div>

        {/* Error code */}
        <div className="font-['JetBrains_Mono'] text-xs text-[#ff3366] uppercase tracking-[0.3em] mb-4">
          ROUTE_NOT_FOUND
        </div>

        <h2 className="text-[#e8e8f0] font-sans text-lg font-semibold mb-2">
          Page not found
        </h2>
        <p className="text-[#6b6b8a] text-sm font-sans mb-8 max-w-xs mx-auto">
          The route you navigated to doesn't exist in the super admin portal.
        </p>

        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="px-5 py-2 rounded-md text-sm font-sans text-[#6b6b8a]
                       hover:text-[#e8e8f0] bg-[#161625] border border-[#1e1e35]
                       hover:border-[#00d4ff]/30 transition-colors"
          >
            ← Go Back
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-5 py-2 rounded-md text-sm font-['JetBrains_Mono'] font-semibold
                       text-[#080810] bg-[#00d4ff]
                       hover:shadow-[0_0_20px_rgba(0,212,255,0.4)] transition-all"
          >
            Dashboard
          </button>
        </div>

        {/* Terminal-style footer */}
        <div className="mt-12 font-['JetBrains_Mono'] text-[10px] text-[#6b6b8a]/40">
          admin.attendease.com · Super Admin Console v1.0.0
        </div>
      </div>
    </div>
  );
}
