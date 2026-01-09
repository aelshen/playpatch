/**
 * Child Profile Card Component
 */

import Link from 'next/link';
import { DeleteProfileButton } from './delete-profile-button';

interface ProfileCardProps {
  profile: {
    id: string;
    name: string;
    birthDate: Date;
    age: number;
    theme: string;
    uiMode: string;
    ageRating: string;
    avatarUrl: string | null;
    aiEnabled: boolean;
  };
}

const themeEmojis: Record<string, string> = {
  space: '🚀',
  ocean: '🌊',
  safari: '🦁',
  rainbow: '🌈',
  forest: '🌲',
};

export function ProfileCard({ profile }: ProfileCardProps) {
  const emoji = themeEmojis[profile.theme] || '⭐';

  return (
    <div className="rounded-lg bg-white p-6 shadow-md hover:shadow-lg transition-shadow">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500 text-3xl">
            {profile.avatarUrl ? (
              <img
                src={profile.avatarUrl}
                alt={profile.name}
                className="h-full w-full rounded-full object-cover"
              />
            ) : (
              emoji
            )}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{profile.name}</h3>
            <p className="text-sm text-gray-600">Age {profile.age}</p>
          </div>
        </div>
      </div>

      <div className="space-y-2 border-t border-gray-100 pt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">UI Mode:</span>
          <span className="font-medium text-gray-900">
            {profile.uiMode === 'TODDLER' ? '👶 Toddler' : '🧒 Explorer'}
          </span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">Age Rating:</span>
          <span className="font-medium text-gray-900">{profile.ageRating.replace('_', ' ')}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-gray-600">AI Assistant:</span>
          <span className="font-medium text-gray-900">
            {profile.aiEnabled ? '✅ Enabled' : '❌ Disabled'}
          </span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <Link
          href={`/admin/profiles/${profile.id}/edit`}
          className="flex-1 rounded-lg bg-blue-600 px-4 py-2 text-center text-sm font-medium text-white hover:bg-blue-700"
        >
          Edit
        </Link>
        <DeleteProfileButton profileId={profile.id} profileName={profile.name} />
      </div>
    </div>
  );
}
