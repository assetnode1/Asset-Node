import React, { useState } from 'react';
import {
  Copy,
  Check,
  FileText,
  Image as ImageIcon,
  Sparkles,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { Message } from '../types';

interface MessageItemProps {
  message: Message;
  isStreaming?: boolean;
}

export const MessageItem: React.FC<MessageItemProps> = ({ message, isStreaming = false }) => {
  const isAssistant = message.role === 'assistant';
  const [copiedCodeIndex, setCopiedCodeIndex] = useState<number | null>(null);
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [showRagContext, setShowRagContext] = useState(false);

  const handleCopyMessage = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMessage(true);
    setTimeout(() => setCopiedMessage(false), 2000);
  };

  const handleCopyCode = (code: string, index: number) => {
    navigator.clipboard.writeText(code);
    setCopiedCodeIndex(index);
    setTimeout(() => setCopiedCodeIndex(null), 2000);
  };

  // Helper to parse basic markdown with code blocks and formatting
  const renderFormattedContent = (content: string) => {
    const parts: React.ReactNode[] = [];
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    let lastIndex = 0;
    let match;
    let codeIndex = 0;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        const textSegment = content.substring(lastIndex, match.index);
        parts.push(renderTextSegment(textSegment, `text-${lastIndex}`));
      }

      const lang = match[1] || 'plaintext';
      const code = match[2];
      const currentCodeIdx = codeIndex++;

      parts.push(
        <div key={`code-${match.index}`} className="my-3 rounded-lg overflow-hidden border border-white/10 bg-[#0d0d10]">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#141418] border-b border-white/[0.06] text-[11px] font-mono text-slate-400">
            <span>{lang}</span>
            <button
              onClick={() => handleCopyCode(code, currentCodeIdx)}
              className="flex items-center gap-1 hover:text-slate-200 transition-colors cursor-pointer"
            >
              {copiedCodeIndex === currentCodeIdx ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy</span>
                </>
              )}
            </button>
          </div>
          <pre className="p-3 text-xs font-mono text-slate-200 overflow-x-auto leading-relaxed">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < content.length) {
      parts.push(renderTextSegment(content.substring(lastIndex), `text-${lastIndex}`));
    }

    return parts;
  };

  const renderTextSegment = (text: string, key: string) => {
    // Process headers, bold, bullets, and paragraphs
    const lines = text.split('\n');
    return (
      <div key={key} className="space-y-2">
        {lines.map((line, idx) => {
          if (line.startsWith('### ')) {
            return (
              <h3 key={idx} className="text-sm font-semibold text-white mt-3 mb-1">
                {line.replace('### ', '')}
              </h3>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h2 key={idx} className="text-base font-semibold text-white mt-3 mb-1">
                {line.replace('## ', '')}
              </h2>
            );
          }
          if (line.startsWith('# ')) {
            return (
              <h1 key={idx} className="text-lg font-bold text-white mt-4 mb-1">
                {line.replace('# ', '')}
              </h1>
            );
          }
          if (line.startsWith('- ') || line.startsWith('* ')) {
            return (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 ml-2">
                <span className="text-slate-500 font-bold select-none">•</span>
                <span>{renderInlineFormatting(line.substring(2))}</span>
              </div>
            );
          }
          if (/^\d+\.\s/.test(line)) {
            const num = line.match(/^(\d+)\.\s/)?.[1];
            return (
              <div key={idx} className="flex items-start gap-2 text-xs text-slate-300 ml-2">
                <span className="text-slate-500 font-mono text-[11px] select-none">{num}.</span>
                <span>{renderInlineFormatting(line.replace(/^\d+\.\s/, ''))}</span>
              </div>
            );
          }
          if (!line.trim()) {
            return <div key={idx} className="h-1.5" />;
          }
          return (
            <p key={idx} className="text-xs text-slate-200 leading-relaxed">
              {renderInlineFormatting(line)}
            </p>
          );
        })}
      </div>
    );
  };

  const renderInlineFormatting = (str: string) => {
    // Handle inline code `code`
    const parts = str.split(/(`[^`]+`)/);
    return parts.map((part, i) => {
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={i} className="px-1.5 py-0.5 rounded bg-white/[0.08] text-slate-200 font-mono text-[11px]">
            {part.slice(1, -1)}
          </code>
        );
      }
      // Handle bold **text**
      const boldParts = part.split(/(\*\*[^*]+\*\*)/);
      return (
        <span key={i}>
          {boldParts.map((bp, j) => {
            if (bp.startsWith('**') && bp.endsWith('**')) {
              return (
                <strong key={j} className="font-semibold text-white">
                  {bp.slice(2, -2)}
                </strong>
              );
            }
            return bp;
          })}
        </span>
      );
    });
  };

  return (
    <div
      className={`group relative py-4 px-4 sm:px-6 transition-colors ${
        isAssistant ? 'bg-[#0f0f12]/60 border-y border-white/[0.03]' : 'bg-transparent'
      }`}
    >
      <div className="max-w-4xl mx-auto flex items-start gap-3.5">
        {/* Avatar */}
        <div
          className={`w-7 h-7 rounded-lg shrink-0 flex items-center justify-center text-xs font-medium border select-none ${
            isAssistant
              ? 'bg-[#18181f] border-white/20 text-slate-200 shadow-[0_2px_8px_rgba(255,255,255,0.08)]'
              : 'bg-slate-800 border-white/10 text-slate-300'
          }`}
        >
          {isAssistant ? (
            <span className="font-bold text-[11px] font-mono text-slate-100">307</span>
          ) : (
            <span>You</span>
          )}
        </div>

        {/* Message Body */}
        <div className="flex-1 min-w-0 space-y-2">
          {/* Header Metadata (Sender + Timestamp + Model) */}
          <div className="flex items-center justify-between text-[11px] text-slate-500">
            <div className="flex items-center gap-2">
              <span className="font-medium text-slate-300">
                {isAssistant ? 'GentleArrow307' : 'You'}
              </span>
              <span aria-hidden="true" className="text-slate-600">·</span>
              <span>
                {message.createdAt ? new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'}
              </span>
              {isAssistant && message.model && (
                <>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span className="font-mono text-[10px] text-slate-400">{message.model}</span>
                </>
              )}
            </div>

            {/* Actions for Assistant Message */}
            {isAssistant && !isStreaming && (
              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={handleCopyMessage}
                  className="flex items-center gap-1 text-[11px] text-slate-400 hover:text-white transition-colors"
                  title="Copy full message"
                >
                  {copiedMessage ? (
                    <>
                      <Check className="w-3 h-3 text-emerald-400" />
                      <span className="text-emerald-400">Copied</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" />
                      <span>Copy</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          {/* Attachments if any */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-wrap gap-2 pt-1 pb-2">
              {message.attachments.map(att => (
                <div
                  key={att.id}
                  className="flex items-center gap-2 px-2.5 py-1.5 bg-[#16161c] border border-white/10 rounded-md text-xs text-slate-300"
                >
                  {att.category === 'image' ? (
                    <ImageIcon className="w-3.5 h-3.5 text-slate-400" />
                  ) : (
                    <FileText className="w-3.5 h-3.5 text-slate-400" />
                  )}
                  <span className="max-w-[150px] truncate">{att.fileName}</span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    ({Math.round(att.fileSize / 1024)}KB)
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* RAG Context Collapsible Panel */}
          {message.retrievedContext && message.retrievedContext.length > 0 && (
            <div className="my-2 bg-[#14141a] border border-white/[0.08] rounded-lg overflow-hidden text-xs">
              <button
                onClick={() => setShowRagContext(!showRagContext)}
                className="w-full flex items-center justify-between px-3 py-2 text-slate-300 hover:text-white transition-colors"
              >
                <div className="flex items-center gap-2">
                  <BookOpen className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-medium">
                    Referenced {message.retrievedContext.length} knowledge base {message.retrievedContext.length === 1 ? 'excerpt' : 'excerpts'}
                  </span>
                </div>
                {showRagContext ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              </button>

              {showRagContext && (
                <div className="px-3 pb-3 pt-1 space-y-2 border-t border-white/[0.06] bg-[#0c0c10]">
                  {message.retrievedContext.map((c, i) => (
                    <div key={i} className="p-2 rounded bg-white/[0.02] border border-white/[0.04] space-y-1">
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-medium">
                        <span>{c.libraryName} · {c.documentTitle}</span>
                        <span className="text-slate-500 font-mono">Score {c.relevanceScore}</span>
                      </div>
                      <p className="text-[11px] text-slate-300 font-mono leading-relaxed bg-[#121217] p-2 rounded">
                        {c.chunkContent}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Main Message Content */}
          <div className="prose-content">
            {renderFormattedContent(message.content)}
          </div>

          {/* Live streaming indicator */}
          {isStreaming && (
            <div className="flex items-center gap-1.5 pt-1 text-xs text-slate-400">
              <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
              <span className="font-mono text-[11px]">Synthesizing reply...</span>
            </div>
          )}

          {/* Token count telemetry for Assistant */}
          {isAssistant && message.tokensUsed && !isStreaming && (
            <div className="pt-2 flex items-center gap-2 text-[10px] text-slate-500 font-mono">
              <span>{message.tokensUsed.promptTokens} in</span>
              <span aria-hidden="true">·</span>
              <span>{message.tokensUsed.completionTokens} out</span>
              <span aria-hidden="true">·</span>
              <span>{message.tokensUsed.totalTokens} total tokens</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
