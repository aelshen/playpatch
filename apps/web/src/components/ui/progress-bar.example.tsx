/**
 * Progress Bar Component Examples
 * Usage demonstrations for the progress bar components
 */

import { ProgressBar, VideoProgressBar, CircularProgress } from './progress-bar';

export function ProgressBarExamples() {
  return (
    <div className="space-y-8 p-8">
      <h2 className="text-2xl font-bold">Progress Bar Examples</h2>

      {/* Basic Progress Bar */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Basic Progress Bar</h3>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-gray-600">25% Progress (Primary)</p>
            <ProgressBar progress={0.25} color="primary" />
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">50% Progress (Success)</p>
            <ProgressBar progress={0.5} color="success" />
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">75% Progress (Warning)</p>
            <ProgressBar progress={0.75} color="warning" />
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">90% Progress (Error)</p>
            <ProgressBar progress={0.9} color="error" />
          </div>
        </div>
      </section>

      {/* Progress Bar with Percentage */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">With Percentage Text</h3>
        <div className="space-y-4">
          <ProgressBar progress={0.35} showPercentage={true} />
          <ProgressBar progress={0.65} showPercentage={true} color="success" />
        </div>
      </section>

      {/* Different Heights */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Different Heights</h3>
        <div className="space-y-4">
          <div>
            <p className="mb-2 text-sm text-gray-600">Thin (4px)</p>
            <ProgressBar progress={0.6} height={4} />
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">Default (8px)</p>
            <ProgressBar progress={0.6} height={8} />
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">Thick (12px)</p>
            <ProgressBar progress={0.6} height={12} />
          </div>
        </div>
      </section>

      {/* Video Progress Bar */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Video Progress Bar</h3>
        <div className="space-y-4 max-w-md">
          <div>
            <p className="mb-2 text-sm text-gray-600">10% watched (1:00 / 10:00)</p>
            <VideoProgressBar position={60} duration={600} />
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">50% watched (5:00 / 10:00)</p>
            <VideoProgressBar position={300} duration={600} />
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">90% watched (9:00 / 10:00)</p>
            <VideoProgressBar position={540} duration={600} />
          </div>
          <div>
            <p className="mb-2 text-sm text-gray-600">With time remaining</p>
            <VideoProgressBar position={180} duration={600} showTimeRemaining={true} />
          </div>
        </div>
      </section>

      {/* Circular Progress */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Circular Progress</h3>
        <div className="flex gap-8">
          <div className="text-center">
            <CircularProgress progress={0.25} />
            <p className="mt-2 text-sm text-gray-600">25%</p>
          </div>
          <div className="text-center">
            <CircularProgress progress={0.5} color="primary" />
            <p className="mt-2 text-sm text-gray-600">50%</p>
          </div>
          <div className="text-center">
            <CircularProgress progress={0.75} color="warning" />
            <p className="mt-2 text-sm text-gray-600">75%</p>
          </div>
          <div className="text-center">
            <CircularProgress progress={1} color="success" />
            <p className="mt-2 text-sm text-gray-600">100%</p>
          </div>
        </div>
      </section>

      {/* Different Sizes */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Different Sizes</h3>
        <div className="flex gap-8 items-center">
          <CircularProgress progress={0.65} size={32} />
          <CircularProgress progress={0.65} size={48} />
          <CircularProgress progress={0.65} size={64} />
          <CircularProgress progress={0.65} size={96} />
        </div>
      </section>

      {/* Real-world Usage Examples */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Real-world Usage</h3>

        {/* Video Card Example */}
        <div className="max-w-sm">
          <div className="relative aspect-video overflow-hidden rounded-lg bg-gray-800 shadow-md">
            <img
              src="/api/placeholder/320/180"
              alt="Video thumbnail"
              className="h-full w-full object-cover"
            />
            <div className="absolute bottom-2 right-2 rounded bg-black/80 px-2 py-1 text-xs text-white">
              10:25
            </div>
            {/* Progress bar at bottom */}
            <div className="absolute bottom-0 left-0 right-0">
              <VideoProgressBar position={385} duration={625} />
            </div>
          </div>
          <div className="mt-2">
            <h3 className="font-medium text-gray-900">Sample Video Title</h3>
            <p className="text-sm text-gray-600">Channel Name</p>
          </div>
        </div>
      </section>

      {/* Code Examples */}
      <section>
        <h3 className="mb-4 text-lg font-semibold">Code Examples</h3>
        <div className="space-y-4 rounded-lg bg-gray-50 p-4">
          <div>
            <p className="mb-2 font-mono text-sm">Basic usage:</p>
            <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-sm text-white">
{`<ProgressBar progress={0.65} />`}
            </pre>
          </div>
          <div>
            <p className="mb-2 font-mono text-sm">With percentage and color:</p>
            <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-sm text-white">
{`<ProgressBar
  progress={0.75}
  color="success"
  showPercentage={true}
/>`}
            </pre>
          </div>
          <div>
            <p className="mb-2 font-mono text-sm">Video progress:</p>
            <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-sm text-white">
{`<VideoProgressBar
  position={300}
  duration={600}
  showTimeRemaining={true}
/>`}
            </pre>
          </div>
          <div>
            <p className="mb-2 font-mono text-sm">Circular progress:</p>
            <pre className="overflow-x-auto rounded bg-gray-900 p-3 text-sm text-white">
{`<CircularProgress
  progress={0.8}
  size={64}
  color="primary"
/>`}
            </pre>
          </div>
        </div>
      </section>
    </div>
  );
}
