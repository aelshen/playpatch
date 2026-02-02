/**
 * AI Conversations Table Component
 * Displays AI conversations with details and export functionality
 */

'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Download, Eye, AlertTriangle } from 'lucide-react';
import { ConversationDetailModal } from './conversation-detail-modal';

interface AIConversation {
  id: string;
  childId: string;
  videoId: string;
  videoTitle: string;
  startedAt: string;
  messageCount: number;
  topics: string[];
  hasFlags: boolean;
}

interface ChildProfile {
  id: string;
  name: string;
}

interface AIConversationsTableProps {
  conversations: AIConversation[];
  profiles: ChildProfile[];
}

export function AIConversationsTable({
  conversations,
  profiles,
}: AIConversationsTableProps) {
  const [selectedConversation, setSelectedConversation] = useState<AIConversation | null>(null);

  const handleExportAll = () => {
    const dataStr = JSON.stringify(conversations, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `ai-conversations-${format(new Date(), 'yyyy-MM-dd')}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="rounded-lg bg-white shadow">
        <div className="border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-gray-900">AI Conversations</h2>
            <p className="mt-1 text-sm text-gray-600">
              Conversation history with AI assistant
            </p>
          </div>
          <button
            onClick={handleExportAll}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Download size={16} />
            Export All
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Video
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Messages
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Topics
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Safety
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {conversations.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500">
                    No conversations found for this period
                  </td>
                </tr>
              ) : (
                conversations.map((conversation) => (
                  <tr
                    key={conversation.id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedConversation(conversation)}
                  >
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900 line-clamp-2 max-w-xs">
                        {conversation.videoTitle}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {format(new Date(conversation.startedAt), 'MMM d, h:mm a')}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm text-gray-900">
                        {conversation.messageCount}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {conversation.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="inline-flex rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700"
                          >
                            {topic}
                          </span>
                        ))}
                        {conversation.topics.length > 3 && (
                          <span className="inline-flex rounded-md bg-gray-50 px-2 py-1 text-xs font-medium text-gray-700">
                            +{conversation.topics.length - 3}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {conversation.hasFlags ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-1 text-xs font-semibold text-yellow-800">
                          <AlertTriangle size={12} />
                          Flagged
                        </span>
                      ) : (
                        <span className="inline-flex rounded-full bg-green-100 px-2 py-1 text-xs font-semibold text-green-800">
                          Safe
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedConversation(conversation);
                        }}
                        className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-800"
                      >
                        <Eye size={16} />
                        View
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {conversations.length > 10 && (
          <div className="border-t border-gray-200 px-6 py-4 text-center">
            <p className="text-sm text-gray-600">
              Showing {Math.min(10, conversations.length)} of {conversations.length} conversations
            </p>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {selectedConversation && (
        <ConversationDetailModal
          conversationId={selectedConversation.id}
          profileId={selectedConversation.childId}
          onClose={() => setSelectedConversation(null)}
        />
      )}
    </>
  );
}
