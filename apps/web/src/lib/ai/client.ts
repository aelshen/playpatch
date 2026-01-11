/**
 * Ollama API Client
 * Wrapper for communicating with local Ollama LLM instance
 */

import { logger } from '../logger';

export interface OllamaMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface OllamaRequest {
  model: string;
  messages: OllamaMessage[];
  stream?: boolean;
  options?: {
    temperature?: number;
    top_p?: number;
    top_k?: number;
    num_predict?: number;
  };
}

export interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

export interface OllamaError {
  error: string;
}

/**
 * Default model to use for chat
 * Can be overridden via environment variable
 */
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'llama3.2:3b';

/**
 * Ollama API base URL
 */
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://localhost:11434';

/**
 * Maximum retries for failed requests
 */
const MAX_RETRIES = 3;

/**
 * Initial retry delay in milliseconds
 */
const RETRY_DELAY = 1000;

/**
 * Request timeout in milliseconds (30 seconds)
 */
const REQUEST_TIMEOUT = 30000;

/**
 * Ollama API client
 */
export class OllamaClient {
  private baseUrl: string;
  private model: string;

  constructor(baseUrl: string = OLLAMA_BASE_URL, model: string = DEFAULT_MODEL) {
    this.baseUrl = baseUrl;
    this.model = model;
  }

  /**
   * Send a chat completion request to Ollama
   */
  async chat(
    messages: OllamaMessage[],
    options?: OllamaRequest['options']
  ): Promise<string> {
    const request: OllamaRequest = {
      model: this.model,
      messages,
      stream: false,
      options: {
        temperature: 0.7,
        top_p: 0.9,
        num_predict: 150, // Limit response length
        ...options,
      },
    };

    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        logger.info(
          {
            attempt,
            model: this.model,
            messageCount: messages.length,
          },
          'Sending chat request to Ollama'
        );

        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);

        const response = await fetch(`${this.baseUrl}/api/chat`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(request),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const error: OllamaError = await response.json();
          throw new Error(`Ollama API error: ${error.error}`);
        }

        const data: OllamaResponse = await response.json();

        logger.info(
          {
            model: data.model,
            evalCount: data.eval_count,
            duration: data.total_duration,
          },
          'Received response from Ollama'
        );

        return data.message.content;
      } catch (error) {
        lastError = error as Error;

        logger.warn(
          {
            attempt,
            error: lastError.message,
            willRetry: attempt < MAX_RETRIES,
          },
          'Ollama request failed'
        );

        if (attempt < MAX_RETRIES) {
          // Exponential backoff
          const delay = RETRY_DELAY * Math.pow(2, attempt - 1);
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    // All retries failed
    logger.error(
      { error: lastError?.message, maxRetries: MAX_RETRIES },
      'Ollama request failed after all retries'
    );

    throw new Error(
      `Failed to get response from Ollama after ${MAX_RETRIES} attempts: ${lastError?.message}`
    );
  }

  /**
   * Send a single message with conversation history
   */
  async sendMessage(
    userMessage: string,
    conversationHistory: OllamaMessage[] = [],
    systemPrompt?: string
  ): Promise<string> {
    const messages: OllamaMessage[] = [];

    // Add system prompt if provided
    if (systemPrompt) {
      messages.push({
        role: 'system',
        content: systemPrompt,
      });
    }

    // Add conversation history
    messages.push(...conversationHistory);

    // Add current user message
    messages.push({
      role: 'user',
      content: userMessage,
    });

    return this.chat(messages);
  }

  /**
   * Check if Ollama is available
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch (error) {
      logger.error({ error }, 'Ollama health check failed');
      return false;
    }
  }

  /**
   * List available models
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);
      const data = await response.json();
      return data.models?.map((m: { name: string }) => m.name) || [];
    } catch (error) {
      logger.error({ error }, 'Failed to list Ollama models');
      return [];
    }
  }
}

/**
 * Singleton instance of Ollama client
 */
export const ollamaClient = new OllamaClient();

/**
 * Check if Ollama is configured and available
 */
export async function isOllamaAvailable(): Promise<boolean> {
  // Check if AI features are enabled
  if (process.env.NEXT_PUBLIC_AI_ENABLED !== 'true') {
    return false;
  }

  return ollamaClient.healthCheck();
}
