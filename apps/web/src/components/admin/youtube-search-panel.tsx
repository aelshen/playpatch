/**
 * YouTube Search Panel
 * Allows admins to search YouTube and import videos directly into the library.
 * Supports prefilled queries (for interest-driven discovery) and age rating scoping.
 */

'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchResult {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  duration: number;
  thumbnailUrl: string;
  description: string;
  uploadDate: string;
  viewCount: number;
  url: string;
}

interface YoutubeSearchPanelProps {
  prefilledQuery?: string;
  ageRating?: string;
}

function formatDuration(seconds: number): string {
  if (seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${m}:${String(s).padStart(2, '0')}`;
}

function formatViewCount(count: number): string {
  if (count >= 1_000_000_000) return `${(count / 1_000_000_000).toFixed(1)}B views`;
  if (count >= 1_000_000) return `${(count / 1_000_000).toFixed(1)}M views`;
  if (count >= 1_000) return `${(count / 1_000).toFixed(1)}K views`;
  return `${count} views`;
}

function formatAgeRating(ageRating: string): string {
  return ageRating.replace(/_/g, ' ').replace('AGE ', 'Age ');
}

async function importVideo(url: string): Promise<{ success: boolean; error?: string }> {
  const res = await fetch('/api/youtube/import', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url }),
  });
  const data = await res.json();
  if (!res.ok) return { success: false, error: data.error ?? 'Import failed' };
  return { success: true };
}

export function YoutubeSearchPanel({ prefilledQuery, ageRating }: YoutubeSearchPanelProps) {
  const [query, setQuery] = useState(prefilledQuery ?? '');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [importingIds, setImportingIds] = useState<Set<string>>(new Set());
  const [importedIds, setImportedIds] = useState<Set<string>>(new Set());
  const [importErrors, setImportErrors] = useState<Record<string, string>>({});
  const didAutoSearch = useRef(false);

  const runSearch = async (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;

    setIsSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({ q: trimmed, limit: '10' });
      if (ageRating) params.set('ageRating', ageRating);

      const res = await fetch(`/api/youtube/search?${params.toString()}`);
      const data = await res.json();

      if (!res.ok) {
        setError(data.error ?? 'Search failed. Please try again.');
        setResults([]);
      } else {
        setResults(data.results ?? []);
      }
    } catch {
      setError('Network error. Please check your connection and try again.');
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search on mount if prefilledQuery is provided
  useEffect(() => {
    if (prefilledQuery && !didAutoSearch.current) {
      didAutoSearch.current = true;
      runSearch(prefilledQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    runSearch(query);
  };

  const handleImport = async (result: SearchResult) => {
    const { videoId, url } = result;

    setImportingIds((prev) => new Set(prev).add(videoId));
    setImportErrors((prev) => {
      const next = { ...prev };
      delete next[videoId];
      return next;
    });

    const outcome = await importVideo(url);

    setImportingIds((prev) => {
      const next = new Set(prev);
      next.delete(videoId);
      return next;
    });

    if (outcome.success) {
      setImportedIds((prev) => new Set(prev).add(videoId));
    } else {
      setImportErrors((prev) => ({ ...prev, [videoId]: outcome.error ?? 'Import failed' }));
    }
  };

  return (
    <div className="space-y-6">
      {/* Search Bar */}
      <form onSubmit={handleSearch} className="flex gap-3">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search YouTube for videos..."
          className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-gray-900 placeholder-gray-400 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        />
        <button
          type="submit"
          disabled={isSearching || !query.trim()}
          className="rounded-lg bg-blue-600 px-6 py-2.5 font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
        >
          {isSearching ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Age rating badge */}
      {ageRating && (
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-blue-100 px-3 py-1 text-sm font-medium text-blue-800">
            Results filtered for {formatAgeRating(ageRating)}
          </span>
        </div>
      )}

      {/* Loading spinner */}
      {isSearching && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
          <span className="ml-3 text-gray-600">Searching YouTube...</span>
        </div>
      )}

      {/* Search error */}
      {error && !isSearching && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Empty state — before any search */}
      {!isSearching && !hasSearched && !error && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <div className="mb-3 text-4xl">▶️</div>
          <p className="text-gray-600">
            Search for videos to add to your library. Results are filtered for children but require
            your approval before going live.
          </p>
        </div>
      )}

      {/* No results */}
      {!isSearching && hasSearched && results.length === 0 && !error && (
        <div className="rounded-lg border border-gray-200 bg-gray-50 px-6 py-12 text-center">
          <p className="text-gray-600">No results found. Try a different search term.</p>
        </div>
      )}

      {/* Results grid */}
      {!isSearching && results.length > 0 && (
        <div className="space-y-4">
          {results.map((result) => {
            const isImporting = importingIds.has(result.videoId);
            const isImported = importedIds.has(result.videoId);
            const importError = importErrors[result.videoId];

            return (
              <div
                key={result.videoId}
                className="flex gap-4 rounded-lg bg-white p-4 shadow transition-shadow hover:shadow-md"
              >
                {/* Thumbnail */}
                <div className="flex-shrink-0">
                  <img
                    src={result.thumbnailUrl}
                    alt={result.title}
                    width={120}
                    className="aspect-video w-[120px] rounded-lg object-cover"
                  />
                </div>

                {/* Info */}
                <div className="min-w-0 flex-1">
                  <h3 className="mb-1 line-clamp-2 font-semibold leading-snug text-gray-900">
                    {result.title}
                  </h3>
                  <p className="mb-2 text-sm text-gray-500">{result.channelName}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <span>{formatDuration(result.duration)}</span>
                    <span>&middot;</span>
                    <span>{formatViewCount(result.viewCount)}</span>
                  </div>

                  {/* Import error */}
                  {importError && (
                    <p className="mt-2 text-xs text-red-600">{importError}</p>
                  )}
                </div>

                {/* Import button */}
                <div className="flex flex-shrink-0 items-start">
                  {isImported ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg bg-green-100 px-4 py-2 text-sm font-medium text-green-700">
                      <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path
                          fillRule="evenodd"
                          d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Imported!
                    </span>
                  ) : (
                    <button
                      onClick={() => handleImport(result)}
                      disabled={isImporting}
                      className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                    >
                      {isImporting ? 'Importing...' : 'Import'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
