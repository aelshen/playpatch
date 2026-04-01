/**
 * AI Safety Analysis Service
 * Uses OpenAI to assess child-safety of video content.
 */

import OpenAI from 'openai';
import { zodResponseFormat } from 'openai/helpers/zod';
import { z } from 'zod';
import { logger } from '@/lib/logger';

const MODEL = 'gpt-4o-mini';

const SafetyAnalysisSchema = z.object({
  safetyScore: z
    .number()
    .int()
    .min(0)
    .max(100)
    .describe(
      'Safety score 0-100. 90-100 = completely safe, 70-89 = mostly safe, 50-69 = review recommended, below 50 = not suitable.'
    ),
  safeForChildren: z
    .boolean()
    .describe('True if content is appropriate for children aged 2-10 with no concerns.'),
  ageRecommendation: z
    .enum(['Ages 2+', 'Ages 4+', 'Ages 7+', 'Ages 10+', 'Not for children'])
    .describe('Minimum appropriate age group for this content.'),
  concerns: z
    .array(z.string())
    .describe(
      'List of specific safety concerns (e.g. "mild cartoon violence", "scary imagery"). Empty if none.'
    ),
  summary: z
    .string()
    .describe(
      'One sentence description of the video content from a parent safety perspective. Be brief and factual.'
    ),
});

export type SafetyAnalysis = z.infer<typeof SafetyAnalysisSchema>;

const SYSTEM_PROMPT = `You are a child safety expert reviewing educational video content for a parent-controlled streaming platform for children aged 2-10.

Analyze the video based on its title and description. Assess:
- Is the content educational and age-appropriate?
- Are there any scary, violent, or otherwise concerning elements?
- What is the minimum appropriate age?

Be conservative and err on the side of caution. A safety score of 85+ means you'd be comfortable recommending the video to any parent for their young child.`;

export async function analyzeVideoSafety(input: {
  title: string;
  description?: string;
}): Promise<SafetyAnalysis | null> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    logger.warn({ message: 'OPENAI_API_KEY not configured, skipping safety analysis' });
    return null;
  }

  const openai = new OpenAI({ apiKey });

  const contentParts = [`Title: ${input.title}`];
  if (input.description) {
    // Limit to 600 chars — safety can be inferred from title + brief description
    contentParts.push(`Description: ${input.description.slice(0, 600)}`);
  }

  try {
    const completion = await openai.chat.completions.parse({
      model: MODEL,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: contentParts.join('\n\n') },
      ],
      response_format: zodResponseFormat(SafetyAnalysisSchema, 'safety_analysis'),
      temperature: 0,
    });

    const result = completion.choices[0]?.message?.parsed;
    if (!result) {
      logger.error({ message: 'OpenAI returned null safety analysis', title: input.title });
      return null;
    }

    logger.info({
      message: 'Safety analysis completed',
      title: input.title,
      safetyScore: result.safetyScore,
      safeForChildren: result.safeForChildren,
      usage: completion.usage,
    });

    return result;
  } catch (error) {
    logger.error({
      message: 'Safety analysis failed',
      title: input.title,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    return null;
  }
}
