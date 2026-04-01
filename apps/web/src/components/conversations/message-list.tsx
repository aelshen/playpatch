/**
 * Message List Component
 * Displays conversation messages with role-based styling
 */

'use client';

import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: Date;
  wasFiltered?: boolean;
}

interface MessageListProps {
  messages: Message[];
  mode: 'toddler' | 'explorer';
}

export function MessageList({ messages, mode }: MessageListProps) {
  if (messages.length === 0) {
    return (
      <div
        className={cn(
          'text-center text-gray-500',
          mode === 'toddler' ? 'py-12 text-xl' : 'py-8 text-base'
        )}
      >
        No messages in this conversation
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {messages.map((message) => {
        const isChild = message.role === 'CHILD';
        const isSystem = message.role === 'SYSTEM';

        // System messages (usually safety filters)
        if (isSystem) {
          return (
            <div
              key={message.id}
              className={cn(
                'mx-auto text-center italic text-gray-500',
                mode === 'toddler' ? 'text-lg max-w-2xl' : 'text-sm max-w-xl'
              )}
            >
              {message.content}
            </div>
          );
        }

        return (
          <div
            key={message.id}
            className={cn(
              'flex',
              isChild ? 'justify-end' : 'justify-start'
            )}
          >
            <div
              className={cn(
                'max-w-[80%] shadow-md',
                mode === 'toddler' ? 'rounded-3xl px-6 py-4' : 'rounded-2xl px-4 py-3',
                isChild
                  ? mode === 'toddler'
                    ? 'bg-gradient-to-br from-purple-400 to-pink-400 text-white'
                    : 'bg-blue-500 text-white'
                  : mode === 'toddler'
                  ? 'bg-white border-4 border-gray-200 text-gray-900'
                  : 'bg-gray-100 text-gray-900'
              )}
            >
              {/* Message content */}
              <p
                className={cn(
                  'whitespace-pre-wrap break-words',
                  mode === 'toddler' ? 'text-lg leading-relaxed' : 'text-base'
                )}
              >
                {message.content}
              </p>

              {/* Filtered indicator */}
              {message.wasFiltered && (
                <p
                  className={cn(
                    'mt-2 italic opacity-75',
                    mode === 'toddler' ? 'text-sm' : 'text-xs'
                  )}
                >
                  (Content was filtered for safety)
                </p>
              )}

              {/* Timestamp */}
              <p
                className={cn(
                  'mt-2 opacity-70',
                  mode === 'toddler' ? 'text-sm' : 'text-xs'
                )}
              >
                {formatDistanceToNow(new Date(message.createdAt), {
                  addSuffix: true,
                })}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
