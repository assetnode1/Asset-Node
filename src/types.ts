export interface User {
  id: string;
  email: string;
  displayName: string;
  role: 'user' | 'admin';
  tier: 'free' | 'pro' | 'enterprise';
  createdAt: string;
  systemInstruction?: string;
  temperature?: number;
}

export interface Session {
  token: string;
  refreshToken: string;
  expiresAt: string;
}

export interface Attachment {
  id: string;
  userId: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  category: 'image' | 'document' | 'audio';
  url?: string;
  dataBase64?: string;
  createdAt: string;
}

export interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  model?: string;
  attachments?: Attachment[];
  retrievedContext?: {
    documentId: string;
    documentTitle: string;
    libraryName: string;
    chunkContent: string;
    relevanceScore: number;
  }[];
  tokensUsed?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  createdAt: string;
}

export interface Conversation {
  id: string;
  userId: string;
  title: string;
  model: string;
  archived: boolean;
  attachedLibraryIds?: string[];
  createdAt: string;
  updatedAt: string;
  lastMessageSnippet?: string;
  messageCount: number;
}

export interface ModelCapability {
  id: string;
  name: string;
  provider: 'gemini' | 'localai' | 'openai';
  description: string;
  contextWindow: number;
  maxOutputTokens: number;
  capabilities: {
    text: boolean;
    vision: boolean;
    streaming: boolean;
    tools: boolean;
  };
  speed: 'Ultra Fast' | 'Fast' | 'Standard';
  status: 'available' | 'requires_key' | 'offline_local';
  statusReason?: string;
}

export interface KnowledgeDocumentChunk {
  id: string;
  documentId: string;
  chunkIndex: number;
  content: string;
  charCount: number;
}

export interface KnowledgeDocument {
  id: string;
  libraryId: string;
  userId: string;
  title: string;
  originalFileName?: string;
  fileSize?: number;
  mimeType?: string;
  chunkCount: number;
  status: 'processing' | 'ready' | 'error';
  errorMessage?: string;
  createdAt: string;
}

export interface KnowledgeLibrary {
  id: string;
  userId: string;
  name: string;
  description: string;
  documentCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UsageMetric {
  id: string;
  userId: string;
  model: string;
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  timestamp: string;
}

export interface UsageSummary {
  totalTokens: number;
  totalPromptTokens: number;
  totalCompletionTokens: number;
  totalRequests: number;
  byModel: Record<string, { promptTokens: number; completionTokens: number; totalTokens: number; requests: number }>;
}
