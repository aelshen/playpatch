/**
 * Magnet Link Import Form Component
 * RealDebrid Integration
 */

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useState, useEffect } from 'react';
import {
  importMagnetAction,
  previewMagnetAction,
  type ImportMagnetState,
} from '@/lib/actions/video-import';
import { useRouter } from 'next/navigation';

const initialState: ImportMagnetState = {
  error: undefined,
  success: false,
};

function SubmitButton({ disabled }: { disabled?: boolean }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending || disabled}
      className="w-full rounded-lg bg-purple-600 px-4 py-3 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? (
        <span className="flex items-center justify-center space-x-2">
          <span className="animate-spin">⏳</span>
          <span>Importing torrent...</span>
        </span>
      ) : (
        'Import Selected Files'
      )}
    </button>
  );
}

interface TorrentFile {
  id: number;
  name: string;
  size: number;
  sizeFormatted: string;
}

interface TorrentMetadata {
  hash: string;
  name: string;
  totalSize: number;
  totalSizeFormatted: string;
  files: TorrentFile[];
}

export function MagnetImportForm() {
  const router = useRouter();
  const [state, formAction] = useFormState(importMagnetAction, initialState);
  const [magnetUri, setMagnetUri] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isPreviewing, setIsPreviewing] = useState(false);
  const [metadata, setMetadata] = useState<TorrentMetadata | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<Set<number>>(new Set());

  // Track submission state
  useEffect(() => {
    if (state.success || state.error) {
      setIsSubmitting(false);
    }
  }, [state.success, state.error]);

  // Redirect on success after delay
  useEffect(() => {
    if (state.success) {
      const timer = setTimeout(() => {
        router.push('/admin/content');
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [state.success, router]);

  const handlePreview = async () => {
    if (!magnetUri.trim()) return;

    setIsPreviewing(true);
    setPreviewError(null);
    setMetadata(null);

    try {
      const result = await previewMagnetAction(magnetUri);

      if (result.error) {
        setPreviewError(result.error);
      } else if (result.metadata) {
        setMetadata(result.metadata);
        // Select all video files by default
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.webm', '.flv'];
        const videoFiles = result.metadata.files.filter((f) =>
          videoExtensions.some((ext) => f.name.toLowerCase().endsWith(ext))
        );
        setSelectedFiles(new Set(videoFiles.map((f) => f.id)));
      }
    } catch (error) {
      setPreviewError('Failed to preview magnet link. Please try again.');
    } finally {
      setIsPreviewing(false);
    }
  };

  const toggleFileSelection = (fileId: number) => {
    const newSelection = new Set(selectedFiles);
    if (newSelection.has(fileId)) {
      newSelection.delete(fileId);
    } else {
      newSelection.add(fileId);
    }
    setSelectedFiles(newSelection);
  };

  const selectAll = () => {
    if (metadata) {
      setSelectedFiles(new Set(metadata.files.map((f) => f.id)));
    }
  };

  const selectNone = () => {
    setSelectedFiles(new Set());
  };

  const handleSubmit = (formData: FormData) => {
    if (selectedFiles.size === 0) {
      setPreviewError('Please select at least one file to import');
      return;
    }

    formData.append('magnetUri', magnetUri);
    formData.append('selectedFiles', JSON.stringify(Array.from(selectedFiles)));

    setIsSubmitting(true);
    formAction(formData);
  };

  return (
    <form action={handleSubmit} className="space-y-6">
      {/* Progress Indicator */}
      {isSubmitting && !state.success && !state.error && (
        <div className="rounded-lg bg-purple-50 border-2 border-purple-200 p-6">
          <div className="flex items-start space-x-4">
            <div className="text-3xl animate-spin">⏳</div>
            <div className="flex-1">
              <h3 className="font-semibold text-purple-900 mb-2">Importing from RealDebrid...</h3>
              <div className="space-y-2 text-sm text-purple-800">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Validating magnet link</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Adding to RealDebrid</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse"></div>
                  <span>Creating video records</span>
                </div>
              </div>
              <p className="text-xs text-purple-600 mt-3">
                This may take 10-30 seconds
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
                {state.message || 'Torrent files have been added to your library'}
              </p>
              <div className="bg-green-100 rounded-lg p-3 text-sm text-green-800">
                <p className="font-medium mb-1">What happens next:</p>
                <ul className="space-y-1 text-xs">
                  <li>• Video records have been created (no download yet)</li>
                  <li>• Review and approve the videos in the approval queue</li>
                  <li>• After approval, RealDebrid will download the torrent</li>
                  <li>• We'll then fetch the files via HTTPS and process them</li>
                </ul>
                <p className="mt-2 text-xs font-medium">💡 No torrent client needed - downloads via HTTPS!</p>
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

      {/* Preview Error */}
      {previewError && (
        <div className="rounded-lg bg-red-50 p-4">
          <div className="flex items-center">
            <div className="text-2xl mr-3">❌</div>
            <div>
              <h3 className="font-semibold text-red-900">Preview Error</h3>
              <p className="text-sm text-red-700">{previewError}</p>
            </div>
          </div>
        </div>
      )}

      {/* Magnet URI Input */}
      <div>
        <label htmlFor="magnetUri" className="block text-sm font-medium text-gray-700 mb-2">
          Magnet Link
        </label>
        <div className="flex space-x-2">
          <input
            type="text"
            id="magnetUri"
            value={magnetUri}
            onChange={(e) => setMagnetUri(e.target.value)}
            placeholder="magnet:?xt=urn:btih:..."
            required
            className="flex-1 rounded-lg border border-gray-300 px-4 py-3 focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500"
          />
          <button
            type="button"
            onClick={handlePreview}
            disabled={isPreviewing || !magnetUri.trim()}
            className="rounded-lg bg-purple-600 px-6 py-3 font-medium text-white hover:bg-purple-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isPreviewing ? (
              <span className="flex items-center space-x-2">
                <span className="animate-spin">⏳</span>
                <span>Loading...</span>
              </span>
            ) : (
              'Preview Files'
            )}
          </button>
        </div>
        <p className="mt-2 text-sm text-gray-600">
          Paste a magnet link to preview available files
        </p>
      </div>

      {/* File Selection */}
      {metadata && (
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-6">
          <div className="mb-4">
            <h3 className="font-semibold text-purple-900 mb-1">Torrent: {metadata.name}</h3>
            <p className="text-sm text-purple-700">
              Total size: {metadata.totalSizeFormatted} • {metadata.files.length} files
            </p>
          </div>

          <div className="mb-4 flex items-center justify-between">
            <h4 className="font-medium text-purple-900">Select files to import:</h4>
            <div className="space-x-2">
              <button
                type="button"
                onClick={selectAll}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Select All
              </button>
              <span className="text-gray-400">|</span>
              <button
                type="button"
                onClick={selectNone}
                className="text-sm text-purple-600 hover:text-purple-800"
              >
                Select None
              </button>
            </div>
          </div>

          <div className="space-y-2 max-h-96 overflow-y-auto">
            {metadata.files.map((file) => (
              <label
                key={file.id}
                className="flex items-start space-x-3 rounded-lg bg-white p-3 cursor-pointer hover:bg-purple-50 transition-colors"
              >
                <input
                  type="checkbox"
                  checked={selectedFiles.has(file.id)}
                  onChange={() => toggleFileSelection(file.id)}
                  className="mt-1"
                />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{file.name}</p>
                  <p className="text-sm text-gray-600">{file.sizeFormatted}</p>
                </div>
              </label>
            ))}
          </div>

          <div className="mt-4 rounded-lg bg-purple-100 p-3 text-sm text-purple-800">
            <p className="font-medium">{selectedFiles.size} file(s) selected</p>
          </div>
        </div>
      )}

      {/* Submit Button */}
      {metadata && <SubmitButton disabled={selectedFiles.size === 0} />}

      {/* Help Text */}
      <div className="rounded-lg bg-purple-50 p-4">
        <h4 className="font-medium text-purple-900 mb-2">How it works:</h4>
        <ul className="space-y-1 text-sm text-purple-800">
          <li>1. Paste a magnet link and click "Preview Files"</li>
          <li>2. Select which files you want to import</li>
          <li>3. RealDebrid downloads the torrent on their servers</li>
          <li>4. We fetch the files via HTTPS (no torrent client needed!)</li>
          <li>5. Review and approve before making available to children</li>
        </ul>
      </div>

      {/* Magnet Link Info */}
      <div className="rounded-lg border border-gray-200 p-4">
        <h4 className="font-medium text-gray-900 mb-2">Where to get magnet links:</h4>
        <ul className="space-y-1 text-sm text-gray-600">
          <li>• Public torrent sites (ensure content is legal in your jurisdiction)</li>
          <li>• Educational content archives</li>
          <li>• Creative Commons video repositories</li>
        </ul>
      </div>

      {/* Requirements */}
      <div className="rounded-lg border border-yellow-200 bg-yellow-50 p-4">
        <h4 className="font-medium text-yellow-900 mb-2">⚠️ Requirements:</h4>
        <ul className="space-y-1 text-sm text-yellow-800">
          <li>• RealDebrid premium account required (API key configured)</li>
          <li>• Only download content you have rights to access</li>
          <li>• Large files may take time to download on RealDebrid's servers</li>
          <li>• Respect copyright and local laws</li>
        </ul>
      </div>
    </form>
  );
}
