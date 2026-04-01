/**
 * Conversation Detail Page
 * View full conversation with messages and resume option
 */

import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getChildSession } from '@/lib/actions/profile-selection';
import { getConversation } from '@/lib/ai/service';
import { MessageList } from '@/components/conversations/message-list';
import { ConversationActions } from '@/components/conversations/conversation-actions';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';

interface ConversationDetailPageProps {
  params: {
    mode: string;
    conversationId: string;
  };
}

export default async function ConversationDetailPage({
  params,
}: ConversationDetailPageProps) {
  const childSession = await getChildSession();

  if (!childSession) {
    redirect('/profiles');
  }

  const mode = params.mode as 'toddler' | 'explorer';

  // Verify mode matches profile
  if (
    (mode === 'toddler' && childSession.uiMode !== 'TODDLER') ||
    (mode === 'explorer' && childSession.uiMode !== 'EXPLORER')
  ) {
    redirect(`/child/${childSession.uiMode.toLowerCase()}`);
  }

  // Fetch conversation
  const conversation = await getConversation(params.conversationId);

  if (!conversation) {
    notFound();
  }

  // Verify conversation belongs to this child
  if (conversation.childId !== childSession.profileId) {
    redirect(`/child/${mode}/chats`);
  }

  // Mode-specific styling
  const backgroundClasses = mode === 'toddler'
    ? 'bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100'
    : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50';

  const headerClasses = cn(
    'sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-lg mb-8',
    mode === 'toddler' ? 'p-6' : 'p-4'
  );

  const backButtonClasses = cn(
    'flex items-center gap-2 font-bold transition-all hover:scale-105',
    mode === 'toddler'
      ? 'rounded-full bg-white px-6 py-4 text-xl border-4 border-gray-200 shadow-xl'
      : 'rounded-lg bg-white px-4 py-2 text-base border-2 border-gray-200 shadow-md'
  );

  const contentClasses = cn(
    'mx-auto max-w-4xl pb-12',
    mode === 'toddler' ? 'px-6 space-y-8' : 'px-4 space-y-6'
  );

  const cardClasses = cn(
    'bg-white/90 backdrop-blur-sm shadow-xl',
    mode === 'toddler' ? 'rounded-3xl p-8' : 'rounded-xl p-6'
  );

  const titleClasses = cn(
    'font-bold text-gray-900 mb-2',
    mode === 'toddler' ? 'text-3xl' : 'text-2xl'
  );

  const subtitleClasses = cn(
    'text-gray-600 mb-4',
    mode === 'toddler' ? 'text-xl' : 'text-base'
  );

  const topicClasses = cn(
    'inline-block px-3 py-1 mr-2 mb-2 font-medium',
    mode === 'toddler'
      ? 'rounded-full text-base bg-purple-100 text-purple-700 border-2 border-purple-200'
      : 'rounded-md text-sm bg-blue-50 text-blue-700'
  );

  return (
    <div className={cn('min-h-screen', backgroundClasses)}>
      {/* Header */}
      <div className={headerClasses}>
        <div className="mx-auto max-w-4xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <Link
              href={`/child/${mode}/chats`}
              className={backButtonClasses}
            >
              <ArrowLeft size={mode === 'toddler' ? 24 : 20} />
              Back to Chats
            </Link>
          </div>

          {/* Actions */}
          <ConversationActions
            conversationId={conversation.id}
            profileId={childSession.profileId}
            isFavorite={conversation.isFavorite}
            mode={mode}
          />
        </div>
      </div>

      {/* Main Content */}
      <main className={contentClasses}>
        {/* Video info card */}
        <div className={cardClasses}>
          <div className="flex gap-4 mb-4">
            {conversation.video.thumbnailPath && (
              <div
                className={cn(
                  'flex-shrink-0 overflow-hidden',
                  mode === 'toddler'
                    ? 'w-32 h-20 rounded-2xl'
                    : 'w-24 h-16 rounded-lg'
                )}
              >
                <img
                  src={
                    conversation.video.thumbnailPath.startsWith('http')
                      ? conversation.video.thumbnailPath
                      : `/api/thumbnails/${conversation.video.thumbnailPath}`
                  }
                  alt={conversation.video.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            <div className="flex-1">
              <h2 className={titleClasses}>{conversation.video.title}</h2>
              <p className={subtitleClasses}>
                Started {formatDistanceToNow(new Date(conversation.startedAt), { addSuffix: true })}
              </p>
            </div>
          </div>

          {/* Topics */}
          {conversation.topics.length > 0 && (
            <div>
              <p
                className={cn(
                  'font-semibold text-gray-700 mb-2',
                  mode === 'toddler' ? 'text-lg' : 'text-sm'
                )}
              >
                Topics discussed:
              </p>
              <div className="flex flex-wrap">
                {conversation.topics.map((topic) => (
                  <span key={topic} className={topicClasses}>
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Safety flag warning */}
          {conversation.hasFlags && (
            <div
              className={cn(
                'mt-4 rounded-lg bg-yellow-50 border-2 border-yellow-200',
                mode === 'toddler' ? 'p-4 text-base' : 'p-3 text-sm'
              )}
            >
              <p className="text-yellow-800 font-medium">
                ⚠️ This conversation was flagged for parent review
              </p>
            </div>
          )}
        </div>

        {/* Messages card */}
        <div className={cardClasses}>
          <h3
            className={cn(
              'font-bold text-gray-900 mb-6',
              mode === 'toddler' ? 'text-2xl' : 'text-xl'
            )}
          >
            Messages
          </h3>
          <MessageList messages={conversation.messages} mode={mode} />
        </div>
      </main>
    </div>
  );
}
