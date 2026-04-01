/**
 * Past Chats Section Component
 * Shows recent conversations for current video
 */

import Link from 'next/link';
import { MessageCircle } from 'lucide-react';
import { prisma } from '@/lib/db/client';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

interface PastChatsSectionProps {
  videoId: string;
  childId: string;
  mode: 'toddler' | 'explorer';
}

export async function PastChatsSection({
  videoId,
  childId,
  mode,
}: PastChatsSectionProps) {
  // Fetch recent conversations for this video
  const conversations = await prisma.aIConversation.findMany({
    where: {
      childId,
      videoId,
    },
    include: {
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        select: {
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: 3,
  });

  if (conversations.length === 0) {
    return null;
  }

  const titleClasses = cn(
    'font-bold text-gray-900 mb-4 flex items-center gap-2',
    mode === 'toddler' ? 'text-2xl' : 'text-xl'
  );

  const chatItemClasses = cn(
    'block transition-all hover:scale-105',
    mode === 'toddler'
      ? 'rounded-2xl bg-white/90 p-4 shadow-md border-2 border-gray-200'
      : 'rounded-lg bg-white/80 p-3 shadow-sm border border-gray-200'
  );

  const chatTextClasses = cn(
    'text-gray-700 line-clamp-2 mb-2',
    mode === 'toddler' ? 'text-base' : 'text-sm'
  );

  const chatDateClasses = cn(
    'text-gray-500',
    mode === 'toddler' ? 'text-sm' : 'text-xs'
  );

  return (
    <div className={cn('space-y-3', mode === 'toddler' ? 'mt-8' : 'mt-6')}>
      <h3 className={titleClasses}>
        <MessageCircle size={mode === 'toddler' ? 24 : 20} />
        Past Chats
      </h3>
      <div className="space-y-3">
        {conversations.map((conversation) => (
          <Link
            key={conversation.id}
            href={`/child/${mode}/chats/${conversation.id}`}
            className={chatItemClasses}
          >
            <p className={chatTextClasses}>
              {conversation.messages[0]?.content || 'Tap to view chat'}
            </p>
            <p className={chatDateClasses}>
              {formatDistanceToNow(new Date(conversation.startedAt), {
                addSuffix: true,
              })}
            </p>
          </Link>
        ))}
      </div>
      <Link
        href={`/child/${mode}/chats?videoId=${videoId}`}
        className={cn(
          'block text-center font-medium transition-colors',
          mode === 'toddler'
            ? 'rounded-full bg-blue-100 py-3 text-lg text-blue-700 hover:bg-blue-200'
            : 'rounded-lg bg-blue-50 py-2 text-sm text-blue-600 hover:bg-blue-100'
        )}
      >
        View All Chats
      </Link>
    </div>
  );
}
