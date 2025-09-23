import { useMutation, useQuery } from '@tanstack/react-query';
import { pdfApi } from '../services/api';

export const useUploadPdf = () => {
  return useMutation({
    mutationFn: (file: File) => pdfApi.uploadPdf(file),
    onSuccess: () => {
      // You could invalidate queries here if needed
    },
  });
};

export const useQueryKnowledgeBase = () => {
  return useMutation({
    mutationFn: (query: string) => pdfApi.queryKnowledgeBase(query),
  });
};

export const useHealthCheck = () => {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => pdfApi.checkHealth(),
    retry: false,
    refetchOnWindowFocus: false,
  });
};
