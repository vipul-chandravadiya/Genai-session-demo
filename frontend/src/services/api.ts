import axios from 'axios';
import type {
  UploadResponse,
  QueryRequest,
  QueryResponse,
  HealthResponse,
} from '../types/api';

// Use relative URLs since we have proxy configured in Vite
const api = axios.create({
  timeout: 30000, // 30 seconds timeout for file uploads
});

export const pdfApi = {
  uploadPdf: async (file: File): Promise<UploadResponse> => {
    const formData = new FormData();
    formData.append('pdf', file);

    const response = await api.post<UploadResponse>('/upload-pdf', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response.data;
  },

  queryKnowledgeBase: async (query: string): Promise<QueryResponse> => {
    const response = await api.post<QueryResponse>('/query', {
      query,
    } as QueryRequest);

    return response.data;
  },

  checkHealth: async (): Promise<HealthResponse> => {
    const response = await api.get<HealthResponse>('/health');
    return response.data;
  },
};

export default api;
