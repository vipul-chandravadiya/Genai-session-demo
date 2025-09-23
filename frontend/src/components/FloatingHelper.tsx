import React from 'react';
import { HelpCircle, Lightbulb } from 'lucide-react';

interface FloatingHelperProps {
  onSuggestedQuestionClick: (question: string) => void;
}

const FloatingHelper: React.FC<FloatingHelperProps> = ({
  onSuggestedQuestionClick,
}) => {
  const suggestedQuestions = [
    'What is the main topic of this document?',
    'Can you summarize the key points?',
    'What are the important dates mentioned?',
    'Who are the main people or entities discussed?',
  ];

  return (
    <div className='fixed bottom-6 right-6 z-50 group'>
      <div className='relative'>
        {/* Suggested questions tooltip */}
        <div className='absolute bottom-16 right-0 w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-300 transform translate-y-2 group-hover:translate-y-0'>
          <div className='flex items-center gap-2 mb-3'>
            <Lightbulb className='h-4 w-4 text-yellow-500' />
            <span className='font-semibold text-gray-700 text-sm'>
              Suggested Questions
            </span>
          </div>
          <div className='space-y-2'>
            {suggestedQuestions.map((question, index) => (
              <button
                key={index}
                onClick={() => onSuggestedQuestionClick(question)}
                className='w-full text-left p-2 text-sm text-gray-600 hover:bg-indigo-50 hover:text-indigo-700 rounded-lg transition-all duration-200'
              >
                {question}
              </button>
            ))}
          </div>
        </div>

        {/* Main FAB */}
        <button className='w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 flex items-center justify-center group'>
          <HelpCircle className='h-6 w-6 group-hover:animate-bounce' />
        </button>
      </div>
    </div>
  );
};

export default FloatingHelper;
