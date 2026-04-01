/**
 * Family Settings Form
 */

'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useState } from 'react';
import {
  updateFamilySettingsAction,
  type SettingsActionState,
} from '@/lib/actions/family-settings';
import type { FamilySettingsData } from '@/lib/db/queries/family-settings';

const AGE_RATINGS = [
  { value: 'AGE_2_PLUS', label: 'Ages 2+', description: 'Toddler content only' },
  { value: 'AGE_4_PLUS', label: 'Ages 4+', description: 'Pre-school and above' },
  { value: 'AGE_7_PLUS', label: 'Ages 7+', description: 'School age and above' },
  { value: 'AGE_10_PLUS', label: 'Ages 10+', description: 'All family content' },
];

function SaveButton() {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-gray-400"
    >
      {pending ? 'Saving...' : 'Save Settings'}
    </button>
  );
}

function Toggle({
  name,
  label,
  description,
  defaultChecked,
}: {
  name: string;
  label: string;
  description: string;
  defaultChecked: boolean;
}) {
  const [checked, setChecked] = useState(defaultChecked);

  return (
    <div className="flex items-start justify-between gap-4">
      <div>
        <p className="font-medium text-gray-900">{label}</p>
        <p className="text-sm text-gray-500">{description}</p>
      </div>
      <div className="flex flex-shrink-0 items-center gap-2">
        <input type="hidden" name={name} value={checked ? 'true' : 'false'} />
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          onClick={() => setChecked(!checked)}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
            checked ? 'bg-blue-600' : 'bg-gray-200'
          }`}
        >
          <span
            className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
              checked ? 'translate-x-6' : 'translate-x-1'
            }`}
          />
        </button>
      </div>
    </div>
  );
}

interface FamilySettingsFormProps {
  settings: FamilySettingsData;
}

export function FamilySettingsForm({ settings }: FamilySettingsFormProps) {
  const [state, formAction] = useFormState<SettingsActionState | null, FormData>(
    updateFamilySettingsAction,
    null
  );
  const [showSuccess, setShowSuccess] = useState(false);

  useEffect(() => {
    if (state?.success) {
      setShowSuccess(true);
      const t = setTimeout(() => setShowSuccess(false), 3000);
      return () => clearTimeout(t);
    }
  }, [state?.success]);

  return (
    <form action={formAction} className="space-y-8">
      {/* Content Settings */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Content Settings</h2>
        <p className="mb-6 text-sm text-gray-500">
          Default settings applied to new child profiles and content filtering.
        </p>

        <div>
          <label className="mb-3 block text-sm font-medium text-gray-900">
            Default Age Rating for New Content
          </label>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {AGE_RATINGS.map((rating) => (
              <label key={rating.value} className="cursor-pointer">
                <input
                  type="radio"
                  name="defaultAgeRating"
                  value={rating.value}
                  defaultChecked={settings.defaultAgeRating === rating.value}
                  className="peer sr-only"
                />
                <div className="rounded-lg border-2 border-gray-200 p-3 transition-colors hover:border-gray-300 peer-checked:border-blue-600 peer-checked:bg-blue-50">
                  <div className="font-medium text-gray-900">{rating.label}</div>
                  <div className="text-xs text-gray-600">{rating.description}</div>
                </div>
              </label>
            ))}
          </div>
        </div>
      </div>

      {/* AI Settings */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">AI Assistant</h2>
        <p className="mb-6 text-sm text-gray-500">
          The AI assistant helps kids learn while watching. You can also control this per child
          profile.
        </p>
        <Toggle
          name="allowAI"
          label="Enable AI Learning Assistant"
          description="Allows children to chat with an AI assistant while watching videos. The assistant is child-safe and educational."
          defaultChecked={settings.allowAI}
        />
      </div>

      {/* Weekly Digest */}
      <div className="rounded-lg bg-white p-6 shadow">
        <h2 className="mb-1 text-lg font-semibold text-gray-900">Weekly Digest Email</h2>
        <p className="mb-6 text-sm text-gray-500">
          Receive a weekly summary of what your kids watched and how long.
        </p>
        <div className="space-y-4">
          <Toggle
            name="weeklyDigestEnabled"
            label="Enable Weekly Digest"
            description="Get a summary email every Sunday with viewing stats and highlights."
            defaultChecked={settings.weeklyDigestEnabled}
          />
          <div>
            <label htmlFor="weeklyDigestEmail" className="block text-sm font-medium text-gray-700">
              Digest Email Address
            </label>
            <input
              id="weeklyDigestEmail"
              name="weeklyDigestEmail"
              type="email"
              defaultValue={settings.weeklyDigestEmail ?? ''}
              placeholder="parent@example.com"
              className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:max-w-md"
            />
            <p className="mt-1 text-xs text-gray-500">Leave blank to use your account email.</p>
          </div>
        </div>
      </div>

      {/* Submit */}
      <div className="flex items-center gap-4">
        <SaveButton />
        {showSuccess && (
          <p className="text-sm font-medium text-green-600">Settings saved successfully!</p>
        )}
        {state?.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
