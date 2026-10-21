import React, { useState } from 'react';
import {
  X,
  User as UserIcon,
  Sliders,
  Download,
  Trash2,
  Server,
  Command,
  Check,
  AlertTriangle,
  ExternalLink,
} from 'lucide-react';
import { User } from '../types';
import { api } from '../api';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUserUpdated: (user: User) => void;
  onAccountDeleted: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onAccountDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'profile' | 'ai' | 'shortcuts' | 'architecture'>('profile');
  const [displayName, setDisplayName] = useState(user?.displayName || '');
  const [systemInstruction, setSystemInstruction] = useState(user?.systemInstruction || '');
  const [temperature, setTemperature] = useState<number>(user?.temperature ?? 0.7);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setError(null);
    try {
      const updated = await api.updateProfile({
        displayName,
        systemInstruction,
        temperature,
      });
      onUserUpdated(updated);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to save profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleExportData = async () => {
    try {
      await api.exportAccount();
    } catch (err: any) {
      setError(err.message || 'Export failed');
    }
  };

  const handleDeleteAccount = async () => {
    if (confirm('Are you absolutely certain? This will permanently erase your account, all conversations, file attachments, and private knowledge bases. This action is irreversible.')) {
      try {
        await api.deleteAccount();
        onAccountDeleted();
        onClose();
      } catch (err: any) {
        setError(err.message || 'Failed to delete account');
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-2xl bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[640px]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141419]">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">GentleArrow307 Settings</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="text-xs text-slate-400">Workspace & Privacy</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center px-6 border-b border-white/[0.06] bg-[#0b0b0e] text-xs">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-3 px-3 font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'profile'
                ? 'border-white text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <UserIcon className="w-3.5 h-3.5" />
            <span>Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('ai')}
            className={`py-3 px-3 font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'ai'
                ? 'border-white text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>AI Persona & Params</span>
          </button>

          <button
            onClick={() => setActiveTab('shortcuts')}
            className={`py-3 px-3 font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'shortcuts'
                ? 'border-white text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Command className="w-3.5 h-3.5" />
            <span>Keyboard Shortcuts</span>
          </button>

          <button
            onClick={() => setActiveTab('architecture')}
            className={`py-3 px-3 font-medium transition-colors border-b-2 -mb-px flex items-center gap-2 ${
              activeTab === 'architecture'
                ? 'border-white text-white'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Server className="w-3.5 h-3.5" />
            <span>Architecture & Deploy</span>
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 p-6 overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 bg-rose-500/10 border border-rose-500/20 rounded-lg text-xs text-rose-300">
              {error}
            </div>
          )}

          {/* Profile Tab */}
          {activeTab === 'profile' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Display Name</label>
                <input
                  type="text"
                  value={displayName}
                  onChange={e => setDisplayName(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-[#141419] border border-white/15 rounded-lg text-white focus:outline-none focus:border-white/40"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Account Email</label>
                <input
                  type="email"
                  value={user?.email || ''}
                  disabled
                  className="w-full px-3 py-2 text-xs bg-[#0b0b0e] border border-white/10 rounded-lg text-slate-400 cursor-not-allowed"
                />
              </div>

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-200 text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Changes Saved</span>
                    </>
                  ) : (
                    <span>Save Profile</span>
                  )}
                </button>
              </div>

              {/* Data Export and Erasure */}
              <div className="pt-6 border-t border-white/[0.08] space-y-3">
                <div className="text-xs font-semibold text-slate-300">Data Portability & Erasure</div>
                <p className="text-[11px] text-slate-400">
                  Export all your conversations, knowledge bases, and messages in structured JSON format, or permanently wipe your account.
                </p>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={handleExportData}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-slate-200 bg-[#16161d] border border-white/10 hover:border-white/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5 text-slate-400" />
                    <span>Download Account Data (JSON)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDeleteAccount}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs text-rose-400 bg-rose-500/10 border border-rose-500/20 hover:bg-rose-500/20 rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Account Permanently</span>
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* AI Persona Tab */}
          {activeTab === 'ai' && (
            <form onSubmit={handleSaveProfile} className="space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-medium text-slate-300">Custom System Instruction</label>
                <textarea
                  value={systemInstruction}
                  onChange={e => setSystemInstruction(e.target.value)}
                  placeholder="You are GentleArrow307, a calm, disciplined, private AI assistant..."
                  rows={4}
                  className="w-full px-3 py-2 text-xs bg-[#141419] border border-white/15 rounded-lg text-white font-mono focus:outline-none focus:border-white/40"
                />
                <p className="text-[10px] text-slate-500">
                  Instructs the assistant on its persona and tone across all new conversation turns.
                </p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-slate-300">Model Temperature: {temperature}</span>
                  <span className="text-slate-500 font-mono text-[11px]">
                    {temperature < 0.4 ? 'Precise & Deterministic' : temperature > 0.8 ? 'Creative & Exploratory' : 'Balanced'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1.5"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(parseFloat(e.target.value))}
                  className="w-full accent-slate-300 cursor-pointer"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium bg-slate-200 text-slate-900 rounded-lg hover:bg-white transition-colors cursor-pointer"
                >
                  {saveSuccess ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Saved</span>
                    </>
                  ) : (
                    <span>Save AI Settings</span>
                  )}
                </button>
              </div>
            </form>
          )}

          {/* Shortcuts Tab */}
          {activeTab === 'shortcuts' && (
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-300">Keyboard Shortcuts</div>
              <div className="grid gap-2 text-xs">
                <div className="flex items-center justify-between p-2.5 bg-[#141419] rounded-lg border border-white/[0.06]">
                  <span className="text-slate-300">Search conversations</span>
                  <kbd className="px-2 py-1 bg-[#1e1e26] border border-white/10 rounded font-mono text-[11px] text-slate-300">
                    ⌘K / Ctrl+K
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#141419] rounded-lg border border-white/[0.06]">
                  <span className="text-slate-300">Send prompt message</span>
                  <kbd className="px-2 py-1 bg-[#1e1e26] border border-white/10 rounded font-mono text-[11px] text-slate-300">
                    Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#141419] rounded-lg border border-white/[0.06]">
                  <span className="text-slate-300">Add newline in input</span>
                  <kbd className="px-2 py-1 bg-[#1e1e26] border border-white/10 rounded font-mono text-[11px] text-slate-300">
                    Shift + Enter
                  </kbd>
                </div>
                <div className="flex items-center justify-between p-2.5 bg-[#141419] rounded-lg border border-white/[0.06]">
                  <span className="text-slate-300">Close modal dialog</span>
                  <kbd className="px-2 py-1 bg-[#1e1e26] border border-white/10 rounded font-mono text-[11px] text-slate-300">
                    Esc
                  </kbd>
                </div>
              </div>
            </div>
          )}

          {/* Architecture & Deploy Tab */}
          {activeTab === 'architecture' && (
            <div className="space-y-4 text-xs">
              <div className="space-y-1">
                <div className="font-semibold text-white">Full-Stack Production Topology</div>
                <p className="text-slate-400 text-[11px] leading-relaxed">
                  GentleArrow307 was designed with a dual-tier approach: a high-efficiency React web client with Express server for Cloud Run, and an optional Docker Compose stack for self-hosted local inference.
                </p>
              </div>

              <div className="p-3 bg-[#131318] border border-white/10 rounded-lg font-mono text-[11px] text-slate-300 space-y-1.5 overflow-x-auto">
                <div className="text-slate-500"># Cloud Run Service (Current Deployment)</div>
                <div>Runtime: Node.js 22 + React 19 + Express Full-Stack</div>
                <div>Inference: Google Gemini 3.8 Flash (Server-Side Secrets)</div>
                <div>Persistence: Owner-Scoped Local Workspace Store (.data/)</div>
                <div>Security: Zero Client Keys · Untrusted RAG Context Envelopes</div>
              </div>

              <div className="space-y-2">
                <div className="font-semibold text-slate-300">Self-Hosted Docker Compose Option</div>
                <p className="text-[11px] text-slate-400">
                  If running on a local GPU/CPU server, you can deploy the included <code className="text-slate-200">docker-compose.yml</code> which runs:
                </p>
                <ul className="list-disc list-inside space-y-1 text-slate-400 text-[11px]">
                  <li>FastAPI orchestrator with asyncpg</li>
                  <li>PostgreSQL 15 with pgvector extension</li>
                  <li>Redis 7 for rate-limiting & ingestion queues</li>
                  <li>LocalAI Qwen3 0.6B CPU container for offline inference</li>
                  <li>Caddy for automatic TLS termination</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-[#0b0b0e] border-t border-white/[0.06] flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-200 bg-white/[0.08] hover:bg-white/15 rounded-lg transition-colors cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
