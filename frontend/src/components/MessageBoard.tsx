import { useState } from "react";
import {
  Trophy,
  TrendingUp,
  Send,
  MessageSquare,
  ThumbsUp,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  Pin,
  Trash2,
} from "lucide-react";
import { auth } from "../firebase/config";
import { useAuth } from "../providers/AuthProvider";
import {
  useInfiniteMessages,
  useCreateMessage,
  useLikeMessage,
  useAddComment,
  useEditMessage,
  usePinMessage,
  useAdminDeleteMessage,
  useAdminDeleteComment,
} from "../hooks/useApi";
import type { MessageResponse, Comment, MessageCategory } from "../types/api.types";

// ── Helpers ───────────────────────────────────────────────────────────────────
const CATEGORY_META = {
  win: {
    label: "Win",
    pill: "bg-[#003366] dark:bg-primary text-white",
    border: "border-l-[#003366] dark:border-l-primary",
  },
  gain: {
    label: "Gain",
    pill: "bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300",
    border: "border-l-slate-400 dark:border-l-slate-600",
  },
};

function timeAgo(isoString: string): string {
  const diff = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
}

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Comment Component ─────────────────────────────────────────────────────────
function CommentItem({ comment, isAdmin, onDelete }: { comment: Comment; isAdmin: boolean; onDelete?: (id: string) => void }) {
  return (
    <div className="flex gap-2.5">
      <div className="shrink-0 w-7 h-7 rounded-full bg-slate-400 dark:bg-slate-600 text-white flex items-center justify-center text-xs font-bold shadow-sm">
        {getInitials(comment.author_name)}
      </div>
      <div className="bg-slate-50 dark:bg-slate-700 rounded-lg px-3 py-2 flex-1 border border-slate-200 dark:border-slate-600 shadow-sm">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className="font-bold text-xs text-text">{comment.author_name}</span>
              {comment.author_is_admin && (
                <span className="text-[9px] text-white bg-[#003366] dark:bg-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Admin
                </span>
              )}
            </div>
            <p className="text-xs text-text leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            <div className="text-[10px] text-muted mt-1">{timeAgo(comment.created_at)}</div>
          </div>
          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-2 p-1 rounded-lg text-muted hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors shrink-0"
              title="Delete comment"
            >
              <Trash2 size={12} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Message Card Component ────────────────────────────────────────────────────
interface MessageCardProps {
  msg: MessageResponse;
  currentUserId: string;
  isAdmin: boolean;
  readOnly?: boolean;
}

export function MessageCard({ msg, currentUserId, isAdmin, readOnly = false }: MessageCardProps) {
  const meta = CATEGORY_META[msg.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.win;
  const isOwner = msg.author_uid === currentUserId;
  const hasLiked = msg.likes.includes(currentUserId);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(msg.content);
  const [showComments, setShowComments] = useState(msg.comments.length > 0);
  const [commentInput, setCommentInput] = useState("");

  // Only initialize mutations if not in readOnly mode
  const likeMutation = useLikeMessage();
  const commentMutation = useAddComment();
  const editMutation = useEditMessage();
  const pinMutation = usePinMessage();
  const deleteMutation = useAdminDeleteMessage();
  const deleteCommentMutation = useAdminDeleteComment();

  // In read-only mode, disable all interactive features
  const canEdit = !readOnly && isOwner && !isAdmin;
  const canLike = !readOnly;
  const canComment = !readOnly;
  const canAdminActions = !readOnly && isAdmin;

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      editMutation.mutate(
        { messageId: msg.id, content: editValue },
        {
          onSuccess: () => setEditing(false),
        }
      );
    }
  };

  const handlePostComment = () => {
    if (commentInput.trim()) {
      commentMutation.mutate(
        { messageId: msg.id, content: commentInput },
        {
          onSuccess: () => setCommentInput(""),
        }
      );
    }
  };

  const handleLike = () => {
    likeMutation.mutate(msg.id);
  };

  const handlePin = () => {
    pinMutation.mutate({ messageId: msg.id, isPinned: !msg.is_pinned });
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this message?")) {
      deleteMutation.mutate(msg.id);
    }
  };

  const handleDeleteComment = (commentId: string) => {
    if (confirm("Are you sure you want to delete this comment?")) {
      deleteCommentMutation.mutate(commentId);
    }
  };

  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-5 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="shrink-0 w-11 h-11 rounded-full bg-[#003366] dark:bg-primary text-white flex items-center justify-center text-sm font-bold shadow-sm">
          {getInitials(msg.author_name)}
        </div>

        {/* Author Info & Actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {msg.is_pinned && (
                  <Pin className="text-[#003366] dark:text-primary shrink-0" size={15} fill="currentColor" />
                )}
                <span className="font-bold text-text text-sm">{msg.author_name}</span>
                {msg.author_is_admin && (
                  <span className="text-[9px] text-white bg-[#003366] dark:bg-primary px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    Admin
                  </span>
                )}
              </div>
              <div className="text-xs text-muted shrink-0">{timeAgo(msg.created_at)}</div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1 shrink-0">
              {canAdminActions && (
                <>
                  <button
                    onClick={handlePin}
                    disabled={pinMutation.isPending}
                    className={`p-1.5 rounded-lg transition-colors ${
                      msg.is_pinned
                        ? "text-[#003366] dark:text-primary bg-background hover:bg-slate-50 dark:hover:bg-slate-700"
                        : "text-muted hover:text-[#003366] dark:hover:text-primary hover:bg-background"
                    }`}
                    title={msg.is_pinned ? "Unpin" : "Pin"}
                  >
                    <Pin size={14} fill={msg.is_pinned ? "currentColor" : "none"} />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg text-muted hover:text-red-600 hover:bg-background transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              {canEdit && !editing && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg text-muted hover:text-[#003366] dark:hover:text-primary hover:bg-background transition-colors"
                  title="Edit"
                >
                  <Pencil size={14} />
                </button>
              )}
            </div>
          </div>

          {/* Content / Edit */}
          {editing ? (
            <div className="mt-2">
              <textarea
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                rows={2}
                className="w-full resize-none rounded-lg border border-slate-300 dark:border-slate-600 bg-background px-3 py-2 text-sm text-text focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-primary focus:border-transparent shadow-sm"
                autoFocus
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={() => { setEditing(false); setEditValue(msg.content); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-muted hover:bg-background text-xs font-medium transition-colors"
                  disabled={editMutation.isPending}
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003366] dark:bg-primary text-white text-xs font-semibold hover:bg-[#002244] dark:hover:bg-primary/80 transition-colors disabled:opacity-50 shadow-sm"
                >
                  {editMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-text text-sm leading-relaxed mt-2 whitespace-pre-wrap">{msg.content}</p>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-600">
            {/* Like */}
            {canLike ? (
              <button
                onClick={handleLike}
                disabled={likeMutation.isPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  hasLiked
                    ? "bg-slate-900 dark:bg-slate-700 text-white shadow-sm"
                    : "text-slate-700 dark:text-slate-300 hover:bg-background hover:shadow-sm"
                }`}
              >
                <ThumbsUp size={14} />
                {msg.likes.length > 0 && <span>{msg.likes.length}</span>}
              </button>
            ) : (
              <div className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-slate-500 dark:text-slate-400">
                <ThumbsUp size={14} />
                {msg.likes.length > 0 && <span>{msg.likes.length}</span>}
              </div>
            )}

            {/* Comments toggle */}
            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-background hover:shadow-sm transition-all"
            >
              <MessageSquare size={14} />
              {msg.comments.length > 0 && <span>{msg.comments.length}</span>}
              {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-600 space-y-2.5">
              {msg.comments.map((c) => (
                <CommentItem key={c.id} comment={c} isAdmin={canAdminActions} onDelete={canAdminActions ? handleDeleteComment : undefined} />
              ))}

              {/* Add Comment - only show if not readOnly */}
              {canComment && (
                <div className="flex gap-3 mt-3">
                  <div className="shrink-0 w-8 h-8 rounded-full bg-[#003366] dark:bg-primary text-white flex items-center justify-center text-xs font-bold shadow-sm">
                    {getInitials(auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "U")}
                  </div>
                  <div className="flex-1 flex gap-2">
                    <input
                      value={commentInput}
                      onChange={(e) => setCommentInput(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                      placeholder="Add a comment..."
                      className="flex-1 rounded-lg border border-slate-300 dark:border-slate-600 bg-background px-4 py-2.5 text-sm text-text placeholder-muted focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-primary focus:border-transparent shadow-sm"
                    />
                    <button
                      onClick={handlePostComment}
                      disabled={!commentInput.trim() || commentMutation.isPending}
                      className="p-2.5 rounded-lg bg-[#003366] dark:bg-primary disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white transition-colors shadow-sm hover:bg-[#002244] dark:hover:bg-primary/80"
                    >
                      {commentMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function MessageSkeleton() {
  return (
    <div className="bg-slate-100 dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-300 dark:bg-slate-600 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-slate-300 dark:bg-slate-600 rounded w-28 mb-1.5" />
          <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-16 mb-3" />
          <div className="space-y-1.5">
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-full" />
            <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded w-4/5" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MessageBoard() {
  const [content, setContent] = useState("");
  const { isAdmin } = useAuth();

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteMessages(20);
  const createMutation = useCreateMessage();

  const currentUserId = auth.currentUser?.uid || "";

  // Flatten all pages into a single array of messages and sort: pinned first, then by date
  const messages = (data?.pages.flatMap((page) => page.messages) ?? []).sort((a, b) => {
    // Pinned messages always come first
    if (a.is_pinned && !b.is_pinned) return -1;
    if (!a.is_pinned && b.is_pinned) return 1;
    // Within same pin status, sort by creation date (newest first)
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const handlePost = () => {
    if (!content.trim()) return;
    createMutation.mutate(
      { content, category: "win" },
      {
        onSuccess: () => {
          setContent("");
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 md:p-6">
      <div className="w-full h-full">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <MessageSquare className="text-slate-900 dark:text-white" size={28} strokeWidth={2.5} />
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Community Board</h1>
          </div>
          <p className="text-slate-700 dark:text-slate-300 text-sm ml-11">
            Share updates, progress, and connect with the community.
          </p>
        </div>

        {/* Compose */}
        <div className="bg-background rounded-xl shadow-md border border-slate-200 dark:border-slate-700 p-4 mb-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handlePost()}
            placeholder="Share your thoughts, progress, or questions with the community..."
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-300 dark:border-slate-600 bg-slate-50 dark:bg-slate-800 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-500 dark:placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366] dark:focus:ring-primary focus:border-transparent transition shadow-sm"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-600 dark:text-slate-400">Ctrl/Cmd + Enter to post</span>
            <button
              onClick={handlePost}
              disabled={!content.trim() || createMutation.isPending}
              className="flex items-center gap-2 bg-slate-900 dark:bg-slate-800 hover:bg-slate-800 dark:hover:bg-slate-700 disabled:bg-slate-300 dark:disabled:bg-slate-600 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all duration-150 shadow-md hover:shadow-lg disabled:shadow-sm"
            >
              {createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Post
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={18} />
            <div>
              <p className="text-red-800 dark:text-red-300 font-medium text-sm">Failed to load messages</p>
              <p className="text-red-600 dark:text-red-400 text-xs">{error.message}</p>
            </div>
          </div>
        )}

        {/* Create Error State */}
        {createMutation.error && (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3 mb-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={18} />
            <div>
              <p className="text-red-800 dark:text-red-300 font-medium text-sm">Failed to post message</p>
              <p className="text-red-600 dark:text-red-400 text-xs">{createMutation.error.message}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-3">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        )}

        {/* Feed */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-3 pb-4">
            {messages && messages.length > 0 ? (
              <>
                {messages.map((msg) => (
                  <MessageCard
                    key={msg.id}
                    msg={msg}
                    currentUserId={currentUserId}
                    isAdmin={isAdmin}
                  />
                ))}

                {/* Load More Button */}
                {hasNextPage && (
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="mt-4 py-3 px-6 bg-background hover:bg-slate-50 dark:hover:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded-lg text-text font-medium text-sm transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
                  >
                    {isFetchingNextPage ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Loading more...
                      </>
                    ) : (
                      <>
                        <ChevronDown size={16} />
                        Load More Messages
                      </>
                    )}
                  </button>
                )}
              </>
            ) : (
              <div className="text-center py-12 bg-background rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                <MessageSquare className="mx-auto text-muted mb-3" size={48} strokeWidth={1.5} />
                <p className="text-text text-base font-medium">No messages yet</p>
                <p className="text-muted text-sm mt-1">Be the first to share something with the community!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
