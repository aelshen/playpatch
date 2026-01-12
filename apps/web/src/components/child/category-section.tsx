/**
 * Category Section Component
 * Shows videos from a specific category
 */

import { prisma } from '@/lib/db/client';
import { ChildVideoGrid } from './video-grid';
import { getAllowedAgeRatings } from '@/lib/utils/age-rating';
import { AgeRating } from '@prisma/client';

interface CategorySectionProps {
  category: string;
  ageRating: AgeRating;
  mode: 'toddler' | 'explorer';
  icon?: string;
}

export async function CategorySection({ category, ageRating, mode, icon }: CategorySectionProps) {
  const allowedRatings = getAllowedAgeRatings(ageRating);

  // Fetch videos in this category
  const videos = await prisma.video.findMany({
    where: {
      status: 'READY',
      approvalStatus: 'APPROVED',
      ageRating: { in: allowedRatings },
      categories: {
        has: category,
      },
    },
    include: {
      channel: true,
    },
    orderBy: {
      createdAt: 'desc',
    },
    take: mode === 'toddler' ? 6 : 8,
  });

  if (videos.length === 0) {
    return null; // Don't show empty categories
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {icon && <span className={mode === 'toddler' ? 'text-4xl' : 'text-3xl'}>{icon}</span>}
        <h2 className={`${mode === 'toddler' ? 'text-3xl' : 'text-2xl'} font-bold text-gray-900`}>
          {category}
        </h2>
      </div>
      <ChildVideoGrid videos={videos} />
    </div>
  );
}
