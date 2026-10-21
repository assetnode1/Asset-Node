import React, { useState, useEffect, useRef } from 'react';
import {
  Menu,
  Cpu,
  BookOpen,
  Sparkles,
  Shield,
  Layers,
  ArrowRight,
  LogOut,
  User as UserIcon,
  ChevronDown,
} from 'lucide-react';
import { User, Conversation, Message, ModelCapability, Attachment, KnowledgeLibrary } from './types';
import { api } from './api';
import { BrandLogo } from './components/BrandLogo';
import { Sidebar } from './components/Sidebar';
import { MessageItem } from './components/MessageItem';
import { MessageInput } from './components/MessageInput';
import { KnowledgeModal } from './components/KnowledgeModal';
import { ModelSelectorModal } from './components/ModelSelectorModal';
import { UsageModal } from './components/UsageModal';
import { SettingsModal } from './components/SettingsModal';
import { AuthModal } from './components/AuthModal';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [currentConversation, setCurrentConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [models, setModels] = useState<ModelCapability[]>([]);
  const [selectedModelId, setSelectedModelId] = useState<string>('gemini-3.8-flash');
  const [libraries, setLibraries] = useState<KnowledgeLibrary[]>([]);
  const [selectedLibraryIds, setSelectedLibraryIds] = useState<string[]>([]);

  // Streaming State
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const [streamingRagChunks, setStreamingRagChunks] = useState<any[]>([]);
  const [streamError, setStreamError] = useState<string | null>(null);
  const stopStreamRef = useRef<(() => void) | null>(null);

  // Modals & Navigation
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [isKnowledgeModalOpen, setIsKnowledgeModalOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [isUsageModalOpen, setIsUsageModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, streamingContent]);

  // Initial Data Load
  useEffect(() => {
    const init = async () => {
      try {
        const [meRes, modelsRes, convsRes, libsRes] = await Promise.all([
          api.getMe().catch(() => null),
          api.getModels().catch(() => ({ models: [], defaultModel: 'gemini-3.8-flash' })),
          api.getConversations().catch(() => ({ conversations: [] })),
          api.getLibraries().catch(() => ({ libraries: [] })),
        ]);

        if (meRes) setUser(meRes);
        if (modelsRes.models) {
          setModels(modelsRes.models);
          setSelectedModelId(modelsRes.defaultModel || 'gemini-3.8-flash');
        }
        if (convsRes.conversations) {
          setConversations(convsRes.conversations);
          if (convsRes.conversations.length > 0) {
            loadConversation(convsRes.conversations[0].id);
          }
        }
        if (libsRes.libraries) {
          setLibraries(libsRes.libraries);
          if (libsRes.libraries.length > 0) {
            setSelectedLibraryIds([libsRes.libraries[0].id]);
          }
        }
      } catch (err) {
        console.error('Initialisation failed', err);
      }
    };

    init();
  }, []);

  // Keyboard shortcut listener (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setMobileSidebarOpen(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const loadConversation = async (id: string) => {
    try {
      const res = await api.getConversation(id);
      setActiveConversationId(id);
      setCurrentConversation(res.conversation);
      setMessages(res.messages);
      setSelectedModelId(res.conversation.model || 'gemini-3.8-flash');
      if (res.conversation.attachedLibraryIds) {
        setSelectedLibraryIds(res.conversation.attachedLibraryIds);
      }
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  const handleNewConversation = async () => {
    try {
      const res = await api.createConversation({
        title: 'New Conversation',
        model: selectedModelId,
        attachedLibraryIds: selectedLibraryIds,
      });
      setConversations(prev => [res.conversation, ...prev]);
      setActiveConversationId(res.conversation.id);
      setCurrentConversation(res.conversation);
      setMessages([]);
    } catch (err) {
      console.error('Failed to create conversation', err);
    }
  };

  const handleRenameConversation = async (id: string, newTitle: string) => {
    try {
      const res = await api.updateConversation(id, { title: newTitle });
      setConversations(prev => prev.map(c => (c.id === id ? { ...c, title: res.conversation.title } : c)));
      if (currentConversation?.id === id) {
        setCurrentConversation(prev => (prev ? { ...prev, title: res.conversation.title } : null));
      }
    } catch (err) {
      console.error('Failed to rename conversation', err);
    }
  };

  const handleToggleArchive = async (id: string, currentStatus: boolean) => {
    try {
      await api.updateConversation(id, { archived: !currentStatus });
      const convs = await api.getConversations();
      setConversations(convs.conversations);
      if (activeConversationId === id) {
        const nextActive = convs.conversations.find(c => !c.archived);
        if (nextActive) loadConversation(nextActive.id);
        else {
          setActiveConversationId(null);
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to toggle archive', err);
    }
  };

  const handleDeleteConversation = async (id: string) => {
    try {
      await api.deleteConversation(id);
      const updated = conversations.filter(c => c.id !== id);
      setConversations(updated);
      if (activeConversationId === id) {
        if (updated.length > 0) {
          loadConversation(updated[0].id);
        } else {
          setActiveConversationId(null);
          setCurrentConversation(null);
          setMessages([]);
        }
      }
    } catch (err) {
      console.error('Failed to delete conversation', err);
    }
  };

  const handleExportConversation = async (id: string, title: string) => {
    try {
      await api.exportConversation(id, title);
    } catch (err) {
      console.error('Failed to export conversation', err);
    }
  };

  const handleSendMessage = (text: string, attachments: Attachment[], libraryIds: string[]) => {
    if (isStreaming) return;
    setStreamError(null);

    let convId = activeConversationId;
    if (!convId) {
      convId = `conv_${Date.now()}`;
      setActiveConversationId(convId);
    }

    // Optimistically add user message
    const userMessage: Message = {
      id: `local_${Date.now()}`,
      conversationId: convId,
      role: 'user',
      content: text,
      attachments,
      createdAt: new Date().toISOString(),
    };
    setMessages(prev => [...prev, userMessage]);

    // Setup streaming state
    setIsStreaming(true);
    setStreamingContent('');
    setStreamingRagChunks([]);

    const cancelStream = api.streamChat(
      {
        conversationId: convId,
        message: text,
        model: selectedModelId,
        attachments,
        attachedLibraryIds: libraryIds,
      },
      {
        onToken: (tokenChunk: string) => {
          setStreamingContent(prev => prev + tokenChunk);
        },
        onRagContext: (chunks: any[]) => {
          setStreamingRagChunks(chunks);
        },
        onDone: (data: any) => {
          setIsStreaming(false);
          // Reload conversation messages to get persisted message with usage tokens
          if (activeConversationId) {
            loadConversation(activeConversationId);
          }
          // Update conversation title in sidebar if updated
          api.getConversations().then(res => setConversations(res.conversations));
        },
        onError: (err: string) => {
          setIsStreaming(false);
          setStreamError(err);
        },
        onCancelled: () => {
          setIsStreaming(false);
          if (activeConversationId) {
            loadConversation(activeConversationId);
          }
        },
      }
    );

    stopStreamRef.current = cancelStream;
  };

  const handleStopStreaming = async () => {
    if (stopStreamRef.current) {
      stopStreamRef.current();
      stopStreamRef.current = null;
    }
    if (activeConversationId) {
      await api.stopGeneration(activeConversationId).catch(() => {});
    }
    setIsStreaming(false);
  };

  const handleToggleLibrary = (libId: string) => {
    setSelectedLibraryIds(prev =>
      prev.includes(libId) ? prev.filter(id => id !== libId) : [...prev, libId]
    );
  };

  const handleSelectModel = (modelId: string) => {
    setSelectedModelId(modelId);
    if (activeConversationId) {
      api.updateConversation(activeConversationId, { model: modelId });
    }
  };

  const refreshLibraries = async () => {
    try {
      const res = await api.getLibraries();
      setLibraries(res.libraries);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#09090b] text-[#eeedf0]">
      {/* Sidebar Navigation */}
      <Sidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        onSelectConversation={loadConversation}
        onNewConversation={handleNewConversation}
        onRenameConversation={handleRenameConversation}
        onToggleArchive={handleToggleArchive}
        onDeleteConversation={handleDeleteConversation}
        onExportConversation={handleExportConversation}
        onOpenKnowledge={() => setIsKnowledgeModalOpen(true)}
        onOpenUsage={() => setIsUsageModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        user={user}
        isOpenMobile={mobileSidebarOpen}
        onCloseMobile={() => setMobileSidebarOpen(false)}
      />

      {/* Main Workspace View */}
      <main className="flex-1 flex flex-col h-full min-w-0 bg-[#09090b]">
        {/* Top App Header */}
        <header className="h-14 border-b border-white/[0.06] bg-[#0d0d10]/80 backdrop-blur-md px-4 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="md:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/[0.05]"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Conversation Title */}
            <div className="truncate max-w-[260px] sm:max-w-md">
              <h1 className="text-sm font-semibold text-white truncate">
                {currentConversation?.title || 'GentleArrow307'}
              </h1>
            </div>
          </div>

          {/* Right Header Controls */}
          <div className="flex items-center gap-2">
            {/* Active Model Selector Pill */}
            <button
              onClick={() => setIsModelModalOpen(true)}
              className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-slate-300 bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 rounded-lg transition-colors cursor-pointer"
              title="Change active AI model"
            >
              <Cpu className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-mono text-[11px]">
                {models.find(m => m.id === selectedModelId)?.name || 'Gemini 3.8 Flash'}
              </span>
              <ChevronDown className="w-3 h-3 text-slate-500" />
            </button>

            {/* Knowledge RAG Status Pill */}
            <button
              onClick={() => setIsKnowledgeModalOpen(true)}
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-lg transition-colors cursor-pointer ${
                selectedLibraryIds.length > 0
                  ? 'bg-white/[0.06] text-slate-200 border border-white/10'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
              title="Manage attached knowledge libraries"
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>
                {selectedLibraryIds.length > 0 ? `${selectedLibraryIds.length} RAG` : 'No RAG'}
              </span>
            </button>

            {/* Auth / Profile trigger */}
            {user ? (
              <button
                onClick={() => setIsSettingsModalOpen(true)}
                className="flex items-center gap-1.5 p-1 rounded-lg hover:bg-white/[0.06] text-slate-300 cursor-pointer"
                title="Account Settings"
              >
                <div className="w-7 h-7 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center text-xs font-semibold text-slate-200">
                  {user.displayName.slice(0, 2).toUpperCase()}
                </div>
              </button>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3 py-1 text-xs font-semibold rounded-lg bg-slate-100 text-slate-900 hover:bg-white transition-colors cursor-pointer"
              >
                Sign In
              </button>
            )}
          </div>
        </header>

        {/* Message Feed Area */}
        <div className="flex-1 overflow-y-auto">
          {messages.length === 0 && !isStreaming ? (
            /* Empty State / Welcome Screen */
            <div className="max-w-2xl mx-auto px-6 py-12 flex flex-col items-center justify-center text-center space-y-6">
              <BrandLogo size="lg" showWordmark={true} className="flex-col gap-3" />

              <div className="space-y-1.5">
                <h2 className="text-lg font-semibold text-white tracking-tight">
                  Private, Local-First AI Workspace
                </h2>
                <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
                  Engineered with server-side API credential isolation, owner-scoped document storage, and strict RAG prompt injection boundaries.
                </p>
              </div>

              {/* Core System Guarantees */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-left pt-2">
                <div className="p-3 bg-[#121217] border border-white/[0.06] rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-200 text-xs font-semibold">
                    <Shield className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Server-Side Keys</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    GEMINI_API_KEY is isolated on the backend server. No credentials leak into client bundles.
                  </p>
                </div>

                <div className="p-3 bg-[#121217] border border-white/[0.06] rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-200 text-xs font-semibold">
                    <Layers className="w-3.5 h-3.5 text-slate-300" />
                    <span>Private RAG</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    Document chunks are stored in your private workspace and retrieved using contextual boundaries.
                  </p>
                </div>

                <div className="p-3 bg-[#121217] border border-white/[0.06] rounded-xl space-y-1">
                  <div className="flex items-center gap-1.5 text-slate-200 text-xs font-semibold">
                    <Sparkles className="w-3.5 h-3.5 text-slate-300" />
                    <span>Gemini 3.8 Flash</span>
                  </div>
                  <p className="text-[11px] text-slate-400">
                    High-speed multimodal synthesis, streaming token SSE, and cooperative stream cancellation.
                  </p>
                </div>
              </div>

              {/* Starter Prompts */}
              <div className="w-full space-y-2 pt-2">
                <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider text-left">
                  Suggested Prompts
                </div>
                <div className="grid gap-2 text-left">
                  {[
                    'Explain how RAG retrieval works in GentleArrow307 with private knowledge libraries.',
                    'How do I deploy this service using Docker Compose or Google Cloud Run?',
                    'Draft a technical summary of local-first private AI workspace architecture.',
                  ].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(prompt, [], selectedLibraryIds)}
                      className="group flex items-center justify-between p-3 bg-[#121216] border border-white/[0.06] hover:border-white/20 rounded-xl text-xs text-slate-300 hover:text-white transition-all text-left cursor-pointer"
                    >
                      <span>{prompt}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-transform group-hover:translate-x-0.5" />
                    </button>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            /* Message Thread */
            <div className="divide-y divide-white/[0.03]">
              {messages.map(msg => (
                <MessageItem key={msg.id} message={msg} />
              ))}

              {/* Live Streaming Message */}
              {isStreaming && (
                <MessageItem
                  message={{
                    id: 'streaming_active',
                    conversationId: activeConversationId || '',
                    role: 'assistant',
                    content: streamingContent,
                    model: selectedModelId,
                    retrievedContext: streamingRagChunks,
                    createdAt: new Date().toISOString(),
                  }}
                  isStreaming={true}
                />
              )}

              {/* Stream error banner */}
              {streamError && (
                <div className="max-w-4xl mx-auto p-4 my-3 bg-rose-500/10 border border-rose-500/30 rounded-xl text-xs text-rose-300 space-y-1">
                  <div className="font-semibold">Inference Error</div>
                  <div>{streamError}</div>
                  <div className="text-[10px] text-rose-400 pt-1">
                    Verify that your GEMINI_API_KEY is configured in Google AI Studio Settings &gt; Secrets.
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {/* Bottom Input Composer */}
        <div className="border-t border-white/[0.06] bg-[#0d0d11]/80 backdrop-blur-md pt-3">
          <MessageInput
            onSendMessage={handleSendMessage}
            isStreaming={isStreaming}
            onStopStreaming={handleStopStreaming}
            libraries={libraries}
            selectedLibraryIds={selectedLibraryIds}
            onToggleLibrary={handleToggleLibrary}
          />
        </div>
      </main>

      {/* Modals */}
      <KnowledgeModal
        isOpen={isKnowledgeModalOpen}
        onClose={() => setIsKnowledgeModalOpen(false)}
        onLibrariesChanged={refreshLibraries}
      />

      <ModelSelectorModal
        isOpen={isModelModalOpen}
        onClose={() => setIsModelModalOpen(false)}
        models={models}
        currentModelId={selectedModelId}
        onSelectModel={handleSelectModel}
      />

      <UsageModal
        isOpen={isUsageModalOpen}
        onClose={() => setIsUsageModalOpen(false)}
      />

      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        user={user}
        onUserUpdated={u => setUser(u)}
        onAccountDeleted={() => {
          setUser(null);
          setConversations([]);
          setActiveConversationId(null);
          setMessages([]);
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onAuthSuccess={u => {
          setUser(u);
          api.getConversations().then(res => setConversations(res.conversations));
          refreshLibraries();
        }}
      />
    </div>
  );
}
