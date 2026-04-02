'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

interface Interest {
  topic: string;
  score: number;
  sources: ('chat' | 'watch')[];
  chatCount?: number;
  watchTimeSecs?: number;
}

interface ChildInterestsWidgetProps {
  profileId: string;
  ageRating: string;
}

export function ChildInterestsWidget({ profileId, ageRating }: ChildInterestsWidgetProps) {
  const [interests, setInterests] = useState<Interest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    async function fetchInterests() {
      setLoading(true);
      setError(false);
      try {
        const res = await fetch(`/api/profiles/${profileId}/interests`);
        if (res.ok) {
          const data = await res.json();
          setInterests(data.interests || []);
        } else {
          setError(true);
        }
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    }

    fetchInterests();
  }, [profileId]);

  return (
    <div className="rounded-lg bg-white p-6 shadow">
      <h2 className="text-lg font-semibold text-gray-900">Topics of Interest</h2>
      <p className="mt-1 text-sm text-gray-500">
        Based on AI chat questions and viewing patterns — click any topic to find videos
      </p>

      <div className="mt-4">
        {loading ? (
          <div className="flex flex-wrap gap-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="h-8 w-24 animate-pulse rounded-full bg-gray-100"
                style={{ width: `${60 + (i % 3) * 24}px` }}
              />
            ))}
          </div>
        ) : error ? (
          <p className="text-sm text-gray-500">
            Could not load topics right now. Try refreshing the page.
          </p>
        ) : interests.length === 0 ? (
          <p className="text-sm text-gray-500">
            Not enough data yet — this will fill in as your child watches videos and asks questions.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interests.map((interest) => {
              const isHot =
                interest.sources.includes('chat') && interest.sources.includes('watch');
              const href = `/admin/content/import?source=search&q=${encodeURIComponent(interest.topic)}&ageRating=${encodeURIComponent(ageRating)}`;

              return (
                <Link
                  key={interest.topic}
                  href={href}
                  className="inline-flex items-center gap-1.5 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors"
                >
                  {isHot && (
                    <span className="h-2 w-2 rounded-full bg-orange-400 flex-shrink-0" />
                  )}
                  {interest.topic}
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
