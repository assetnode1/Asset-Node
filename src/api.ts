import {
  User,
  Conversation,
  Message,
  ModelCapability,
  Attachment,
  KnowledgeLibrary,
  KnowledgeDocument,
  UsageSummary,
} from './types';

const TOKEN_KEY = 'gentlearrow_token';
const REFRESH_KEY = 'gentlearrow_refresh_token';

export function getStoredToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setStoredSession(token: string, refreshToken: string) {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(REFRESH_KEY, refreshToken);
}

export function clearStoredSession() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(REFRESH_KEY);
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getStoredToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // Handle transparent 401 refresh attempt
  if (response.status === 401) {
    const refreshToken = localStorage.getItem(REFRESH_KEY);
    if (refreshToken) {
      try {
        const refreshRes = await fetch('/api/v1/auth/refresh', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setStoredSession(data.token, data.refreshToken);
          headers['Authorization'] = `Bearer ${data.token}`;
          response = await fetch(endpoint, {
            ...options,
            headers,
          });
        } else {
          clearStoredSession();
        }
      } catch (err) {
        clearStoredSession();
      }
    }
  }

  if (!response.ok) {
    let errorMsg = `Request failed: ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error) errorMsg = errJson.error;
    } catch (_) {}
    throw new Error(errorMsg);
  }

  return response.json();
}

export const api = {
  // Auth
  async getMe(): Promise<User> {
    return request<User>('/api/v1/auth/me');
  },

  async login(email: string, password: string): Promise<{ user: User; token: string; refreshToken: string }> {
    const res = await request<{ user: User; token: string; refreshToken: string }>('/api/v1/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    setStoredSession(res.token, res.refreshToken);
    return res;
  },

  async register(email: string, password: string, displayName?: string): Promise<{ user: User; token: string; refreshToken: string }> {
    const res = await request<{ user: User; token: string; refreshToken: string }>('/api/v1/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password, displayName }),
    });
    setStoredSession(res.token, res.refreshToken);
    return res;
  },

  async logout(): Promise<void> {
    try {
      await request('/api/v1/auth/logout', { method: 'POST' });
    } finally {
      clearStoredSession();
    }
  },

  async updateProfile(data: { displayName?: string; systemInstruction?: string; temperature?: number }): Promise<User> {
    return request<User>('/api/v1/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async exportAccount(): Promise<void> {
    const token = getStoredToken();
    const res = await fetch('/api/v1/auth/export', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gentlearrow307-account-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  async deleteAccount(): Promise<void> {
    await request('/api/v1/auth/account', { method: 'DELETE' });
    clearStoredSession();
  },

  // Models
  async getModels(): Promise<{ models: ModelCapability[]; defaultModel: string }> {
    return request<{ models: ModelCapability[]; defaultModel: string }>('/api/v1/models');
  },

  // Conversations
  async getConversations(params?: { q?: string; archived?: boolean }): Promise<{ conversations: Conversation[] }> {
    const query = new URLSearchParams();
    if (params?.q) query.set('q', params.q);
    if (params?.archived !== undefined) query.set('archived', String(params.archived));
    return request<{ conversations: Conversation[] }>(`/api/v1/conversations?${query.toString()}`);
  },

  async createConversation(data: { title?: string; model?: string; attachedLibraryIds?: string[] }): Promise<{ conversation: Conversation }> {
    return request<{ conversation: Conversation }>('/api/v1/conversations', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getConversation(id: string): Promise<{ conversation: Conversation; messages: Message[] }> {
    return request<{ conversation: Conversation; messages: Message[] }>(`/api/v1/conversations/${id}`);
  },

  async updateConversation(
    id: string,
    data: { title?: string; archived?: boolean; model?: string; attachedLibraryIds?: string[] }
  ): Promise<{ conversation: Conversation }> {
    return request<{ conversation: Conversation }>(`/api/v1/conversations/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  },

  async deleteConversation(id: string): Promise<void> {
    await request(`/api/v1/conversations/${id}`, { method: 'DELETE' });
  },

  async exportConversation(id: string, title: string): Promise<void> {
    const token = getStoredToken();
    const res = await fetch(`/api/v1/conversations/${id}/export`, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.replace(/[^a-zA-Z0-9_-]/g, '_')}.md`;
    a.click();
    window.URL.revokeObjectURL(url);
  },

  // Attachments
  async uploadAttachment(fileName: string, mimeType: string, dataBase64: string, fileSize?: number): Promise<{ attachment: Attachment }> {
    return request<{ attachment: Attachment }>('/api/v1/attachments/upload', {
      method: 'POST',
      body: JSON.stringify({ fileName, mimeType, dataBase64, fileSize }),
    });
  },

  async getAttachments(): Promise<{ attachments: Attachment[] }> {
    return request<{ attachments: Attachment[] }>('/api/v1/attachments');
  },

  async deleteAttachment(id: string): Promise<void> {
    await request(`/api/v1/attachments/${id}`, { method: 'DELETE' });
  },

  // Knowledge Base (RAG)
  async getLibraries(): Promise<{ libraries: KnowledgeLibrary[] }> {
    return request<{ libraries: KnowledgeLibrary[] }>('/api/v1/knowledge/libraries');
  },

  async createLibrary(name: string, description?: string): Promise<{ library: KnowledgeLibrary }> {
    return request<{ library: KnowledgeLibrary }>('/api/v1/knowledge/libraries', {
      method: 'POST',
      body: JSON.stringify({ name, description }),
    });
  },

  async deleteLibrary(id: string): Promise<void> {
    await request(`/api/v1/knowledge/libraries/${id}`, { method: 'DELETE' });
  },

  async getLibraryDocuments(libraryId: string): Promise<{ documents: KnowledgeDocument[] }> {
    return request<{ documents: KnowledgeDocument[] }>(`/api/v1/knowledge/libraries/${libraryId}/documents`);
  },

  async addDocumentToLibrary(
    libraryId: string,
    data: { title: string; content: string; originalFileName?: string; mimeType?: string }
  ): Promise<{ document: KnowledgeDocument; chunksCreated: number }> {
    return request<{ document: KnowledgeDocument; chunksCreated: number }>(`/api/v1/knowledge/libraries/${libraryId}/documents`, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async deleteDocument(id: string): Promise<void> {
    await request(`/api/v1/knowledge/documents/${id}`, { method: 'DELETE' });
  },

  // Usage & Ledger
  async getUsage(): Promise<{ summary: UsageSummary; recentRecords: any[] }> {
    return request<{ summary: UsageSummary; recentRecords: any[] }>('/api/v1/usage');
  },

  // Billing
  async getBilling(): Promise<any> {
    return request<any>('/api/v1/billing');
  },

  // Stop Generation
  async stopGeneration(conversationId: string): Promise<void> {
    await request('/api/v1/ai/chat/stop', {
      method: 'POST',
      body: JSON.stringify({ conversationId }),
    });
  },

  // SSE Stream listener
  streamChat(
    payload: {
      conversationId: string;
      message: string;
      model?: string;
      attachments?: Attachment[];
      attachedLibraryIds?: string[];
    },
    callbacks: {
      onToken: (token: string) => void;
      onRagContext?: (chunks: any[]) => void;
      onDone: (data: { messageId?: string; usage?: any }) => void;
      onError: (err: string) => void;
      onCancelled?: () => void;
    }
  ): () => void {
    const token = getStoredToken();
    const abortCtrl = new AbortController();

    (async () => {
      try {
        const response = await fetch('/api/v1/ai/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
          body: JSON.stringify(payload),
          signal: abortCtrl.signal,
        });

        if (!response.ok) {
          let errMsg = `Generation failed (${response.status})`;
          try {
            const errJson = await response.json();
            if (errJson.error) errMsg = errJson.error;
          } catch (_) {}
          callbacks.onError(errMsg);
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          callbacks.onError('ReadableStream not supported by browser');
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            const trimmed = line.trim();
            if (trimmed.startsWith('data: ')) {
              const dataStr = trimmed.substring(6).trim();
              if (!dataStr) continue;
              try {
                const parsed = JSON.parse(dataStr);
                if (parsed.type === 'token') {
                  callbacks.onToken(parsed.content);
                } else if (parsed.type === 'rag_context' && callbacks.onRagContext) {
                  callbacks.onRagContext(parsed.chunks);
                } else if (parsed.type === 'cancelled') {
                  callbacks.onCancelled?.();
                } else if (parsed.type === 'done') {
                  callbacks.onDone(parsed);
                } else if (parsed.type === 'error') {
                  callbacks.onError(parsed.error);
                }
              } catch (e) {
                console.warn('Failed to parse SSE payload:', dataStr);
              }
            }
          }
        }
      } catch (err: any) {
        if (err.name === 'AbortError') {
          callbacks.onCancelled?.();
        } else {
          callbacks.onError(err.message || 'Stream connection failed');
        }
      }
    })();

    return () => {
      abortCtrl.abort();
    };
  },
};
