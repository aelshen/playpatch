'use client';

import { useState, useEffect, useCallback } from 'react';
import { Film, Tv, Search, Loader2, CheckCircle, AlertCircle, ChevronLeft, ChevronRight, Plus } from 'lucide-react';

interface PlexLibrary {
  key: string;
  title: string;
  type: string;
  count: number;
}

interface PlexItem {
  ratingKey: string;
  title: string;
  type: string;
  summary: string | null;
  year: number | null;
  contentRating: string | null;
  duration: number | null;
  thumbUrl: string | null;
  grandparentTitle?: string;
  parentTitle?: string;
  index?: number;
  parentIndex?: number;
  partKey?: string;
}

type ImportState = 'idle' | 'loading' | 'imported' | 'error';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function PlexItemCard({
  item,
  onImport,
}: {
  item: PlexItem;
  onImport: (item: PlexItem) => Promise<void>;
}) {
  const [state, setState] = useState<ImportState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleImport = async () => {
    setState('loading');
    try {
      await onImport(item);
      setState('imported');
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Import failed');
      setState('error');
    }
  };

  const subtitle = item.type === 'episode'
    ? [item.grandparentTitle, item.parentTitle && `S${item.parentIndex}E${item.index}`].filter(Boolean).join(' · ')
    : item.year?.toString() ?? '';

  return (
    <div className="rounded-lg bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      {/* Thumbnail */}
      <div className="relative aspect-[2/3] bg-gray-100 flex-shrink-0">
        {item.thumbUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-gray-300">
            {item.type === 'episode' ? <Tv className="w-8 h-8" /> : <Film className="w-8 h-8" />}
          </div>
        )}
        {item.contentRating && (
          <span className="absolute top-2 right-2 rounded px-1.5 py-0.5 text-xs font-bold bg-black/60 text-white">
            {item.contentRating}
          </span>
        )}
      </div>

      {/* Info */}
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{item.title}</p>
          {subtitle && <p className="text-xs text-gray-500 mt-0.5">{subtitle}</p>}
          {item.duration && (
            <p className="text-xs text-gray-400 mt-0.5">{formatDuration(item.duration)}</p>
          )}
        </div>

        {state === 'error' && (
          <p className="text-xs text-red-600 flex items-center gap-1">
            <AlertCircle className="w-3 h-3" /> {errorMsg}
          </p>
        )}

        <button
          onClick={handleImport}
          disabled={state === 'loading' || state === 'imported'}
          className={`mt-auto w-full rounded-lg px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            state === 'imported'
              ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
              : state === 'error'
              ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
              : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
          }`}
        >
          {state === 'loading' ? (
            <><Loader2 className="w-3 h-3 animate-spin" /> Adding...</>
          ) : state === 'imported' ? (
            <><CheckCircle className="w-3 h-3" /> Added for Review</>
          ) : state === 'error' ? (
            <>Retry</>
          ) : (
            <><Plus className="w-3 h-3" /> Add to Library</>
          )}
        </button>
      </div>
    </div>
  );
}

export function PlexBrowser() {
  const [libraries, setLibraries] = useState<PlexLibrary[]>([]);
  const [activeKey, setActiveKey] = useState<string | null>(null);
  const [items, setItems] = useState<PlexItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [loadingLibs, setLoadingLibs] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [libError, setLibError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);

  const LIMIT = 24;

  // Fetch libraries on mount
  useEffect(() => {
    async function fetchLibraries() {
      try {
        const res = await fetch('/api/plex/libraries');
        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || 'Failed to load libraries');
        }
        const data = await res.json();
        setLibraries(data.libraries);
        if (data.libraries.length > 0) setActiveKey(data.libraries[0].key);
      } catch (err) {
        setLibError(err instanceof Error ? err.message : 'Failed to load libraries');
      } finally {
        setLoadingLibs(false);
      }
    }
    fetchLibraries();
  }, []);

  // Fetch items when library or pagination changes
  const fetchItems = useCallback(async (key: string, currentOffset: number, currentSearch: string) => {
    setLoadingItems(true);
    setItemsError(null);
    try {
      const params = new URLSearchParams({ offset: String(currentOffset), limit: String(LIMIT) });
      if (currentSearch) params.set('q', currentSearch);
      const res = await fetch(`/api/plex/libraries/${key}/items?${params}`);
      if (!res.ok) throw new Error('Failed to load items');
      const data = await res.json();
      setItems(data.items);
      setTotalItems(data.totalItems);
    } catch (err) {
      setItemsError(err instanceof Error ? err.message : 'Failed to load items');
    } finally {
      setLoadingItems(false);
    }
  }, []);

  useEffect(() => {
    if (activeKey) fetchItems(activeKey, offset, search);
  }, [activeKey, offset, search, fetchItems]);

  const handleLibraryChange = (key: string) => {
    setActiveKey(key);
    setOffset(0);
    setSearch('');
    setSearchInput('');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setOffset(0);
  };

  const handleImport = async (item: PlexItem) => {
    const res = await fetch('/api/plex/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Import failed');
  };

  const totalPages = Math.ceil(totalItems / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  if (loadingLibs) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />
        Connecting to Plex...
      </div>
    );
  }

  if (libError) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-red-700">{libError}</p>
        <p className="text-xs text-red-600 mt-1">
          Make sure your Plex server is connected in Settings.
        </p>
      </div>
    );
  }

  if (libraries.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Film className="w-10 h-10 mx-auto mb-3 text-gray-300" />
        <p className="text-sm">No movie or TV libraries found on your Plex server.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Library tabs */}
      <div className="flex gap-2 border-b border-gray-200 pb-0">
        {libraries.map((lib) => (
          <button
            key={lib.key}
            onClick={() => handleLibraryChange(lib.key)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeKey === lib.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {lib.type === 'movie' ? <Film className="w-4 h-4 inline mr-1.5" /> : <Tv className="w-4 h-4 inline mr-1.5" />}
            {lib.title}
            <span className="ml-1.5 text-xs text-gray-400">({lib.count})</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            placeholder="Search titles..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
          />
        </div>
        <button
          type="submit"
          className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600"
        >
          Search
        </button>
        {search && (
          <button
            type="button"
            onClick={() => { setSearch(''); setSearchInput(''); setOffset(0); }}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50"
          >
            Clear
          </button>
        )}
      </form>

      {/* Items grid */}
      {loadingItems ? (
        <div className="flex items-center justify-center py-16 text-gray-400">
          <Loader2 className="w-5 h-5 animate-spin mr-2" />
          Loading...
        </div>
      ) : itemsError ? (
        <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">
          {itemsError}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          {search ? `No results for "${search}"` : 'No items in this library'}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {items.map((item) => (
            <PlexItemCard key={item.ratingKey} item={item} onImport={handleImport} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <p className="text-sm text-gray-500">
            Page {currentPage} of {totalPages} ({totalItems} items)
          </p>
          <div className="flex gap-2">
            <button
              onClick={() => setOffset(Math.max(0, offset - LIMIT))}
              disabled={offset === 0}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              <ChevronLeft className="w-4 h-4" /> Previous
            </button>
            <button
              onClick={() => setOffset(offset + LIMIT)}
              disabled={offset + LIMIT >= totalItems}
              className="flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-40"
            >
              Next <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
