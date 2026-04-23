/**
 * Import Tabs Component
 * Switches between YouTube and Plex import forms
 */

'use client';

import { useState } from 'react';
import { ImportForm } from './import-form';
import { YoutubeSearchPanel } from './youtube-search-panel';
import { PlexBrowser } from './plex-browser';
import { useRouter, useSearchParams } from 'next/navigation';

interface ImportTabsProps {
  defaultSource?: string;
  prefilledQuery?: string;
  ageRating?: string;
}

export function ImportTabs({ defaultSource = 'youtube', prefilledQuery, ageRating }: ImportTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const getDefaultTab = () => {
    if (defaultSource === 'search' || prefilledQuery) return 'search';
    if (defaultSource === 'plex') return 'plex';
    return 'youtube';
  };

  const [activeTab, setActiveTab] = useState<'youtube' | 'search' | 'plex'>(
    getDefaultTab()
  );

  const switchTab = (tab: 'youtube' | 'search' | 'plex') => {
    setActiveTab(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('source', tab);
    router.push(`/admin/content/import?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-6">
      {/* Tab Switcher */}
      <div className="flex space-x-2 border-b border-gray-200">
        <button
          onClick={() => switchTab('youtube')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'youtube'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>▶️</span>
            <span>YouTube URL</span>
          </span>
        </button>
        <button
          onClick={() => switchTab('search')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'search'
              ? 'border-green-600 text-green-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>🔍</span>
            <span>Search YouTube</span>
          </span>
        </button>
        <button
          onClick={() => switchTab('plex')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'plex'
              ? 'border-orange-500 text-orange-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>🎬</span>
            <span>Plex</span>
          </span>
        </button>
      </div>

      {/* Tab Content */}
      <div className="rounded-lg bg-white p-8 shadow">
        {activeTab === 'youtube' ? (
          <>
            <div className="mb-6 text-center">
              <div className="mb-4 text-6xl">▶️</div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Import from YouTube
              </h2>
              <p className="text-gray-600">
                Add educational and entertaining content from YouTube
              </p>
            </div>
            <ImportForm />
          </>
        ) : activeTab === 'search' ? (
          <>
            <div className="mb-6 text-center">
              <div className="mb-4 text-6xl">🔍</div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Search YouTube
              </h2>
              <p className="text-gray-600">
                Find content by topic and import directly to your library
              </p>
            </div>
            <YoutubeSearchPanel prefilledQuery={prefilledQuery} ageRating={ageRating} />
          </>
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mb-4 text-6xl">🎬</div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Browse Plex Library
              </h2>
              <p className="text-gray-600">
                Import movies and TV shows from your local Plex server
              </p>
            </div>
            <PlexBrowser />
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="grid gap-4 md:grid-cols-3">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900 mb-2">▶️ YouTube URL</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Paste a direct video URL</li>
            <li>• Single video imports</li>
            <li>• Automatic metadata extraction</li>
            <li>• Fast and reliable</li>
          </ul>
        </div>
        <div className="rounded-lg border border-green-200 bg-green-50 p-4">
          <h3 className="font-semibold text-green-900 mb-2">🔍 Search YouTube</h3>
          <ul className="space-y-1 text-sm text-green-800">
            <li>• Search by topic or keyword</li>
            <li>• Browse results before importing</li>
            <li>• Age-scoped search results</li>
            <li>• Import multiple at once</li>
          </ul>
        </div>
        <div className="rounded-lg border border-orange-200 bg-orange-50 p-4">
          <h3 className="font-semibold text-orange-900 mb-2">🎬 Plex Library</h3>
          <ul className="space-y-1 text-sm text-orange-800">
            <li>• Browse your local Plex server</li>
            <li>• Import movies & TV episodes</li>
            <li>• Parent review before kids watch</li>
            <li>• Streams directly from Plex</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
