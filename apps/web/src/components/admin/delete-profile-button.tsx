/**
 * Delete Profile Button with Confirmation
 */

'use client';

import { useState } from 'react';
import { deleteChildProfileAction } from '@/lib/actions/child-profiles';
import { useRouter } from 'next/navigation';

interface DeleteProfileButtonProps {
  profileId: string;
  profileName: string;
}

export function DeleteProfileButton({ profileId, profileName }: DeleteProfileButtonProps) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteChildProfileAction(profileId);
      router.refresh();
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete profile');
      setIsDeleting(false);
    }
  };

  if (showConfirm) {
    return (
      <div className="flex-1">
        <div className="rounded-lg bg-red-50 p-3">
          <p className="mb-2 text-xs text-red-800">Delete {profileName}?</p>
          <div className="flex space-x-2">
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="flex-1 rounded bg-red-600 px-2 py-1 text-xs text-white hover:bg-red-700 disabled:bg-gray-400"
            >
              {isDeleting ? 'Deleting...' : 'Yes'}
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              disabled={isDeleting}
              className="flex-1 rounded bg-gray-300 px-2 py-1 text-xs text-gray-700 hover:bg-gray-400"
            >
              No
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="rounded-lg border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
    >
      Delete
    </button>
  );
}
