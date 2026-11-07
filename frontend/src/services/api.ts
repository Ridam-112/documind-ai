import {
  AuthResponse,
  User,
  DocumentItem,
  DocumentPage,
  ConversationSummary,
  Conversation,
  Message,
  Collection,
  HealthInfo,
} from '../types';

const API_BASE = '/api';

export class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = 'ApiError';
  }
}

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('documind_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers = {
    ...getAuthHeader(),
    ...options.headers,
  };

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = response.statusText;
    let errorData = null;
    try {
      errorData = await response.json();
      if (errorData?.detail) {
        errorDetail = typeof errorData.detail === 'string' ? errorData.detail : JSON.stringify(errorData.detail);
      }
    } catch {
      // ignore json parse error
    }
    throw new ApiError(response.status, errorDetail, errorData);
  }

  if (response.status === 204) {
    return {} as T;
  }

  return response.json();
}

export const api = {
  // Auth
  auth: {
    async register(name: string, email: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, password }),
      });
    },

    async login(email: string, password: string): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
    },

    async logout(): Promise<void> {
      try {
        await request('/auth/logout', { method: 'POST' });
      } finally {
        localStorage.removeItem('documind_token');
        localStorage.removeItem('documind_user');
      }
    },

    async getMe(): Promise<User> {
      return request<User>('/auth/me');
    },

    async getGuest(): Promise<AuthResponse> {
      return request<AuthResponse>('/auth/guest');
    },
  },

  // Documents
  documents: {
    async list(search?: string): Promise<DocumentItem[]> {
      const q = search ? `?search=${encodeURIComponent(search)}` : '';
      return request<DocumentItem[]>(`/documents${q}`);
    },

    async get(id: string): Promise<DocumentItem> {
      return request<DocumentItem>(`/documents/${id}`);
    },

    async upload(file: File, title?: string): Promise<DocumentItem> {
      const formData = new FormData();
      formData.append('file', file);
      if (title) formData.append('title', title);

      return request<DocumentItem>('/documents/upload', {
        method: 'POST',
        body: formData,
      });
    },

    async delete(id: string): Promise<void> {
      return request<void>(`/documents/${id}`, { method: 'DELETE' });
    },

    async getStatus(id: string): Promise<{ id: string; processing_status: string; page_count: number; processing_error?: string }> {
      return request(`/documents/${id}/status`);
    },

    async getPage(documentId: string, pageNumber: number): Promise<DocumentPage> {
      return request<DocumentPage>(`/documents/${documentId}/pages/${pageNumber}`);
    },

    getFileUrl(documentId: string): string {
      return `${API_BASE}/documents/${documentId}/file`;
    },
  },

  // Chat
  chat: {
    async sendMessage(
      documentId: string,
      message: string,
      conversationId?: string
    ): Promise<{ conversation_id: string; message: Message }> {
      return request(`/documents/${documentId}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, conversation_id: conversationId }),
      });
    },

    async listConversations(documentId?: string): Promise<ConversationSummary[]> {
      const q = documentId ? `?document_id=${documentId}` : '';
      return request<ConversationSummary[]>(`/conversations${q}`);
    },

    async getConversation(id: string): Promise<Conversation> {
      return request<Conversation>(`/conversations/${id}`);
    },

    async deleteConversation(id: string): Promise<void> {
      return request<void>(`/conversations/${id}`, { method: 'DELETE' });
    },
  },

  // Collections
  collections: {
    async list(): Promise<Collection[]> {
      return request<Collection[]>('/collections');
    },

    async create(name: string, description?: string): Promise<Collection> {
      return request<Collection>('/collections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
    },

    async update(id: string, name?: string, description?: string): Promise<Collection> {
      return request<Collection>(`/collections/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, description }),
      });
    },

    async delete(id: string): Promise<void> {
      return request<void>(`/collections/${id}`, { method: 'DELETE' });
    },

    async addDocument(collectionId: string, documentId: string): Promise<Collection> {
      return request<Collection>(`/collections/${collectionId}/documents/${documentId}`, {
        method: 'POST',
      });
    },

    async removeDocument(collectionId: string, documentId: string): Promise<Collection> {
      return request<Collection>(`/collections/${collectionId}/documents/${documentId}`, {
        method: 'DELETE',
      });
    },
  },

  // Health & AI Settings
  health: {
    async check(): Promise<HealthInfo> {
      return request<HealthInfo>('/health');
    },
  },

  settings: {
    async getAI(): Promise<{
      llm_provider: string;
      llm_model: string;
      llm_key_configured: boolean;
      embedding_provider: string;
      embedding_model: string;
      embedding_key_configured: boolean;
    }> {
      return request('/settings/ai');
    },

    async updateAI(data: {
      llm_provider: string;
      llm_api_key: string;
      llm_model: string;
      embedding_provider?: string;
      embedding_api_key?: string;
    }): Promise<any> {
      return request('/settings/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
    },
  },
};
