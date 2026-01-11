/**
 * Input and output filters for AI safety
 */

export interface FilterResult {
  passed: boolean;
  reason?: string;
  filtered?: string;
}

/**
 * Common profanity and inappropriate words to filter
 * (Simplified list for initial implementation)
 */
const PROFANITY_PATTERNS = [
  /\b(stupid|dumb|idiot|hate|kill|die|death)\b/gi,
  /\b(f+u+c+k|s+h+i+t|d+a+m+n|h+e+l+l|c+r+a+p)\b/gi,
];

/**
 * PII patterns to detect personal information
 */
const PII_PATTERNS = [
  { pattern: /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, type: 'phone number' },
  { pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, type: 'email address' },
  { pattern: /\b\d{3}-\d{2}-\d{4}\b/g, type: 'social security number' },
  { pattern: /\b\d{1,5}\s\w+\s(street|st|avenue|ave|road|rd|lane|ln|drive|dr|court|ct|circle|cir|boulevard|blvd)\b/gi, type: 'street address' },
];

/**
 * Harmful topics to filter
 */
const HARMFUL_PATTERNS = [
  /\b(violence|weapon|gun|knife|bomb|explosive|attack)\b/gi,
  /\b(suicide|self[-\s]?harm|hurt[-\s]?myself)\b/gi,
  /\b(drug|marijuana|cocaine|heroin|meth|prescription)\b/gi,
  /\b(sex|sexual|porn|nude|naked)\b/gi,
];

/**
 * Filter child input before sending to LLM
 */
export function filterInput(input: string): FilterResult {
  if (!input || input.trim().length === 0) {
    return { passed: false, reason: 'Input cannot be empty' };
  }

  // Check for excessive length (prevent abuse)
  if (input.length > 500) {
    return {
      passed: false,
      reason: 'Message is too long. Please keep it under 500 characters.'
    };
  }

  // Check for profanity
  for (const pattern of PROFANITY_PATTERNS) {
    if (pattern.test(input)) {
      return {
        passed: false,
        reason: 'Please use kind and respectful language.',
      };
    }
  }

  // Check for PII
  for (const { pattern, type } of PII_PATTERNS) {
    if (pattern.test(input)) {
      return {
        passed: false,
        reason: `Please don't share personal information like ${type}s. Keep yourself safe online!`,
      };
    }
  }

  // Check for harmful topics
  for (const pattern of HARMFUL_PATTERNS) {
    if (pattern.test(input)) {
      return {
        passed: false,
        reason: 'This topic isn\'t appropriate for our chat. Let\'s talk about the video instead!',
      };
    }
  }

  // Check for excessive caps (shouting)
  const capsRatio = (input.match(/[A-Z]/g) || []).length / input.length;
  if (input.length > 10 && capsRatio > 0.6) {
    return {
      passed: false,
      reason: 'Please don\'t use all caps. It looks like shouting!',
    };
  }

  // Check for excessive special characters (spam-like)
  const specialCharsRatio = (input.match(/[!?@#$%^&*()]/g) || []).length / input.length;
  if (input.length > 10 && specialCharsRatio > 0.3) {
    return {
      passed: false,
      reason: 'Please use regular words to ask your question.',
    };
  }

  return { passed: true };
}

/**
 * External link patterns to remove from output
 */
const LINK_PATTERNS = [
  /https?:\/\/[^\s]+/gi,
  /www\.[^\s]+/gi,
  /\b[a-zA-Z0-9-]+\.(com|org|net|edu|gov|io|co)\b/gi,
];

/**
 * Inappropriate content patterns for output
 */
const OUTPUT_FILTER_PATTERNS = [
  ...PROFANITY_PATTERNS,
  ...HARMFUL_PATTERNS,
  /\b(click here|visit|go to|download|install)\b/gi,
  /\b(personal information|address|phone|email|password)\b/gi,
];

/**
 * Filter LLM output before showing to child
 */
export function filterOutput(output: string, childAge: number): FilterResult {
  if (!output || output.trim().length === 0) {
    return { passed: false, reason: 'Output is empty' };
  }

  let filtered = output;

  // Remove any external links
  for (const pattern of LINK_PATTERNS) {
    if (pattern.test(filtered)) {
      filtered = filtered.replace(pattern, '[link removed]');
    }
  }

  // Check for inappropriate content
  for (const pattern of OUTPUT_FILTER_PATTERNS) {
    if (pattern.test(filtered)) {
      return {
        passed: false,
        reason: 'Response contains inappropriate content',
      };
    }
  }

  // Enforce length limits based on age
  const maxWords = childAge < 7 ? 50 : childAge < 10 ? 75 : 100;
  const wordCount = filtered.split(/\s+/).length;

  if (wordCount > maxWords * 1.5) {
    return {
      passed: false,
      reason: `Response is too long for age ${childAge} (${wordCount} words, max ${maxWords})`,
    };
  }

  // Check for attempts to ask for personal information
  if (/\b(what is your|tell me your|share your)\s+(name|address|phone|email|age|school)\b/gi.test(filtered)) {
    return {
      passed: false,
      reason: 'Response attempts to collect personal information',
    };
  }

  // Return filtered output if any links were removed
  if (filtered !== output) {
    return {
      passed: true,
      filtered,
    };
  }

  return { passed: true };
}

/**
 * Check if a topic is within allowed boundaries for child discussion
 */
export function isTopicAllowed(topic: string): boolean {
  const lowerTopic = topic.toLowerCase();

  const blockedTopics = [
    'violence', 'weapon', 'war', 'death',
    'adult', 'sex', 'dating', 'romance',
    'politics', 'religion',
    'drugs', 'alcohol', 'smoking',
    'gambling', 'betting',
    'horror', 'scary', 'nightmare',
  ];

  return !blockedTopics.some(blocked => lowerTopic.includes(blocked));
}

/**
 * Sanitize text by removing or replacing unsafe content
 */
export function sanitizeText(text: string): string {
  let sanitized = text;

  // Remove any HTML tags
  sanitized = sanitized.replace(/<[^>]*>/g, '');

  // Remove excessive punctuation
  sanitized = sanitized.replace(/([!?.]){3,}/g, '$1$1');

  // Remove excessive whitespace
  sanitized = sanitized.replace(/\s+/g, ' ').trim();

  return sanitized;
}
