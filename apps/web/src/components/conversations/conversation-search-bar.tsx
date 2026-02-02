/**
 * Conversation Search Bar Component
 * Search conversations with favorite filter toggle
 */

'use client';

import { useState } from 'react';
import { Search, X, Heart } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ConversationSearchBarProps {
  mode: 'toddler' | 'explorer';
  initialQuery?: string;
  initialFavorited?: boolean;
  onSearch: (query: string, favorited: boolean) => void;
}

export function ConversationSearchBar({
  mode,
  initialQuery = '',
  initialFavorited = false,
  onSearch,
}: ConversationSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const [favorited, setFavorited] = useState(initialFavorited);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query.trim(), favorited);
  };

  const handleClear = () => {
    setQuery('');
    onSearch('', favorited);
  };

  const toggleFavorited = () => {
    const newFavorited = !favorited;
    setFavorited(newFavorited);
    onSearch(query.trim(), newFavorited);
  };

  const placeholderText = mode === 'toddler'
    ? 'Find a chat...'
    : 'Search conversations...';

  const searchIconSize = mode === 'toddler' ? 24 : 20;
  const heartIconSize = mode === 'toddler' ? 28 : 22;

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="flex gap-3">
        {/* Search input */}
        <div className="relative flex-1">
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
            <Search
              className="text-gray-400"
              size={searchIconSize}
            />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={placeholderText}
            className={cn(
              'w-full border-2 border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500',
              mode === 'toddler'
                ? 'rounded-full py-4 pl-12 pr-12 text-xl'
                : 'rounded-full py-3 pl-12 pr-12 text-base'
            )}
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
            >
              <X size={searchIconSize} />
            </button>
          )}
        </div>

        {/* Favorite filter toggle */}
        <button
          type="button"
          onClick={toggleFavorited}
          className={cn(
            'flex items-center justify-center transition-all',
            mode === 'toddler'
              ? 'rounded-full px-6 py-4 border-4'
              : 'rounded-full px-5 py-3 border-2',
            favorited
              ? 'border-red-500 bg-red-50 text-red-600'
              : 'border-gray-300 bg-white text-gray-400 hover:border-red-300 hover:text-red-400'
          )}
          aria-label={favorited ? 'Show all conversations' : 'Show only favorites'}
        >
          <Heart
            size={heartIconSize}
            className={favorited ? 'fill-red-500' : ''}
          />
        </button>
      </div>
    </form>
  );
}
