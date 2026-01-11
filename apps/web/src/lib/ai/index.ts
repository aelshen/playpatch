/**
 * AI Library
 * Export all AI-related functionality
 */

export * from './client';
export * from './openai-client';
export * from './service';

// Re-export availability check based on provider
import { isOllamaAvailable } from './client';
import { isOpenAIAvailable } from './openai-client';

export async function isAIAvailable(): Promise<boolean> {
  const provider = process.env.AI_PROVIDER || 'ollama';
  return provider === 'openai' ? isOpenAIAvailable() : isOllamaAvailable();
}
