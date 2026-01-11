/**
 * Tests for AI safety filters
 */

import {
  filterInput,
  filterOutput,
  isTopicAllowed,
  sanitizeText,
  type FilterResult,
} from '../index';

describe('filterInput', () => {
  describe('valid inputs', () => {
    it('should pass normal, appropriate questions', () => {
      const result = filterInput('What are dinosaurs?');
      expect(result.passed).toBe(true);
      expect(result.reason).toBeUndefined();
    });

    it('should pass questions about video content', () => {
      const result = filterInput('Can you tell me more about how plants grow?');
      expect(result.passed).toBe(true);
    });

    it('should pass simple statements', () => {
      const result = filterInput('I liked the part about space!');
      expect(result.passed).toBe(true);
    });
  });

  describe('empty or invalid inputs', () => {
    it('should reject empty input', () => {
      const result = filterInput('');
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('empty');
    });

    it('should reject whitespace-only input', () => {
      const result = filterInput('   ');
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('empty');
    });

    it('should reject excessively long input', () => {
      const longInput = 'a'.repeat(501);
      const result = filterInput(longInput);
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('too long');
    });
  });

  describe('profanity detection', () => {
    it('should reject common profanity', () => {
      const inputs = ['stupid person', 'that is dumb', 'I hate this', 'idiot'];
      inputs.forEach(input => {
        const result = filterInput(input);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('kind and respectful');
      });
    });

    it('should reject obfuscated profanity', () => {
      const inputs = ['fuuuck', 'sh1t', 'daamn'];
      inputs.forEach(input => {
        const result = filterInput(input);
        expect(result.passed).toBe(false);
      });
    });

    it('should not flag words containing blocked words', () => {
      // "assassin" contains "ass", but should not be flagged
      const result = filterInput('Tell me about dinosaurs and their history');
      expect(result.passed).toBe(true);
    });
  });

  describe('PII detection', () => {
    it('should reject phone numbers', () => {
      const inputs = [
        'Call me at 555-123-4567',
        'My number is 5551234567',
        'Phone: 555.123.4567',
      ];
      inputs.forEach(input => {
        const result = filterInput(input);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('phone number');
      });
    });

    it('should reject email addresses', () => {
      const result = filterInput('Email me at test@example.com');
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('email address');
    });

    it('should reject SSNs', () => {
      const result = filterInput('My SSN is 123-45-6789');
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('social security number');
    });

    it('should reject street addresses', () => {
      const result = filterInput('I live at 123 Main Street');
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('street address');
    });
  });

  describe('harmful content detection', () => {
    it('should reject violence-related content', () => {
      const inputs = ['Tell me about guns', 'What is a weapon', 'How do bombs work'];
      inputs.forEach(input => {
        const result = filterInput(input);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('appropriate');
      });
    });

    it('should reject self-harm content', () => {
      const inputs = ['I want to hurt myself', 'suicide methods', 'self-harm'];
      inputs.forEach(input => {
        const result = filterInput(input);
        expect(result.passed).toBe(false);
      });
    });

    it('should reject drug-related content', () => {
      const inputs = ['Tell me about drugs', 'What is marijuana'];
      inputs.forEach(input => {
        const result = filterInput(input);
        expect(result.passed).toBe(false);
      });
    });

    it('should reject sexual content', () => {
      const inputs = ['sex education', 'naked people', 'porn'];
      inputs.forEach(input => {
        const result = filterInput(input);
        expect(result.passed).toBe(false);
      });
    });
  });

  describe('spam and abuse detection', () => {
    it('should reject excessive caps', () => {
      const result = filterInput('WHAT IS THIS ALL ABOUT');
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('caps');
    });

    it('should allow some caps for emphasis', () => {
      const result = filterInput('WOW that was amazing!');
      expect(result.passed).toBe(true);
    });

    it('should reject excessive special characters', () => {
      const result = filterInput('!@#$%^&*()!@#$');
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('regular words');
    });

    it('should allow normal punctuation', () => {
      const result = filterInput('Really? That\'s cool!');
      expect(result.passed).toBe(true);
    });
  });
});

describe('filterOutput', () => {
  describe('valid outputs', () => {
    it('should pass appropriate, age-suitable responses', () => {
      const result = filterOutput(
        'Dinosaurs lived millions of years ago. They were amazing creatures!',
        7
      );
      expect(result.passed).toBe(true);
    });

    it('should pass responses for different age groups', () => {
      const youngResponse = 'Dinosaurs were big and ate plants!';
      const olderResponse = 'Dinosaurs were diverse reptiles that dominated the Mesozoic Era.';

      expect(filterOutput(youngResponse, 5).passed).toBe(true);
      expect(filterOutput(olderResponse, 10).passed).toBe(true);
    });
  });

  describe('empty outputs', () => {
    it('should reject empty output', () => {
      const result = filterOutput('', 7);
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('empty');
    });
  });

  describe('link removal', () => {
    it('should remove http links', () => {
      const result = filterOutput(
        'Check out http://example.com for more info!',
        7
      );
      expect(result.passed).toBe(true);
      expect(result.filtered).toContain('[link removed]');
      expect(result.filtered).not.toContain('http://');
    });

    it('should remove https links', () => {
      const result = filterOutput(
        'Visit https://example.com to learn more',
        7
      );
      expect(result.passed).toBe(true);
      expect(result.filtered).toContain('[link removed]');
    });

    it('should remove www links', () => {
      const result = filterOutput('Go to www.example.com', 7);
      expect(result.passed).toBe(true);
      expect(result.filtered).toContain('[link removed]');
    });

    it('should remove domain names', () => {
      const result = filterOutput('Visit example.com for details', 7);
      expect(result.passed).toBe(true);
      expect(result.filtered).toContain('[link removed]');
    });
  });

  describe('inappropriate content detection', () => {
    it('should reject profanity in output', () => {
      const result = filterOutput('That was stupid', 7);
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('inappropriate');
    });

    it('should reject harmful content in output', () => {
      const inputs = [
        'You can use a weapon to...',
        'Violence is sometimes...',
        'Drug use can...',
      ];
      inputs.forEach(input => {
        const result = filterOutput(input, 7);
        expect(result.passed).toBe(false);
      });
    });

    it('should reject call-to-action phrases', () => {
      const inputs = [
        'Click here to learn more',
        'Visit this website',
        'Download this app',
        'Install this software',
      ];
      inputs.forEach(input => {
        const result = filterOutput(input, 7);
        expect(result.passed).toBe(false);
      });
    });

    it('should reject attempts to collect personal info', () => {
      const inputs = [
        'What is your name?',
        'Tell me your address',
        'Share your phone number',
        'What is your email?',
      ];
      inputs.forEach(input => {
        const result = filterOutput(input, 7);
        expect(result.passed).toBe(false);
        expect(result.reason).toContain('personal information');
      });
    });
  });

  describe('length enforcement', () => {
    it('should accept appropriate length for age 5', () => {
      // Max 50 words, allow 1.5x = 75 words
      const shortResponse = 'Dinosaurs were big. Some ate plants. Some ate meat.';
      const result = filterOutput(shortResponse, 5);
      expect(result.passed).toBe(true);
    });

    it('should reject excessively long responses for young children', () => {
      // Max 50 words for age 5, reject > 75 words
      const longResponse = Array(80).fill('word').join(' ');
      const result = filterOutput(longResponse, 5);
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('too long');
    });

    it('should allow longer responses for older children', () => {
      // Max 75 words for age 8, allow up to 112 words
      const response = Array(100).fill('word').join(' ');
      const result = filterOutput(response, 8);
      expect(result.passed).toBe(true);
    });

    it('should reject very long responses for age 10', () => {
      // Max 100 words for age 10, reject > 150 words
      const longResponse = Array(160).fill('word').join(' ');
      const result = filterOutput(longResponse, 10);
      expect(result.passed).toBe(false);
      expect(result.reason).toContain('too long');
    });
  });
});

describe('isTopicAllowed', () => {
  it('should allow educational topics', () => {
    const allowedTopics = [
      'dinosaurs',
      'space',
      'science',
      'animals',
      'nature',
      'math',
      'history',
      'geography',
    ];
    allowedTopics.forEach(topic => {
      expect(isTopicAllowed(topic)).toBe(true);
    });
  });

  it('should block violence-related topics', () => {
    const blockedTopics = ['violence', 'weapon', 'war', 'death'];
    blockedTopics.forEach(topic => {
      expect(isTopicAllowed(topic)).toBe(false);
    });
  });

  it('should block adult content topics', () => {
    const blockedTopics = ['adult', 'sex', 'dating', 'romance'];
    blockedTopics.forEach(topic => {
      expect(isTopicAllowed(topic)).toBe(false);
    });
  });

  it('should block controversial topics', () => {
    const blockedTopics = ['politics', 'religion'];
    blockedTopics.forEach(topic => {
      expect(isTopicAllowed(topic)).toBe(false);
    });
  });

  it('should block substance topics', () => {
    const blockedTopics = ['drugs', 'alcohol', 'smoking', 'gambling'];
    blockedTopics.forEach(topic => {
      expect(isTopicAllowed(topic)).toBe(false);
    });
  });

  it('should block scary topics', () => {
    const blockedTopics = ['horror', 'scary', 'nightmare'];
    blockedTopics.forEach(topic => {
      expect(isTopicAllowed(topic)).toBe(false);
    });
  });

  it('should be case-insensitive', () => {
    expect(isTopicAllowed('VIOLENCE')).toBe(false);
    expect(isTopicAllowed('Violence')).toBe(false);
    expect(isTopicAllowed('SCIENCE')).toBe(true);
  });
});

describe('sanitizeText', () => {
  it('should remove HTML tags', () => {
    const text = 'Hello <script>alert("xss")</script> world';
    const result = sanitizeText(text);
    expect(result).toBe('Hello world');
    expect(result).not.toContain('<');
    expect(result).not.toContain('>');
  });

  it('should remove multiple HTML tags', () => {
    const text = '<div><p>Text</p></div>';
    const result = sanitizeText(text);
    expect(result).toBe('Text');
  });

  it('should reduce excessive punctuation', () => {
    const text = 'Really!!! That is amazing???';
    const result = sanitizeText(text);
    expect(result).toBe('Really!! That is amazing??');
  });

  it('should normalize whitespace', () => {
    const text = 'Too    many     spaces';
    const result = sanitizeText(text);
    expect(result).toBe('Too many spaces');
  });

  it('should trim leading and trailing whitespace', () => {
    const text = '   Hello world   ';
    const result = sanitizeText(text);
    expect(result).toBe('Hello world');
  });

  it('should handle multiple sanitization operations', () => {
    const text = '<b>  Too   many!!!  spaces  </b>';
    const result = sanitizeText(text);
    expect(result).toBe('Too many!! spaces');
  });

  it('should not modify clean text', () => {
    const text = 'This is a normal sentence.';
    const result = sanitizeText(text);
    expect(result).toBe(text);
  });
});
