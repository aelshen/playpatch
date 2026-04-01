/**
 * Import Tabs Component
 * Switches between YouTube and RealDebrid import forms
 */

'use client';

import { useState } from 'react';
import { ImportForm } from './import-form';
import { MagnetImportForm } from './magnet-import-form';
import { useRouter, useSearchParams } from 'next/navigation';

interface ImportTabsProps {
  defaultSource?: string;
}

export function ImportTabs({ defaultSource = 'youtube' }: ImportTabsProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState<'youtube' | 'realdebrid'>(
    defaultSource === 'realdebrid' ? 'realdebrid' : 'youtube'
  );

  const switchTab = (tab: 'youtube' | 'realdebrid') => {
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
            <span>YouTube</span>
          </span>
        </button>
        <button
          onClick={() => switchTab('realdebrid')}
          className={`px-6 py-3 font-medium border-b-2 transition-colors ${
            activeTab === 'realdebrid'
              ? 'border-purple-600 text-purple-600'
              : 'border-transparent text-gray-600 hover:text-gray-900'
          }`}
        >
          <span className="flex items-center space-x-2">
            <span>🧲</span>
            <span>RealDebrid</span>
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
        ) : (
          <>
            <div className="mb-6 text-center">
              <div className="mb-4 text-6xl">🧲</div>
              <h2 className="mb-2 text-2xl font-bold text-gray-900">
                Import from RealDebrid
              </h2>
              <p className="text-gray-600">
                Add content via magnet links - no torrent client needed!
              </p>
            </div>
            <MagnetImportForm />
          </>
        )}
      </div>

      {/* Info Section */}
      <div className="grid gap-4 md:grid-cols-2">
        <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
          <h3 className="font-semibold text-blue-900 mb-2">📺 YouTube Import</h3>
          <ul className="space-y-1 text-sm text-blue-800">
            <li>• Perfect for educational channels</li>
            <li>• Single video imports</li>
            <li>• Automatic metadata extraction</li>
            <li>• Fast and reliable</li>
          </ul>
        </div>
        <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
          <h3 className="font-semibold text-purple-900 mb-2">🧲 RealDebrid Import</h3>
          <ul className="space-y-1 text-sm text-purple-800">
            <li>• Multi-file torrents supported</li>
            <li>• No torrent client needed</li>
            <li>• Downloads via HTTPS</li>
            <li>• Great for series and collections</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
