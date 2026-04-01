/**
 * Parent AI Assistant API
 * POST /api/admin/parent-ai
 *
 * Answers parent questions about their children's chat and viewing activity.
 * Builds a rich context from the DB, then queries OpenAI.
 */

import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth/session';
import { prisma } from '@/lib/db/client';
import { logger } from '@/lib/logger';
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    const familyId = user.familyId as string;

    const body = await request.json();
    const {
      message,
      profileId = 'all',
      startDate: startDateStr,
      endDate: endDateStr,
      history = [],
    }: {
      message: string;
      profileId?: string;
      startDate?: string;
      endDate?: string;
      history?: Array<{ role: 'user' | 'assistant'; content: string }>;
    } = body;

    if (!message?.trim()) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    const startDate = startDateStr ? new Date(startDateStr) : new Date(Date.now() - 7 * 86400_000);
    const endDate = endDateStr ? new Date(endDateStr) : new Date();

    // Build the where clause scoped to this family
    const childWhere: any = { user: { familyId } };
    if (profileId !== 'all') childWhere.id = profileId;

    const profiles = await prisma.childProfile.findMany({
      where: childWhere,
      select: { id: true, name: true, ageRating: true },
    });

    const profileIds = profiles.map((p) => p.id);

    // Fetch recent conversations with messages
    const conversations = await prisma.aIConversation.findMany({
      where: {
        childId: { in: profileIds },
        startedAt: { gte: startDate, lte: endDate },
      },
      include: {
        child: { select: { name: true } },
        video: { select: { title: true } },
        messages: {
          where: { role: { not: 'SYSTEM' } },
          orderBy: { createdAt: 'asc' },
          select: { role: true, content: true, wasFiltered: true },
        },
      },
      orderBy: { startedAt: 'desc' },
      take: 20,
    });

    // Aggregate topics
    const topicCounts: Record<string, number> = {};
    conversations.forEach((c) => {
      c.topics.forEach((t) => {
        topicCounts[t] = (topicCounts[t] || 0) + 1;
      });
    });
    const topTopics = Object.entries(topicCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([t, n]) => `${t} (${n}×)`);

    // Build context summary for each conversation
    const convSummaries = conversations.map((c) => {
      const excerpt = c.messages
        .filter((m) => !m.wasFiltered)
        .slice(0, 6)
        .map((m) => `  ${m.role === 'CHILD' ? c.child.name : 'AI'}: ${m.content.slice(0, 120)}`)
        .join('\n');
      return `[${c.child.name} – "${c.video.title}"]\n${excerpt}`;
    });

    const childNames =
      profileId === 'all'
        ? profiles.map((p) => p.name).join(', ') || 'your children'
        : (profiles[0]?.name ?? 'your child');

    const systemPrompt = `You are a warm, insightful parenting assistant for PlayPatch — a safe educational video platform for children.
You have access to data about ${childNames}'s recent video watching and AI chat activity.

DATA SUMMARY (${startDate.toLocaleDateString()} – ${endDate.toLocaleDateString()}):
- Profiles: ${profiles.map((p) => `${p.name} (age rating: ${p.ageRating})`).join(', ')}
- Total AI conversations in period: ${conversations.length}
- Top topics discussed: ${topTopics.length ? topTopics.join(', ') : 'none yet'}

RECENT CONVERSATIONS (newest first):
${convSummaries.length ? convSummaries.join('\n\n') : 'No conversations in this period.'}

GUIDELINES:
- Answer the parent's question using the data above
- Be specific — reference actual topics, videos, or quotes when helpful
- If the parent asks about something not in the data, say so honestly
- Highlight any safety flags if they exist
- Keep responses concise and actionable (2-4 short paragraphs max)
- Don't make up data that isn't in the context`;

    // Sanitize history to prevent prompt injection: only allow user/assistant roles,
    // enforce string content, cap per-message length, and limit turn count.
    const safeHistory = (history as any[])
      .filter((m) => m && typeof m.content === 'string' && (m.role === 'user' || m.role === 'assistant'))
      .map((m) => ({ role: m.role as 'user' | 'assistant', content: String(m.content).slice(0, 2000) }))
      .slice(-8);

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...safeHistory,
      { role: 'user', content: message },
    ];

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages,
      max_tokens: 400,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content ?? 'I could not generate a response.';

    logger.info(
      { userId: user.id, profileId, conversationCount: conversations.length },
      'Parent AI query answered'
    );

    return NextResponse.json({ response });
  } catch (error) {
    logger.error({ error }, 'Parent AI API error');
    return NextResponse.json({ error: 'Failed to get response' }, { status: 500 });
  }
}
