/**
 * RealDebrid Status Component
 * Shows detailed status for RealDebrid downloads
 */

'use client';

interface RealDebridStatusProps {
  video: {
    id: string;
    sourceType: string;
    status: string;
    metadata?: any;
  };
}

export function RealDebridStatus({ video }: RealDebridStatusProps) {
  if (video.sourceType !== 'REALDEBRID') {
    return null;
  }

  const metadata = video.metadata as any;
  const torrentHash = metadata?.torrentHash;
  const fileId = metadata?.fileId;
  const fileSize = metadata?.fileSize;
  const torrentName = metadata?.torrentName;

  return (
    <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
      <div className="flex items-center space-x-2 mb-3">
        <span className="text-2xl">🧲</span>
        <h3 className="font-semibold text-purple-900">RealDebrid Download</h3>
      </div>

      <div className="space-y-2 text-sm">
        {torrentName && (
          <div>
            <span className="font-medium text-purple-900">Torrent:</span>
            <p className="text-purple-700 mt-1">{torrentName}</p>
          </div>
        )}

        {fileSize && (
          <div>
            <span className="font-medium text-purple-900">File Size:</span>
            <p className="text-purple-700">
              {(fileSize / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}

        {torrentHash && (
          <div>
            <span className="font-medium text-purple-900">Hash:</span>
            <p className="text-purple-700 font-mono text-xs">
              {torrentHash.substring(0, 16)}...
            </p>
          </div>
        )}

        {/* Status-specific messages */}
        {video.status === 'PENDING' && (
          <div className="rounded-lg bg-yellow-100 p-3 text-yellow-800 mt-3">
            <p className="text-xs font-medium">
              ⏳ Waiting for approval. Once approved, RealDebrid will download the torrent.
            </p>
          </div>
        )}

        {video.status === 'DOWNLOADING' && (
          <div className="rounded-lg bg-blue-100 p-3 text-blue-800 mt-3">
            <p className="text-xs font-medium">
              ⬇️ RealDebrid is downloading the torrent. We'll fetch it via HTTPS once ready.
            </p>
          </div>
        )}

        {video.status === 'PROCESSING' && (
          <div className="rounded-lg bg-purple-100 p-3 text-purple-800 mt-3">
            <p className="text-xs font-medium">
              🔄 File downloaded! Now transcoding for playback...
            </p>
          </div>
        )}

        {video.status === 'READY' && (
          <div className="rounded-lg bg-green-100 p-3 text-green-800 mt-3">
            <p className="text-xs font-medium">
              ✅ Downloaded via RealDebrid and ready to watch!
            </p>
          </div>
        )}

        {video.status === 'ERROR' && (
          <div className="rounded-lg bg-red-100 p-3 text-red-800 mt-3">
            <p className="text-xs font-medium">
              ❌ Download failed. Try approving again to retry, or check RealDebrid account status.
            </p>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-purple-200 text-xs text-purple-600">
        <p>💡 RealDebrid downloads torrents on their servers, then we fetch via HTTPS - no torrent client needed!</p>
      </div>
    </div>
  );
}
