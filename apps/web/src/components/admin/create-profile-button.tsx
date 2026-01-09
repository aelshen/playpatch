/**
 * Create Profile Button
 */

import Link from 'next/link';

export function CreateProfileButton() {
  return (
    <Link
      href="/admin/profiles/new"
      className="inline-flex items-center rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
    >
      <span className="mr-2">+</span>
      Create Profile
    </Link>
  );
}
