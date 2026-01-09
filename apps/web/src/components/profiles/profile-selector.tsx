/**
 * Profile Selector Component
 * Netflix-style profile selection
 */

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { selectProfileAction } from '@/lib/actions/profile-selection';
import { PinModal } from './pin-modal';

interface Profile {
  id: string;
  name: string;
  age: number;
  theme: string;
  avatarUrl: string | null;
  pin: string | null;
  uiMode: string;
}

interface ProfileSelectorProps {
  profiles: Profile[];
}

const themeColors: Record<string, { from: string; to: string; emoji: string }> = {
  space: { from: 'from-blue-400', to: 'to-purple-500', emoji: '🚀' },
  ocean: { from: 'from-blue-500', to: 'to-cyan-400', emoji: '🌊' },
  safari: { from: 'from-yellow-400', to: 'to-orange-500', emoji: '🦁' },
  rainbow: { from: 'from-pink-400', to: 'to-yellow-400', emoji: '🌈' },
  forest: { from: 'from-green-400', to: 'to-emerald-600', emoji: '🌲' },
};

export function ProfileSelector({ profiles }: ProfileSelectorProps) {
  const router = useRouter();
  const [selectedProfile, setSelectedProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleProfileClick = (profile: Profile) => {
    if (profile.pin) {
      setSelectedProfile(profile);
    } else {
      selectProfile(profile.id);
    }
  };

  const handlePinVerified = (profileId: string) => {
    setSelectedProfile(null);
    selectProfile(profileId);
  };

  const selectProfile = async (profileId: string) => {
    setIsLoading(true);
    try {
      const result = await selectProfileAction(profileId);
      if (result.success) {
        // Redirect based on UI mode
        const profile = profiles.find((p) => p.id === profileId);
        if (profile?.uiMode === 'TODDLER') {
          router.push('/child/toddler');
        } else {
          router.push('/child/explorer');
        }
        router.refresh();
      } else {
        alert(result.error || 'Failed to select profile');
        setIsLoading(false);
      }
    } catch (error) {
      console.error('Profile selection error:', error);
      alert('An error occurred');
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="grid grid-cols-2 gap-6 md:grid-cols-3 lg:grid-cols-4">
        {profiles.map((profile) => {
          const theme = themeColors[profile.theme] || themeColors.space;

          return (
            <button
              key={profile.id}
              onClick={() => handleProfileClick(profile)}
              disabled={isLoading}
              className="group relative transform transition-all duration-200 hover:scale-105 disabled:opacity-50"
            >
              <div
                className={`flex aspect-square items-center justify-center rounded-2xl bg-gradient-to-br ${theme.from} ${theme.to} shadow-lg group-hover:shadow-2xl`}
              >
                {profile.avatarUrl ? (
                  <img
                    src={profile.avatarUrl}
                    alt={profile.name}
                    className="h-full w-full rounded-2xl object-cover"
                  />
                ) : (
                  <span className="text-7xl">{theme.emoji}</span>
                )}
                {profile.pin && (
                  <div className="absolute right-2 top-2 rounded-full bg-white px-2 py-1 text-xs font-medium text-gray-700 shadow">
                    🔒
                  </div>
                )}
              </div>
              <div className="mt-3 text-center">
                <p className="text-lg font-semibold text-gray-900">{profile.name}</p>
                <p className="text-sm text-gray-600">
                  Age {profile.age} • {profile.uiMode === 'TODDLER' ? '👶' : '🧒'}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {selectedProfile && (
        <PinModal
          profile={selectedProfile}
          onVerified={handlePinVerified}
          onClose={() => setSelectedProfile(null)}
        />
      )}
    </>
  );
}
