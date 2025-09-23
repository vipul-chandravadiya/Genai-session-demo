import React, { useCallback, useState } from 'react';
import {
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Loader2,
  Sparkles,
  Zap,
  Brain,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { useUploadPdf } from '../hooks/useApi';
import { formatFileSize } from '../lib/utils';

interface FileUploadProps {
  onUploadSuccess: () => void;
}

const FileUpload: React.FC<FileUploadProps> = ({ onUploadSuccess }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const uploadMutation = useUploadPdf();

  const handleFileSelect = useCallback((file: File) => {
    if (file && file.type === 'application/pdf') {
      setSelectedFile(file);
    } else {
      alert('Please select a valid PDF file.');
    }
  }, []);

  const handleFileInputChange = (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);

    const file = event.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    try {
      const result = await uploadMutation.mutateAsync(selectedFile);

      if (result.success) {
        setSelectedFile(null);
        onUploadSuccess();
        // Reset file input
        const fileInput = document.getElementById(
          'fileInput'
        ) as HTMLInputElement;
        if (fileInput) {
          fileInput.value = '';
        }
      } else {
        alert(`Upload failed: ${result.error}`);
      }
    } catch (error) {
      alert(
        `Upload failed: ${
          error instanceof Error ? error.message : 'Unknown error'
        }`
      );
    }
  };

  const getStatusIcon = () => {
    if (uploadMutation.isPending) {
      return <Loader2 className='h-5 w-5 animate-spin text-blue-500' />;
    }
    if (uploadMutation.isSuccess) {
      return <CheckCircle className='h-5 w-5 text-green-500' />;
    }
    if (uploadMutation.isError) {
      return <AlertCircle className='h-5 w-5 text-red-500' />;
    }
    return null;
  };

  const getStatusMessage = () => {
    if (uploadMutation.isPending) {
      return '🔄 Processing PDF...';
    }
    if (uploadMutation.isSuccess) {
      return '✅ PDF processed successfully! You can now ask questions.';
    }
    if (uploadMutation.isError) {
      return `❌ Error: ${uploadMutation.error?.message || 'Upload failed'}`;
    }
    return null;
  };

  return (
    <Card className='w-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl'>
      <CardHeader className='pb-6'>
        <CardTitle className='flex items-center gap-3 text-2xl'>
          <div className='relative'>
            <Upload className='h-7 w-7 text-indigo-600' />
            <Sparkles className='h-3 w-3 text-purple-500 absolute -top-1 -right-1 animate-bounce' />
          </div>
          <span className='bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold'>
            Upload PDF
          </span>
        </CardTitle>
        <p className='text-gray-600 text-sm mt-1'>
          Upload your document to start an intelligent conversation
        </p>
      </CardHeader>
      <CardContent className='space-y-6'>
        <div
          className={`
            relative border-2 border-dashed rounded-xl p-12 text-center cursor-pointer 
            transition-all duration-300 ease-in-out transform hover:scale-[1.02]
            ${
              isDragOver
                ? 'border-purple-500 bg-gradient-to-br from-purple-50 to-indigo-50 shadow-lg'
                : selectedFile
                ? 'border-green-500 bg-gradient-to-br from-green-50 to-emerald-50 shadow-lg'
                : 'border-gray-300 bg-gradient-to-br from-gray-50 to-slate-50 hover:border-indigo-400 hover:bg-gradient-to-br hover:from-indigo-50 hover:to-purple-50'
            }
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => document.getElementById('fileInput')?.click()}
        >
          <input
            id='fileInput'
            type='file'
            accept='.pdf'
            className='hidden'
            onChange={handleFileInputChange}
          />

          {selectedFile ? (
            <div className='space-y-4 animate-fade-in'>
              <div className='relative inline-block'>
                <FileText className='h-16 w-16 mx-auto text-green-600' />
                <div className='absolute -top-2 -right-2 w-6 h-6 bg-green-500 rounded-full flex items-center justify-center'>
                  <CheckCircle className='h-4 w-4 text-white' />
                </div>
              </div>
              <div>
                <p className='font-bold text-green-700 text-lg mb-1'>
                  {selectedFile.name}
                </p>
                <p className='text-sm text-gray-600 mb-2'>
                  Size: {formatFileSize(selectedFile.size)}
                </p>
                <div className='inline-flex items-center gap-2 px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium'>
                  <Zap className='h-3 w-3' />
                  Ready to process!
                </div>
              </div>
            </div>
          ) : (
            <div className='space-y-4'>
              <div className='relative inline-block'>
                <Upload className='h-16 w-16 mx-auto text-gray-400 transition-colors group-hover:text-indigo-500' />
                <Brain className='h-5 w-5 text-purple-500 absolute -top-1 -right-1 animate-pulse' />
              </div>
              <div>
                <p className='font-bold text-gray-700 text-lg mb-2'>
                  Drop your PDF here
                </p>
                <p className='text-gray-500 mb-1'>or click to browse files</p>
                <p className='text-xs text-gray-400'>Maximum file size: 10MB</p>
              </div>
            </div>
          )}
        </div>

        <Button
          onClick={handleUpload}
          disabled={!selectedFile || uploadMutation.isPending}
          className={`
            w-full py-6 text-lg font-bold rounded-xl transition-all duration-300
            ${
              uploadMutation.isPending
                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                : 'bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 hover:shadow-lg hover:scale-[1.02]'
            }
            disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
          `}
        >
          <div className='flex items-center justify-center gap-3'>
            <Brain className='h-5 w-5' />
            <span>Transform to AI Knowledge</span>
            <Sparkles className='h-5 w-5 animate-pulse' />
          </div>
        </Button>

        {(uploadMutation.isPending ||
          uploadMutation.isSuccess ||
          uploadMutation.isError) && (
          <div
            className={`
            p-4 rounded-xl flex items-center gap-3 animate-fade-in border
            ${
              uploadMutation.isPending
                ? 'bg-gradient-to-r from-blue-50 to-purple-50 text-blue-700 border-blue-200'
                : ''
            }
            ${
              uploadMutation.isSuccess
                ? 'bg-gradient-to-r from-green-50 to-emerald-50 text-green-700 border-green-200'
                : ''
            }
            ${
              uploadMutation.isError
                ? 'bg-gradient-to-r from-red-50 to-pink-50 text-red-700 border-red-200'
                : ''
            }
          `}
          >
            {getStatusIcon()}
            <span className='font-semibold'>{getStatusMessage()}</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default FileUpload;
