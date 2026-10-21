import React, { useState, useEffect } from 'react';
import {
  X,
  Plus,
  BookOpen,
  FileText,
  Trash2,
  ChevronRight,
  Upload,
  Layers,
  Info,
  Check,
  AlertCircle,
} from 'lucide-react';
import { KnowledgeLibrary, KnowledgeDocument } from '../types';
import { api } from '../api';

interface KnowledgeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onLibrariesChanged: () => void;
}

export const KnowledgeModal: React.FC<KnowledgeModalProps> = ({
  isOpen,
  onClose,
  onLibrariesChanged,
}) => {
  const [libraries, setLibraries] = useState<KnowledgeLibrary[]>([]);
  const [selectedLibrary, setSelectedLibrary] = useState<KnowledgeLibrary | null>(null);
  const [documents, setDocuments] = useState<KnowledgeDocument[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New Library Form state
  const [isCreatingLibrary, setIsCreatingLibrary] = useState(false);
  const [newLibName, setNewLibName] = useState('');
  const [newLibDesc, setNewLibDesc] = useState('');

  // Add Document Form state
  const [isAddingDoc, setIsAddingDoc] = useState(false);
  const [docTitle, setDocTitle] = useState('');
  const [docContent, setDocContent] = useState('');

  // Selected document to inspect chunks
  const [inspectingDoc, setInspectingDoc] = useState<KnowledgeDocument | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadLibraries();
    }
  }, [isOpen]);

  const loadLibraries = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.getLibraries();
      setLibraries(res.libraries);
      if (res.libraries.length > 0 && !selectedLibrary) {
        setSelectedLibrary(res.libraries[0]);
        loadDocuments(res.libraries[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load libraries');
    } finally {
      setIsLoading(false);
    }
  };

  const loadDocuments = async (libraryId: string) => {
    try {
      const res = await api.getLibraryDocuments(libraryId);
      setDocuments(res.documents);
    } catch (err: any) {
      setError(err.message || 'Failed to load documents');
    }
  };

  const handleSelectLibrary = (lib: KnowledgeLibrary) => {
    setSelectedLibrary(lib);
    setInspectingDoc(null);
    setIsAddingDoc(false);
    loadDocuments(lib.id);
  };

  const handleCreateLibrary = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newLibName.trim()) return;
    try {
      const res = await api.createLibrary(newLibName.trim(), newLibDesc.trim());
      setLibraries(prev => [...prev, res.library]);
      setSelectedLibrary(res.library);
      setDocuments([]);
      setNewLibName('');
      setNewLibDesc('');
      setIsCreatingLibrary(false);
      onLibrariesChanged();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDeleteLibrary = async (id: string) => {
    if (!confirm('Are you sure you want to delete this knowledge library and all its indexed documents?')) {
      return;
    }
    try {
      await api.deleteLibrary(id);
      const updated = libraries.filter(l => l.id !== id);
      setLibraries(updated);
      if (selectedLibrary?.id === id) {
        setSelectedLibrary(updated.length > 0 ? updated[0] : null);
        if (updated.length > 0) loadDocuments(updated[0].id);
        else setDocuments([]);
      }
      onLibrariesChanged();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleAddDocument = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedLibrary || !docTitle.trim() || !docContent.trim()) return;
    setIsLoading(true);
    try {
      await api.addDocumentToLibrary(selectedLibrary.id, {
        title: docTitle.trim(),
        content: docContent.trim(),
      });
      setDocTitle('');
      setDocContent('');
      setIsAddingDoc(false);
      loadDocuments(selectedLibrary.id);
      loadLibraries();
      onLibrariesChanged();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteDocument = async (docId: string) => {
    if (!confirm('Delete this document and its chunk embeddings?')) return;
    try {
      await api.deleteDocument(docId);
      setDocuments(prev => prev.filter(d => d.id !== docId));
      if (inspectingDoc?.id === docId) setInspectingDoc(null);
      loadLibraries();
      onLibrariesChanged();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setDocTitle(file.name.replace(/\.[^/.]+$/, ''));
    const reader = new FileReader();
    reader.onload = () => {
      setDocContent(reader.result as string);
    };
    reader.readAsText(file);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-4xl h-[640px] flex flex-col bg-[#0f0f13] border border-white/10 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-[#141419]">
          <div className="flex items-center gap-2.5">
            <BookOpen className="w-5 h-5 text-slate-300" />
            <div>
              <h2 className="text-sm font-semibold text-white">Private Knowledge Libraries (RAG)</h2>
              <p className="text-[11px] text-slate-400">
                Index private documents for automated retrieval and factual grounding in chat.
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

        {/* Error Alert */}
        {error && (
          <div className="px-6 py-2 bg-rose-500/10 border-b border-rose-500/20 text-xs text-rose-300 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
            <button onClick={() => setError(null)} className="text-rose-400 hover:text-white">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Main 2-Column Split: Libraries List + Documents Panel */}
        <div className="flex-1 flex overflow-hidden">
          {/* Left Column: Libraries List */}
          <div className="w-72 border-r border-white/[0.08] bg-[#0b0b0e] flex flex-col">
            <div className="p-3 border-b border-white/[0.06] flex items-center justify-between">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Collections
              </span>
              <button
                onClick={() => setIsCreatingLibrary(true)}
                className="flex items-center gap-1 text-xs text-slate-300 hover:text-white py-1 px-2 rounded bg-white/[0.05] hover:bg-white/[0.08]"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>New</span>
              </button>
            </div>

            {/* Create Library Inline Form */}
            {isCreatingLibrary && (
              <form onSubmit={handleCreateLibrary} className="p-3 border-b border-white/[0.08] bg-[#16161d] space-y-2">
                <input
                  type="text"
                  placeholder="Library name..."
                  value={newLibName}
                  onChange={e => setNewLibName(e.target.value)}
                  autoFocus
                  className="w-full px-2 py-1 text-xs bg-[#111116] border border-white/20 rounded text-white focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Description (optional)..."
                  value={newLibDesc}
                  onChange={e => setNewLibDesc(e.target.value)}
                  className="w-full px-2 py-1 text-xs bg-[#111116] border border-white/20 rounded text-slate-300 focus:outline-none"
                />
                <div className="flex items-center justify-end gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsCreatingLibrary(false)}
                    className="px-2 py-1 text-xs text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-2.5 py-1 text-xs bg-slate-200 text-slate-900 rounded font-medium hover:bg-white"
                  >
                    Create
                  </button>
                </div>
              </form>
            )}

            {/* Libraries Scroll Area */}
            <div className="flex-1 overflow-y-auto p-2 space-y-1">
              {libraries.length === 0 ? (
                <div className="p-4 text-center text-xs text-slate-500">
                  No libraries created yet. Click "New" to create one.
                </div>
              ) : (
                libraries.map(lib => {
                  const isSelected = selectedLibrary?.id === lib.id;
                  return (
                    <div
                      key={lib.id}
                      onClick={() => handleSelectLibrary(lib)}
                      className={`group flex items-center justify-between p-2.5 rounded-lg text-xs cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-white/[0.09] text-white font-medium border border-white/10'
                          : 'text-slate-400 hover:bg-white/[0.03] hover:text-slate-200'
                      }`}
                    >
                      <div className="truncate pr-2">
                        <div className="truncate">{lib.name}</div>
                        <div className="text-[10px] text-slate-500 font-normal">
                          {lib.documentCount} {lib.documentCount === 1 ? 'document' : 'documents'}
                        </div>
                      </div>
                      <button
                        onClick={e => {
                          e.stopPropagation();
                          handleDeleteLibrary(lib.id);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 text-slate-500 hover:text-rose-400"
                        title="Delete library"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Right Column: Library Contents */}
          <div className="flex-1 flex flex-col bg-[#0f0f13] overflow-y-auto">
            {selectedLibrary ? (
              <div className="p-6 space-y-6">
                {/* Library Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-base font-semibold text-white">{selectedLibrary.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {selectedLibrary.description || 'Private knowledge base collection for this workspace.'}
                    </p>
                  </div>
                  {!isAddingDoc && (
                    <button
                      onClick={() => setIsAddingDoc(true)}
                      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-200 hover:bg-white rounded-lg transition-colors cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Document</span>
                    </button>
                  )}
                </div>

                {/* Add Document Inline Form */}
                {isAddingDoc && (
                  <form onSubmit={handleAddDocument} className="p-4 bg-[#14141a] border border-white/10 rounded-xl space-y-3">
                    <div className="flex items-center justify-between border-b border-white/[0.06] pb-2">
                      <span className="text-xs font-semibold text-white">Index New Document</span>
                      <label className="flex items-center gap-1 text-[11px] text-slate-300 hover:text-white cursor-pointer px-2 py-1 rounded bg-white/[0.05]">
                        <Upload className="w-3 h-3" />
                        <span>Upload File (.txt, .md)</span>
                        <input
                          type="file"
                          accept=".txt,.md,.json,.csv"
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                      </label>
                    </div>

                    <input
                      type="text"
                      placeholder="Document title (e.g., API Specifications, Meeting Notes)..."
                      value={docTitle}
                      onChange={e => setDocTitle(e.target.value)}
                      required
                      className="w-full px-3 py-1.5 text-xs bg-[#0b0b0e] border border-white/15 rounded-md text-white focus:outline-none"
                    />

                    <textarea
                      placeholder="Paste document text or content to index into chunks..."
                      value={docContent}
                      onChange={e => setDocContent(e.target.value)}
                      required
                      rows={6}
                      className="w-full px-3 py-2 text-xs bg-[#0b0b0e] border border-white/15 rounded-md text-slate-200 font-mono focus:outline-none"
                    />

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[10px] text-slate-500">
                        Will be automatically split into ~1,500 character chunks with 200 char overlap.
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => setIsAddingDoc(false)}
                          className="px-3 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          type="submit"
                          disabled={isLoading}
                          className="px-3 py-1.5 text-xs font-medium text-slate-900 bg-slate-200 hover:bg-white rounded-md disabled:opacity-50"
                        >
                          {isLoading ? 'Indexing...' : 'Index Document'}
                        </button>
                      </div>
                    </div>
                  </form>
                )}

                {/* Documents List */}
                <div className="space-y-3">
                  <div className="text-xs font-medium text-slate-400">
                    Documents in Collection ({documents.length})
                  </div>

                  {documents.length === 0 ? (
                    <div className="p-8 border border-dashed border-white/10 rounded-xl text-center space-y-2">
                      <FileText className="w-8 h-8 text-slate-600 mx-auto" />
                      <div className="text-xs font-medium text-slate-300">No documents in this library</div>
                      <p className="text-[11px] text-slate-500 max-w-sm mx-auto">
                        Add text notes, articles, or project documentation. The system will chunk and index them for live retrieval during chat.
                      </p>
                    </div>
                  ) : (
                    <div className="grid gap-2">
                      {documents.map(doc => (
                        <div
                          key={doc.id}
                          className="flex items-center justify-between p-3 bg-[#131317] border border-white/[0.06] rounded-lg hover:border-white/15 transition-colors"
                        >
                          <div className="flex items-center gap-3 min-w-0">
                            <div className="w-8 h-8 rounded bg-white/[0.05] border border-white/10 flex items-center justify-center shrink-0">
                              <FileText className="w-4 h-4 text-slate-300" />
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-medium text-white truncate">{doc.title}</div>
                              <div className="text-[11px] text-slate-500 flex items-center gap-2 mt-0.5">
                                <span className="font-mono text-emerald-400 text-[10px]">● {doc.status}</span>
                                <span aria-hidden="true">·</span>
                                <span>{doc.chunkCount} chunks</span>
                                <span aria-hidden="true">·</span>
                                <span>{Math.round((doc.fileSize || 0) / 1024)} KB</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="p-1.5 text-slate-500 hover:text-rose-400 rounded hover:bg-rose-500/10 transition-colors"
                              title="Delete document"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Privacy & Anti-Prompt-Injection Guarantee */}
                <div className="p-3.5 bg-white/[0.02] border border-white/[0.06] rounded-xl text-xs text-slate-400 flex items-start gap-3">
                  <Info className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-slate-200">Local-First RAG Boundaries:</strong>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      When this library is attached to a conversation, only relevant chunks are matched and formatted into an untrusted system reference envelope. Prompt injection instructions embedded in documents are strictly neutralised.
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                <BookOpen className="w-10 h-10 text-slate-600 mb-3 opacity-50" />
                <h3 className="text-sm font-medium text-slate-300">Select or Create a Knowledge Library</h3>
                <p className="text-xs text-slate-500 max-w-sm mt-1">
                  Organize domain research, codebase specifications, or personal guides for context-augmented chat.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
