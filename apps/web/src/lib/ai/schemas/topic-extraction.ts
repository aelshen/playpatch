/**
 * Zod schema for OpenAI structured output topic extraction
 * Used with zodResponseFormat() for 100% schema adherence
 */

import { z } from 'zod';

/**
 * Schema for video topic extraction response
 *
 * IMPORTANT: Keep schema simple for OpenAI compatibility.
 * Avoid: .refine(), .transform(), .default() on nested objects
 * Use .describe() to guide the model instead of constraints.
 */
export const VideoTopicsSchema = z.object({
  topics: z
    .array(z.string())
    .describe(
      '3-5 specific, meaningful topics from the video. Focus on concrete subjects (animals, science concepts, activities) rather than generic terms (fun, learning, cool). Each topic should be 1-3 words.'
    ),

  category: z
    .enum([
      'animals',
      'science',
      'art',
      'music',
      'sports',
      'nature',
      'vehicles',
      'space',
      'history',
      'math',
      'reading',
      'social_skills',
      'other',
    ])
    .describe('Primary educational category that best fits the video content'),

  confidence: z
    .enum(['high', 'medium', 'low'])
    .describe(
      'Confidence in topic extraction: high if clear educational content, medium if mixed, low if unclear or entertainment-focused'
    ),
});

export type VideoTopicsResponse = z.infer<typeof VideoTopicsSchema>;

/**
 * Input schema for extraction function
 */
export const VideoInputSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  transcript: z.string().optional(),
});

export type VideoInput = z.infer<typeof VideoInputSchema>;
