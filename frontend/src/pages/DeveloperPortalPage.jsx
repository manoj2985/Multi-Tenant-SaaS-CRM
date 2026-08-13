import React from 'react';
import { Code, Terminal, Shield, BookOpen, ExternalLink, Zap } from 'lucide-react';

export default function DeveloperPortalPage() {
  return (
    <div className="space-y-6 max-w-5xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <Code className="w-7 h-7 text-indigo-400" /> Developer Portal & Documentation
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Technical specifications for building custom integrations with the Multi-Tenant SaaS CRM REST API.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <Terminal className="w-6 h-6 text-indigo-400" />
          <h3 className="font-bold text-sm text-white">REST API Base URL</h3>
          <p className="text-xs font-mono text-emerald-400 bg-slate-900 p-2 rounded-lg border border-slate-800">
            http://localhost:5000/api/v1
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <Shield className="w-6 h-6 text-emerald-400" />
          <h3 className="font-bold text-sm text-white">API Authentication</h3>
          <p className="text-xs text-slate-400">
            Header: <code className="text-indigo-300">Authorization: Bearer crm_live_...</code>
          </p>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
          <BookOpen className="w-6 h-6 text-amber-400" />
          <h3 className="font-bold text-sm text-white">OpenAPI / Swagger Specs</h3>
          <a
            href="http://localhost:5000/api-docs"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-xs text-indigo-400 hover:underline font-bold"
          >
            Launch Interactive Swagger UI <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      {/* HMAC Verification Code Example */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <Zap className="w-5 h-5 text-amber-400" /> Webhook HMAC-SHA256 Signature Verification
        </h2>
        <p className="text-xs text-slate-400">
          All outbound webhook dispatches include an <code className="text-amber-300">X-CRM-Signature</code> header computed via HMAC SHA-256 using your webhook secret.
        </p>

        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 font-mono text-xs text-slate-300 space-y-2 overflow-x-auto">
          <div className="text-slate-500">// Node.js Express Webhook Verification Example</div>
          <pre>{`const crypto = require('crypto');

app.post('/webhook-endpoint', (req, res) => {
  const signature = req.headers['x-crm-signature'];
  const webhookSecret = 'whsec_your_secret_here';

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (signature !== expectedSignature) {
    return res.status(401).send('Invalid signature');
  }

  console.log('Valid Webhook Event:', req.body.event);
  res.status(200).send('OK');
});`}</pre>
        </div>
      </div>
    </div>
  );
}
