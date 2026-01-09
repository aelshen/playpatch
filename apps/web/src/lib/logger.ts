/**
 * Structured Logging with Pino
 * SSK-009: Logging & Error Handling
 */

import pino from 'pino';

export const logger = pino({
  level: process.env.LOG_LEVEL || (process.env.NODE_ENV === 'development' ? 'debug' : 'info'),
  transport:
    process.env.NODE_ENV === 'development'
      ? {
          target: 'pino-pretty',
          options: {
            colorize: true,
            translateTime: 'SYS:standard',
            ignore: 'pid,hostname',
          },
        }
      : undefined,
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
