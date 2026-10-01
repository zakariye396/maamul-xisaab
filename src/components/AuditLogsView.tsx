import React, { useState, useEffect } from 'react';
import {
  FileText,
  RefreshCw,
  Search,
  Filter,
  Shield,
  Smartphone,
  ShoppingBag,
  Receipt,
  Wallet,
  KeyRound,
  UserCheck,
  Clock,
} from 'lucide-react';
import { AuditLogRecord } from '../types/accounting';

interface AuditLogsViewProps {
  authToken: string;
}

export const AuditLogsView: React.FC<AuditLogsViewProps> = ({ authToken }) => {
  const [logs, setLogs] = useState<AuditLogRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedAction, setSelectedAction] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const fetchLogs = async () => {
    setIsLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedAction !== 'all') params.append('action', selectedAction);
      if (searchQuery.trim()) params.append('search', searchQuery.trim());
      params.append('limit', '100');

      const res = await fetch(`/api/audit-logs?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${authToken}`,
          'Content-Type': 'application/json',
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setLogs(data.data || []);
        setTotal(data.total || 0);
      }
    } catch (e) {
      console.error('Error fetching audit logs', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, [authToken, selectedAction]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLogs();
  };

  const getActionBadge = (action: string) => {
    switch (action) {
      case 'LOGIN_SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <UserCheck className="w-3 h-3 text-emerald-600" />
            <span>Login Success</span>
          </span>
        );
      case 'LOGIN_FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Shield className="w-3 h-3 text-rose-600" />
            <span>Login Failed</span>
          </span>
        );
      case 'LOGOUT':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
            <span>Logout</span>
          </span>
        );
      case 'PASSWORD_CHANGED':
      case 'PASSWORD_RESET':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <KeyRound className="w-3 h-3 text-amber-600" />
            <span>Password Change</span>
          </span>
        );
      case 'PHONE_ADDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Smartphone className="w-3 h-3 text-blue-600" />
            <span>Phone Added</span>
          </span>
        );
      case 'PHONE_SOLD':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
            <ShoppingBag className="w-3 h-3 text-emerald-700" />
            <span>Phone Sold</span>
          </span>
        );
      case 'EXPENSE_CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <Receipt className="w-3 h-3 text-rose-600" />
            <span>Expense</span>
          </span>
        );
      case 'WITHDRAWAL_CREATED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200">
            <Wallet className="w-3 h-3 text-purple-600" />
            <span>Withdrawal</span>
          </span>
        );
      case 'USER_CREATED':
      case 'USER_UPDATED':
      case 'USER_DELETED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
            <Shield className="w-3 h-3 text-indigo-600" />
            <span>{action.replace('_', ' ')}</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
            {action}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl font-black text-slate-900">Diiwaanka Dhacdooyinka (Audit Log)</h1>
            <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200">
              {total} Dhacdooyin
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Diiwaan rasmi ah oo kaydiya galitaanka, iibka, qabashada teleefannada, iyo beddelka xogta maaliyadeed.
          </p>
        </div>

        <button
          onClick={fetchLogs}
          disabled={isLoading}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-bold transition cursor-pointer"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Cusboonaysii</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        {/* Action Tabs Filter */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <span className="text-slate-400 font-bold uppercase text-[10px] mr-1 flex items-center gap-1">
            <Filter className="w-3 h-3" /> Shaandhee:
          </span>
          {[
            { id: 'all', label: 'Dhammaan' },
            { id: 'LOGIN_SUCCESS', label: 'Galitaanka' },
            { id: 'PHONE_ADDED', label: 'Qabashada' },
            { id: 'PHONE_SOLD', label: 'Iibka' },
            { id: 'EXPENSE_CREATED', label: 'Kharashka' },
            { id: 'WITHDRAWAL_CREATED', label: 'Kala-bixidda' },
            { id: 'USER_CREATED', label: 'Users' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setSelectedAction(item.id)}
              className={`px-3 py-1.5 rounded-xl font-bold whitespace-nowrap transition cursor-pointer ${
                selectedAction === item.id
                  ? 'bg-slate-900 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <form onSubmit={handleSearchSubmit} className="relative w-full md:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Raadi username, ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-4">Waqtiga (Timestamp)</th>
                <th className="py-3 px-4">Isticmaalaha</th>
                <th className="py-3 px-4">Ficilka (Action)</th>
                <th className="py-3 px-4">Faahfaahinta (Details)</th>
                <th className="py-3 px-4">IP Address</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {logs.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-slate-400">
                    <FileText className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                    <p className="font-bold text-slate-600">Wax dhacdo ah lama helin</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Shaandhada aad dooratay kuma jiraan diiwaanno.
                    </p>
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{new Date(log.createdAt).toLocaleString()}</span>
                      </div>
                    </td>

                    <td className="py-3 px-4 font-bold text-slate-900">
                      <span className="px-2 py-0.5 bg-slate-100 rounded-md font-mono text-[11px]">
                        @{log.username}
                      </span>
                    </td>

                    <td className="py-3 px-4">{getActionBadge(log.action)}</td>

                    <td className="py-3 px-4 text-slate-700 max-w-md">
                      <span className="font-medium">{log.details || '—'}</span>
                      {log.entityId && (
                        <span className="ml-2 font-mono text-[10px] text-slate-400 bg-slate-50 px-1.5 py-0.5 rounded border border-slate-200">
                          {log.entityType ? `${log.entityType}: ` : ''}
                          {log.entityId}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-[11px] text-slate-400">
                      {log.ipAddress || '127.0.0.1'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
