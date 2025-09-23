export interface UploadResponse {
  success: boolean;
  error?: string;
}

export interface QueryRequest {
  query: string;
}

export interface Source {
  score: number;
  content: string;
}

export interface QueryResponse {
  success: boolean;
  answer?: string;
  sources?: Source[];
  error?: string;
}

export interface HealthResponse {
  status: string;
  timestamp: string;
}
