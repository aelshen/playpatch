/**
 * Family Settings Page
 */

import { getCurrentFamilyId } from '@/lib/auth/session';
import { getFamilySettings } from '@/lib/db/queries/family-settings';
import { FamilySettingsForm } from '@/components/admin/family-settings-form';

export default async function SettingsPage() {
  const familyId = await getCurrentFamilyId();
  const settings = await getFamilySettings(familyId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Family Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure content filters, the AI assistant, and notification preferences for your family.
        </p>
      </div>

      <FamilySettingsForm settings={settings} />
    </div>
  );
}
