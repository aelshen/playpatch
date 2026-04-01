/**
 * AI Service
 * Integrates Ollama client with safety filters, prompts, and database logging
 */

import { ollamaClient, type OllamaMessage } from './client';
import { getOpenAIClient } from './openai-client';
import { filterInput, filterOutput, sanitizeText } from '@playpatch/ai-safety';
import { buildSystemPrompt } from '@playpatch/ai-safety';
import { prisma } from '../db/client';
import { logger } from '../logger';
import { AIErrors, DatabaseErrors } from '../errors/messages';

const AI_PROVIDER = process.env.AI_PROVIDER || 'ollama';

export interface CreateConversationParams {
  childId: string;
  videoId: string;
}

export interface SendMessageParams {
  conversationId?: string;
  childId: string;
  videoId: string;
  message: string;
  childAge: number;
  childName: string;
}

export interface SendMessageResult {
  conversationId: string;
  response: string;
  filtered: boolean;
  error?: string;
}

/**
 * Create a new AI conversation
 */
export async function createConversation({
  childId,
  videoId,
}: CreateConversationParams): Promise<string> {
  try {
    const conversation = await prisma.aIConversation.create({
      data: {
        childId,
        videoId,
      },
    });

    logger.info(
      { conversationId: conversation.id, childId, videoId },
      'Created new AI conversation'
    );

    return conversation.id;
  } catch (error) {
    logger.error({ error, childId, videoId }, 'Failed to create AI conversation');
    throw AIErrors.CONVERSATION_CREATE_FAILED(error);
  }
}

/**
 * Get or create a conversation for a child watching a video
 */
export async function getOrCreateConversation({
  childId,
  videoId,
}: CreateConversationParams): Promise<string> {
  try {
    // Try to find existing conversation
    const existing = await prisma.aIConversation.findFirst({
      where: {
        childId,
        videoId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (existing) {
      logger.info(
        { conversationId: existing.id, childId, videoId },
        'Using existing AI conversation'
      );
      return existing.id;
    }

    // Create new conversation
    return createConversation({ childId, videoId });
  } catch (error) {
    logger.error({ error, childId, videoId }, 'Failed to get or create conversation');
    throw error;
  }
}

/**
 * Get conversation history
 */
async function getConversationHistory(conversationId: string): Promise<OllamaMessage[]> {
  try {
    const messages = await prisma.aIMessage.findMany({
      where: {
        conversationId,
      },
      orderBy: {
        createdAt: 'asc',
      },
      take: 20, // Limit history to last 20 messages to keep context manageable
    });

    return messages.map((msg) => ({
      role: msg.role as 'user' | 'assistant',
      content: msg.content,
    }));
  } catch (error) {
    logger.error({ error, conversationId }, 'Failed to get conversation history');
    return [];
  }
}

/**
 * Save a message to the database
 */
async function saveMessage(
  conversationId: string,
  role: 'CHILD' | 'ASSISTANT',
  content: string,
  metrics?: { processingTime?: number; tokenCount?: number }
): Promise<void> {
  try {
    await prisma.aIMessage.create({
      data: {
        conversationId,
        role,
        content,
        ...(metrics?.processingTime !== undefined && { processingTime: metrics.processingTime }),
        ...(metrics?.tokenCount !== undefined && { tokenCount: metrics.tokenCount }),
      },
    });
  } catch (error) {
    logger.error({ error, conversationId, role }, 'Failed to save message');
    // Don't throw - logging failure shouldn't break the conversation
  }
}

/**
 * Extract topics from the conversation messages and persist them.
 * Runs fire-and-forget after each assistant reply — failures are silent.
 */
async function refreshConversationTopics(
  conversationId: string,
  videoTitle: string
): Promise<void> {
  try {
    const { extractTopicsFromConversation } = await import('./topic-extractor');
    const messages = await prisma.aIMessage.findMany({
      where: { conversationId },
      orderBy: { createdAt: 'asc' },
      select: { role: true, content: true },
    });
    const topics = await extractTopicsFromConversation(messages, videoTitle);
    if (topics.length > 0) {
      await prisma.aIConversation.update({
        where: { id: conversationId },
        data: { topics },
      });
    }
  } catch {
    // non-critical
  }
}

/**
 * Send a message in an AI conversation
 */
export async function sendAIChatMessage({
  conversationId,
  childId,
  videoId,
  message,
  childAge,
  childName,
}: SendMessageParams): Promise<SendMessageResult> {
  try {
    // Sanitize input
    const sanitizedMessage = sanitizeText(message);

    // Filter input for safety
    const inputFilter = filterInput(sanitizedMessage);
    if (!inputFilter.passed) {
      logger.warn(
        {
          childId,
          reason: inputFilter.reason,
          messagePreview: message.slice(0, 50),
        },
        'Child message filtered by safety filter'
      );

      return {
        conversationId: conversationId || '',
        response: inputFilter.reason || 'This message cannot be processed.',
        filtered: true,
      };
    }

    // Get or create conversation
    const convId = conversationId || (await getOrCreateConversation({ childId, videoId }));

    // Get video details for context
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        title: true,
        description: true,
        topics: true,
        categories: true,
      },
    });

    if (!video) {
      throw DatabaseErrors.RECORD_NOT_FOUND('Video', videoId);
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      childName,
      childAge,
      videoTitle: video.title,
      videoSummary: video.description || undefined,
      topics: (video.topics as string[]) || [],
    });

    // Get conversation history
    const history = await getConversationHistory(convId);

    // Send to LLM
    logger.info(
      {
        conversationId: convId,
        childId,
        videoId,
        historyLength: history.length,
        provider: AI_PROVIDER,
      },
      'Sending message to AI provider'
    );

    const llmStart = Date.now();
    const llmResponse =
      AI_PROVIDER === 'openai'
        ? await getOpenAIClient().sendMessage(sanitizedMessage, history, systemPrompt)
        : await ollamaClient.sendMessage(sanitizedMessage, history, systemPrompt);
    const llmProcessingTime = Date.now() - llmStart;

    // Filter output for safety
    const outputFilter = filterOutput(llmResponse, childAge);
    if (!outputFilter.passed) {
      logger.error(
        {
          conversationId: convId,
          reason: outputFilter.reason,
          responsePreview: llmResponse.slice(0, 100),
        },
        'LLM response filtered by safety filter'
      );

      // Save the filtered attempt to track issues
      await saveMessage(convId, 'CHILD', sanitizedMessage);
      await saveMessage(convId, 'ASSISTANT', '[Response filtered for safety]');

      return {
        conversationId: convId,
        response:
          "I apologize, but I cannot provide a safe response to that question. Let's talk about something else from the video!",
        filtered: true,
      };
    }

    // Use filtered output if links were removed
    const finalResponse = outputFilter.filtered || llmResponse;
    // Rough token estimate: ~4 chars per token
    const tokenCount = Math.ceil((sanitizedMessage.length + finalResponse.length) / 4);

    // Save messages to database
    await saveMessage(convId, 'CHILD', sanitizedMessage);
    await saveMessage(convId, 'ASSISTANT', finalResponse, {
      processingTime: llmProcessingTime,
      tokenCount,
    });

    // Refresh conversation topics based on what was actually discussed
    void refreshConversationTopics(convId, video.title);

    logger.info(
      {
        conversationId: convId,
        childId,
        responseLength: finalResponse.length,
      },
      'AI chat message processed successfully'
    );

    return {
      conversationId: convId,
      response: finalResponse,
      filtered: false,
    };
  } catch (error) {
    logger.error(
      {
        error,
        childId,
        videoId,
        conversationId,
      },
      'Failed to process AI chat message'
    );

    // Preserve ActionableError if it's already thrown
    if (error instanceof Error && 'code' in error) {
      throw error;
    }

    throw AIErrors.MESSAGE_SEND_FAILED(error);
  }
}

/**
 * Get conversation with messages
 */
export async function getConversation(conversationId: string) {
  try {
    const conversation = await prisma.aIConversation.findUnique({
      where: { id: conversationId },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
        child: {
          select: {
            id: true,
            name: true,
            ageRating: true,
          },
        },
        video: {
          select: {
            id: true,
            title: true,
            thumbnailPath: true,
          },
        },
      },
    });

    return conversation;
  } catch (error) {
    logger.error({ error, conversationId }, 'Failed to get conversation');
    throw DatabaseErrors.QUERY_FAILED('get conversation', error);
  }
}

/**
 * Get all conversations for a child and video
 */
export async function getConversationsForVideo(childId: string, videoId: string) {
  try {
    const conversations = await prisma.aIConversation.findMany({
      where: {
        childId,
        videoId,
      },
      include: {
        messages: {
          orderBy: {
            createdAt: 'asc',
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return conversations;
  } catch (error) {
    logger.error({ error, childId, videoId }, 'Failed to get conversations');
    return [];
  }
}

/**
 * Delete a conversation
 */
export async function deleteConversation(conversationId: string): Promise<void> {
  try {
    // Messages will be cascade deleted via Prisma schema
    await prisma.aIConversation.delete({
      where: { id: conversationId },
    });

    logger.info({ conversationId }, 'Deleted AI conversation');
  } catch (error) {
    logger.error({ error, conversationId }, 'Failed to delete conversation');
    throw DatabaseErrors.QUERY_FAILED('delete conversation', error);
  }
}

/**
 * Stream AI chat message response
 */
export async function* streamAIChatMessage({
  conversationId,
  childId,
  videoId,
  message,
  childAge,
  childName,
}: SendMessageParams): AsyncGenerator<
  { type: string; content?: string; conversationId?: string; error?: string },
  void,
  unknown
> {
  try {
    // Sanitize input
    const sanitizedMessage = sanitizeText(message);

    // Filter input for safety
    const inputFilter = filterInput(sanitizedMessage);
    if (!inputFilter.passed) {
      logger.warn(
        {
          childId,
          reason: inputFilter.reason,
          messagePreview: message.slice(0, 50),
        },
        'Child message filtered by safety filter'
      );

      yield {
        type: 'error',
        content: inputFilter.reason || 'This message cannot be processed.',
      };
      return;
    }

    // Get or create conversation
    const convId = conversationId || (await getOrCreateConversation({ childId, videoId }));

    yield { type: 'conversationId', conversationId: convId };

    // Get video details for context
    const video = await prisma.video.findUnique({
      where: { id: videoId },
      select: {
        title: true,
        description: true,
        topics: true,
        categories: true,
      },
    });

    if (!video) {
      yield { type: 'error', content: 'Video not found' };
      return;
    }

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      childName,
      childAge,
      videoTitle: video.title,
      videoSummary: video.description || undefined,
      topics: (video.topics as string[]) || [],
    });

    // Get conversation history
    const history = await getConversationHistory(convId);

    logger.info(
      {
        conversationId: convId,
        childId,
        videoId,
        historyLength: history.length,
        provider: AI_PROVIDER,
      },
      'Streaming message to AI provider'
    );

    // Stream from LLM
    let fullResponse = '';
    const llmStart = Date.now();
    const streamGenerator =
      AI_PROVIDER === 'openai'
        ? getOpenAIClient().streamMessage(sanitizedMessage, history, systemPrompt)
        : ollamaClient.streamMessage(sanitizedMessage, history, systemPrompt);

    for await (const chunk of streamGenerator) {
      fullResponse += chunk;

      // Send each chunk to the client
      yield {
        type: 'chunk',
        content: chunk,
      };
    }
    const llmProcessingTime = Date.now() - llmStart;

    // Filter complete output for safety
    const outputFilter = filterOutput(fullResponse, childAge);
    if (!outputFilter.passed) {
      logger.error(
        {
          conversationId: convId,
          reason: outputFilter.reason,
          responsePreview: fullResponse.slice(0, 100),
        },
        'LLM response filtered by safety filter'
      );

      // Save the filtered attempt
      await saveMessage(convId, 'CHILD', sanitizedMessage);
      await saveMessage(convId, 'ASSISTANT', '[Response filtered for safety]');

      yield {
        type: 'error',
        content:
          "I apologize, but I cannot provide a safe response to that question. Let's talk about something else from the video!",
      };
      return;
    }

    // Use filtered output if links were removed
    const finalResponse = outputFilter.filtered || fullResponse;
    const tokenCount = Math.ceil((sanitizedMessage.length + finalResponse.length) / 4);

    // Save messages to database
    await saveMessage(convId, 'CHILD', sanitizedMessage);
    await saveMessage(convId, 'ASSISTANT', finalResponse, {
      processingTime: llmProcessingTime,
      tokenCount,
    });

    // Refresh conversation topics based on what was actually discussed
    void refreshConversationTopics(convId, video.title);

    logger.info(
      {
        conversationId: convId,
        childId,
        responseLength: finalResponse.length,
      },
      'Streaming AI chat message completed successfully'
    );

    yield { type: 'done' };
  } catch (error) {
    logger.error(
      {
        error,
        childId,
        videoId,
        conversationId,
      },
      'Failed to stream AI chat message'
    );

    yield {
      type: 'error',
      content: error instanceof Error ? error.message : 'Failed to process message',
    };
  }
}
