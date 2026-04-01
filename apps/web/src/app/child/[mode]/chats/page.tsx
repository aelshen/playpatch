/**
 * Chat History Page
 * Browse all past AI conversations
 */

import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MessageCircle } from 'lucide-react';
import { getChildSession } from '@/lib/actions/profile-selection';
import { prisma } from '@/lib/db/client';
import { ConversationListClient } from '@/components/conversations/conversation-list-client';
import { cn } from '@/lib/utils';

interface ChatsPageProps {
  params: {
    mode: string;
  };
  searchParams: {
    q?: string;
    favorited?: string;
  };
}

export default async function ChatsPage({ params, searchParams }: ChatsPageProps) {
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

  // Parse search params
  const searchQuery = searchParams.q || '';
  const favorited = searchParams.favorited === 'true';

  // Build where clause
  const where: any = {
    childId: childSession.profileId,
  };

  if (favorited) {
    where.isFavorite = true;
  }

  if (searchQuery) {
    where.OR = [
      {
        video: {
          title: {
            contains: searchQuery,
            mode: 'insensitive',
          },
        },
      },
      {
        topics: {
          has: searchQuery,
        },
      },
    ];
  }

  // Fetch conversations
  const conversations = await prisma.aIConversation.findMany({
    where,
    include: {
      video: {
        select: {
          id: true,
          title: true,
          thumbnailPath: true,
          duration: true,
        },
      },
      messages: {
        orderBy: {
          createdAt: 'desc',
        },
        take: 1,
        select: {
          role: true,
          content: true,
          createdAt: true,
        },
      },
    },
    orderBy: {
      startedAt: 'desc',
    },
    take: 50, // Limit to 50 most recent
  });

  // Transform data for client component
  const conversationsData = conversations.map((conv) => ({
    id: conv.id,
    videoId: conv.videoId,
    videoTitle: conv.video.title,
    videoThumbnail: conv.video.thumbnailPath,
    videoDuration: conv.video.duration,
    startedAt: conv.startedAt,
    isFavorite: conv.isFavorite,
    topics: conv.topics,
    lastMessage: conv.messages[0] || null,
  }));

  // Mode-specific styling
  const backgroundClasses = mode === 'toddler'
    ? 'bg-gradient-to-br from-yellow-100 via-pink-100 to-purple-100'
    : 'bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50';

  const headerClasses = cn(
    'sticky top-0 z-40 bg-white/95 backdrop-blur-sm shadow-lg mb-8',
    mode === 'toddler' ? 'p-6' : 'p-4'
  );

  const titleClasses = cn(
    'font-bold text-gray-900',
    mode === 'toddler' ? 'text-4xl' : 'text-3xl'
  );

  const backButtonClasses = cn(
    'flex items-center gap-2 font-bold transition-all hover:scale-105',
    mode === 'toddler'
      ? 'rounded-full bg-white px-6 py-4 text-xl border-4 border-gray-200 shadow-xl'
      : 'rounded-lg bg-white px-4 py-2 text-base border-2 border-gray-200 shadow-md'
  );

  const contentClasses = cn(
    'mx-auto max-w-7xl pb-12',
    mode === 'toddler' ? 'px-6' : 'px-4'
  );

  return (
    <div className={cn('min-h-screen', backgroundClasses)}>
      {/* Header */}
      <div className={headerClasses}>
        <div className="mx-auto max-w-7xl">
          <div className="flex items-center justify-between gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Link href={`/child/${mode}`} className={backButtonClasses}>
                <ArrowLeft size={mode === 'toddler' ? 24 : 20} />
                Back
              </Link>
              <div className="flex items-center gap-3">
                <MessageCircle
                  className="text-blue-500"
                  size={mode === 'toddler' ? 40 : 32}
                />
                <h1 className={titleClasses}>My Chats</h1>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className={contentClasses}>
        <ConversationListClient
          conversations={conversationsData}
          mode={mode}
          profileId={childSession.profileId}
          initialQuery={searchQuery}
          initialFavorited={favorited}
        />
      </main>
    </div>
  );
}
