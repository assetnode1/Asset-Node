import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  Square,
  Paperclip,
  BookOpen,
  X,
  FileText,
  Image as ImageIcon,
  Check,
} from 'lucide-react';
import { Attachment, KnowledgeLibrary } from '../types';

interface MessageInputProps {
  onSendMessage: (text: string, attachments: Attachment[], libraryIds: string[]) => void;
  isStreaming: boolean;
  onStopStreaming: () => void;
  libraries: KnowledgeLibrary[];
  selectedLibraryIds: string[];
  onToggleLibrary: (id: string) => void;
}

export const MessageInput: React.FC<MessageInputProps> = ({
  onSendMessage,
  isStreaming,
  onStopStreaming,
  libraries,
  selectedLibraryIds,
  onToggleLibrary,
}) => {
  const [text, setText] = useState('');
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [showLibraryDropdown, setShowLibraryDropdown] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 180)}px`;
    }
  }, [text]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isStreaming) return;
    const trimmed = text.trim();
    if (!trimmed && attachments.length === 0) return;

    onSendMessage(trimmed, attachments, selectedLibraryIds);
    setText('');
    setAttachments([]);
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadError(null);

    Array.from(files).forEach(file => {
      const isImg = file.type.startsWith('image/');
      const maxSize = isImg ? 8 * 1024 * 1024 : 20 * 1024 * 1024;

      if (file.size > maxSize) {
        setUploadError(`File "${file.name}" exceeds ${isImg ? '8MB' : '20MB'} limit.`);
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result as string;
        const newAttachment: Attachment = {
          id: `local_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          userId: 'current',
          fileName: file.name,
          fileSize: file.size,
          mimeType: file.type || 'application/octet-stream',
          category: isImg ? 'image' : 'document',
          dataBase64: base64,
          createdAt: new Date().toISOString(),
        };
        setAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    });

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const removeAttachment = (id: string) => {
    setAttachments(prev => prev.filter(a => a.id !== id));
  };

  return (
    <div className="max-w-4xl mx-auto w-full px-4 pb-4">
      {/* Upload error banner */}
      {uploadError && (
        <div className="mb-2 p-2 bg-rose-500/10 border border-rose-500/20 rounded-md text-xs text-rose-300 flex items-center justify-between">
          <span>{uploadError}</span>
          <button onClick={() => setUploadError(null)} className="text-rose-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Attachment Chips */}
      {attachments.length > 0 && (
        <div className="flex flex-wrap gap-2 mb-2 p-2 bg-[#121217] border border-white/[0.08] rounded-lg">
          {attachments.map(att => (
            <div
              key={att.id}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#1a1a22] border border-white/10 rounded-md text-xs text-slate-200"
            >
              {att.category === 'image' ? (
                <ImageIcon className="w-3 h-3 text-slate-400" />
              ) : (
                <FileText className="w-3 h-3 text-slate-400" />
              )}
              <span className="max-w-[120px] truncate">{att.fileName}</span>
              <button
                onClick={() => removeAttachment(att.id)}
                className="p-0.5 text-slate-400 hover:text-white rounded"
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Main Composer Box */}
      <div className="relative rounded-xl border border-white/[0.1] bg-[#121216] shadow-[0_4px_24px_rgba(0,0,0,0.5)] focus-within:border-slate-400/50 transition-colors">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={
            isStreaming
              ? 'GentleArrow307 is generating a reply...'
              : 'Ask a question, upload a document, or reference your knowledge base...'
          }
          rows={1}
          disabled={isStreaming}
          className="w-full bg-transparent px-4 pt-3.5 pb-12 text-sm text-slate-100 placeholder-slate-500 focus:outline-none resize-none min-h-[56px] max-h-[200px]"
        />

        {/* Bottom Control Bar */}
        <div className="absolute left-3 right-3 bottom-2 flex items-center justify-between pointer-events-auto">
          {/* Left Actions: Attach File + Knowledge Base Selector */}
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,.pdf,.txt,.md,.csv,.json"
              onChange={handleFileSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isStreaming}
              className="p-1.5 text-slate-400 hover:text-slate-200 hover:bg-white/[0.06] rounded-md transition-colors cursor-pointer"
              title="Attach files (Images up to 8MB, Docs up to 20MB)"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Knowledge RAG Library Selector */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowLibraryDropdown(!showLibraryDropdown)}
                disabled={isStreaming}
                className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-xs transition-colors cursor-pointer ${
                  selectedLibraryIds.length > 0
                    ? 'bg-white/[0.1] text-white border border-white/20'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-white/[0.06]'
                }`}
                title="Connect private knowledge library for RAG retrieval"
              >
                <BookOpen className="w-3.5 h-3.5" />
                <span>
                  {selectedLibraryIds.length > 0
                    ? `${selectedLibraryIds.length} ${selectedLibraryIds.length === 1 ? 'Library' : 'Libraries'} Attached`
                    : 'Attach Knowledge'}
                </span>
              </button>

              {/* Dropdown for Library Selection */}
              {showLibraryDropdown && (
                <div className="absolute left-0 bottom-full mb-2 w-64 p-2 bg-[#181820] border border-white/10 rounded-lg shadow-2xl z-30 space-y-1">
                  <div className="px-2 py-1 text-[11px] font-medium text-slate-400 border-b border-white/[0.06]">
                    Select Knowledge for RAG Context
                  </div>
                  {libraries.length === 0 ? (
                    <div className="p-2 text-xs text-slate-500 text-center">
                      No libraries created yet. Open Knowledge Libraries in the sidebar to add your documents.
                    </div>
                  ) : (
                    libraries.map(lib => {
                      const isSelected = selectedLibraryIds.includes(lib.id);
                      return (
                        <button
                          key={lib.id}
                          type="button"
                          onClick={() => onToggleLibrary(lib.id)}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 text-xs rounded-md text-left transition-colors ${
                            isSelected
                              ? 'bg-white/[0.08] text-white font-medium'
                              : 'text-slate-300 hover:bg-white/[0.04]'
                          }`}
                        >
                          <div className="truncate pr-2">
                            <div>{lib.name}</div>
                            <div className="text-[10px] text-slate-500 font-normal">
                              {lib.documentCount} {lib.documentCount === 1 ? 'document' : 'documents'}
                            </div>
                          </div>
                          {isSelected && <Check className="w-3.5 h-3.5 text-slate-200 shrink-0" />}
                        </button>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Actions: Stop Generating or Send */}
          <div className="flex items-center gap-2">
            {isStreaming ? (
              <button
                type="button"
                onClick={onStopStreaming}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-rose-500/20 text-rose-300 border border-rose-500/40 rounded-lg text-xs font-medium hover:bg-rose-500/30 transition-colors cursor-pointer"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                <span>Stop</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!text.trim() && attachments.length === 0}
                className="p-1.5 rounded-lg liquid-glass-button text-slate-200 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                title="Send message (Enter)"
              >
                <Send className="w-4 h-4 text-slate-100" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Helpful keyboard shortcut hints */}
      <div className="mt-1.5 flex items-center justify-between px-1 text-[11px] text-slate-500">
        <span>Enter to send · Shift+Enter for new line</span>
        <span className="font-mono text-[10px]">Gemini 3.8 Flash · Local-first</span>
      </div>
    </div>
  );
};
