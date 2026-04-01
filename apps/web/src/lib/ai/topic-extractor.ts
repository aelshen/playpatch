/**
 * Topic Extraction Service
 * Uses OpenAI structured outputs for 100% schema-compliant topic extraction
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { logger } from '@/lib/logger';
import {
  VideoTopicsSchema,
  type VideoInput,
  type VideoTopicsResponse,
} from './schemas/topic-extraction';

const MODEL = 'gpt-4o-mini'; // Fast, affordable, supports structured outputs

const SYSTEM_PROMPT = `You are an expert at analyzing children's educational video content.
Extract 3-5 specific, meaningful topics from the video.

Guidelines:
- Focus on CONCRETE subjects: specific animals (dolphins, T-Rex), science concepts (photosynthesis, gravity), activities (drawing, building)
- AVOID generic terms: fun, learning, educational, cool, awesome, amazing, kids, children
- Each topic should be 1-3 words, specific enough to be searchable
- If the video covers multiple subjects, prioritize the most distinctive/unique topics
- Consider what a child might want to explore more of after watching

Examples of GOOD topics: "sea turtles", "volcanic eruptions", "watercolor painting", "dinosaur fossils"
Examples of BAD topics: "fun facts", "learning time", "cool stuff", "kids activities"`;

/**
 * Extract topics from video metadata using OpenAI structured outputs
 *
 * @param input Video title, description, and optional transcript
 * @returns Validated topic extraction response or null on error
 */
export async function extractTopicsFromVideo(
  input: VideoInput
): Promise<VideoTopicsResponse | null> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    logger.error({ message: 'OPENAI_API_KEY not configured' });
    return null;
  }

  const openai = new OpenAI({ apiKey });

  // Build user message from available content
  const contentParts = [`Title: ${input.title}`];

  if (input.description) {
    contentParts.push(`Description: ${input.description}`);
  }

  if (input.transcript) {
    // Limit transcript to first 500 chars to stay within token budget
    contentParts.push(`Transcript excerpt: ${input.transcript.slice(0, 500)}`);
  }

  const userMessage = contentParts.join('\n\n');

  try {
    logger.info({
      message: 'Extracting topics from video',
      title: input.title,
      hasDescription: !!input.description,
      hasTranscript: !!input.transcript,
    });

    const completion = await openai.chat.completions.parse({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userMessage },
      ],
      response_format: zodResponseFormat(VideoTopicsSchema, 'video_topics'),
      temperature: 0, // Deterministic for factual extraction
    });

    const result = completion.choices[0]?.message?.parsed;

    if (!result) {
      logger.error({
        message: 'OpenAI returned null parsed response',
        title: input.title,
      });
      return null;
    }

    logger.info({
      message: 'Topics extracted successfully',
      title: input.title,
      topicCount: result.topics.length,
      category: result.category,
      confidence: result.confidence,
      usage: completion.usage,
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'Topic extraction failed',
      title: input.title,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
