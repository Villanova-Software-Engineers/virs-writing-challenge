import { useState } from "react";
import {
  Trophy,
  TrendingUp,
  Send,
  MessageSquare,
  ThumbsUp,
  ThumbsDown,
  Pencil,
  Check,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { auth } from "../firebase/config";
import {
  useMessages,
  useCreateMessage,
  useLikeMessage,
  useDislikeMessage,
  useAddComment,
  useEditMessage,
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

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

// ── Comment Component ─────────────────────────────────────────────────────────
function CommentItem({ comment }: { comment: Comment }) {
  return (
    <div className="flex gap-2 mt-2">
      <div className="shrink-0 w-7 h-7 rounded-full bg-slate-300 text-slate-700 flex items-center justify-center text-xs font-bold">
        {getInitials(comment.author_name)}
      </div>
      <div className="bg-slate-50 rounded-xl px-3 py-2 flex-1">
        <span className="font-semibold text-xs text-slate-700 mr-2">{comment.author_name}</span>
        <span className="text-xs text-slate-600">{comment.content}</span>
        <div className="text-xs text-slate-400 mt-0.5">{timeAgo(comment.created_at)}</div>
      </div>
    </div>
  );
}

// ── Message Card Component ────────────────────────────────────────────────────
interface MessageCardProps {
  msg: MessageResponse;
  currentUserId: string;
}

function MessageCard({ msg, currentUserId }: MessageCardProps) {
  const meta = CATEGORY_META[msg.category as keyof typeof CATEGORY_META] ?? CATEGORY_META.win;
  const isOwner = msg.author_uid === currentUserId;
  const hasLiked = msg.likes.includes(currentUserId);
  const hasDisliked = msg.dislikes.includes(currentUserId);

  const [editing, setEditing] = useState(false);
  const [editValue, setEditValue] = useState(msg.content);
  const [showComments, setShowComments] = useState(msg.comments.length > 0);
  const [commentInput, setCommentInput] = useState("");

  const likeMutation = useLikeMessage();
  const dislikeMutation = useDislikeMessage();
  const commentMutation = useAddComment();
  const editMutation = useEditMessage();

  const handleSaveEdit = () => {
    if (editValue.trim()) {
      editMutation.mutate(
        { messageId: msg.id, content: editValue.trim() },
        {
          onSuccess: () => setEditing(false),
        }
      );
    }
  };

  const handlePostComment = () => {
    if (commentInput.trim()) {
      commentMutation.mutate(
        { messageId: msg.id, content: commentInput.trim() },
        {
          onSuccess: () => setCommentInput(""),
        }
      );
    }
  };

  const handleLike = () => {
    likeMutation.mutate(msg.id);
  };

  const handleDislike = () => {
    dislikeMutation.mutate(msg.id);
  };

  return (
    <div className={`bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 ${meta.border} p-5 hover:shadow-md transition-shadow duration-200`}>
      {/* Header */}
      <div className="flex items-start justify-between gap-2 mb-3">
        <div className="flex items-center gap-3">
          <div className="shrink-0 w-9 h-9 rounded-full bg-[#003366] text-white flex items-center justify-center text-sm font-bold">
            {getInitials(msg.author_name)}
          </div>
          <div>
            <div className="font-semibold text-slate-800 text-sm">{msg.author_name}</div>
            <div className="text-xs text-slate-400">{timeAgo(msg.created_at)}</div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${meta.pill}`}>
            {meta.label}
          </span>
          {isOwner && !editing && (
            <button
              onClick={() => setEditing(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-[#003366] hover:bg-slate-100 transition-colors"
              title="Edit"
            >
              <Pencil size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Content / Edit */}
      {editing ? (
        <div className="mb-3">
          <textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={3}
            className="w-full resize-none rounded-xl border border-[#003366] bg-slate-50 px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[#003366]"
            autoFocus
          />
          <div className="flex gap-2 mt-2 justify-end">
            <button
              onClick={() => { setEditing(false); setEditValue(msg.content); }}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-slate-500 hover:bg-slate-100 text-xs font-medium transition-colors"
              disabled={editMutation.isPending}
            >
              <X size={13} /> Cancel
            </button>
            <button
              onClick={handleSaveEdit}
              disabled={editMutation.isPending}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#003366] text-white text-xs font-medium hover:bg-[#002244] transition-colors disabled:opacity-50"
            >
              {editMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
              Save
            </button>
          </div>
        </div>
      ) : (
        <p className="text-slate-700 text-sm leading-relaxed mb-3">{msg.content}</p>
      )}

      {/* Actions Row */}
      <div className="flex items-center gap-1 border-t border-slate-100 pt-3">
        {/* Like */}
        <button
          onClick={handleLike}
          disabled={likeMutation.isPending}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            hasLiked
              ? "bg-[#003366] text-white"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <ThumbsUp size={13} />
          {msg.likes.length > 0 && <span>{msg.likes.length}</span>}
        </button>

        {/* Dislike */}
        <button
          onClick={handleDislike}
          disabled={dislikeMutation.isPending}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            hasDisliked
              ? "bg-red-100 text-red-600"
              : "text-slate-500 hover:bg-slate-100"
          }`}
        >
          <ThumbsDown size={13} />
          {msg.dislikes.length > 0 && <span>{msg.dislikes.length}</span>}
        </button>

        {/* Comments toggle */}
        <button
          onClick={() => setShowComments((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-500 hover:bg-slate-100 transition-colors ml-1"
        >
          <MessageSquare size={13} />
          {msg.comments.length > 0 && <span>{msg.comments.length}</span>}
          {showComments ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>
      </div>

      {/* Comments Section */}
      {showComments && (
        <div className="mt-3 pl-2 border-l-2 border-slate-100">
          {msg.comments.map((c) => (
            <CommentItem key={c.id} comment={c} />
          ))}

          {/* Add Comment */}
          <div className="flex gap-2 mt-3">
            <div className="shrink-0 w-7 h-7 rounded-full bg-[#003366] text-white flex items-center justify-center text-xs font-bold">
              {getInitials(auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "U")}
            </div>
            <div className="flex-1 flex gap-2">
              <input
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handlePostComment()}
                placeholder="Add a comment..."
                className="flex-1 rounded-xl border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition"
              />
              <button
                onClick={handlePostComment}
                disabled={!commentInput.trim() || commentMutation.isPending}
                className="p-1.5 rounded-lg bg-[#003366] disabled:bg-slate-200 text-white transition-colors"
              >
                {commentMutation.isPending ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Loading Skeleton ──────────────────────────────────────────────────────────
function MessageSkeleton() {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-100 border-l-4 border-l-slate-200 p-5 animate-pulse">
      <div className="flex items-center gap-3 mb-3">
        <div className="w-9 h-9 rounded-full bg-slate-200" />
        <div className="flex-1">
          <div className="h-4 bg-slate-200 rounded w-24 mb-1" />
          <div className="h-3 bg-slate-100 rounded w-16" />
        </div>
      </div>
      <div className="space-y-2 mb-3">
        <div className="h-3 bg-slate-100 rounded w-full" />
        <div className="h-3 bg-slate-100 rounded w-4/5" />
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function MessageBoard() {
  const [content, setContent] = useState("");
  const [category, setCategory] = useState<MessageCategory>("win");

  const { data: messages, isLoading, error } = useMessages(50);
  const createMutation = useCreateMessage();

  const currentUserId = auth.currentUser?.uid || "";

  const handlePost = () => {
    if (!content.trim()) return;
    createMutation.mutate(
      { content: content.trim(), category },
      {
        onSuccess: () => setContent(""),
      }
    );
  };

  return (
    <div className="min-h-screen bg-slate-50 p-6 md:p-10">
      <div className="max-w-2xl mx-auto">

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-1">
            <MessageSquare className="text-[#003366]" size={28} />
            <h1 className="text-3xl font-bold text-[#003366]">Message Board</h1>
          </div>
          <p className="text-slate-500 text-sm ml-10">
            Share your writing wins and gains with the community.
          </p>
        </div>

        {/* Compose */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 mb-8">
          <div className="flex gap-2 mb-3">
            {(Object.entries(CATEGORY_META) as [MessageCategory, typeof CATEGORY_META.win][]).map(([key, meta]) => (
              <button
                key={key}
                onClick={() => setCategory(key)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-150 ${
                  category === key
                    ? meta.pill + " ring-2 ring-offset-1 ring-[#003366]"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {key === "win" ? "Win" : "Gain"}
              </button>
            ))}
          </div>

          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && (e.metaKey || e.ctrlKey) && handlePost()}
            placeholder={
              category === "win"
                ? "Share a writing win — finished a chapter, hit a word goal..."
                : "Share a gain — a new insight, habit improvement, or skill learned..."
            }
            rows={3}
            className="w-full resize-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#003366] focus:border-transparent transition"
          />

          <div className="flex items-center justify-between mt-3">
            <span className="text-xs text-slate-400">Ctrl/Cmd + Enter to post</span>
            <button
              onClick={handlePost}
              disabled={!content.trim() || createMutation.isPending}
              className="flex items-center gap-2 bg-[#003366] hover:bg-[#002244] disabled:bg-slate-300 text-white text-sm font-semibold px-5 py-2 rounded-xl transition-colors duration-150"
            >
              {createMutation.isPending ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
              Post
            </button>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div>
              <p className="text-red-800 font-medium">Failed to load messages</p>
              <p className="text-red-600 text-sm">{error.message}</p>
            </div>
          </div>
        )}

        {/* Create Error State */}
        {createMutation.error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-6 flex items-center gap-3">
            <AlertCircle className="text-red-500" size={20} />
            <div>
              <p className="text-red-800 font-medium">Failed to post message</p>
              <p className="text-red-600 text-sm">{createMutation.error.message}</p>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex flex-col gap-4">
            <MessageSkeleton />
            <MessageSkeleton />
            <MessageSkeleton />
          </div>
        )}

        {/* Feed */}
        {!isLoading && !error && (
          <div className="flex flex-col gap-4">
            {messages && messages.length > 0 ? (
              messages.map((msg) => (
                <MessageCard
                  key={msg.id}
                  msg={msg}
                  currentUserId={currentUserId}
                />
              ))
            ) : (
              <div className="text-center py-12">
                <MessageSquare className="mx-auto text-slate-300 mb-3" size={48} />
                <p className="text-slate-500">No messages yet. Be the first to share!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
