/**
 * Auth Error Page
 */

export default function AuthErrorPage({
  searchParams,
}: {
  searchParams: { error?: string };
}) {
  const errorMessages: Record<string, string> = {
    Configuration: 'There is a problem with the server configuration.',
    AccessDenied: 'You do not have permission to access this resource.',
    Verification: 'The verification token has expired or has already been used.',
    Default: 'An error occurred during authentication.',
  };

  const error = searchParams.error || 'Default';
  const errorMessage = errorMessages[error] || errorMessages.Default;

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-red-50 to-orange-100 p-4">
      <div className="w-full max-w-md rounded-lg bg-white p-8 shadow-lg">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100">
            <span className="text-3xl">⚠️</span>
          </div>
          <h1 className="text-2xl font-bold text-gray-900">Authentication Error</h1>
        </div>

        <p className="mb-6 text-center text-gray-600">{errorMessage}</p>

        <div className="space-y-2">
          <a
            href="/auth/login"
            className="block w-full rounded-lg bg-blue-600 px-4 py-2 text-center text-white hover:bg-blue-700"
          >
            Back to Login
          </a>
          <a
            href="/"
            className="block w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-gray-700 hover:bg-gray-50"
          >
            Go Home
          </a>
        </div>
      </div>
    </div>
  );
}
