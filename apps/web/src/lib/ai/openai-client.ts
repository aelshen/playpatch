/**
 * OpenAI API Client
 * Wrapper for communicating with OpenAI API
 */

import OpenAI from 'openai';
import { logger } from '../logger';
import type { OllamaMessage } from './client';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const DEFAULT_MODEL = 'gpt-4o-mini'; // Fast and affordable model

/**
 * OpenAI API client
 */
export class OpenAIClient {
  private client: OpenAI;
  private model: string;

  constructor(apiKey: string = OPENAI_API_KEY || '', model: string = DEFAULT_MODEL) {
    if (!apiKey) {
      throw new Error('OpenAI API key is required');
    }

    this.client = new OpenAI({ apiKey });
    this.model = model;
  }

  /**
   * Send a single message with conversation history (non-streaming)
   */
  async sendMessage(
    userMessage: string,
    conversationHistory: OllamaMessage[] = [],
    systemPrompt?: string
  ): Promise<string> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      logger.info(
        {
          model: this.model,
          messageCount: messages.length,
        },
        'Sending chat request to OpenAI'
      );

      const completion = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 150,
        temperature: 0.7,
      });

      const response = completion.choices[0]?.message?.content || '';

      logger.info(
        {
          model: this.model,
          usage: completion.usage,
        },
        'Received response from OpenAI'
      );

      return response;
    } catch (error) {
      logger.error({ error }, 'OpenAI request failed');
      throw new Error(
        `Failed to get response from OpenAI: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Stream a chat completion (yields chunks of text)
   */
  async *streamMessage(
    userMessage: string,
    conversationHistory: OllamaMessage[] = [],
    systemPrompt?: string
  ): AsyncGenerator<string, void, unknown> {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation history
    for (const msg of conversationHistory) {
      messages.push({
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content,
      });
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    try {
      logger.info(
        {
          model: this.model,
          messageCount: messages.length,
        },
        'Starting streaming chat request to OpenAI'
      );

      const stream = await this.client.chat.completions.create({
        model: this.model,
        messages,
        max_tokens: 150,
        temperature: 0.7,
        stream: true,
      });

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content;
        if (content) {
          yield content;
        }
      }

      logger.info('Streaming chat completed');
    } catch (error) {
      logger.error(
        {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
        },
        'Streaming chat failed'
      );
      throw new Error(
        `Failed to stream from OpenAI: ${error instanceof Error ? error.message : String(error)}`
      );
    }
  }

  /**
   * Check if OpenAI is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      // Try to list models as a health check
      await this.client.models.list();
      return true;
    } catch (error) {
      logger.error({ error }, 'OpenAI health check failed');
      return false;
    }
  }
}

/**
 * Singleton instance of OpenAI client
 */
let openaiClientInstance: OpenAIClient | null = null;

export function getOpenAIClient(): OpenAIClient {
  if (!openaiClientInstance) {
    openaiClientInstance = new OpenAIClient();
  }
  return openaiClientInstance;
}

/**
 * Check if OpenAI is configured and available
 */
export async function isOpenAIAvailable(): Promise<boolean> {
  // Check if AI features are enabled
  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') {
    return false;
  }

  // Check if API key is configured
  if (!process.env.OPENAI_API_KEY) {
    return false;
  }

  try {
    const client = getOpenAIClient();
    return await client.healthCheck();
  } catch {
    return false;
  }
}
