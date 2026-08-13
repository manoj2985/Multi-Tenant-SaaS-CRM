import React, { useState } from 'react';
import { 
  Server, 
  Database, 
  Activity, 
  RefreshCw, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Cpu, 
  Layers, 
  Box, 
  Zap,
  Check
} from 'lucide-react';
import { SYSTEM_MODULES } from '../utils/constants';

export function Dashboard({ healthData, loading, error, lastChecked, refetch }) {
  const [activeTab, setActiveTab] = useState('overview');

  const isApiConnected = !!healthData?.success;
  const isDbConnected = healthData?.database?.status === 'healthy' || healthData?.database?.status === 'connected';

  return (
    <div className="space-y-8">
      {/* Hero Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl glass-card p-8 border border-slate-800 bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900">
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-12 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/10 border border-indigo-500/30 text-indigo-300">
              <Zap className="w-3.5 h-3.5 text-indigo-400" />
              <span>Phase 1 — Foundation Active</span>
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
              Multi-Tenant SaaS CRM Platform
            </h2>
            <p className="text-slate-400 text-sm max-w-2xl">
              Clean modular foundation powered by Express.js, Prisma ORM, PostgreSQL, and React. Architected for enterprise tenant isolation and scalable performance.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={refetch}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 transition-all shadow-lg shadow-indigo-600/30 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Ping Backend API</span>
            </button>
          </div>
        </div>
      </div>

      {/* Health Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {/* Card 1: API Gateway Status */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Express Server</span>
            <div className={`p-2.5 rounded-xl ${isApiConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Server className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              {isApiConnected ? 'Running' : 'Offline'}
              {isApiConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              ) : (
                <XCircle className="w-5 h-5 text-rose-400" />
              )}
            </div>
            <p className="text-xs text-slate-400 mt-1">Endpoint: <code className="text-indigo-300">GET /api/health</code></p>
          </div>
        </div>

        {/* Card 2: Database Connection */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">PostgreSQL + Prisma</span>
            <div className={`p-2.5 rounded-xl ${isDbConnected ? 'bg-emerald-500/10 text-emerald-400' : 'bg-rose-500/10 text-rose-400'}`}>
              <Database className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white flex items-center gap-2">
              {isDbConnected ? 'Connected' : 'Unavailable'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Latency: <span className="font-semibold text-emerald-400">{healthData?.database?.latencyMs ?? 0} ms</span>
            </p>
          </div>
        </div>

        {/* Card 3: Server Memory / Uptime */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">System Uptime</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Clock className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">
              {healthData?.uptimeSeconds ? `${healthData.uptimeSeconds}s` : 'N/A'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Heap: <span className="font-semibold text-slate-200">{healthData?.system?.memoryUsage?.heapUsedMb ?? 0} MB</span>
            </p>
          </div>
        </div>

        {/* Card 4: Architecture */}
        <div className="glass-card glass-card-hover p-6 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Environment</span>
            <div className="p-2.5 rounded-xl bg-violet-500/10 text-violet-400">
              <Cpu className="w-5 h-5" />
            </div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white capitalize">
              {healthData?.environment || 'Development'}
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Node: <span className="font-semibold text-slate-200">{healthData?.system?.nodeVersion || process.version}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Main Section Tabbed View */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setActiveTab('overview')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'overview'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              System Overview & Architecture
            </button>
            <button
              onClick={() => setActiveTab('payload')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'payload'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Live Health Payload
            </button>
            <button
              onClick={() => setActiveTab('roadmap')}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                activeTab === 'roadmap'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/30'
                  : 'text-slate-400 hover:text-white hover:bg-slate-900'
              }`}
            >
              Phase Roadmap
            </button>
          </div>

          <div className="text-xs text-slate-500 hidden sm:block">
            Last polled: <span className="text-slate-400 font-mono">{lastChecked || 'Just now'}</span>
          </div>
        </div>

        {/* Tab 1: System Overview */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Layers className="w-5 h-5 text-indigo-400" />
                Backend Layered Architecture
              </h3>

              <div className="space-y-4 text-sm text-slate-300">
                <p>
                  The backend follows a production-grade separation of concerns pattern designed for high maintainability:
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-indigo-400 uppercase">Routes & Controllers</span>
                    <p className="text-xs text-slate-400">Receives HTTP requests, validates input parameters, and returns standard JSON responses.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-indigo-400 uppercase">Services Layer</span>
                    <p className="text-xs text-slate-400">Encapsulates domain logic, workflow orchestration, and tenant context resolution.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-indigo-400 uppercase">Repositories Layer</span>
                    <p className="text-xs text-slate-400">Handles database access exclusively through Prisma ORM query interface.</p>
                  </div>
                  <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 space-y-1">
                    <span className="text-xs font-bold text-indigo-400 uppercase">Centralized Middleware</span>
                    <p className="text-xs text-slate-400">Manages request logging, CORS, body parsing, 404 handling, and error capture.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Box className="w-5 h-5 text-indigo-400" />
                Foundation Stack
              </h3>
              <ul className="space-y-3 text-xs">
                <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">Runtime</span>
                  <span className="font-semibold text-indigo-300">Node.js (JavaScript ES6+)</span>
                </li>
                <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">Web Framework</span>
                  <span className="font-semibold text-indigo-300">Express.js</span>
                </li>
                <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">Database</span>
                  <span className="font-semibold text-indigo-300">PostgreSQL</span>
                </li>
                <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">ORM</span>
                  <span className="font-semibold text-indigo-300">Prisma</span>
                </li>
                <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">Frontend UI</span>
                  <span className="font-semibold text-indigo-300">React + Tailwind CSS</span>
                </li>
                <li className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/50 border border-slate-800">
                  <span className="text-slate-400">Containerization</span>
                  <span className="font-semibold text-indigo-300">Docker Compose</span>
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* Tab 2: Live Health Payload */}
        {activeTab === 'payload' && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-400" />
                Raw JSON Response from <code className="text-xs text-indigo-300 bg-slate-900 px-2 py-1 rounded">GET /api/health</code>
              </h3>
              {error && (
                <span className="text-xs text-rose-400 font-semibold">{error}</span>
              )}
            </div>

            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-emerald-400 font-mono text-xs overflow-x-auto leading-relaxed">
              {healthData ? JSON.stringify(healthData, null, 2) : error ? JSON.stringify({ error }, null, 2) : '// Loading response...'}
            </pre>
          </div>
        )}

        {/* Tab 3: Phase Roadmap */}
        {activeTab === 'roadmap' && (
          <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-6">
            <h3 className="text-lg font-bold text-white">Multi-Tenant CRM Development Roadmap</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-indigo-950/40 border border-indigo-500/40 flex items-start gap-4">
                <div className="p-2 rounded-lg bg-indigo-600 text-white mt-0.5">
                  <Check className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-bold text-white text-sm">Phase 1: Foundation (Completed)</h4>
                  <p className="text-xs text-slate-400 mt-0.5">Project structure, Node.js + Express backend, Prisma ORM, PostgreSQL connection, React frontend, health check endpoints, Docker Compose orchestration.</p>
                </div>
              </div>

              {SYSTEM_MODULES.map((mod) => (
                <div key={mod.id} className="p-4 rounded-xl bg-slate-900/60 border border-slate-800/80 flex items-start gap-4 opacity-75">
                  <div className="p-2 rounded-lg bg-slate-800 text-slate-400 mt-0.5">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h4 className="font-bold text-slate-300 text-sm">{mod.name}</h4>
                      <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-400">{mod.phase}</span>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">Scheduled for implementation in later phases.</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
