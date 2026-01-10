/**
 * Video Import Form Component
 * SSK-037: YouTube Video Import
 */

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import { importYouTubeVideoAction, type ImportVideoState } from '@/lib/actions/video-import';
import { useRouter } from 'next/navigation';

const initialState: ImportVideoState = {
  error: undefined,
  success: false,
};

function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-3 font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center justify-center space-x-2">
          <span className="animate-spin">⏳</span>
          <span>Importing video...</span>
        </span>
      ) : (
        'Import Video'
      )}
    </button>
  );
}

export function ImportForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(importYouTubeVideoAction, initialState);
  const [url, setUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Track submission state
  useEffect(() => {
    if (state.success || state.error) {
      setIsSubmitting(false);
    }
  }, [state.success, state.error]);

  // Redirect on success after longer delay
  useEffect(() => {
    if (state.success && state.videoId) {
      // Show success message for 5 seconds before redirecting
      const timer = setTimeout(() => {
        router.push('/admin/content');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.success, state.videoId, router]);

  const handleSubmit = (formData: FormData) => {
    setIsSubmitting(true);
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Progress Indicator */}
      {isSubmitting && !state.success && !state.error && (
        <div className="rounded-lg bg-blue-50 border-2 border-blue-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="text-3xl animate-spin">⏳</div>
            <div className="flex-1">
              <h3 className="font-semibold text-blue-900 mb-2">Importing your video...</h3>
              <div className="space-y-2 text-sm text-blue-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Validating YouTube URL</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Fetching video metadata</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Creating video record</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                  <span>Queuing download job</span>
                </div>
              </div>
              <p className="text-xs text-blue-600 mt-3">
                This may take 10-30 seconds depending on video size
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Success Message */}
      {state.success && (
        <div className="rounded-lg bg-green-50 border-2 border-green-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="text-3xl">✅</div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">Import Started Successfully!</h3>
              <p className="text-sm text-green-700 mb-3">
                {state.message || 'Video has been added to your library and queued for download'}
              </p>
              <div className="bg-green-100 rounded-lg p-3 text-sm text-green-800">
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Video metadata has been imported (no download yet)</li>
                  <li>• Review and approve the video in the approval queue</li>
                  <li>• After approval, the video will be downloaded automatically</li>
                  <li>• Once downloaded and processed, it will be available for viewing</li>
                </ul>
                <p className="mt-2 text-xs font-medium">💡 Videos are only downloaded after approval to save bandwidth!</p>
              </div>
              <p className="text-xs text-green-600 mt-3 font-medium">
                Redirecting to content library in 5 seconds...
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Error Message */}
      {state.error && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">❌</div>
            <div>
              <h3 className="font-semibold text-red-900">Error</h3>
              <p className="text-sm text-red-700">{state.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* URL Input */}
      <div>
        <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
          YouTube Video URL
        </label>
        <input
          type="url"
          id="url"
          name="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="https://www.youtube.com/watch?v=..."
          required
          className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <p className="mt-2 text-sm text-gray-600">
          Paste a YouTube video URL to import it to your library
        </p>
      </div>

      {/* Submit Button */}
      <SubmitButton />

      {/* Help Text */}
      <div className="rounded-lg bg-blue-50 p-4">
        <h4 className="font-medium text-blue-900 mb-2">How it works:</h4>
        <ul className="space-y-1 text-sm text-blue-800">
          <li>1. Paste a YouTube video URL</li>
          <li>2. We'll extract the video information</li>
          <li>3. Video will be queued for download</li>
          <li>4. Once processed, it will appear in your library</li>
          <li>5. Review and approve it before it's available to children</li>
        </ul>
      </div>

      {/* Supported URLs */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-2">Supported URL formats:</h4>
        <ul className="space-y-1 text-sm text-gray-600 font-mono">
          <li>• https://www.youtube.com/watch?v=VIDEO_ID</li>
          <li>• https://youtu.be/VIDEO_ID</li>
        </ul>
      </div>

      {/* Requirements */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Requirements:</h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• Video must be publicly accessible</li>
          <li>• Age-restricted videos cannot be imported</li>
          <li>• Private or unlisted videos are not supported</li>
          <li>• Make sure you have permission to download the video</li>
        </ul>
      </div>
    </form>
  );
}
