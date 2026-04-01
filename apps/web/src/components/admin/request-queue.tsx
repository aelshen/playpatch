/**
 * Request Queue Component
 * Shows child content requests and lets parents fulfill/dismiss them.
 */

'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { fulfillRequestAction, dismissRequestAction } from '@/lib/actions/requests';
import type { ChildRequestWithDetails } from '@/lib/db/queries/requests';

const THEME_EMOJIS: Record<string, string> = {
  space: '🚀',
  ocean: '🌊',
  safari: '🦁',
  rainbow: '🌈',
  forest: '🌲',
};

const REQUEST_TYPE_LABELS: Record<string, { label: string; color: string }> = {
  MORE_LIKE_THIS: { label: 'More like this', color: 'bg-blue-100 text-blue-800' },
  SPECIFIC_TOPIC: { label: 'Specific topic', color: 'bg-purple-100 text-purple-800' },
  NEW_CHANNEL: { label: 'New channel', color: 'bg-green-100 text-green-800' },
  OTHER: { label: 'Other', color: 'bg-gray-100 text-gray-700' },
};

const STATUS_TABS = ['ALL', 'PENDING', 'FULFILLED', 'DISMISSED'] as const;
type StatusTab = (typeof STATUS_TABS)[number];

interface RequestCardProps {
  request: ChildRequestWithDetails;
}

function RequestCard({ request }: RequestCardProps) {
  const [isPending, startTransition] = useTransition();
  const [actionDone, setActionDone] = useState(false);

  const typeInfo = REQUEST_TYPE_LABELS[request.requestType] ?? REQUEST_TYPE_LABELS.OTHER;
  const childEmoji = THEME_EMOJIS[request.child.theme] ?? '👶';
  const isPendingStatus = request.status === 'PENDING';

  const handleFulfill = () => {
    startTransition(async () => {
      await fulfillRequestAction(request.id);
      setActionDone(true);
    });
  };

  const handleDismiss = () => {
    startTransition(async () => {
      await dismissRequestAction(request.id);
      setActionDone(true);
    });
  };

  if (actionDone) return null;

  return (
    <div
      className={`rounded-lg border bg-white p-5 shadow-sm transition-opacity ${isPending ? 'opacity-50' : ''}`}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          {/* Child avatar */}
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-gray-100 text-xl">
            {childEmoji}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-medium text-gray-900">{request.child.name}</span>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${typeInfo.color}`}>
                {typeInfo.label}
              </span>
              {request.status !== 'PENDING' && (
                <span
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    request.status === 'FULFILLED'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-700'
                  }`}
                >
                  {request.status.toLowerCase()}
                </span>
              )}
            </div>

            {request.message && (
              <p className="mt-1 text-sm text-gray-700">&ldquo;{request.message}&rdquo;</p>
            )}

            {request.video && (
              <div className="mt-2 flex items-center gap-1.5 text-xs text-gray-500">
                <span>Re:</span>
                <Link
                  href={`/admin/content/${request.video.id}`}
                  className="font-medium text-blue-600 hover:underline"
                >
                  {request.video.title}
                </Link>
              </div>
            )}

            <p className="mt-1 text-xs text-gray-400">
              {new Date(request.createdAt).toLocaleDateString(undefined, {
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </p>
          </div>
        </div>

        {/* Actions */}
        {isPendingStatus && (
          <div className="flex flex-shrink-0 gap-2">
            <button
              onClick={handleFulfill}
              disabled={isPending}
              className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 disabled:opacity-50"
            >
              Fulfill
            </button>
            <button
              onClick={handleDismiss}
              disabled={isPending}
              className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface RequestQueueProps {
  requests: ChildRequestWithDetails[];
}

export function RequestQueue({ requests }: RequestQueueProps) {
  const [activeTab, setActiveTab] = useState<StatusTab>('PENDING');

  const filtered = activeTab === 'ALL' ? requests : requests.filter((r) => r.status === activeTab);

  const pendingCount = requests.filter((r) => r.status === 'PENDING').length;

  return (
    <div className="space-y-4">
      {/* Tabs */}
      <div className="flex gap-1 rounded-lg bg-gray-100 p-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab === 'ALL' ? 'All' : tab.charAt(0) + tab.slice(1).toLowerCase()}
            {tab === 'PENDING' && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-yellow-100 px-1.5 py-0.5 text-xs font-semibold text-yellow-800">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Request list */}
      {filtered.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 p-12 text-center">
          <div className="mb-3 text-4xl">{activeTab === 'PENDING' ? '🎉' : '📭'}</div>
          <p className="font-medium text-gray-900">
            {activeTab === 'PENDING' ? 'No pending requests!' : 'No requests here'}
          </p>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === 'PENDING'
              ? "You're all caught up. Kids can request content while watching videos."
              : `No ${activeTab.toLowerCase()} requests to show.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((request) => (
            <RequestCard key={request.id} request={request} />
          ))}
        </div>
      )}
    </div>
  );
}
