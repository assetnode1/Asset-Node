import React from 'react';
import { X, Check, Cpu, Zap, Eye, MessageSquare, ShieldCheck, AlertCircle } from 'lucide-react';
import { ModelCapability } from '../types';

interface ModelSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  models: ModelCapability[];
  currentModelId: string;
  onSelectModel: (modelId: string) => void;
}

export const ModelSelectorModal: React.FC<ModelSelectorModalProps> = ({
  isOpen,
  onClose,
  models,
  currentModelId,
  onSelectModel,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141419]">
          <div className="flex items-center gap-2.5">
            <Cpu className="w-5 h-5 text-slate-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">Model Selection & Architecture</h2>
              <p className="text-[11px] text-slate-400">
                Choose the model runtime for this conversation. Only configured and tested adapters are available.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Model Cards */}
        <div className="p-6 space-y-3.5 overflow-y-auto max-h-[480px]">
          {models.map(model => {
            const isSelected = model.id === currentModelId;
            const isLocal = model.provider === 'localai';
            const isUnavailable = model.status === 'offline_local';

            return (
              <div
                key={model.id}
                onClick={() => {
                  if (!isUnavailable) {
                    onSelectModel(model.id);
                    onClose();
                  }
                }}
                className={`group relative p-4 rounded-xl border transition-all ${
                  isUnavailable
                    ? 'bg-[#111116]/50 border-white/[0.04] opacity-75 cursor-not-allowed'
                    : isSelected
                    ? 'bg-white/[0.08] border-white/20 shadow-[0_4px_20px_rgba(255,255,255,0.05)] cursor-pointer'
                    : 'bg-[#131317] border-white/[0.08] hover:border-white/20 hover:bg-white/[0.02] cursor-pointer'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1 pr-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold text-white">{model.name}</span>
                      <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-300">
                        {model.provider}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                          <Check className="w-3 h-3" /> Active
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 leading-relaxed">
                      {model.description}
                    </p>
                  </div>

                  {/* Speed Badge */}
                  <div className="shrink-0 text-right">
                    <div className="flex items-center gap-1 text-[11px] font-medium text-slate-300">
                      <Zap className="w-3 h-3 text-amber-400" />
                      <span>{model.speed}</span>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 mt-0.5">
                      {(model.contextWindow / 1000).toFixed(0)}k context
                    </div>
                  </div>
                </div>

                {/* Capability Badges */}
                <div className="mt-3 pt-3 border-t border-white/[0.05] flex items-center justify-between text-[11px] text-slate-400">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center gap-1">
                      <MessageSquare className="w-3 h-3 text-slate-500" /> Text
                    </span>
                    {model.capabilities.vision && (
                      <span className="flex items-center gap-1 text-slate-300">
                        <Eye className="w-3 h-3 text-slate-400" /> Vision
                      </span>
                    )}
                    <span className="flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-slate-500" /> Streaming SSE
                    </span>
                  </div>

                  {/* Status notice */}
                  {isUnavailable ? (
                    <span className="text-[10px] text-amber-400/90 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Dedicated host needed
                    </span>
                  ) : (
                    <span className="text-[10px] text-emerald-400">Ready</span>
                  )}
                </div>

                {/* Local model hardware requirement note */}
                {isLocal && (
                  <div className="mt-2 text-[10px] text-slate-500 bg-[#09090c] p-2 rounded border border-white/[0.04]">
                    <strong>Hardware Note:</strong> GentleArrow307 provides a LocalAI profile for CPU execution (Qwen3 0.6B). In Google AI Studio web containers, model calls route to Gemini 3.8 Flash via server-side secrets.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-[#0b0b0e] border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
          <span>Server-side key security: keys are never exposed in browser bundles.</span>
          <button
            onClick={onClose}
            className="px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/15 text-white font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
