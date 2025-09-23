import React from 'react';
import { Brain, Sparkles, Zap } from 'lucide-react';

interface LoadingAnimationProps {
  message?: string;
}

const LoadingAnimation: React.FC<LoadingAnimationProps> = ({
  message = 'Processing...',
}) => {
  return (
    <div className='flex flex-col items-center justify-center py-8 space-y-4'>
      <div className='relative'>
        {/* Main brain icon */}
        <Brain className='h-12 w-12 text-indigo-600 animate-pulse' />

        {/* Floating sparkles */}
        <Sparkles className='h-4 w-4 text-purple-500 absolute -top-2 -right-2 animate-bounce' />
        <Zap className='h-3 w-3 text-blue-500 absolute -bottom-1 -left-1 animate-ping' />

        {/* Orbital elements */}
        <div className='absolute inset-0 animate-spin'>
          <div className='w-16 h-16 border-2 border-transparent border-t-purple-300 rounded-full'></div>
        </div>
        <div
          className='absolute inset-1 animate-spin'
          style={{ animationDirection: 'reverse', animationDuration: '3s' }}
        >
          <div className='w-14 h-14 border-2 border-transparent border-t-indigo-300 rounded-full'></div>
        </div>
      </div>

      <div className='text-center'>
        <p className='text-lg font-semibold text-gray-700 mb-2'>{message}</p>
        <div className='flex items-center justify-center space-x-1'>
          <div className='w-2 h-2 bg-indigo-500 rounded-full animate-bounce'></div>
          <div
            className='w-2 h-2 bg-purple-500 rounded-full animate-bounce'
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className='w-2 h-2 bg-pink-500 rounded-full animate-bounce'
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </div>
  );
};

export default LoadingAnimation;
