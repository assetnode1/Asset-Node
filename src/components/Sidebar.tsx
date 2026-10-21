import React, { useState, useMemo } from 'react';
import {
  Plus,
  Search,
  MessageSquare,
  Archive,
  MoreVertical,
  Edit2,
  Trash2,
  Download,
  BookOpen,
  BarChart3,
  Settings,
  X,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from 'lucide-react';
import { Conversation, User } from '../types';
import { BrandLogo } from './BrandLogo';

interface SidebarProps {
  conversations: Conversation[];
  activeConversationId: string | null;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  onToggleArchive: (id: string, currentStatus: boolean) => void;
  onDeleteConversation: (id: string) => void;
  onExportConversation: (id: string, title: string) => void;
  onOpenKnowledge: () => void;
  onOpenUsage: () => void;
  onOpenSettings: () => void;
  user: User | null;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeConversationId,
  onSelectConversation,
  onNewConversation,
  onRenameConversation,
  onToggleArchive,
  onDeleteConversation,
  onExportConversation,
  onOpenKnowledge,
  onOpenUsage,
  onOpenSettings,
  user,
  isOpenMobile,
  onCloseMobile,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showArchived, setShowArchived] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

  // Filter conversations
  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return conversations;
    const q = searchQuery.toLowerCase();
    return conversations.filter(c => c.title.toLowerCase().includes(q));
  }, [conversations, searchQuery]);

  // Group active vs archived
  const activeList = useMemo(() => filtered.filter(c => !c.archived), [filtered]);
  const archivedList = useMemo(() => filtered.filter(c => c.archived), [filtered]);

  // Group active by time (Today, Yesterday, Earlier)
  const groupedActive = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const groups: { [key: string]: Conversation[] } = {
      Today: [],
      Yesterday: [],
      Earlier: [],
    };

    activeList.forEach(c => {
      const convDate = new Date(c.updatedAt);
      if (convDate >= today) {
        groups.Today.push(c);
      } else if (convDate >= yesterday) {
        groups.Yesterday.push(c);
      } else {
        groups.Earlier.push(c);
      }
    });

    return groups;
  }, [activeList]);

  const handleStartRename = (conv: Conversation) => {
    setEditingId(conv.id);
    setEditingTitle(conv.title);
    setActiveMenuId(null);
  };

  const handleSaveRename = (id: string) => {
    if (editingTitle.trim()) {
      onRenameConversation(id, editingTitle.trim());
    }
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
          onClick={onCloseMobile}
        />
      )}

      {/* Main Sidebar */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-50 flex flex-col w-72 bg-[#0c0c0f] border-r border-white/[0.07] transition-transform duration-200 ease-in-out ${
          isOpenMobile ? 'translate-x-0' : '-translate-x-full md:translate-x-0'
        }`}
      >
        {/* Header with Brand Logo */}
        <div className="flex items-center justify-between p-4 border-b border-white/[0.06]">
          <BrandLogo size="md" />
          <button
            onClick={onCloseMobile}
            className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
            aria-label="Close sidebar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New Chat Action */}
        <div className="p-3">
          <button
            onClick={() => {
              onNewConversation();
              onCloseMobile();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 text-sm font-medium text-slate-200 rounded-lg liquid-glass-button cursor-pointer"
          >
            <Plus className="w-4 h-4 text-slate-300" />
            <span>New Chat</span>
          </button>
        </div>

        {/* Search */}
        <div className="px-3 pb-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              placeholder="Search conversations..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 text-xs bg-[#141418] border border-white/[0.06] rounded-md text-slate-200 placeholder-slate-500 focus:outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto px-2 py-1 space-y-4">
          {activeList.length === 0 && archivedList.length === 0 && (
            <div className="py-8 text-center px-4">
              <MessageSquare className="w-6 h-6 text-slate-600 mx-auto mb-2 opacity-60" />
              <p className="text-xs text-slate-400 font-medium">No conversations yet</p>
              <p className="text-[11px] text-slate-500 mt-1">Start a conversation to begin your private AI workspace session.</p>
            </div>
          )}

          {/* Grouped by Today / Yesterday / Earlier */}
          {Object.entries(groupedActive).map(([label, items]) => {
            if (items.length === 0) return null;
            return (
              <div key={label} className="space-y-1">
                <div className="px-2.5 py-1 text-[11px] font-medium tracking-wider uppercase text-slate-500">
                  {label}
                </div>
                {items.map(conv => {
                  const isActive = conv.id === activeConversationId;
                  const isEditing = editingId === conv.id;

                  return (
                    <div
                      key={conv.id}
                      className={`group relative flex items-center justify-between rounded-lg px-2.5 py-2 text-xs transition-colors cursor-pointer ${
                        isActive
                          ? 'bg-white/[0.08] text-white font-medium shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]'
                          : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                      }`}
                      onClick={() => {
                        if (!isEditing) {
                          onSelectConversation(conv.id);
                          onCloseMobile();
                        }
                      }}
                    >
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <MessageSquare className={`w-3.5 h-3.5 shrink-0 ${isActive ? 'text-slate-200' : 'text-slate-600 group-hover:text-slate-400'}`} />
                        {isEditing ? (
                          <div className="flex items-center gap-1 w-full" onClick={e => e.stopPropagation()}>
                            <input
                              type="text"
                              value={editingTitle}
                              onChange={e => setEditingTitle(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') handleSaveRename(conv.id);
                                if (e.key === 'Escape') setEditingId(null);
                              }}
                              autoFocus
                              className="w-full bg-[#1c1c22] border border-white/20 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none"
                            />
                            <button
                              onClick={() => handleSaveRename(conv.id)}
                              className="p-1 text-emerald-400 hover:text-emerald-300"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="p-1 text-slate-400 hover:text-slate-300"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <span className="truncate">{conv.title}</span>
                        )}
                      </div>

                      {/* Options menu trigger */}
                      {!isEditing && (
                        <div className="relative shrink-0" onClick={e => e.stopPropagation()}>
                          <button
                            onClick={() => setActiveMenuId(activeMenuId === conv.id ? null : conv.id)}
                            className={`p-1 rounded text-slate-500 hover:text-slate-200 hover:bg-white/[0.06] transition-opacity ${
                              isActive || activeMenuId === conv.id ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                            }`}
                            aria-label="Conversation options"
                          >
                            <MoreVertical className="w-3.5 h-3.5" />
                          </button>

                          {/* Dropdown Menu */}
                          {activeMenuId === conv.id && (
                            <div className="absolute right-0 top-full mt-1 w-36 py-1 bg-[#18181e] border border-white/10 rounded-lg shadow-xl z-30">
                              <button
                                onClick={() => handleStartRename(conv)}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                              >
                                <Edit2 className="w-3 h-3 text-slate-400" />
                                <span>Rename</span>
                              </button>
                              <button
                                onClick={() => {
                                  onExportConversation(conv.id, conv.title);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                              >
                                <Download className="w-3 h-3 text-slate-400" />
                                <span>Export Markdown</span>
                              </button>
                              <button
                                onClick={() => {
                                  onToggleArchive(conv.id, conv.archived);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-slate-300 hover:bg-white/[0.06] hover:text-white"
                              >
                                <Archive className="w-3 h-3 text-slate-400" />
                                <span>Archive</span>
                              </button>
                              <div className="h-px bg-white/[0.06] my-1" />
                              <button
                                onClick={() => {
                                  onDeleteConversation(conv.id);
                                  setActiveMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-1.5 text-xs text-rose-400 hover:bg-rose-500/10"
                              >
                                <Trash2 className="w-3 h-3 text-rose-400" />
                                <span>Delete</span>
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            );
          })}

          {/* Archived Accordion */}
          {archivedList.length > 0 && (
            <div className="pt-2 border-t border-white/[0.06]">
              <button
                onClick={() => setShowArchived(!showArchived)}
                className="w-full flex items-center justify-between px-2.5 py-1 text-[11px] font-medium text-slate-500 hover:text-slate-300"
              >
                <div className="flex items-center gap-1.5">
                  <Archive className="w-3 h-3" />
                  <span>Archived ({archivedList.length})</span>
                </div>
                {showArchived ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              </button>

              {showArchived && (
                <div className="mt-1 space-y-1">
                  {archivedList.map(conv => (
                    <div
                      key={conv.id}
                      onClick={() => {
                        onSelectConversation(conv.id);
                        onCloseMobile();
                      }}
                      className="group flex items-center justify-between rounded-md px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-300 hover:bg-white/[0.02] cursor-pointer"
                    >
                      <span className="truncate">{conv.title}</span>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          onToggleArchive(conv.id, conv.archived);
                        }}
                        className="text-[10px] text-slate-400 hover:text-white"
                      >
                        Unarchive
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Bottom Nav Features (RAG Libraries, Usage, Settings) */}
        <div className="p-2 border-t border-white/[0.06] space-y-0.5 bg-[#0a0a0d]">
          <button
            onClick={() => {
              onOpenKnowledge();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors text-left"
          >
            <BookOpen className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <span>Knowledge Libraries</span>
              <span className="block text-[10px] text-slate-500 font-normal">Private RAG & document indexing</span>
            </div>
          </button>

          <button
            onClick={() => {
              onOpenUsage();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors text-left"
          >
            <BarChart3 className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <span>Token Usage & Quotas</span>
              <span className="block text-[10px] text-slate-500 font-normal">Actual tokens & model telemetry</span>
            </div>
          </button>

          <button
            onClick={() => {
              onOpenSettings();
              onCloseMobile();
            }}
            className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-300 hover:bg-white/[0.05] hover:text-white rounded-lg transition-colors text-left"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <div className="flex-1">
              <span>Workspace Settings</span>
              <span className="block text-[10px] text-slate-500 font-normal">Account, data export & privacy</span>
            </div>
          </button>
        </div>

        {/* Current User Footprint */}
        <div className="p-3 border-t border-white/[0.06] bg-[#070709] flex items-center justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-300 shrink-0">
              {user?.displayName ? user.displayName.slice(0, 2).toUpperCase() : 'GA'}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-medium text-slate-200 truncate">{user?.displayName || 'Operator'}</div>
              <div className="text-[10px] text-slate-500 truncate flex items-center gap-1">
                <ShieldCheck className="w-2.5 h-2.5 text-emerald-500" />
                <span>Local-first · Server Keys</span>
              </div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
