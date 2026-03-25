import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
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
    pill: "bg-[#003366] text-white",
    border: "border-l-[#003366]",
  },
  gain: {
    label: "Gain",
    pill: "bg-slate-200 text-slate-700",
    border: "border-l-slate-400",
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
      <div className="shrink-0 w-7 h-7 rounded-full bg-slate-400 text-white flex items-center justify-center text-xs font-bold shadow-sm">
        {getInitials(comment.author_name)}
      </div>
      <div className="bg-slate-50 rounded-lg px-3 py-2 flex-1 border border-slate-200 shadow-sm">
        <div className="flex justify-between items-start gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap mb-0.5">
              <span className="font-bold text-xs text-slate-800">{comment.author_name}</span>
              {comment.author_is_admin && (
                <span className="text-[9px] text-white bg-[#003366] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                  Admin
                </span>
              )}
              {comment.author_department && (
                <span className="text-[9px] text-slate-600 bg-slate-100 px-1.5 py-0.5 rounded-full border border-slate-200">
                  {comment.author_department}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">{comment.content}</p>
            <div className="text-[10px] text-slate-400 mt-1">{timeAgo(comment.created_at)}</div>
          </div>
          {isAdmin && onDelete && (
            <button
              onClick={() => onDelete(comment.id)}
              className="ml-2 p-1 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors shrink-0"
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
  highlightMessageId?: string | null;
}

function MessageCard({ msg, currentUserId, isAdmin, highlightMessageId }: MessageCardProps) {
  const meta = CATEGORY_META[msg.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.win;
  const isOwner = msg.author_uid === currentUserId;
  const hasLiked = msg.likes.includes(currentUserId);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(msg.content);
  const [showComments, setShowComments] = useState(msg.comments.length > 0);
  const [commentInput, setCommentInput] = useState("");

  const cardRef = useRef<HTMLDivElement>(null);
  const commentInputRef = useRef<HTMLInputElement>(null);

  const likeMutation = useLikeMessage();
  const commentMutation = useAddComment();
  const editMutation = useEditMessage();
  const pinMutation = usePinMessage();
  const deleteMutation = useAdminDeleteMessage();
  const deleteCommentMutation = useAdminDeleteComment();

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

  useEffect(() => {
    if (highlightMessageId === msg.id) {
      setShowComments(true);
      cardRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
      commentInputRef.current?.focus();
    }
  }, [highlightMessageId, msg.id]);

  return (
    <div ref={cardRef} id={`message-${msg.id}`} className="bg-slate-100 rounded-xl shadow-sm border border-slate-200 p-4 hover:shadow-md transition-all duration-200">
      {/* Header */}
      <div className="flex items-start gap-3 mb-3">
        {/* Avatar */}
        <div className="shrink-0 w-10 h-10 rounded-full bg-[#003366] text-white flex items-center justify-center text-sm font-bold shadow-sm">
          {getInitials(msg.author_name)}
        </div>

        {/* Author Info & Actions */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0 flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-wrap">
                {msg.is_pinned && (
                  <Pin className="text-[#003366] shrink-0" size={15} fill="#003366" />
                )}
                <span className="font-bold text-slate-900 text-sm">{msg.author_name}</span>
                {msg.author_is_admin && (
                  <span className="text-[9px] text-white bg-[#003366] px-1.5 py-0.5 rounded-full font-bold uppercase tracking-wide">
                    Admin
                  </span>
                )}
                {msg.author_department && (
                  <span className="text-[10px] text-slate-600 bg-white px-2 py-0.5 rounded-full border border-slate-300">
                    {msg.author_department}
                  </span>
                )}
              </div>
              <div className="text-xs text-slate-400 shrink-0">{timeAgo(msg.created_at)}</div>
            </div>

            {/* Action buttons */}
            <div className="flex gap-1 shrink-0">
              {isAdmin && (
                <>
                  <button
                    onClick={handlePin}
                    disabled={pinMutation.isPending}
                    className={`p-1.5 rounded-lg transition-colors ${
                      msg.is_pinned
                        ? "text-[#003366] bg-white hover:bg-slate-50"
                        : "text-slate-500 hover:text-[#003366] hover:bg-white"
                    }`}
                    title={msg.is_pinned ? "Unpin" : "Pin"}
                  >
                    <Pin size={14} fill={msg.is_pinned ? "#003366" : "none"} />
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deleteMutation.isPending}
                    className="p-1.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-white transition-colors"
                    title="Delete"
                  >
                    <Trash2 size={14} />
                  </button>
                </>
              )}
              {isOwner && !editing && !isAdmin && (
                <button
                  onClick={() => setEditing(true)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-[#003366] hover:bg-white transition-colors"
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
                className="w-full resize-none rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent shadow-sm"
                autoFocus
              />
              <div className="flex gap-2 mt-2 justify-end">
                <button
                  onClick={() => { setEditing(false); setEditValue(msg.content); }}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-600 hover:bg-white text-xs font-medium transition-colors"
                  disabled={editMutation.isPending}
                >
                  <X size={13} /> Cancel
                </button>
                <button
                  onClick={handleSaveEdit}
                  disabled={editMutation.isPending}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003366] text-white text-xs font-semibold hover:bg-[#002244] transition-colors disabled:opacity-50 shadow-sm"
                >
                  {editMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                  Save
                </button>
              </div>
            </div>
          ) : (
            <p className="text-slate-800 text-sm leading-relaxed mt-2 whitespace-pre-wrap">{msg.content}</p>
          )}

          {/* Actions Row */}
          <div className="flex items-center gap-2 mt-3 pt-2.5 border-t border-slate-200">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={likeMutation.isPending}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                hasLiked
                  ? "bg-[#003366] text-white shadow-sm"
                  : "text-slate-600 hover:bg-white hover:shadow-sm"
              }`}
            >
              <ThumbsUp size={14} />
              {msg.likes.length > 0 && <span>{msg.likes.length}</span>}
            </button>

            {/* Comments toggle */}
            <button
              onClick={() => setShowComments((v) => !v)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-white hover:shadow-sm transition-all"
            >
              <MessageSquare size={14} />
              {msg.comments.length > 0 && <span>{msg.comments.length}</span>}
              {showComments ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
            </button>
          </div>

          {/* Comments Section */}
          {showComments && (
            <div className="mt-3 pt-3 border-t border-slate-200 space-y-2.5">
              {msg.comments.map((c) => (
                <CommentItem key={c.id} comment={c} isAdmin={isAdmin} onDelete={handleDeleteComment} />
              ))}

              {/* Add Comment */}
              <div className="flex gap-3 mt-3">
                <div className="shrink-0 w-8 h-8 rounded-full bg-[#003366] text-white flex items-center justify-center text-xs font-bold shadow-sm">
                  {getInitials(auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "U")}
                </div>
                <div className="flex-1 flex gap-2">
                  <input
                    ref={commentInputRef}
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                    placeholder="Add a comment..."
                    className="flex-1 rounded-lg border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent shadow-sm"
                  />
                  <button
                    onClick={handlePostComment}
                    disabled={!commentInput.trim() || commentMutation.isPending}
                    className="p-2.5 rounded-lg bg-[#003366] disabled:bg-slate-300 text-white transition-colors shadow-sm hover:bg-[#002244]"
                  >
                    {commentMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                  </button>
                </div>
              </div>
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
    <div className="bg-slate-100 rounded-xl shadow-sm border border-slate-200 p-4 animate-pulse">
      <div className="flex gap-3">
        <div className="w-10 h-10 rounded-full bg-slate-300 shrink-0" />
        <div className="flex-1">
          <div className="h-4 bg-slate-300 rounded w-28 mb-1.5" />
          <div className="h-3 bg-slate-200 rounded w-16 mb-3" />
          <div className="space-y-1.5">
            <div className="h-3 bg-slate-200 rounded w-full" />
            <div className="h-3 bg-slate-200 rounded w-4/5" />
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
  const [searchParams] = useSearchParams();
  const highlightMessageId = searchParams.get("highlight");

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

  // Flatten all pages into a single array of messages
  const messages = data?.pages.flatMap((page) => page.messages) ?? [];

  const handlePost = () => {
    if (!content.trim()) return;
    console.log("[MessageBoard] Posting message:", { content, category: "win" });
    createMutation.mutate(
      { content, category: "win" },
      {
        onSuccess: (newMessage) => {
          console.log("[MessageBoard] Message posted successfully:", newMessage);
          setContent("");
        },
        onError: (error) => {
          console.error("[MessageBoard] Failed to post message:", error);
        },
      }
    );
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 p-4 md:p-6">
      <div className="w-full h-full">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-1">
            <MessageSquare className="text-[#003366]" size={28} strokeWidth={2.5} />
            <h1 className="text-3xl font-bold text-[#003366]">Community Board</h1>
          </div>
          <p className="text-slate-600 text-sm ml-11">
            Share updates, progress, and connect with the community.
          </p>
        </div>

        {/* Compose */}
        <div className="bg-white rounded-xl shadow-md border border-slate-200 p-4 mb-5">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handlePost()}
            placeholder="Share your thoughts, progress, or questions with the community..."
            rows={2}
            className="w-full resize-none rounded-lg border border-slate-300 bg-slate-50 px-4 py-2.5 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition shadow-sm"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-500">Ctrl/Cmd + Enter to post</span>
            <button
              onClick={handlePost}
              disabled={!content.trim() || createMutation.isPending}
              className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 text-white text-sm font-bold px-5 py-2 rounded-lg transition-all duration-150 shadow-md hover:shadow-lg disabled:shadow-sm"
            >
              {createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Post
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={18} />
            <div>
              <p className="text-red-800 font-medium text-sm">Failed to load messages</p>
              <p className="text-red-600 text-xs">{error.message}</p>
            </div>
          </div>
        )}

        {/* Create Error State */}
        {createMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={18} />
            <div>
              <p className="text-red-800 font-medium text-sm">Failed to post message</p>
              <p className="text-red-600 text-xs">{createMutation.error.message}</p>
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
                    highlightMessageId={highlightMessageId}
                  />
                ))}

                {/* Load More Button */}
                {hasNextPage && (
                  <button
                    onClick={() => fetchNextPage()}
                    disabled={isFetchingNextPage}
                    className="mt-4 py-3 px-6 bg-white hover:bg-slate-50 border border-slate-300 rounded-lg text-slate-700 font-medium text-sm transition-all duration-150 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mx-auto"
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
              <div className="text-center py-12 bg-white rounded-xl border border-slate-200 shadow-sm">
                <MessageSquare className="mx-auto text-slate-300 mb-3" size={48} strokeWidth={1.5} />
                <p className="text-slate-500 text-base font-medium">No messages yet</p>
                <p className="text-slate-400 text-sm mt-1">Be the first to share something with the community!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
