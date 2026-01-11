'use client';

/**
 * AI Chat Panel
 * Collapsible panel for AI chat in the video viewer
 */

import { useState, useEffect } from 'react';
import { MessageCircle, ChevronLeft, Loader2 } from 'lucide-react';
import { AiMessageList } from './ai-message-list';
import { AiChatInput } from './ai-chat-input';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

export interface AiChatPanelProps {
  videoId: string;
  childProfileId: string;
  childName: string;
  isExpanded?: boolean;
  onToggle?: () => void;
}

const AI_CHAT_STORAGE_KEY = 'safestream_ai_chat_expanded';

export function AiChatPanel({
  videoId,
  childProfileId,
  childName,
  isExpanded: controlledExpanded,
  onToggle: controlledToggle,
}: AiChatPanelProps) {
  // Use controlled state if provided, otherwise use local state with localStorage
  const [localExpanded, setLocalExpanded] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem(AI_CHAT_STORAGE_KEY);
    return stored === 'true';
  });

  const isExpanded = controlledExpanded !== undefined ? controlledExpanded : localExpanded;

  const handleToggle = () => {
    if (controlledToggle) {
      controlledToggle();
    } else {
      const newValue = !localExpanded;
      setLocalExpanded(newValue);
      localStorage.setItem(AI_CHAT_STORAGE_KEY, String(newValue));
    }
  };

  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isAiAvailable, setIsAiAvailable] = useState(true);

  // Check AI availability on mount
  useEffect(() => {
    const checkAiAvailability = async () => {
      try {
        const response = await fetch('/api/ai/chat');
        const data = await response.json();
        setIsAiAvailable(data.available);
      } catch (err) {
        console.error('Failed to check AI availability:', err);
        setIsAiAvailable(false);
      }
    };

    checkAiAvailability();
  }, []);

  // Load conversation history on mount
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await fetch(
          `/api/ai/conversations/${videoId}?childProfileId=${childProfileId}`
        );

        if (!response.ok) {
          throw new Error('Failed to load conversation history');
        }

        const data = await response.json();

        if (data.conversations && data.conversations.length > 0) {
          const latestConversation = data.conversations[0];
          setConversationId(latestConversation.id);
          setMessages(
            latestConversation.messages.map((msg: any) => ({
              ...msg,
              createdAt: new Date(msg.createdAt),
            }))
          );
        }
      } catch (err) {
        console.error('Failed to load conversation history:', err);
        // Don't show error to user, just start with empty conversation
      }
    };

    if (isExpanded) {
      loadHistory();
    }
  }, [videoId, childProfileId, isExpanded]);

  const handleSendMessage = async (message: string) => {
    setIsLoading(true);
    setError(null);

    // Add user message immediately for optimistic UI
    const userMessage: ChatMessage = {
      id: `temp-${Date.now()}`,
      role: 'user',
      content: message,
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);

    // Add placeholder for assistant message
    const assistantMessageId = `assistant-${Date.now()}`;
    const assistantMessage: ChatMessage = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      createdAt: new Date(),
    };
    setMessages((prev) => [...prev, assistantMessage]);

    try {
      const response = await fetch('/api/ai/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          conversationId,
          videoId,
          childProfileId,
          message,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('Response body is null');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.trim() || !line.startsWith('data: ')) continue;

          const data = line.slice(6);
          if (data === '[DONE]') {
            setIsLoading(false);
            continue;
          }

          try {
            const parsed = JSON.parse(data);

            if (parsed.type === 'conversationId' && !conversationId) {
              setConversationId(parsed.conversationId);
            } else if (parsed.type === 'chunk' && parsed.content) {
              fullContent += parsed.content;
              // Update the assistant message with accumulated content
              setMessages((prev) =>
                prev.map((msg) =>
                  msg.id === assistantMessageId
                    ? { ...msg, content: fullContent }
                    : msg
                )
              );
            } else if (parsed.type === 'error') {
              throw new Error(parsed.content || 'An error occurred');
            } else if (parsed.type === 'done') {
              setIsLoading(false);
            }
          } catch (e) {
            // Only log if it's not a JSON parse error from streaming
            if (!(e instanceof SyntaxError)) {
              console.error('Failed to parse SSE data:', e);
            }
          }
        }
      }

      setIsLoading(false);
    } catch (err) {
      console.error('Failed to send message:', err);

      // Show error message in place of empty assistant bubble
      setMessages((prev) =>
        prev.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: 'Sorry, I encountered an error. The AI service may be unavailable right now.',
              }
            : msg
        )
      );

      setError(err instanceof Error ? err.message : 'Failed to send message');
      setIsLoading(false);
    }
  };

  if (!isAiAvailable) {
    return (
      <div className="flex items-center justify-center p-4 text-center">
        <div className="rounded-lg bg-gray-800 p-6">
          <MessageCircle className="mx-auto mb-2 h-8 w-8 text-gray-500" />
          <p className="text-sm text-gray-400">
            AI chat is currently unavailable
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-gray-700 p-4">
        <div className="flex items-center gap-2">
          {isExpanded && (
            <button
              onClick={handleToggle}
              className="rounded-lg p-1 hover:bg-gray-700"
              aria-label="Back to suggestions"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          )}
          <MessageCircle className="h-5 w-5 text-blue-400" />
          <h3 className="font-semibold">AI Chat</h3>
        </div>
      </div>

      {/* Chat content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Welcome message */}
        {messages.length === 0 && !isLoading && (
          <div className="flex flex-1 items-center justify-center p-6 text-center">
            <div>
              <MessageCircle className="mx-auto mb-3 h-12 w-12 text-blue-400" />
              <p className="mb-2 text-sm font-medium">
                Hi {childName}! 👋
              </p>
              <p className="text-xs text-gray-400">
                Ask me anything about the video you just watched!
              </p>
            </div>
          </div>
        )}

        {/* Messages */}
        {messages.length > 0 && (
          <AiMessageList messages={messages} isLoading={isLoading} />
        )}

        {/* Error message */}
        {error && (
          <div className="border-t border-gray-700 bg-red-900/20 p-3">
            <p className="text-xs text-red-400">{error}</p>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-gray-700">
          <AiChatInput
            onSend={handleSendMessage}
            disabled={isLoading}
            placeholder="Ask a question about the video..."
          />
        </div>
      </div>
    </div>
  );
}
