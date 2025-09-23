import React, { useState, useRef, useEffect } from 'react';
import {
  Send,
  MessageCircle,
  Bot,
  User,
  Loader2,
  Sparkles,
  Brain,
  Zap,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Input } from './ui/input';
import { useQueryKnowledgeBase } from '../hooks/useApi';
import { formatBotAnswer } from '../lib/utils';
import LoadingAnimation from './LoadingAnimation';
import type { Source } from '../types/api';

interface Message {
  id: string;
  content: string;
  isUser: boolean;
  sources?: Source[];
}

const ChatInterface: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      content:
        "Welcome to your AI-powered knowledge assistant! Upload a PDF document and I'll transform it into an intelligent conversation partner. Ask me anything about your content and I'll provide precise, contextual answers.",
      isUser: false,
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const queryMutation = useQueryKnowledgeBase();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async () => {
    const query = inputValue.trim();
    if (!query) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: query,
      isUser: true,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');

    // Add loading message
    const loadingMessage: Message = {
      id: (Date.now() + 1).toString(),
      content: 'LOADING_ANIMATION',
      isUser: false,
    };
    setMessages((prev) => [...prev, loadingMessage]);

    try {
      const result = await queryMutation.mutateAsync(query);

      // Remove loading message and add bot response
      setMessages((prev) => {
        const withoutLoading = prev.filter(
          (msg) => msg.id !== loadingMessage.id
        );

        if (result.success && result.answer) {
          const botMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: result.answer,
            isUser: false,
            sources: result.sources,
          };
          return [...withoutLoading, botMessage];
        } else {
          const errorMessage: Message = {
            id: (Date.now() + 2).toString(),
            content: `❌ Sorry, I encountered an error: ${
              result.error || 'Unknown error'
            }`,
            isUser: false,
          };
          return [...withoutLoading, errorMessage];
        }
      });
    } catch (error) {
      // Remove loading message and add error
      setMessages((prev) => {
        const withoutLoading = prev.filter(
          (msg) => msg.id !== loadingMessage.id
        );
        const errorMessage: Message = {
          id: (Date.now() + 2).toString(),
          content: `❌ Sorry, I couldn't process your question: ${
            error instanceof Error ? error.message : 'Unknown error'
          }`,
          isUser: false,
        };
        return [...withoutLoading, errorMessage];
      });
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      handleSendMessage();
    }
  };

  const renderMessageContent = (content: string, isUser: boolean) => {
    if (isUser) {
      return <p>{content}</p>;
    }

    if (content === 'LOADING_ANIMATION') {
      return <LoadingAnimation message='Analyzing your document...' />;
    }

    // For bot messages, format the content
    const formattedContent = formatBotAnswer(content);
    return (
      <div
        dangerouslySetInnerHTML={{ __html: formattedContent }}
        className='prose prose-sm max-w-none break-words overflow-wrap-anywhere'
      />
    );
  };

  return (
    <Card className='w-full flex flex-col h-full bg-white/95 backdrop-blur-sm border-0 shadow-2xl max-h-[calc(100vh-300px)]'>
      <CardHeader className='pb-6 border-b border-gray-100 flex-shrink-0'>
        <CardTitle className='flex items-center gap-3 text-2xl'>
          <div className='relative'>
            <MessageCircle className='h-7 w-7 text-indigo-600 fill-indigo-600' />
            <Brain className='h-3 w-3 text-purple-500 absolute -top-1 -right-1 animate-pulse' />
          </div>
          <span className='bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent font-bold'>
            AI Conversation
          </span>
        </CardTitle>
        <p className='text-gray-600 text-sm mt-1'>
          Engage in intelligent dialogue with your documents
        </p>
      </CardHeader>
      <CardContent className='flex flex-col flex-1 pt-6 pb-6 min-h-0'>
        <div className='flex-1 rounded-xl p-6 overflow-y-auto bg-gradient-to-br from-gray-50/50 to-slate-50/50 backdrop-blur-sm border border-gray-100 space-y-6 mb-6 max-h-full'>
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex animate-fade-in ${
                message.isUser ? 'justify-end' : 'justify-start'
              }`}
            >
              <div
                className={`
                  max-w-[85%] rounded-2xl p-4 shadow-lg transition-all duration-300 hover:shadow-xl break-words chat-message
                  ${
                    message.isUser
                      ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white ml-12'
                      : 'bg-white text-gray-800 mr-12 border border-gray-100'
                  }
                `}
              >
                <div className='flex items-start gap-3'>
                  {!message.isUser && (
                    <div className='flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center mt-1'>
                      <Bot className='h-4 w-4 text-white' />
                    </div>
                  )}
                  <div className='flex-1 min-w-0 overflow-hidden'>
                    {renderMessageContent(message.content, message.isUser)}

                    {message.sources && message.sources.length > 0 && (
                      <div className='mt-4 p-3 bg-gradient-to-br from-gray-50 to-slate-50 rounded-lg border border-gray-200'>
                        <div className='flex items-center gap-2 mb-2'>
                          <Zap className='h-4 w-4 text-indigo-600' />
                          <strong className='text-gray-700 text-sm'>
                            Knowledge Sources:
                          </strong>
                        </div>
                        <div className='space-y-2'>
                          {message.sources.map((source, index) => (
                            <div
                              key={index}
                              className='p-2 bg-white rounded-md border border-gray-100'
                            >
                              <div className='flex items-center gap-2 mb-1'>
                                <div className='w-2 h-2 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full'></div>
                                <span className='font-semibold text-xs text-gray-600'>
                                  Relevance: {(source.score * 100).toFixed(1)}%
                                </span>
                              </div>
                              <p className='text-xs text-gray-600 leading-relaxed break-words'>
                                {source.content}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  {message.isUser && (
                    <div className='flex-shrink-0 w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mt-1'>
                      <User className='h-4 w-4 text-white' />
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>

        <div className='flex gap-3 flex-shrink-0'>
          <div className='flex-1 relative'>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyPress}
              placeholder='Ask anything about your document...'
              disabled={queryMutation.isPending}
              className='pr-12 py-6 text-lg rounded-xl border-2 border-gray-200 focus:border-indigo-400 transition-all duration-300'
            />
            <Sparkles className='absolute right-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400' />
          </div>
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || queryMutation.isPending}
            className={`
              px-6 py-6 rounded-xl font-bold transition-all duration-300
              bg-gradient-to-r from-indigo-600 to-purple-600 
              hover:from-indigo-700 hover:to-purple-700 
              hover:shadow-lg hover:scale-105
              disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
            `}
          >
            {queryMutation.isPending ? (
              <Loader2 className='h-5 w-5 animate-spin' />
            ) : (
              <Send className='h-5 w-5' />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default ChatInterface;
