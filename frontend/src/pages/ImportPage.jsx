import React, { useState } from 'react';
import { previewImport, processImport } from '../services/importExportService';
import { FileSpreadsheet, Upload, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';

export default function ImportPage() {
  const [entityType, setEntityType] = useState('CUSTOMER');
  const [fileContent, setFileContent] = useState('');
  const [fileName, setFileName] = useState('');
  const [preview, setPreview] = useState(null);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = (evt) => {
      const text = evt.target.result;
      setFileContent(text);
      handlePreview(text);
    };
    reader.readAsText(file);
  };

  const handlePreview = async (text) => {
    try {
      setLoading(true);
      const res = await previewImport(entityType, text);
      if (res.success) setPreview(res.data);
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to preview CSV file');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmImport = async () => {
    try {
      setImporting(true);
      const res = await processImport(entityType, fileName, fileContent);
      if (res.success) {
        setImportResult(res.data);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'CSV Import failed');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <FileSpreadsheet className="w-7 h-7 text-indigo-400" /> Data Import Wizard
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Upload and validate CSV files to bulk import customers and leads into your tenant database.
        </p>
      </div>

      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Target Entity</label>
            <select
              value={entityType}
              onChange={(e) => { setEntityType(e.target.value); setPreview(null); }}
              className="w-full p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white"
            >
              <option value="CUSTOMER">CUSTOMER</option>
              <option value="LEAD">LEAD</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1.5">Select CSV File</label>
            <input
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              className="w-full text-xs text-slate-400 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-500 cursor-pointer"
            />
          </div>
        </div>

        {/* Sample Template Tip */}
        <div className="p-3 bg-slate-900/60 rounded-xl text-slate-400 text-[11px]">
          Sample Header Row: <code className="text-indigo-300 font-mono">name,email,phone,companyName,industry</code>
        </div>
      </div>

      {loading && <div className="text-center py-8 text-slate-400 text-xs">Parsing & validating CSV headers...</div>}

      {/* Import Preview */}
      {preview && !importResult && (
        <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-4">
          <h2 className="font-bold text-sm text-white">Import Validation Preview</h2>
          <div className="grid grid-cols-4 gap-3 text-center">
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px]">TOTAL ROWS</span>
              <div className="text-lg font-bold text-white">{preview.totalRows}</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px]">VALID ROWS</span>
              <div className="text-lg font-bold text-emerald-400">{preview.validRows}</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px]">INVALID ROWS</span>
              <div className="text-lg font-bold text-rose-400">{preview.invalidRows}</div>
            </div>
            <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
              <span className="text-slate-400 text-[10px]">COLUMNS</span>
              <div className="text-lg font-bold text-indigo-400">{preview.detectedColumns?.length || 0}</div>
            </div>
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleConfirmImport}
              disabled={importing || preview.validRows === 0}
              className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              {importing ? 'Processing Batch Import...' : 'Confirm & Execute Import'} <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Completion Summary */}
      {importResult && (
        <div className="p-6 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 space-y-3">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-6 h-6 text-emerald-400 shrink-0" />
            <h3 className="font-bold text-sm text-white">CSV Import Completed Successfully</h3>
          </div>
          <p className="text-xs text-slate-300">
            Successfully imported <strong>{importResult.successfulRows}</strong> records into {entityType}. (Failed: {importResult.failedRows})
          </p>
        </div>
      )}
    </div>
  );
}
