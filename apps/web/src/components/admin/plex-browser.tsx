'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Film, Tv, Search, Loader2, CheckCircle, AlertCircle,
  ChevronLeft, ChevronRight, Plus, ListPlus, ChevronRight as Arrow,
} from 'lucide-react';

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
  grandparentRatingKey?: string;
  grandparentTitle?: string;
  parentTitle?: string;
  index?: number;
  parentIndex?: number;
  partKey?: string;
}

interface PlexSeason {
  ratingKey: string;
  title: string;
  parentTitle: string;
  index: number;
  leafCount: number;
  thumbUrl: string | null;
}

type ImportState = 'idle' | 'loading' | 'imported' | 'error';
type ViewMode = 'library' | 'seasons' | 'episodes';

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

// ─── Movie card (poster aspect ratio) ──────────────────────────────────────

function MovieCard({ item, onImport }: { item: PlexItem; onImport: (item: PlexItem) => Promise<void> }) {
  const [state, setState] = useState<ImportState>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handle = async () => {
    setState('loading');
    try { await onImport(item); setState('imported'); }
    catch (err) { setErrorMsg(err instanceof Error ? err.message : 'Failed'); setState('error'); }
  };

  return (
    <div className="rounded-lg bg-white border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="relative aspect-[2/3] bg-gray-100 flex-shrink-0">
        {item.thumbUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300"><Film className="w-8 h-8" /></div>}
        {item.contentRating && (
          <span className="absolute top-2 right-2 rounded px-1.5 py-0.5 text-xs font-bold bg-black/60 text-white">
            {item.contentRating}
          </span>
        )}
      </div>
      <div className="p-3 flex flex-col gap-2 flex-1">
        <div>
          <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{item.title}</p>
          {item.year && <p className="text-xs text-gray-400 mt-0.5">{item.year}</p>}
          {item.duration && <p className="text-xs text-gray-400">{formatDuration(item.duration)}</p>}
        </div>
        {state === 'error' && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{errorMsg}</p>}
        <button
          onClick={handle}
          disabled={state === 'loading' || state === 'imported'}
          className={`mt-auto w-full rounded-lg px-3 py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
            state === 'imported' ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
            : state === 'error' ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
            : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
          }`}
        >
          {state === 'loading' ? <><Loader2 className="w-3 h-3 animate-spin" />Adding...</>
            : state === 'imported' ? <><CheckCircle className="w-3 h-3" />Added for Review</>
            : state === 'error' ? <>Retry</>
            : <><Plus className="w-3 h-3" />Add to Library</>}
        </button>
      </div>
    </div>
  );
}

// ─── Show card (navigates into seasons) ────────────────────────────────────

function ShowCard({ item, onClick }: { item: PlexItem; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="rounded-lg bg-white border border-gray-200 overflow-hidden hover:shadow-md hover:border-orange-300 transition-all flex flex-col text-left group"
    >
      <div className="relative aspect-[2/3] bg-gray-100 flex-shrink-0">
        {item.thumbUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={item.thumbUrl} alt={item.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300"><Tv className="w-8 h-8" /></div>}
        {item.contentRating && (
          <span className="absolute top-2 right-2 rounded px-1.5 py-0.5 text-xs font-bold bg-black/60 text-white">
            {item.contentRating}
          </span>
        )}
        <div className="absolute inset-0 bg-orange-500/0 group-hover:bg-orange-500/10 transition-colors flex items-center justify-center">
          <Arrow className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity drop-shadow-lg" />
        </div>
      </div>
      <div className="p-3">
        <p className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">{item.title}</p>
        {item.year && <p className="text-xs text-gray-400 mt-0.5">{item.year}</p>}
        <p className="text-xs text-orange-500 mt-1 font-medium">Browse episodes →</p>
      </div>
    </button>
  );
}

// ─── Season row ─────────────────────────────────────────────────────────────

function SeasonRow({ season, onClick }: { season: PlexSeason; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-4 p-4 rounded-lg bg-white border border-gray-200 hover:border-orange-300 hover:shadow-sm transition-all text-left group"
    >
      <div className="w-14 h-14 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden">
        {season.thumbUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={season.thumbUrl} alt={season.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300"><Tv className="w-6 h-6" /></div>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-gray-900">{season.title}</p>
        <p className="text-xs text-gray-500 mt-0.5">{season.leafCount} episode{season.leafCount !== 1 ? 's' : ''}</p>
      </div>
      <Arrow className="w-4 h-4 text-gray-400 group-hover:text-orange-500 transition-colors flex-shrink-0" />
    </button>
  );
}

// ─── Episode row ─────────────────────────────────────────────────────────────

function EpisodeRow({
  episode,
  onImport,
  importedKeys,
}: {
  episode: PlexItem;
  onImport: (item: PlexItem) => Promise<void>;
  importedKeys: Set<string>;
}) {
  const alreadyImported = importedKeys.has(episode.ratingKey);
  const [state, setState] = useState<ImportState>(alreadyImported ? 'imported' : 'idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handle = async () => {
    setState('loading');
    try { await onImport(episode); setState('imported'); }
    catch (err) { setErrorMsg(err instanceof Error ? err.message : 'Failed'); setState('error'); }
  };

  const epLabel = episode.parentIndex != null && episode.index != null
    ? `S${String(episode.parentIndex).padStart(2, '0')}E${String(episode.index).padStart(2, '0')}`
    : null;

  return (
    <div className="flex items-center gap-4 p-3 rounded-lg bg-white border border-gray-200 hover:border-gray-300 transition-colors">
      {/* Thumb */}
      <div className="w-28 h-16 rounded bg-gray-100 flex-shrink-0 overflow-hidden">
        {episode.thumbUrl
          // eslint-disable-next-line @next/next/no-img-element
          ? <img src={episode.thumbUrl} alt={episode.title} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-gray-300"><Tv className="w-5 h-5" /></div>}
      </div>
      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          {epLabel && <span className="text-xs font-mono font-bold text-orange-500 flex-shrink-0">{epLabel}</span>}
          <p className="text-sm font-semibold text-gray-900 truncate">{episode.title}</p>
        </div>
        {episode.duration && <p className="text-xs text-gray-400 mt-0.5">{formatDuration(episode.duration)}</p>}
        {episode.summary && <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{episode.summary}</p>}
        {state === 'error' && <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>}
      </div>
      {/* Action */}
      <button
        onClick={handle}
        disabled={state === 'loading' || state === 'imported'}
        className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5 transition-colors ${
          state === 'imported' ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
          : state === 'error' ? 'bg-red-50 text-red-700 border border-red-200 hover:bg-red-100'
          : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
        }`}
      >
        {state === 'loading' ? <><Loader2 className="w-3 h-3 animate-spin" />Adding...</>
          : state === 'imported' ? <><CheckCircle className="w-3 h-3" />Added</>
          : state === 'error' ? <>Retry</>
          : <><Plus className="w-3 h-3" />Add</>}
      </button>
    </div>
  );
}

// ─── Main browser ─────────────────────────────────────────────────────────

export function PlexBrowser() {
  const [libraries, setLibraries] = useState<PlexLibrary[]>([]);
  const [activeLibrary, setActiveLibrary] = useState<PlexLibrary | null>(null);

  // Library view state
  const [items, setItems] = useState<PlexItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [searchInput, setSearchInput] = useState('');

  // Drill-down state
  const [view, setView] = useState<ViewMode>('library');
  const [selectedShow, setSelectedShow] = useState<PlexItem | null>(null);
  const [selectedSeason, setSelectedSeason] = useState<PlexSeason | null>(null);
  const [seasons, setSeasons] = useState<PlexSeason[]>([]);
  const [episodes, setEpisodes] = useState<PlexItem[]>([]);
  const [importedKeys, setImportedKeys] = useState<Set<string>>(new Set());
  const [bulkAdding, setBulkAdding] = useState(false);
  const [bulkDone, setBulkDone] = useState(false);

  // Loading / error
  const [loadingLibs, setLoadingLibs] = useState(true);
  const [loadingItems, setLoadingItems] = useState(false);
  const [loadingChildren, setLoadingChildren] = useState(false);
  const [libError, setLibError] = useState<string | null>(null);
  const [itemsError, setItemsError] = useState<string | null>(null);
  const [childrenError, setChildrenError] = useState<string | null>(null);

  const LIMIT = 24;

  // Fetch libraries
  useEffect(() => {
    async function fetchLibraries() {
      try {
        const res = await fetch('/api/plex/libraries');
        if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed'); }
        const data = await res.json();
        setLibraries(data.libraries);
        if (data.libraries.length > 0) setActiveLibrary(data.libraries[0]);
      } catch (err) {
        setLibError(err instanceof Error ? err.message : 'Failed to load libraries');
      } finally {
        setLoadingLibs(false);
      }
    }
    fetchLibraries();
  }, []);

  // Fetch library items
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
    if (activeLibrary && view === 'library') {
      fetchItems(activeLibrary.key, offset, search);
    }
  }, [activeLibrary, offset, search, view, fetchItems]);

  const handleLibraryChange = (lib: PlexLibrary) => {
    setActiveLibrary(lib);
    setOffset(0);
    setSearch('');
    setSearchInput('');
    setView('library');
    setSelectedShow(null);
    setSelectedSeason(null);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearch(searchInput);
    setOffset(0);
  };

  // Drill into a show → fetch its seasons
  const handleShowClick = async (show: PlexItem) => {
    setSelectedShow(show);
    setView('seasons');
    setChildrenError(null);
    setLoadingChildren(true);
    try {
      const res = await fetch(`/api/plex/metadata/${show.ratingKey}/children`);
      if (!res.ok) throw new Error('Failed to load seasons');
      const data = await res.json();
      setSeasons(data.seasons ?? []);
    } catch (err) {
      setChildrenError(err instanceof Error ? err.message : 'Failed to load seasons');
    } finally {
      setLoadingChildren(false);
    }
  };

  // Drill into a season → fetch its episodes
  const handleSeasonClick = async (season: PlexSeason) => {
    setSelectedSeason(season);
    setView('episodes');
    setChildrenError(null);
    setLoadingChildren(true);
    setBulkDone(false);
    try {
      const res = await fetch(`/api/plex/metadata/${season.ratingKey}/children`);
      if (!res.ok) throw new Error('Failed to load episodes');
      const data = await res.json();
      setEpisodes(data.episodes ?? []);
    } catch (err) {
      setChildrenError(err instanceof Error ? err.message : 'Failed to load episodes');
    } finally {
      setLoadingChildren(false);
    }
  };

  const handleImport = async (item: PlexItem) => {
    const res = await fetch('/api/plex/import', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(item),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Import failed');
    setImportedKeys((prev) => new Set([...prev, item.ratingKey]));
  };

  const handleAddAllEpisodes = async () => {
    setBulkAdding(true);
    const remaining = episodes.filter((ep) => !importedKeys.has(ep.ratingKey));
    for (const ep of remaining) {
      try {
        await handleImport(ep);
      } catch {
        // continue — individual cards will show their own error state
      }
    }
    setBulkAdding(false);
    setBulkDone(true);
  };

  // ─── Breadcrumb ─────────────────────────────────────────────────────────
  const breadcrumb = (
    <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-4 flex-wrap">
      <button
        onClick={() => { setView('library'); setSelectedShow(null); setSelectedSeason(null); }}
        className="hover:text-orange-600 font-medium transition-colors"
      >
        {activeLibrary?.title ?? 'Library'}
      </button>
      {selectedShow && (
        <>
          <Arrow className="w-3.5 h-3.5 text-gray-300" />
          <button
            onClick={() => { setView('seasons'); setSelectedSeason(null); }}
            className={`hover:text-orange-600 transition-colors ${view === 'seasons' ? 'text-gray-900 font-semibold' : ''}`}
          >
            {selectedShow.title}
          </button>
        </>
      )}
      {selectedSeason && (
        <>
          <Arrow className="w-3.5 h-3.5 text-gray-300" />
          <span className="text-gray-900 font-semibold">{selectedSeason.title}</span>
        </>
      )}
    </div>
  );

  const totalPages = Math.ceil(totalItems / LIMIT);
  const currentPage = Math.floor(offset / LIMIT) + 1;

  // ─── Render ──────────────────────────────────────────────────────────────

  if (loadingLibs) {
    return (
      <div className="flex items-center justify-center py-16 text-gray-500">
        <Loader2 className="w-6 h-6 animate-spin mr-2" />Connecting to Plex...
      </div>
    );
  }

  if (libError) {
    return (
      <div className="rounded-lg bg-red-50 border border-red-200 p-6 text-center">
        <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2" />
        <p className="text-sm font-medium text-red-700">{libError}</p>
        <p className="text-xs text-red-600 mt-1">Make sure your Plex server is connected in Settings.</p>
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
      <div className="flex gap-2 border-b border-gray-200">
        {libraries.map((lib) => (
          <button
            key={lib.key}
            onClick={() => handleLibraryChange(lib)}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeLibrary?.key === lib.key
                ? 'border-orange-500 text-orange-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            {lib.type === 'movie'
              ? <Film className="w-4 h-4 inline mr-1.5" />
              : <Tv className="w-4 h-4 inline mr-1.5" />}
            {lib.title}
            <span className="ml-1.5 text-xs text-gray-400">({lib.count})</span>
          </button>
        ))}
      </div>

      {/* ── SEASONS VIEW ─────────────────────────────────────────────────── */}
      {view === 'seasons' && (
        <div className="space-y-3">
          {breadcrumb}
          {loadingChildren ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading seasons...
            </div>
          ) : childrenError ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{childrenError}</div>
          ) : seasons.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No seasons found</p>
          ) : (
            <div className="space-y-2">
              {seasons.map((season) => (
                <SeasonRow key={season.ratingKey} season={season} onClick={() => handleSeasonClick(season)} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── EPISODES VIEW ────────────────────────────────────────────────── */}
      {view === 'episodes' && (
        <div className="space-y-3">
          {breadcrumb}

          {/* Add All button */}
          {!loadingChildren && episodes.length > 0 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-gray-500">{episodes.length} episodes</p>
              <button
                onClick={handleAddAllEpisodes}
                disabled={bulkAdding || bulkDone}
                className={`inline-flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                  bulkDone
                    ? 'bg-green-50 text-green-700 border border-green-200 cursor-default'
                    : 'bg-orange-500 text-white hover:bg-orange-600 disabled:opacity-50'
                }`}
              >
                {bulkAdding
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Adding all...</>
                  : bulkDone
                  ? <><CheckCircle className="w-4 h-4" />All added for review</>
                  : <><ListPlus className="w-4 h-4" />Add all episodes</>}
              </button>
            </div>
          )}

          {loadingChildren ? (
            <div className="flex items-center justify-center py-12 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading episodes...
            </div>
          ) : childrenError ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{childrenError}</div>
          ) : episodes.length === 0 ? (
            <p className="text-center py-8 text-sm text-gray-400">No episodes found</p>
          ) : (
            <div className="space-y-2">
              {episodes.map((ep) => (
                <EpisodeRow
                  key={ep.ratingKey}
                  episode={ep}
                  onImport={handleImport}
                  importedKeys={importedKeys}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── LIBRARY VIEW ─────────────────────────────────────────────────── */}
      {view === 'library' && (
        <>
          {/* Search (movies and shows) */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={activeLibrary?.type === 'show' ? 'Search shows...' : 'Search movies...'}
                className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-orange-300"
              />
            </div>
            <button type="submit" className="rounded-lg bg-orange-500 px-4 py-2 text-sm font-medium text-white hover:bg-orange-600">
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

          {activeLibrary?.type === 'show' && (
            <p className="text-xs text-gray-400 -mt-2">Click a show to browse its seasons and episodes</p>
          )}

          {loadingItems ? (
            <div className="flex items-center justify-center py-16 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin mr-2" />Loading...
            </div>
          ) : itemsError ? (
            <div className="rounded-lg bg-red-50 border border-red-200 p-4 text-sm text-red-700">{itemsError}</div>
          ) : items.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-sm">
              {search ? `No results for "${search}"` : 'No items in this library'}
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
              {items.map((item) =>
                item.type === 'show' ? (
                  <ShowCard key={item.ratingKey} item={item} onClick={() => handleShowClick(item)} />
                ) : (
                  <MovieCard key={item.ratingKey} item={item} onImport={handleImport} />
                )
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="text-sm text-gray-500">Page {currentPage} of {totalPages} ({totalItems} items)</p>
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
        </>
      )}
    </div>
  );
}
