# Feature Spec: LLM Chat Memory & History

**Priority:** Medium-High - Enhances existing AI feature
**Effort:** 1 week
**Impact:** High - Better AI experience

## Overview

Allow children to see and resume past AI conversations they had about videos. This creates continuity in learning, helps them remember what they learned, and enables deeper exploration of topics over time.

## User Story

**As a child**, I want to see the conversations I had with the AI about videos I watched, so I can remember what I learned and continue asking questions about topics I'm interested in.

**As a parent**, I want to review all AI conversations my child has had, so I can understand their curiosities and ensure the AI is providing appropriate responses.

## Current State

### Already Implemented ✅
- `AIConversation` model (stores conversation metadata)
- `AIMessage` model (stores individual messages)
- Conversation creation and persistence
- Safety filtering and logging
- Basic parent review in analytics

### What's Missing ❌
- Child-facing conversation history UI
- Ability to resume past conversations
- Search through chat history
- Link from video to past chats
- Conversation summaries
- Favorite/bookmark conversations

## Feature Design

### Child View: Chat History

**Location:** `/child/chats` or `/child/[mode]/chats`

**Layout:**
```
┌─────────────────────────────────────────────────────────────┐
│  🏠 Back                     My Chats                   🔍  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  📅 Today                                                   │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🎥 [Thumbnail] Ocean Animals                          │ │
│  │    💬 "How do whales breathe?"                        │ │
│  │    🤖 "Great question! Whales breathe air..."         │ │
│  │    ⏰ 2:30 PM  •  5 messages                          │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🎥 [Thumbnail] Space Exploration                      │ │
│  │    💬 "Why is space dark?"                            │ │
│  │    🤖 "Excellent question! Space looks dark..."       │ │
│  │    ⏰ 10:15 AM  •  8 messages                         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  📅 Yesterday                                               │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ 🎥 [Thumbnail] Dinosaurs                              │ │
│  │    💬 "Did T-Rex really have tiny arms?"              │ │
│  │    🤖 "Yes! T-Rex had very small arms compared..."    │ │
│  │    ⏰ 3:45 PM  •  12 messages  •  ⭐ Favorite         │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Conversation Detail View

**Location:** `/child/chats/[conversationId]`

```
┌─────────────────────────────────────────────────────────────┐
│  ← Back to Chats                                       ⋮   │
├─────────────────────────────────────────────────────────────┤
│  🎥 Ocean Animals                                           │
│  🕐 Today at 2:30 PM  •  5 messages                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  👤 You: How do whales breathe?                             │
│  🕐 2:30 PM                                                 │
│                                                             │
│  🤖 AI: Great question! 🐋                                  │
│  Whales breathe air just like we do! Even though they      │
│  live in the ocean, they need to come up to the surface    │
│  to breathe through a blowhole on top of their head.        │
│  🕐 2:30 PM                                                 │
│                                                             │
│  👤 You: How long can they hold their breath?               │
│  🕐 2:31 PM                                                 │
│                                                             │
│  🤖 AI: Different whales can hold their breath for          │
│  different amounts of time! Some can hold it for 20         │
│  minutes, and sperm whales can hold it for up to 90         │
│  minutes - that's an hour and a half!                       │
│  🕐 2:31 PM                                                 │
│                                                             │
│  👤 You: Wow that's a long time!                            │
│  🕐 2:32 PM                                                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Continue this conversation...]                      [⭐] │
└─────────────────────────────────────────────────────────────┘
```

### Video Page Integration

**Add to existing watch page:**

```
┌─────────────────────────────────────────────────────────────┐
│  [Video Player]                                             │
├─────────────────────────────────────────────────────────────┤
│  Ocean Animals                                              │
│                                                             │
│  [❤️ Favorite]  [📋 Playlist]  [💬 Ask Questions]          │
│                                                             │
│  💬 Past Conversations (2)                                  │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Today at 2:30 PM                                      │ │
│  │ "How do whales breathe?" • 5 messages                 │ │
│  │ [Continue →]                                          │ │
│  └───────────────────────────────────────────────────────┘ │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Last week                                             │ │
│  │ "What do whales eat?" • 8 messages                    │ │
│  │ [View →]                                              │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Parent View: Conversation Review

**Enhanced analytics page:**

```
┌─────────────────────────────────────────────────────────────┐
│  Admin > Analytics > AI Conversations                       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  [Eddie ▼]  [Last 30 days ▼]  [All Topics ▼]  [Search...]  │
│                                                             │
│  Total Conversations: 47  •  Total Messages: 312            │
│  Avg per conversation: 6.6 messages                         │
│                                                             │
│  📊 Most Discussed Topics                                   │
│  1. Ocean Animals (12 conversations)                        │
│  2. Space (8 conversations)                                 │
│  3. Dinosaurs (7 conversations)                             │
│                                                             │
│  📋 Recent Conversations                                    │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Today, 2:30 PM  •  Ocean Animals  •  5 msgs  •  ✅    │ │
│  │ "How do whales breathe?"                              │ │
│  │ Topics: ocean, whales, breathing, marine life         │ │
│  │ [View Full] [Export] [Flag]                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌───────────────────────────────────────────────────────┐ │
│  │ Today, 10:15 AM  •  Space  •  8 msgs  •  ✅           │ │
│  │ "Why is space dark?"                                  │ │
│  │ Topics: space, darkness, stars, light                 │ │
│  │ [View Full] [Export] [Flag]                           │ │
│  └───────────────────────────────────────────────────────┘ │
│                                                             │
│  🚨 Flagged Conversations (0)                               │
│  ✅ All conversations passed safety checks                  │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## Technical Implementation

### Database Schema (Already Exists!)

Current schema is perfect, just need to add indexes and a few fields:

```sql
-- Add helpful indexes (if not already there)
CREATE INDEX IF NOT EXISTS idx_ai_conv_profile_created
  ON ai_conversations(profile_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_ai_conv_video_profile
  ON ai_conversations(video_id, profile_id);

CREATE INDEX IF NOT EXISTS idx_ai_messages_conv_created
  ON ai_messages(conversation_id, created_at ASC);

-- Add optional fields for enhancement
ALTER TABLE ai_conversations
  ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS summary TEXT, -- AI-generated summary
  ADD COLUMN IF NOT EXISTS first_question TEXT; -- For preview

-- Full text search on messages (optional but recommended)
CREATE INDEX IF NOT EXISTS idx_ai_messages_content_search
  ON ai_messages USING gin(to_tsvector('english', content));
```

### API Endpoints

```typescript
// List all conversations for a profile
GET /api/profiles/[profileId]/conversations
  Query: {
    videoId?: string, // Filter by video
    topic?: string, // Filter by topic
    from?: string, // Date range
    to?: string,
    limit?: number,
    offset?: number,
    onlyFavorites?: boolean
  }
  Response: {
    conversations: Array<{
      id: string,
      videoId: string,
      videoTitle: string,
      videoThumbnail: string,
      messageCount: number,
      firstQuestion: string, // First child message
      lastMessageAt: string,
      topics: string[],
      isFavorite: boolean,
      safetyFlags: any[]
    }>,
    total: number,
    hasMore: boolean
  }

// Get full conversation with messages
GET /api/profiles/[profileId]/conversations/[conversationId]
  Response: {
    conversation: {
      id: string,
      videoId: string,
      video: {
        id: string,
        title: string,
        thumbnailPath: string
      },
      startedAt: string,
      endedAt: string,
      messageCount: number,
      topics: string[],
      isFavorite: boolean
    },
    messages: Array<{
      id: string,
      role: 'CHILD' | 'ASSISTANT',
      content: string,
      createdAt: string,
      wasFiltered: boolean
    }>
  }

// Resume a conversation (continue chatting)
POST /api/profiles/[profileId]/conversations/[conversationId]/resume
  Body: {
    message: string
  }
  Response: {
    messageId: string,
    response: string,
    conversationId: string
  }

// Toggle favorite
POST /api/profiles/[profileId]/conversations/[conversationId]/favorite
  Body: { isFavorite: boolean }
  Response: { success: boolean }

// Search conversations
GET /api/profiles/[profileId]/conversations/search
  Query: {
    q: string, // Search query
    limit?: number
  }
  Response: {
    results: Array<{
      conversationId: string,
      videoTitle: string,
      matchedMessage: string,
      relevance: number
    }>
  }

// Get conversations for a specific video
GET /api/videos/[videoId]/conversations
  Query: { profileId: string }
  Response: {
    conversations: ConversationSummary[]
  }

// Parent: Export conversation
GET /api/admin/conversations/[conversationId]/export
  Query: { format: 'pdf' | 'txt' | 'json' }
  Response: File download
```

### Backend Logic

```typescript
// apps/web/src/lib/ai/conversation-manager.ts

export async function getConversationsForProfile(
  profileId: string,
  options: {
    videoId?: string;
    topic?: string;
    from?: Date;
    to?: Date;
    limit?: number;
    offset?: number;
    onlyFavorites?: boolean;
  } = {}
): Promise<{ conversations: ConversationSummary[], total: number }> {
  const where: any = { profileId };

  if (options.videoId) where.videoId = options.videoId;
  if (options.onlyFavorites) where.isFavorite = true;
  if (options.from || options.to) {
    where.createdAt = {};
    if (options.from) where.createdAt.gte = options.from;
    if (options.to) where.createdAt.lte = options.to;
  }
  if (options.topic) {
    where.topics = { has: options.topic };
  }

  const [conversations, total] = await Promise.all([
    prisma.aIConversation.findMany({
      where,
      include: {
        video: {
          select: {
            id: true,
            title: true,
            thumbnailPath: true
          }
        },
        _count: {
          select: { messages: true }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: options.limit || 20,
      skip: options.offset || 0
    }),
    prisma.aIConversation.count({ where })
  ]);

  // Get first question for each conversation
  const conversationsWithPreview = await Promise.all(
    conversations.map(async (conv) => {
      const firstMessage = await prisma.aIMessage.findFirst({
        where: {
          conversationId: conv.id,
          role: 'CHILD'
        },
        orderBy: { createdAt: 'asc' }
      });

      return {
        id: conv.id,
        videoId: conv.videoId,
        videoTitle: conv.video.title,
        videoThumbnail: conv.video.thumbnailPath,
        messageCount: conv._count.messages,
        firstQuestion: firstMessage?.content || 'Conversation started',
        lastMessageAt: conv.endedAt || conv.startedAt,
        topics: conv.topics,
        isFavorite: conv.isFavorite || false,
        safetyFlags: conv.safetyFlags as any[]
      };
    })
  );

  return {
    conversations: conversationsWithPreview,
    total
  };
}

export async function resumeConversation(
  conversationId: string,
  message: string,
  profileId: string
): Promise<{ messageId: string, response: string }> {
  // Get existing conversation
  const conversation = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' },
        take: 20 // Last 20 messages for context
      },
      video: true
    }
  });

  if (!conversation || conversation.profileId !== profileId) {
    throw new Error('Conversation not found or unauthorized');
  }

  // Use existing AI service to continue conversation
  const result = await aiService.chat({
    conversationId,
    message,
    videoId: conversation.videoId,
    profileId,
    existingMessages: conversation.messages
  });

  // Update conversation endedAt
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { endedAt: new Date() }
  });

  return result;
}

export async function searchConversations(
  profileId: string,
  query: string,
  limit: number = 10
): Promise<SearchResult[]> {
  // Use PostgreSQL full-text search
  const results = await prisma.$queryRaw`
    SELECT
      c.id as conversation_id,
      v.title as video_title,
      m.content as matched_message,
      ts_rank(to_tsvector('english', m.content), plainto_tsquery('english', ${query})) as relevance
    FROM ai_conversations c
    JOIN ai_messages m ON m.conversation_id = c.id
    JOIN videos v ON v.id = c.video_id
    WHERE c.profile_id = ${profileId}
    AND to_tsvector('english', m.content) @@ plainto_tsquery('english', ${query})
    ORDER BY relevance DESC
    LIMIT ${limit}
  `;

  return results as SearchResult[];
}

export async function generateConversationSummary(
  conversationId: string
): Promise<string> {
  const conversation = await prisma.aIConversation.findUnique({
    where: { id: conversationId },
    include: {
      messages: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!conversation) throw new Error('Conversation not found');

  // Use AI to summarize (optional - can be run as background job)
  const messagesText = conversation.messages
    .map(m => `${m.role}: ${m.content}`)
    .join('\n');

  const summary = await aiService.summarize({
    text: messagesText,
    maxLength: 100
  });

  // Store summary
  await prisma.aIConversation.update({
    where: { id: conversationId },
    data: { summary }
  });

  return summary;
}
```

### Frontend Components

```typescript
// apps/web/src/app/child/[mode]/chats/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useProfile } from '@/lib/hooks/use-profile';
import { ConversationCard } from '@/components/child/chats/conversation-card';
import { SearchBar } from '@/components/child/search-bar';

export default function ChatsPage() {
  const { profile } = useProfile();
  const [conversations, setConversations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');

  useEffect(() => {
    loadConversations();
  }, [profile?.id, filter, searchQuery]);

  async function loadConversations() {
    if (!profile) return;

    const params = new URLSearchParams({
      onlyFavorites: filter === 'favorites' ? 'true' : 'false',
      limit: '20'
    });

    if (searchQuery) {
      const res = await fetch(`/api/profiles/${profile.id}/conversations/search?q=${searchQuery}`);
      const data = await res.json();
      setConversations(data.results);
    } else {
      const res = await fetch(`/api/profiles/${profile.id}/conversations?${params}`);
      const data = await res.json();
      setConversations(data.conversations);
    }
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">My Chats 💬</h1>
        <button onClick={() => router.back()} className="btn-secondary">
          ← Back
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 mb-6">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="Search your chats..."
        />
        <button
          onClick={() => setFilter(filter === 'all' ? 'favorites' : 'all')}
          className={filter === 'favorites' ? 'btn-primary' : 'btn-secondary'}
        >
          {filter === 'favorites' ? '⭐ Favorites' : 'All Chats'}
        </button>
      </div>

      {/* Conversation List */}
      <div className="space-y-4">
        {conversations.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <p className="text-lg mb-2">No chats yet!</p>
            <p>Start watching videos and ask questions to create your first chat.</p>
          </div>
        ) : (
          conversations.map(conv => (
            <ConversationCard
              key={conv.id}
              conversation={conv}
              onClick={() => router.push(`/child/${profile.uiMode}/chats/${conv.id}`)}
            />
          ))
        )}
      </div>
    </div>
  );
}
```

```typescript
// apps/web/src/components/child/chats/conversation-card.tsx
export function ConversationCard({ conversation, onClick }) {
  return (
    <div
      onClick={onClick}
      className="bg-white rounded-lg shadow-md p-4 hover:shadow-lg transition cursor-pointer"
    >
      <div className="flex gap-4">
        {/* Video Thumbnail */}
        <img
          src={conversation.videoThumbnail}
          alt={conversation.videoTitle}
          className="w-24 h-16 object-cover rounded"
        />

        {/* Conversation Info */}
        <div className="flex-1">
          <h3 className="font-bold text-lg mb-1">
            {conversation.videoTitle}
          </h3>
          <p className="text-gray-600 text-sm mb-2 line-clamp-2">
            💬 "{conversation.firstQuestion}"
          </p>
          <div className="flex items-center gap-4 text-sm text-gray-500">
            <span>⏰ {formatTimeAgo(conversation.lastMessageAt)}</span>
            <span>💬 {conversation.messageCount} messages</span>
            {conversation.isFavorite && <span>⭐</span>}
          </div>
        </div>

        {/* Action Arrow */}
        <div className="flex items-center">
          <span className="text-2xl text-gray-400">→</span>
        </div>
      </div>
    </div>
  );
}
```

## Implementation Phases

### Phase 1: Backend (Days 1-2)
- [ ] Add database indexes
- [ ] Implement conversation listing API
- [ ] Implement conversation detail API
- [ ] Add resume conversation endpoint
- [ ] Add favorite toggle endpoint

### Phase 2: Child UI (Days 3-4)
- [ ] Chat history page
- [ ] Conversation detail view
- [ ] Resume conversation functionality
- [ ] Search conversations
- [ ] Favorite conversations

### Phase 3: Video Integration (Day 5)
- [ ] Add "Past Chats" section to watch page
- [ ] Link to continue conversation
- [ ] Show chat count badge

### Phase 4: Parent View (Days 6-7)
- [ ] Enhanced analytics page
- [ ] Conversation review interface
- [ ] Export functionality
- [ ] Search and filter options

## Testing

- [ ] Unit tests for conversation queries
- [ ] Test conversation resumption
- [ ] Test search functionality
- [ ] Test with 0, 1, 10, 100+ conversations
- [ ] Test favorite toggle
- [ ] Test parent review access
- [ ] E2E test full flow

## Performance Considerations

- **Pagination**: Load 20 conversations at a time
- **Caching**: Cache conversation summaries
- **Indexing**: Full-text search indexes on messages
- **Lazy loading**: Load messages only when viewing detail

## Future Enhancements

- **Voice playback** of past conversations
- **Conversation sharing** between siblings
- **Conversation branching** (fork from any point)
- **AI-generated summaries** of long conversations
- **Conversation insights** (topics explored, learning progress)
- **Conversation highlights** (most interesting Q&A)

---

**Estimated Effort:** 1 week
**Priority:** Medium-High
**Dependencies:** None (can start now)
**Value:** High - Completes AI chat feature
