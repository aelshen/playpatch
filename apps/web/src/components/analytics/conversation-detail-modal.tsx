/**
 * Conversation Detail Modal Component
 * Displays full conversation with messages and export option
 */

'use client';

import { useEffect, useState } from 'react';
import { format } from 'date-fns';
import { X, Download, AlertTriangle } from 'lucide-react';

interface Message {
  id: string;
  role: string;
  content: string;
  createdAt: string;
  wasFiltered: boolean;
  originalContent?: string;
}

interface SafetyFlag {
  type: string;
  message: string;
  timestamp: string;
  severity?: 'low' | 'medium' | 'high';
}

interface ConversationDetail {
  id: string;
  videoTitle: string;
  childName: string;
  startedAt: string;
  topics: string[];
  hasFlags: boolean;
  flags: SafetyFlag[] | null;
  messages: Message[];
}

interface ConversationDetailModalProps {
  conversationId: string;
  profileId: string;
  onClose: () => void;
}

export function ConversationDetailModal({
  conversationId,
  profileId,
  onClose,
}: ConversationDetailModalProps) {
  const [conversation, setConversation] = useState<ConversationDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchConversation() {
      try {
        const response = await fetch(`/api/profiles/${profileId}/conversations/${conversationId}`);

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || 'Failed to fetch conversation');
        }

        const data = await response.json();
        setConversation(data.conversation);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    }

    fetchConversation();
  }, [conversationId, profileId]);

  const handleExport = () => {
    if (!conversation) return;

    const dataStr = JSON.stringify(conversation, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `conversation-${conversationId}-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex min-h-screen items-center justify-center p-4">
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
          onClick={onClose}
        />

        {/* Modal */}
        <div className="relative w-full max-w-4xl rounded-lg bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Conversation Details
            </h2>
            <div className="flex items-center gap-2">
              {conversation && (
                <button
                  onClick={handleExport}
                  className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-700"
                >
                  <Download size={16} />
                  Export
                </button>
              )}
              <button
                onClick={onClose}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="max-h-[70vh] overflow-y-auto p-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
              </div>
            ) : error ? (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-800">
                {error}
              </div>
            ) : conversation ? (
              <div className="space-y-6">
                {/* Video and child info */}
                <div className="rounded-lg bg-gray-50 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Video</p>
                      <p className="mt-1 text-sm text-gray-900">{conversation.videoTitle}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Child</p>
                      <p className="mt-1 text-sm text-gray-900">{conversation.childName}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Started</p>
                      <p className="mt-1 text-sm text-gray-900">
                        {format(new Date(conversation.startedAt), 'MMM d, yyyy h:mm a')}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-500">Messages</p>
                      <p className="mt-1 text-sm text-gray-900">{conversation.messages.length}</p>
                    </div>
                  </div>

                  {/* Topics */}
                  {conversation.topics.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium text-gray-500 mb-2">Topics</p>
                      <div className="flex flex-wrap gap-2">
                        {conversation.topics.map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex rounded-md bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Safety flags */}
                  {conversation.hasFlags && conversation.flags && conversation.flags.length > 0 && (
                    <div className="mt-4 rounded-lg bg-yellow-50 border border-yellow-200 p-4">
                      <div className="flex items-center gap-2 text-yellow-800 font-semibold mb-3">
                        <AlertTriangle size={18} />
                        Safety Flags ({conversation.flags.length})
                      </div>
                      <div className="space-y-3">
                        {conversation.flags.map((flag, index) => (
                          <div
                            key={index}
                            className={`rounded-lg p-3 border ${
                              flag.severity === 'high'
                                ? 'bg-red-50 border-red-200'
                                : flag.severity === 'medium'
                                ? 'bg-orange-50 border-orange-200'
                                : 'bg-yellow-50 border-yellow-200'
                            }`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <span
                                  className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-semibold ${
                                    flag.severity === 'high'
                                      ? 'bg-red-100 text-red-800'
                                      : flag.severity === 'medium'
                                      ? 'bg-orange-100 text-orange-800'
                                      : 'bg-yellow-100 text-yellow-800'
                                  }`}
                                >
                                  {flag.type.toUpperCase()}
                                </span>
                                {flag.severity && (
                                  <span
                                    className={`text-xs font-medium ${
                                      flag.severity === 'high'
                                        ? 'text-red-700'
                                        : flag.severity === 'medium'
                                        ? 'text-orange-700'
                                        : 'text-yellow-700'
                                    }`}
                                  >
                                    {flag.severity.charAt(0).toUpperCase() + flag.severity.slice(1)} Severity
                                  </span>
                                )}
                              </div>
                              <span className="text-xs text-gray-600">
                                {format(new Date(flag.timestamp), 'MMM d, h:mm a')}
                              </span>
                            </div>
                            <p className="text-sm text-gray-700">{flag.message}</p>
                          </div>
                        ))}
                      </div>
                      <div className="mt-3 pt-3 border-t border-yellow-200">
                        <p className="text-xs text-yellow-800 font-medium">
                          💡 These flags indicate content that may require parent review or discussion
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Messages */}
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Messages</h3>
                  <div className="space-y-4">
                    {conversation.messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${
                          message.role === 'CHILD' ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-3 ${
                            message.role === 'CHILD'
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm font-medium mb-1">
                            {message.role === 'CHILD' ? 'Child' : 'AI Assistant'}
                          </p>
                          <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          {message.wasFiltered && (
                            <div className={`mt-3 rounded-md p-2 text-xs ${
                              message.role === 'CHILD'
                                ? 'bg-blue-700 bg-opacity-50'
                                : 'bg-yellow-100'
                            }`}>
                              <div className="flex items-center gap-1 font-semibold mb-1">
                                <AlertTriangle size={12} />
                                <span className={message.role === 'CHILD' ? 'text-white' : 'text-yellow-900'}>
                                  Content Filtered for Safety
                                </span>
                              </div>
                              {message.originalContent && (
                                <details className={message.role === 'CHILD' ? 'text-white opacity-90' : 'text-gray-700'}>
                                  <summary className="cursor-pointer hover:underline">
                                    View original content
                                  </summary>
                                  <p className="mt-1 italic whitespace-pre-wrap">
                                    &quot;{message.originalContent}&quot;
                                  </p>
                                </details>
                              )}
                            </div>
                          )}
                          <p className={`mt-2 text-xs ${message.role === 'CHILD' ? 'opacity-70' : 'text-gray-500'}`}>
                            {format(new Date(message.createdAt), 'h:mm a')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center text-sm text-gray-500 py-12">
                No conversation data available
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
