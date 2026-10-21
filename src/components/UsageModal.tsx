import React, { useState, useEffect } from 'react';
import { X, BarChart3, Zap, Shield, RefreshCw } from 'lucide-react';
import { UsageSummary } from '../types';
import { api } from '../api';

interface UsageModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const UsageModal: React.FC<UsageModalProps> = ({ isOpen, onClose }) => {
  const [summary, setSummary] = useState<UsageSummary | null>(null);
  const [recentRecords, setRecentRecords] = useState<any[]>([]);
  const [billing, setBilling] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
  }, [isOpen]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [usageRes, billingRes] = await Promise.all([
        api.getUsage(),
        api.getBilling(),
      ]);
      setSummary(usageRes.summary);
      setRecentRecords(usageRes.recentRecords);
      setBilling(billingRes);
    } catch (e) {
      console.error('Failed to load usage data:', e);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[640px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141419]">
          <div className="flex items-center gap-2.5">
            <BarChart3 className="w-5 h-5 text-slate-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">Token Usage & Account Quotas</h2>
              <p className="text-[11px] text-slate-400">
                Live consumption metrics tracked directly on the GentleArrow307 backend ledger.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={loadData}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
              title="Refresh usage statistics"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Top Metric Cards */}
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3.5 bg-[#141419] border border-white/[0.08] rounded-xl space-y-1">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Total Tokens
              </span>
              <div className="text-xl font-bold font-mono text-white">
                {summary?.totalTokens.toLocaleString() || '0'}
              </div>
              <span className="text-[10px] text-slate-400">Prompt & synthesis</span>
            </div>

            <div className="p-3.5 bg-[#141419] border border-white/[0.08] rounded-xl space-y-1">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Input Tokens
              </span>
              <div className="text-xl font-bold font-mono text-slate-300">
                {summary?.totalPromptTokens.toLocaleString() || '0'}
              </div>
              <span className="text-[10px] text-slate-400">Context & RAG</span>
            </div>

            <div className="p-3.5 bg-[#141419] border border-white/[0.08] rounded-xl space-y-1">
              <span className="text-[10px] font-medium text-slate-500 uppercase tracking-wider">
                Generated
              </span>
              <div className="text-xl font-bold font-mono text-slate-300">
                {summary?.totalCompletionTokens.toLocaleString() || '0'}
              </div>
              <span className="text-[10px] text-slate-400">Model responses</span>
            </div>
          </div>

          {/* Model Breakdown */}
          {summary && Object.keys(summary.byModel).length > 0 && (
            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-300">Model Breakdown</div>
              <div className="space-y-2">
                {Object.entries(summary.byModel).map(([modelId, stat]) => (
                  <div
                    key={modelId}
                    className="p-3 bg-[#121217] border border-white/[0.06] rounded-lg flex items-center justify-between text-xs"
                  >
                    <div className="space-y-0.5">
                      <div className="font-medium text-white">{modelId}</div>
                      <div className="text-[11px] text-slate-500">{stat.requests} requests executed</div>
                    </div>
                    <div className="text-right font-mono">
                      <div className="text-slate-200 font-semibold">{stat.totalTokens.toLocaleString()} tokens</div>
                      <div className="text-[10px] text-slate-500">
                        {stat.promptTokens} in · {stat.completionTokens} out
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Plan & MoMo Information */}
          <div className="p-4 bg-[#14141c] border border-white/10 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-semibold text-white">
                  Plan Tier: {billing?.planName || 'Local Workspace Free'}
                </span>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Your workspace runs with full private document storage and unmetered Gemini 3.8 Flash access.
            </p>
            {billing?.momoNotice && (
              <div className="pt-2 border-t border-white/[0.06] text-[10px] text-slate-500">
                <strong>Payment & Upgrade Note:</strong> {billing.momoNotice}
              </div>
            )}
          </div>

          {/* Recent Records Ledger */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-300">Recent Request Ledger</div>
            <div className="space-y-1.5 max-h-48 overflow-y-auto">
              {recentRecords.length === 0 ? (
                <div className="text-center py-4 text-xs text-slate-500">No requests recorded yet</div>
              ) : (
                recentRecords.map(rec => (
                  <div
                    key={rec.id}
                    className="flex items-center justify-between px-3 py-2 bg-[#111116] rounded-md text-xs border border-white/[0.04]"
                  >
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-300">
                      <Zap className="w-3 h-3 text-amber-400 shrink-0" />
                      <span>{rec.model}</span>
                    </div>
                    <div className="flex items-center gap-3 text-slate-400 text-[11px]">
                      <span className="font-mono">{rec.totalTokens} tokens</span>
                      <span className="text-[10px] text-slate-500">
                        {new Date(rec.timestamp).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0b0b0e] border-t border-white/[0.06] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.08] hover:bg-white/15 rounded-lg transition-colors"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
