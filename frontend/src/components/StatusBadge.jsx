import React from 'react';

export function StatusBadge({ status, label }) {
  const isHealthy = status === 'healthy' || status === 'connected' || status === true || status === 'OK';
  
  return (
    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-slate-900/80 border border-slate-800">
      <span className="relative flex h-2.5 w-2.5">
        {isHealthy && (
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
        )}
        <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isHealthy ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
      </span>
      <span className={isHealthy ? 'text-emerald-400' : 'text-rose-400'}>
        {label || (isHealthy ? 'Operational' : 'Degraded')}
      </span>
    </div>
  );
}
