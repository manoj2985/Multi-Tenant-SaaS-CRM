import React from 'react';
import { Terminal, Cpu, Code2 } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 mt-auto py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <Code2 className="w-4 h-4 text-indigo-400" />
            <span>Pure JavaScript Tech Stack &bull; Express.js &bull; Prisma &bull; PostgreSQL &bull; React &bull; Tailwind</span>
          </div>

          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <Terminal className="w-3.5 h-3.5 text-slate-500" />
              Node.js v22+
            </span>
            <span className="flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-slate-500" />
              Docker Containers Ready
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}
