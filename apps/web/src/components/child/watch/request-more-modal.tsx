/**
 * Request More Modal
 * Modal for requesting more content like the current video
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';

interface RequestMoreModalProps {
  videoId: string;
  childProfileId: string;
  isOpen: boolean;
  onClose: () => void;
}

export function RequestMoreModal({
  videoId,
  childProfileId,
  isOpen,
  onClose,
}: RequestMoreModalProps) {
  const router = useRouter();
  const [requestType, setRequestType] = useState<'MORE_LIKE_THIS' | 'SPECIFIC_TOPIC'>('MORE_LIKE_THIS');
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async () => {
    if (requestType === 'SPECIFIC_TOPIC' && !message.trim()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          childProfileId,
          videoId,
          requestType,
          message: message.trim() || null,
        }),
      });

      if (response.ok) {
        setIsSuccess(true);
        router.refresh();
        // Close modal after 1.5 seconds
        setTimeout(() => {
          onClose();
          // Reset form
          setTimeout(() => {
            setIsSuccess(false);
            setMessage('');
            setRequestType('MORE_LIKE_THIS');
          }, 300);
        }, 1500);
      } else {
        console.error('Failed to submit request');
        alert('Failed to submit request. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting request:', error);
      alert('Failed to submit request. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  if (isSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
        <div className="w-full max-w-md rounded-lg bg-gray-800 p-8 shadow-xl text-center">
          <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-500/20">
            <svg className="h-8 w-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">Request Sent!</h3>
          <p className="text-gray-400">
            We'll look for more videos you might like.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white">Request More Videos</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors"
          >
            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Request type selection */}
        <div className="mb-4 space-y-2">
          <button
            onClick={() => setRequestType('MORE_LIKE_THIS')}
            className={cn(
              'w-full flex items-start gap-3 rounded-lg p-4 text-left transition-colors',
              requestType === 'MORE_LIKE_THIS'
                ? 'bg-blue-500/20 ring-2 ring-blue-500'
                : 'bg-gray-700 hover:bg-gray-600'
            )}
          >
            <div
              className={cn(
                'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                requestType === 'MORE_LIKE_THIS' ? 'border-blue-400' : 'border-gray-500'
              )}
            >
              {requestType === 'MORE_LIKE_THIS' && (
                <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              )}
            </div>
            <div>
              <div className="font-medium text-white mb-1">More videos like this</div>
              <div className="text-sm text-gray-400">
                We'll find more videos similar to this one
              </div>
            </div>
          </button>

          <button
            onClick={() => setRequestType('SPECIFIC_TOPIC')}
            className={cn(
              'w-full flex items-start gap-3 rounded-lg p-4 text-left transition-colors',
              requestType === 'SPECIFIC_TOPIC'
                ? 'bg-blue-500/20 ring-2 ring-blue-500'
                : 'bg-gray-700 hover:bg-gray-600'
            )}
          >
            <div
              className={cn(
                'mt-0.5 h-5 w-5 rounded-full border-2 flex items-center justify-center flex-shrink-0',
                requestType === 'SPECIFIC_TOPIC' ? 'border-blue-400' : 'border-gray-500'
              )}
            >
              {requestType === 'SPECIFIC_TOPIC' && (
                <div className="h-2.5 w-2.5 rounded-full bg-blue-400" />
              )}
            </div>
            <div>
              <div className="font-medium text-white mb-1">Something specific</div>
              <div className="text-sm text-gray-400">
                Tell us what you'd like to learn about
              </div>
            </div>
          </button>
        </div>

        {/* Optional message input */}
        {requestType === 'SPECIFIC_TOPIC' && (
          <div className="mb-4">
            <label htmlFor="request-message" className="block text-sm font-medium text-gray-300 mb-2">
              What would you like to see? <span className="text-red-400">*</span>
            </label>
            <textarea
              id="request-message"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., More videos about dinosaurs, space exploration, art projects..."
              rows={3}
              className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={500}
            />
            <div className="mt-1 text-xs text-gray-400 text-right">
              {message.length}/500
            </div>
          </div>
        )}

        {requestType === 'MORE_LIKE_THIS' && (
          <div className="mb-4">
            <label htmlFor="request-message-optional" className="block text-sm font-medium text-gray-300 mb-2">
              Anything else we should know? <span className="text-gray-500">(optional)</span>
            </label>
            <textarea
              id="request-message-optional"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="e.g., I really liked the animations, I want to learn more about..."
              rows={2}
              className="w-full rounded-lg bg-gray-700 px-4 py-3 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              maxLength={500}
            />
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={handleSubmit}
            disabled={isSubmitting || (requestType === 'SPECIFIC_TOPIC' && !message.trim())}
            className="flex-1 rounded-lg bg-blue-600 px-4 py-3 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isSubmitting ? 'Sending...' : 'Send Request'}
          </button>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="rounded-lg bg-gray-700 px-4 py-3 text-sm font-medium text-gray-300 hover:bg-gray-600 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
