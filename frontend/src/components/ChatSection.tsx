import React, { useState, useRef, useEffect } from 'react';
import { ArrowUp, Loader2, AlertCircle } from 'lucide-react';
import { ChatMessage } from '../types';
import { parseTimestamps } from '../utils/timestamp';
import { TimestampBadge } from './TimestampBadge';

interface ChatSectionProps {
  messages: ChatMessage[];
  isLoadingAnswer: boolean;
  isPrepared: boolean;
  onSendQuestion: (question: string) => void;
}

export const ChatSection: React.FC<ChatSectionProps> = ({
  messages,
  isLoadingAnswer,
  isPrepared,
  onSendQuestion,
}) => {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auto-scroll when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoadingAnswer]);

  // Focus input automatically when video becomes ready
  useEffect(() => {
    if (isPrepared) {
      inputRef.current?.focus();
    }
  }, [isPrepared]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoadingAnswer || !isPrepared) return;
    onSendQuestion(input.trim());
    setInput('');
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const renderMessageContent = (msg: ChatMessage) => {
    if (msg.sender === 'user') {
      return <div className="message-text">{msg.text}</div>;
    }

    if (msg.isError) {
      return (
        <div className="message-error-box">
          <AlertCircle size={13} className="flex-shrink-0 mt-0.5" />
          <span>{msg.text}</span>
        </div>
      );
    }

    // Tokenize timestamps for interactive player seeking
    const segments = parseTimestamps(msg.text);

    return (
      <div className="message-text">
        {segments.map((seg, idx) => {
          if (seg.type === 'timestamp' && seg.seconds !== undefined) {
            return (
              <TimestampBadge
                key={idx}
                label={seg.content}
                seconds={seg.seconds}
              />
            );
          }
          return <span key={idx}>{seg.content}</span>;
        })}
      </div>
    );
  };

  return (
    <div className="chat-section">
      <div className="messages-container">
        {messages.length === 0 ? (
          <div className="chat-blank-state">
            <p className="blank-state-text">
              {isPrepared
                ? 'Ask a question about the video transcript.'
                : 'Prepare the video above to ask questions.'}
            </p>
          </div>
        ) : (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`message-bubble ${
                msg.sender === 'user' ? 'message-user' : 'message-assistant'
              }`}
            >
              <div className="message-body">{renderMessageContent(msg)}</div>
            </div>
          ))
        )}

        {isLoadingAnswer && (
          <div className="message-bubble message-assistant message-loading">
            <div className="loading-dots">
              <Loader2 size={12} className="spin" />
              <span>Searching transcript...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <div className="chat-input-bar">
        <form onSubmit={handleSubmit} className="input-form">
          <input
            ref={inputRef}
            type="text"
            className="chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isPrepared
                ? 'Ask a question...'
                : 'Prepare video to chat'
            }
            disabled={!isPrepared || isLoadingAnswer}
          />
          <button
            type="submit"
            className="send-button"
            disabled={!isPrepared || isLoadingAnswer || !input.trim()}
            title="Send (Enter)"
            aria-label="Send question"
          >
            {isLoadingAnswer ? (
              <Loader2 size={13} className="spin" />
            ) : (
              <ArrowUp size={13} strokeWidth={2.5} />
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
