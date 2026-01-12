'use client';

/**
 * Interaction Analytics Component
 * Combined section for favorites and content requests analytics
 */

import { useState } from 'react';
import { Heart, MessageSquare } from 'lucide-react';
import { FavoritesChart } from './favorites-chart';
import { RequestBreakdown } from './request-breakdown';

interface InteractionAnalyticsProps {
  profileId: string;
  startDate: Date;
  endDate: Date;
}

export function InteractionAnalytics({
  profileId,
  startDate,
  endDate,
}: InteractionAnalyticsProps) {
  const [activeTab, setActiveTab] = useState<'favorites' | 'requests'>('favorites');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Interaction Analytics
        </h2>
        <p className="text-sm text-gray-600 mb-6">
          Track how children engage with content through favorites and requests
        </p>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab('favorites')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'favorites'
                ? 'border-pink-500 text-pink-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <Heart className="w-4 h-4" />
            Favorites
          </button>
          <button
            onClick={() => setActiveTab('requests')}
            className={`flex items-center gap-2 px-6 py-3 font-semibold text-sm transition-colors border-b-2 ${
              activeTab === 'requests'
                ? 'border-purple-500 text-purple-600'
                : 'border-transparent text-gray-600 hover:text-gray-900'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Content Requests
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <div>
        {activeTab === 'favorites' && (
          <FavoritesChart
            profileId={profileId}
            startDate={startDate}
            endDate={endDate}
          />
        )}

        {activeTab === 'requests' && (
          <RequestBreakdown
            profileId={profileId}
            startDate={startDate}
            endDate={endDate}
          />
        )}
      </div>
    </div>
  );
}
