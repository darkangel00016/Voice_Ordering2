import React, { useEffect, useRef } from 'react';
import { ConversationTurn } from '../lib/types';
import { User, Bot, Clock, Loader2, CheckCircle2, Mic } from 'lucide-react';

interface TranscriptPanelProps {
  turns: ConversationTurn[];
  className?: string;
  isProcessing?: boolean;
  isListening?: boolean;
}

/**
 * TranscriptPanel
 * 
 * Renders a scrollable list of conversation turns between the user and the AI assistant.
 * Handles auto-scrolling to the latest message and displays status indicators for
 * active listening or processing states.
 */
export const TranscriptPanel: React.FC<TranscriptPanelProps> = ({
  turns,
  className = '',
  isProcessing = false,
  isListening = false,
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when turns change or status updates
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [turns, isProcessing, isListening]);

  const formatTime = (isoString: string) => {
    try {
      return new Date(isoString).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch (e) {
      return '';
    }
  };

  return (
    <div 
      className={`flex flex-col h-full bg-slate-50 rounded-lg border border-slate-200 overflow-hidden ${className}`}
      aria-label="Conversation Transcript"
      role="log"
      aria-live="polite"
    >
      {/* Header */}
      <div className="bg-white p-3 border-b border-slate-200 flex justify-between items-center shadow-sm z-10">
        <h3 className="text-sm font-semibold text-slate-700 flex items-center gap-2">
          <Clock className="w-4 h-4 text-slate-400" />
          Live Transcript
        </h3>
        <div className="flex items-center gap-2 text-xs">
          {isListening && (
            <span className="flex items-center gap-1 text-red-600 font-medium animate-pulse">
              <Mic className="w-3 h-3" /> Listening
            </span>
          )}
          {isProcessing && (
            <span className="flex items-center gap-1 text-blue-600 font-medium">
              <Loader2 className="w-3 h-3 animate-spin" /> Processing
            </span>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 scroll-smooth"
      >
        {turns.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-400 text-sm italic">
            <p>No conversation yet.</p>
            <p>Start speaking to place an order.</p>
          </div>
        )}

        {turns.map((turn) => {
          const isUser = turn.role === 'user';
          return (
            <div
              key={turn.id}
              className={`flex w-full ${isUser ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`
                  flex max-w-[85%] md:max-w-[75%] rounded-2xl p-3 shadow-sm relative group
                  ${isUser 
                    ? 'bg-blue-600 text-white rounded-tr-none' 
                    : 'bg-white text-slate-800 border border-slate-200 rounded-tl-none'
                  }
                `}
              >
                {/* Icon Avatar */}
                <div 
                  className={`
                    absolute -top-2 w-6 h-6 rounded-full flex items-center justify-center border shadow-sm
                    ${isUser 
                      ? '-right-2 bg-blue-100 border-blue-200 text-blue-700' 
                      : '-left-2 bg-slate-100 border-slate-200 text-slate-600'
                    }
                  `}
                  aria-hidden="true"
                >
                  {isUser ? <User size={14} /> : <Bot size={14} />}
                </div>

                <div className="flex flex-col gap-1">
                  {/* Message Content */}
                  <p className="text-sm leading-relaxed whitespace-pre-wrap">
                    {turn.content}
                  </p>
                  
                  {/* Metadata Footer */}
                  <div 
                    className={`
                      flex items-center gap-2 text-[10px] mt-1
                      ${isUser ? 'text-blue-100' : 'text-slate-400'}
                    `}
                  >
                    <span>{formatTime(turn.timestamp)}</span>
                    
                    {/* Status Indicators for Assistant Messages */}
                    {!isUser && (
                      <span className="flex items-center gap-1" title="Processed">
                        <CheckCircle2 size={10} className="text-green-500" />
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}

        {/* Temporary Loading Bubble (Visual feedback for processing state) */}
        {isProcessing && (
          <div className="flex w-full justify-start animate-pulse">
            <div className="bg-slate-100 border border-slate-200 rounded-2xl rounded-tl-none p-3 max-w-[100px]">
              <div className="flex gap-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptPanel;