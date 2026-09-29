import React, { useState } from 'react';
import {
  Database,
  Terminal,
  Download,
  Upload,
  RefreshCw,
  Copy,
  Check,
  Scale,
  Sparkles,
} from 'lucide-react';
import { MYSQL_SCHEMA, SQL_QUERIES } from '../data/sqlSchema';
import { AccountingSummary, ExpenseRecord, Partner, PhoneRecord, TransactionRecord, WithdrawalRecord } from '../types/accounting';

interface SettingsViewProps {
  summary: AccountingSummary;
  phones: PhoneRecord[];
  expenses: ExpenseRecord[];
  withdrawals: WithdrawalRecord[];
  transactions: TransactionRecord[];
  onReset: () => void;
  onLoadTestCase: () => void;
  onImportJson: (data: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  summary,
  phones,
  expenses,
  withdrawals,
  transactions,
  onReset,
  onLoadTestCase,
  onImportJson,
}) => {
  const [activeCodeTab, setActiveCodeTab] = useState<'schema' | 'queries'>('schema');
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleExport = () => {
    const backup = {
      exportDate: new Date().toISOString(),
      shop: 'Phone Trading Hub (Zakariye & Shariif)',
      summary,
      phones,
      expenses,
      withdrawals,
      transactions,
    };
    const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `phone-hub-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        onImportJson(json);
      } catch (err) {
        alert('Faylka JSON ma saxna!');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base sm:text-lg font-black text-slate-900 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-600" />
            <span>Database Architecture & Data Management</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            SQL DDL Schema, Queries xisaabta, Export/Import, iyo Tijaabada Rasmiga ah (Example Test)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onLoadTestCase}
            className="px-3.5 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-xs border border-blue-200 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Scale className="w-4 h-4" />
            <span>Load Example Test ($130 / $180 / $50)</span>
          </button>

          <button
            onClick={handleExport}
            className="px-3.5 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs hover:bg-slate-800 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Export JSON</span>
          </button>

          <label className="px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer text-slate-700">
            <Upload className="w-4 h-4" />
            <span>Import JSON</span>
            <input type="file" accept=".json" onChange={handleFileInput} className="hidden" />
          </label>

          <button
            onClick={onReset}
            className="px-3.5 py-2 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50 font-bold text-xs flex items-center gap-1.5 transition cursor-pointer"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Reset Data</span>
          </button>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-950 rounded-2xl border border-slate-800 shadow-xl overflow-hidden text-white">
        <div className="p-4 bg-slate-900 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveCodeTab('schema')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeCodeTab === 'schema' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              1. MySQL / PostgreSQL Schema
            </button>
            <button
              onClick={() => setActiveCodeTab('queries')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                activeCodeTab === 'queries' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              2. Financial Calculation SQL Queries
            </button>
          </div>

          <button
            onClick={() => handleCopy(activeCodeTab === 'schema' ? MYSQL_SCHEMA : SQL_QUERIES)}
            className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300 flex items-center gap-1.5 transition cursor-pointer"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied!' : 'Copy SQL'}</span>
          </button>
        </div>

        <pre className="p-5 font-mono text-xs text-emerald-400 overflow-x-auto max-h-[550px] leading-relaxed">
          {activeCodeTab === 'schema' ? MYSQL_SCHEMA : SQL_QUERIES}
        </pre>
      </div>
    </div>
  );
};
