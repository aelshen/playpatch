'use client';

/**
 * Child-Friendly Search Bar
 * Simple search interface for kids
 */

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Search, X } from 'lucide-react';

interface ChildSearchBarProps {
  mode: 'toddler' | 'explorer';
  initialQuery?: string;
}

export function ChildSearchBar({ mode, initialQuery = '' }: ChildSearchBarProps) {
  const [query, setQuery] = useState(initialQuery);
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      const basePath = mode === 'toddler' ? '/child/toddler' : '/child/explorer';
      router.push(`${basePath}/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const handleClear = () => {
    setQuery('');
  };

  const placeholderText = mode === 'toddler'
    ? 'Find a video...'
    : 'Search for videos...';

  return (
    <form onSubmit={handleSearch} className="w-full">
      <div className="relative">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
          <Search className={`${mode === 'toddler' ? 'w-6 h-6' : 'w-5 h-5'} text-gray-400`} />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholderText}
          className={`w-full rounded-full border-2 border-gray-300 bg-white py-3 pl-12 pr-12 text-gray-900 placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            mode === 'toddler' ? 'text-xl' : 'text-base'
          }`}
        />
        {query && (
          <button
            type="button"
            onClick={handleClear}
            className="absolute inset-y-0 right-0 flex items-center pr-4 text-gray-400 hover:text-gray-600"
          >
            <X className={mode === 'toddler' ? 'w-6 h-6' : 'w-5 h-5'} />
          </button>
        )}
      </div>
    </form>
  );
}
