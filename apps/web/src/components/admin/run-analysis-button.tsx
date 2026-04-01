/**
 * Run AI Analysis button — queues analysis for all videos missing aiAnalysis.
 */

'use client';

import { useState, useTransition } from 'react';
import { runMissingAnalysisAction } from '@/lib/actions/ai-analysis';

interface Props {
  missingCount: number;
}

export function RunAnalysisButton({ missingCount }: Props) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ queued: number } | null>(null);

  if (missingCount === 0) return null;

  const handleClick = () => {
    startTransition(async () => {
      const r = await runMissingAnalysisAction();
      setResult(r);
    });
  };

  if (result) {
    return (
      <span className="rounded-lg bg-green-100 px-3 py-2 text-sm font-medium text-green-800">
        ✓ {result.queued} analysis jobs queued
      </span>
    );
  }

  return (
    <button
      onClick={handleClick}
      disabled={isPending}
      className="rounded-lg border border-purple-300 bg-purple-50 px-4 py-2 text-sm font-medium text-purple-700 hover:bg-purple-100 disabled:opacity-50"
    >
      {isPending ? 'Queuing...' : `🤖 Run AI Analysis (${missingCount})`}
    </button>
  );
}
