import { useEffect, useState } from 'react';
import { BookOpen, Brain, Sparkles } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ChatInterface from './components/ChatInterface';
import { useHealthCheck } from './hooks/useApi';

function App() {
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const healthQuery = useHealthCheck();

  useEffect(() => {
    // Check server health on load
    if (healthQuery.data) {
      console.log('Server health:', healthQuery.data);
    }
    if (healthQuery.error) {
      console.warn('Could not connect to server:', healthQuery.error);
    }
  }, [healthQuery.data, healthQuery.error]);

  const handleUploadSuccess = () => {
    setUploadSuccess(true);
    // Reset after 3 seconds to allow new uploads
    setTimeout(() => setUploadSuccess(false), 3000);
  };

  return (
    <div className='min-h-screen bg-gradient-to-br from-indigo-900 via-purple-900 to-pink-900 relative overflow-hidden'>
      {/* Animated background elements */}
      <div className='absolute inset-0 overflow-hidden'>
        <div className='absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse'></div>
        <div className='absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-pulse animation-delay-2000'></div>
        <div className='absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse animation-delay-4000'></div>
      </div>

      <div className='relative z-10 min-h-screen p-4 lg:p-8'>
        <div className='container mx-auto max-w-7xl'>
          {/* Header */}
          <div className='mb-12 text-center'>
            <div className='relative group'>
              <div className='absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-3xl blur-lg opacity-75 group-hover:opacity-100 transition-all duration-300'></div>
              <div className='relative bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl p-8 border border-white/20'>
                <div className='flex items-center justify-center gap-4 mb-4'>
                  <div className='relative'>
                    <BookOpen className='h-12 w-12 text-indigo-600' />
                    <Sparkles className='h-5 w-5 text-purple-500 absolute -top-1 -right-1 animate-bounce' />
                  </div>
                  <Brain className='h-12 w-12 text-purple-600 animate-pulse' />
                </div>
                <h1 className='text-5xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent'>
                  AI Knowledge Base
                </h1>
                <p className='text-gray-600 mt-2 text-lg font-medium'>
                  Transform your PDFs into intelligent conversations
                </p>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className='grid grid-cols-1 xl:grid-cols-2 gap-8 h-[calc(100vh-300px)]'>
            {/* Upload Section */}
            <div className='flex flex-col'>
              <FileUpload onUploadSuccess={handleUploadSuccess} />
            </div>

            {/* Chat Section */}
            <div className='flex flex-col h-full'>
              <ChatInterface />
            </div>
          </div>

          {/* Status Footer */}
          <div className='mt-12 text-center'>
            <div className='inline-flex items-center gap-4 px-6 py-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20'>
              <div className='flex items-center gap-2'>
                <div
                  className={`w-2 h-2 rounded-full ${
                    healthQuery.isLoading
                      ? 'bg-yellow-400 animate-pulse'
                      : healthQuery.error
                      ? 'bg-red-400'
                      : 'bg-green-400'
                  }`}
                ></div>
                <span className='text-white/90 text-sm font-medium'>
                  {healthQuery.isLoading && 'Connecting to AI server...'}
                  {healthQuery.error && 'Server unavailable'}
                  {healthQuery.data && 'AI Ready'}
                </span>
              </div>
              {uploadSuccess && (
                <div className='flex items-center gap-2 text-green-300 animate-fade-in'>
                  <Sparkles className='h-4 w-4' />
                  <span className='text-sm font-medium'>Upload complete!</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;
