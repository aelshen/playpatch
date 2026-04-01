/**
 * Conversation Actions Component
 * Resume and favorite buttons for conversation detail page
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Heart, Play } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface ConversationActionsProps {
  conversationId: string;
  profileId: string;
  isFavorite: boolean;
  mode: 'toddler' | 'explorer';
}

export function ConversationActions({
  conversationId,
  profileId,
  isFavorite: initialIsFavorite,
  mode,
}: ConversationActionsProps) {
  const router = useRouter();
  const [isFavorite, setIsFavorite] = useState(initialIsFavorite);
  const [isResuming, setIsResuming] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);

  const handleResume = async () => {
    setIsResuming(true);
    try {
      const response = await fetch(
        `/api/profiles/${profileId}/conversations/${conversationId}/resume`,
        {
          method: 'POST',
        }
      );

      if (!response.ok) {
        throw new Error('Failed to resume conversation');
      }

      const data = await response.json();
      router.push(data.redirectUrl);
    } catch (error) {
      toast.error('Failed to resume conversation');
      console.error('Failed to resume:', error);
      setIsResuming(false);
    }
  };

  const handleFavoriteToggle = async () => {
    const newIsFavorite = !isFavorite;
    setIsTogglingFavorite(true);

    try {
      const response = await fetch(
        `/api/profiles/${profileId}/conversations/${conversationId}/favorite`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ isFavorite: newIsFavorite }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update favorite status');
      }

      setIsFavorite(newIsFavorite);
      toast.success(
        newIsFavorite ? 'Added to favorites!' : 'Removed from favorites'
      );
    } catch (error) {
      toast.error('Failed to update favorite status');
      console.error('Failed to toggle favorite:', error);
    } finally {
      setIsTogglingFavorite(false);
    }
  };

  const buttonBaseClasses = cn(
    'flex items-center gap-2 font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed',
    mode === 'toddler'
      ? 'rounded-full px-8 py-4 text-xl border-4'
      : 'rounded-lg px-6 py-3 text-base border-2'
  );

  const resumeButtonClasses = cn(
    buttonBaseClasses,
    mode === 'toddler'
      ? 'bg-gradient-to-r from-green-400 to-blue-400 text-white border-white shadow-xl hover:shadow-2xl'
      : 'bg-blue-600 text-white border-blue-700 hover:bg-blue-700'
  );

  const favoriteButtonClasses = cn(
    buttonBaseClasses,
    isFavorite
      ? mode === 'toddler'
        ? 'bg-red-100 text-red-600 border-red-300 hover:bg-red-200'
        : 'bg-red-50 text-red-600 border-red-200 hover:bg-red-100'
      : mode === 'toddler'
      ? 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
  );

  const iconSize = mode === 'toddler' ? 28 : 20;

  return (
    <div className="flex flex-wrap gap-4">
      {/* Resume button */}
      <button
        onClick={handleResume}
        disabled={isResuming}
        className={resumeButtonClasses}
      >
        <Play size={iconSize} className="fill-current" />
        {isResuming ? 'Loading...' : 'Resume Chat'}
      </button>

      {/* Favorite button */}
      <button
        onClick={handleFavoriteToggle}
        disabled={isTogglingFavorite}
        className={favoriteButtonClasses}
      >
        <Heart
          size={iconSize}
          className={isFavorite ? 'fill-current' : ''}
        />
        {isFavorite ? 'Favorited' : 'Add to Favorites'}
      </button>
    </div>
  );
}
