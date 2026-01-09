/**
 * Shared Zod validators
 */

import { z } from 'zod';

export const ageRatingSchema = z.enum(['2+', '4+', '7+', '10+']);

export const uiModeSchema = z.enum(['TODDLER', 'EXPLORER']);

export const videoStatusSchema = z.enum([
  'PENDING',
  'DOWNLOADING',
  'PROCESSING',
  'READY',
  'ERROR',
]);

export const approvalStatusSchema = z.enum(['PENDING', 'APPROVED', 'REJECTED']);

export const sourceTypeSchema = z.enum(['YOUTUBE', 'VIMEO', 'UPLOAD', 'OTHER']);
