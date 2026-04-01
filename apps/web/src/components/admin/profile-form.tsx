/**
 * Child Profile Form Component
 * Used for both creating and editing profiles
 */

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  createChildProfileAction,
  updateChildProfileAction,
  type ProfileActionState,
} from '@/lib/actions/child-profiles';
import { VIDEO_CATEGORIES } from '@/lib/utils/shared';

interface ProfileFormProps {
  mode: 'create' | 'edit';
  profile?: any;
}

function SubmitButton({ mode }: { mode: 'create' | 'edit' }) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-lg bg-blue-600 px-4 py-3 text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {pending ? 'Saving...' : mode === 'create' ? 'Create Profile' : 'Save Changes'}
    </button>
  );
}

export function ProfileForm({ mode, profile }: ProfileFormProps) {
  const router = useRouter();
  const action = mode === 'create' ? createChildProfileAction : updateChildProfileAction;
  const [state, formAction] = useFormState<ProfileActionState | null, FormData>(action, null);

  useEffect(() => {
    if (state?.success) {
      router.push('/admin/profiles');
      router.refresh();
    }
  }, [state?.success, router]);

  const defaultBirthDate = profile?.birthDate
    ? new Date(profile.birthDate).toISOString().split('T')[0]
    : '';

  return (
    <form action={formAction} className="space-y-6">
      {mode === 'edit' && <input type="hidden" name="id" value={profile.id} />}

      {/* Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Child&apos;s Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={profile?.name}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="Emma"
        />
      </div>

      {/* Birth Date */}
      <div>
        <label htmlFor="birthDate" className="block text-sm font-medium text-gray-700">
          Birth Date *
        </label>
        <input
          id="birthDate"
          name="birthDate"
          type="date"
          required
          defaultValue={defaultBirthDate}
          max={new Date().toISOString().split('T')[0]}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        />
        <p className="mt-1 text-xs text-gray-500">
          Age and UI mode will be calculated automatically
        </p>
      </div>

      {/* Theme */}
      <div>
        <label htmlFor="theme" className="block text-sm font-medium text-gray-700">
          Theme
        </label>
        <select
          id="theme"
          name="theme"
          defaultValue={profile?.theme || 'space'}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
        >
          <option value="space">🚀 Space</option>
          <option value="ocean">🌊 Ocean</option>
          <option value="safari">🦁 Safari</option>
          <option value="rainbow">🌈 Rainbow</option>
          <option value="forest">🌲 Forest</option>
        </select>
      </div>

      {/* PIN */}
      <div>
        <label htmlFor="pin" className="block text-sm font-medium text-gray-700">
          PIN (Optional)
        </label>
        <input
          id="pin"
          name="pin"
          type="text"
          maxLength={4}
          pattern="[0-9]{4}"
          defaultValue={profile?.pin || ''}
          className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500"
          placeholder="1234"
        />
        <p className="mt-1 text-xs text-gray-500">
          4-digit PIN for profile protection (leave empty for no PIN)
        </p>
      </div>

      {/* Allowed Categories */}
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700">
          Allowed Categories (Optional)
        </label>
        <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border border-gray-300 p-3">
          {VIDEO_CATEGORIES.map((category) => (
            <label key={category} className="flex items-center space-x-2">
              <input
                type="checkbox"
                name="allowedCategories"
                value={category}
                defaultChecked={profile?.allowedCategories?.includes(category)}
                className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm text-gray-700">{category}</span>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-gray-500">Leave all unchecked to allow all categories</p>
      </div>

      {/* Screen Time Limits */}
      {mode === 'edit' && (
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Screen Time Limits</label>
          <p className="mb-3 text-xs text-gray-500">
            Set daily viewing limits in minutes. Leave blank for no limit. Weekday/weekend limits
            override the daily limit on those days.
          </p>
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label htmlFor="dailyLimitMinutes" className="mb-1 block text-xs text-gray-600">
                Daily limit (min)
              </label>
              <input
                id="dailyLimitMinutes"
                name="dailyLimitMinutes"
                type="number"
                min="0"
                max="1440"
                step="15"
                defaultValue={(profile?.timeLimits as { daily?: number } | null)?.daily ?? ''}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="e.g. 60"
              />
            </div>
            <div>
              <label htmlFor="weekdayLimitMinutes" className="mb-1 block text-xs text-gray-600">
                Weekday (min)
              </label>
              <input
                id="weekdayLimitMinutes"
                name="weekdayLimitMinutes"
                type="number"
                min="0"
                max="1440"
                step="15"
                defaultValue={(profile?.timeLimits as { weekday?: number } | null)?.weekday ?? ''}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="e.g. 45"
              />
            </div>
            <div>
              <label htmlFor="weekendLimitMinutes" className="mb-1 block text-xs text-gray-600">
                Weekend (min)
              </label>
              <input
                id="weekendLimitMinutes"
                name="weekendLimitMinutes"
                type="number"
                min="0"
                max="1440"
                step="15"
                defaultValue={(profile?.timeLimits as { weekend?: number } | null)?.weekend ?? ''}
                className="block w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500"
                placeholder="e.g. 90"
              />
            </div>
          </div>
        </div>
      )}

      {state?.error && (
        <div className="rounded-md bg-red-50 p-3 text-sm text-red-800">{state.error}</div>
      )}

      <SubmitButton mode={mode} />
    </form>
  );
}
