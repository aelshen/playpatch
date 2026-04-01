/**
 * Actionable Error Messages
 * All error messages should help users understand what went wrong and how to fix it
 */

export class ActionableError extends Error {
  constructor(
    message: string,
    public code: string,
    public fix?: string,
    public cause?: unknown
  ) {
    super(message);
    this.name = 'ActionableError';
  }

  toString(): string {
    let msg = `[${this.code}] ${this.message}`;
    if (this.fix) {
      msg += `\n\nHow to fix: ${this.fix}`;
    }
    return msg;
  }
}

/**
 * Database Errors
 */
export const DatabaseErrors = {
  CONNECTION_FAILED: (cause?: unknown) =>
    new ActionableError(
      'Database connection failed. PostgreSQL may not be running or DATABASE_URL is incorrect.',
      'DB_CONNECTION_FAILED',
      'Run: pnpm docker:dev to start PostgreSQL, then check DATABASE_URL in apps/web/.env matches postgresql://playpatch:playpatch_dev@localhost:5433/playpatch',
      cause
    ),

  QUERY_FAILED: (operation: string, cause?: unknown) =>
    new ActionableError(
      `Database query failed during ${operation}.`,
      'DB_QUERY_FAILED',
      'Check: 1) Database is running (pnpm docker:status), 2) Migrations are current (pnpm db:migrate), 3) Database connection is stable',
      cause
    ),

  MIGRATION_FAILED: (cause?: unknown) =>
    new ActionableError(
      'Database migration failed. Schema changes could not be applied.',
      'DB_MIGRATION_FAILED',
      'Run: pnpm db:reset to reset the database (WARNING: deletes all data), or check migration files in apps/web/prisma/migrations/',
      cause
    ),

  RECORD_NOT_FOUND: (entityType: string, id: string) =>
    new ActionableError(
      `${entityType} with ID "${id}" not found in database.`,
      'DB_RECORD_NOT_FOUND',
      `Verify the ${entityType} ID is correct and the record exists in the database. Use pnpm db:studio to browse data.`
    ),
};

/**
 * AI Service Errors
 */
export const AIErrors = {
  SERVICE_UNAVAILABLE: (provider: string, cause?: unknown) =>
    new ActionableError(
      `AI service (${provider}) is unavailable or not responding.`,
      'AI_SERVICE_UNAVAILABLE',
      provider === 'ollama'
        ? 'Check: 1) Ollama is running (docker ps | grep ollama), 2) Model is downloaded (pnpm ollama:pull), 3) OLLAMA_URL in .env is correct (http://localhost:11434)'
        : 'Check: 1) OPENAI_API_KEY is set in .env, 2) API key is valid, 3) OpenAI API is reachable',
      cause
    ),

  CONVERSATION_CREATE_FAILED: (cause?: unknown) =>
    new ActionableError(
      'Failed to create AI conversation in database.',
      'AI_CONVERSATION_CREATE_FAILED',
      'Check: 1) Database is running (pnpm health:check), 2) childId and videoId are valid',
      cause
    ),

  MESSAGE_SEND_FAILED: (cause?: unknown) =>
    new ActionableError(
      'Failed to send message to AI service.',
      'AI_MESSAGE_SEND_FAILED',
      'Check: 1) AI service is running (pnpm health:check), 2) Conversation exists in database',
      cause
    ),

  RESPONSE_FILTERED: () =>
    new ActionableError(
      'AI response was blocked by safety filters.',
      'AI_RESPONSE_FILTERED',
      'The AI attempted to generate content that violated safety guidelines. This is working as intended. Try rephrasing your question.'
    ),
};

/**
 * Storage Errors
 */
export const StorageErrors = {
  UPLOAD_FAILED: (filename: string, cause?: unknown) =>
    new ActionableError(
      `Failed to upload file "${filename}" to storage.`,
      'STORAGE_UPLOAD_FAILED',
      'Check: 1) MinIO is running (pnpm docker:status), 2) Storage path is writable, 3) Disk space is available (df -h)',
      cause
    ),

  DOWNLOAD_FAILED: (url: string, cause?: unknown) =>
    new ActionableError(
      `Failed to download file from "${url}".`,
      'STORAGE_DOWNLOAD_FAILED',
      'Check: 1) URL is valid and accessible, 2) Network connection is stable, 3) Source server is responding',
      cause
    ),

  FILE_TOO_LARGE: (size: number, maxSize: number) =>
    new ActionableError(
      `File size (${Math.round(size / 1024 / 1024)}MB) exceeds maximum allowed size (${Math.round(maxSize / 1024 / 1024)}MB).`,
      'STORAGE_FILE_TOO_LARGE',
      `Reduce file size or increase MAX_VIDEO_SIZE_MB in .env (current: ${Math.round(maxSize / 1024 / 1024)}MB)`
    ),

  MINIO_UNAVAILABLE: (cause?: unknown) =>
    new ActionableError(
      'MinIO storage service is unavailable.',
      'STORAGE_MINIO_UNAVAILABLE',
      'Run: pnpm docker:dev to start MinIO, then verify it\'s running with: pnpm docker:status',
      cause
    ),
};

/**
 * Video Processing Errors
 */
export const VideoErrors = {
  IMPORT_FAILED: (source: string, cause?: unknown) =>
    new ActionableError(
      `Failed to import video from ${source}.`,
      'VIDEO_IMPORT_FAILED',
      'Check: 1) URL is valid, 2) Video is publicly accessible, 3) yt-dlp is installed (for YouTube), 4) Source service is online',
      cause
    ),

  YTDLP_NOT_INSTALLED: () =>
    new ActionableError(
      'yt-dlp is not installed. YouTube videos cannot be imported.',
      'VIDEO_YTDLP_NOT_INSTALLED',
      'Install yt-dlp: pip install yt-dlp (or brew install yt-dlp on macOS)'
    ),

  VIDEO_PRIVATE: (url: string) =>
    new ActionableError(
      'This video is private and cannot be imported.',
      'VIDEO_PRIVATE',
      `The video at ${url} is set to private. You can only import public videos.`
    ),

  VIDEO_UNAVAILABLE: (url: string) =>
    new ActionableError(
      'This video is unavailable or has been removed.',
      'VIDEO_UNAVAILABLE',
      `The video at ${url} no longer exists or is not accessible. Verify the URL is correct.`
    ),

  TRANSCODING_FAILED: (videoId: string, cause?: unknown) =>
    new ActionableError(
      `Video transcoding failed for video ${videoId}.`,
      'VIDEO_TRANSCODING_FAILED',
      'Check: 1) ffmpeg is installed and working, 2) Source video file is valid, 3) Sufficient disk space',
      cause
    ),
};

/**
 * Network Errors
 */
export const NetworkErrors = {
  FETCH_FAILED: (url: string, cause?: unknown) =>
    new ActionableError(
      `Network request to ${url} failed.`,
      'NETWORK_FETCH_FAILED',
      'Check: 1) Internet connection is active, 2) URL is correct, 3) Remote server is responding, 4) No firewall blocking the request',
      cause
    ),

  TIMEOUT: (url: string, timeoutMs: number) =>
    new ActionableError(
      `Request to ${url} timed out after ${timeoutMs}ms.`,
      'NETWORK_TIMEOUT',
      'Check: 1) Network connection speed, 2) Remote server responsiveness, 3) Increase timeout if needed'
    ),

  RATE_LIMITED: (service: string) =>
    new ActionableError(
      `Rate limit exceeded for ${service}.`,
      'NETWORK_RATE_LIMITED',
      'Wait a few minutes before retrying. If this persists, check your API usage limits.'
    ),
};

/**
 * Authentication Errors
 */
export const AuthErrors = {
  UNAUTHORIZED: () =>
    new ActionableError(
      'You are not authorized to access this resource.',
      'AUTH_UNAUTHORIZED',
      'Log in with valid credentials or request access from your family administrator.'
    ),

  SESSION_EXPIRED: () =>
    new ActionableError(
      'Your session has expired. Please log in again.',
      'AUTH_SESSION_EXPIRED',
      'Refresh the page and log in again. Sessions expire after 30 days of inactivity.'
    ),

  INVALID_CREDENTIALS: () =>
    new ActionableError(
      'Invalid email or password.',
      'AUTH_INVALID_CREDENTIALS',
      'Check your email and password are correct. Passwords are case-sensitive.'
    ),

  PIN_INCORRECT: () =>
    new ActionableError(
      'Incorrect PIN. Access denied.',
      'AUTH_PIN_INCORRECT',
      'Enter the correct 4-digit PIN. Contact your parent if you forgot it.'
    ),
};

/**
 * Configuration Errors
 */
export const ConfigErrors = {
  ENV_VAR_MISSING: (varName: string) =>
    new ActionableError(
      `Required environment variable ${varName} is not set.`,
      'CONFIG_ENV_VAR_MISSING',
      `Add ${varName} to apps/web/.env file. See .env.example for reference.`
    ),

  INVALID_CONFIG: (setting: string, reason: string) =>
    new ActionableError(
      `Invalid configuration for ${setting}: ${reason}`,
      'CONFIG_INVALID',
      `Check apps/web/.env and verify ${setting} is set correctly. See documentation for valid values.`
    ),
};

/**
 * Helper to format errors for API responses
 */
export function formatErrorResponse(error: unknown): {
  message: string;
  code?: string;
  fix?: string;
} {
  if (error instanceof ActionableError) {
    return {
      message: error.message,
      code: error.code,
      fix: error.fix,
    };
  }

  if (error instanceof Error) {
    return {
      message: error.message,
    };
  }

  return {
    message: 'An unexpected error occurred',
  };
}
