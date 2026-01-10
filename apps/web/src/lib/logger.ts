/**
 * Structured Logging with Pino
 * SSK-009: Logging & Error Handling
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  redact: {
    paths: ['password', 'pin', 'sessionId', 'token', 'secret', 'apiKey'],
    remove: true,
  },
  formatters: {
    level: (label) => {
      return { level: label };
    },
  },
});

export default logger;
