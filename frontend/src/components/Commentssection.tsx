import { useEffect, useState, useCallback, useRef } from "react";
import { useAuthStore } from "../store/authStore";
import {
  getVideoComments,
  addComment,
  updateComment,
  deleteComment,
  type Comment,
  type CommentsPage,
} from "../api/comments.api";
import { Trash2, Pencil, X, Check, MessageSquare, MoreVertical } from "lucide-react";

// ── helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1) return "Today";
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  if (days < 365) return `${Math.floor(days / 30)} months ago`;
  return `${Math.floor(days / 365)} years ago`;
}

// ── 3-dot dropdown ────────────────────────────────────────────────────────────

function CommentMenu({
  onEdit,
  onDelete,
  deleting,
}: {
  onEdit: () => void;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative shrink-0">
      <button
        onClick={() => setOpen((o) => !o)}
        className="p-1.5 rounded-full hover:bg-zinc-800 text-zinc-500 hover:text-white transition-colors"
        title="More options"
      >
        <MoreVertical size={16} />
      </button>

      {open && (
        <div className="absolute right-0 top-8 z-20 w-36 bg-zinc-800 border border-zinc-700 rounded-xl shadow-xl overflow-hidden">
          <button
            onClick={() => { setOpen(false); onEdit(); }}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-white hover:bg-zinc-700 transition-colors"
          >
            <Pencil size={14} className="text-zinc-400" />
            Edit
          </button>
          <button
            onClick={() => { setOpen(false); onDelete(); }}
            disabled={deleting}
            className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-zinc-700 transition-colors disabled:opacity-40"
          >
            <Trash2 size={14} />
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      )}
    </div>
  );
}

// ── component ─────────────────────────────────────────────────────────────────

interface Props {
  videoId: string;
}

export default function CommentsSection({ videoId }: Props) {
  const user = useAuthStore((s) => s.user);
  const isLoggedIn = !!user;
  const currentUserId = user?._id ?? null;

  // comments
  const [comments, setComments] = useState<Comment[]>([]);
  const [page, setPage] = useState(1);
  const [hasNext, setHasNext] = useState(false);
  const [totalDocs, setTotalDocs] = useState(0);
  const [loadingComments, setLoadingComments] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [commentError, setCommentError] = useState<string | null>(null);

  // new comment — YouTube-style single line that expands on focus
  const [inputFocused, setInputFocused] = useState(false);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // edit
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");
  const [editSubmitting, setEditSubmitting] = useState(false);

  // delete
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // ── fetch ──────────────────────────────────────────────────────────────────

  const fetchComments = useCallback(
    async (pageNum: number, append = false) => {
      try {
        append ? setLoadingMore(true) : setLoadingComments(true);
        setCommentError(null);
        const result: CommentsPage = await getVideoComments(videoId, pageNum, 10);
        setComments((prev) => (append ? [...prev, ...result.docs] : result.docs));
        setHasNext(result.hasNextPage);
        setTotalDocs(result.totalDocs);
        setPage(pageNum);
      } catch (err: any) {
        setCommentError(err?.response?.data?.message ?? "Failed to load comments");
      } finally {
        setLoadingComments(false);
        setLoadingMore(false);
      }
    },
    [videoId]
  );

  useEffect(() => {
    fetchComments(1);
  }, [fetchComments]);

  // ── handlers ───────────────────────────────────────────────────────────────

  async function handleSubmit() {
    if (!newContent.trim()) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const comment = await addComment(videoId, newContent.trim());

      // fix: if avatar is missing from the returned comment owner (backend
      // doesn't populate on create), patch it in from the local auth store
      const enriched: Comment = {
        ...comment,
        owner: {
          ...comment.owner,
          avatar: comment.owner.avatar || user?.avatar || "",
          username: comment.owner.username || user?.username || "",
        },
      };

      setComments((prev) => [enriched, ...prev]);
      setTotalDocs((n) => n + 1);
      setNewContent("");
      setInputFocused(false);
    } catch (err: any) {
      setSubmitError(err?.response?.data?.message ?? "Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  function handleCancelInput() {
    setNewContent("");
    setInputFocused(false);
    setSubmitError(null);
  }

  async function handleEdit(commentId: string) {
    if (!editContent.trim()) return;
    setEditSubmitting(true);
    try {
      const updated = await updateComment(commentId, editContent.trim());
      setComments((prev) =>
        prev.map((c) => (c._id === commentId ? { ...c, content: updated.content } : c))
      );
      setEditingId(null);
    } catch {
      // keep open so user can retry
    } finally {
      setEditSubmitting(false);
    }
  }

  async function handleDelete(commentId: string) {
    setDeletingId(commentId);
    try {
      await deleteComment(commentId);
      setComments((prev) => prev.filter((c) => c._id !== commentId));
      setTotalDocs((n) => n - 1);
    } catch {
      // ignore
    } finally {
      setDeletingId(null);
    }
  }

  // ── render ─────────────────────────────────────────────────────────────────

  return (
    <div className="mt-6">
      {/* header */}
      <div className="flex items-center gap-2 mb-5">
        <MessageSquare size={18} className="text-zinc-400" />
        <h2 className="text-white font-semibold text-base">
          {totalDocs} Comment{totalDocs !== 1 ? "s" : ""}
        </h2>
      </div>

      {/* ── comment input ── */}
      {isLoggedIn ? (
        <div className="flex gap-3 mb-7">
          {/* current user avatar */}
          <img
            src={user.avatar}
            alt={user.username}
            className="w-8 h-8 rounded-full object-cover bg-zinc-700 shrink-0 mt-1"
          />

          <div className="flex-1 min-w-0">
            {/* single-line input that expands on focus */}
            <input
              type="text"
              value={newContent}
              onChange={(e) => setNewContent(e.target.value)}
              onFocus={() => setInputFocused(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSubmit(); }
                if (e.key === "Escape") handleCancelInput();
              }}
              placeholder="Add a comment…"
              className="w-full bg-transparent border-b border-zinc-600 focus:border-white text-white text-sm placeholder-zinc-500 pb-1 outline-none transition-colors"
            />

            {/* action buttons — only shown when focused */}
            {inputFocused && (
              <div className="flex justify-end gap-2 mt-3">
                <button
                  onClick={handleCancelInput}
                  className="text-zinc-400 hover:text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={submitting || !newContent.trim()}
                  className="bg-zinc-100 hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed text-black text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                >
                  {submitting ? "Posting…" : "Comment"}
                </button>
              </div>
            )}
            {submitError && (
              <p className="text-red-400 text-xs mt-1">{submitError}</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mb-6 px-4 py-3 bg-zinc-900 border border-zinc-800 rounded-xl text-sm text-zinc-400">
          <span
            className="text-white underline underline-offset-2 cursor-pointer hover:text-zinc-200"
            onClick={() => (window.location.href = "/login")}
          >
            Sign in
          </span>{" "}
          to join the conversation.
        </div>
      )}

      {/* ── comment list ── */}
      {loadingComments ? (
        <div className="flex justify-center py-8">
          <div className="w-6 h-6 border-2 border-zinc-600 border-t-red-500 rounded-full animate-spin" />
        </div>
      ) : commentError ? (
        <p className="text-red-400 text-sm">{commentError}</p>
      ) : comments.length === 0 ? (
        <p className="text-zinc-500 text-sm">No comments yet. Be the first!</p>
      ) : (
        <ul className="flex flex-col gap-5">
          {comments.map((c) => {
            const isOwner = !!currentUserId && c.owner._id === currentUserId;
            const isEditing = editingId === c._id;

            return (
              <li key={c._id} className="flex gap-3">
                {/* avatar — always visible, no lazy load flash */}
                <img
                  src={c.owner.avatar}
                  alt={c.owner.username}
                  className="w-8 h-8 rounded-full object-cover bg-zinc-700 shrink-0 mt-0.5"
                  loading="eager"
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-white text-sm font-medium">
                      {c.owner.username}
                    </span>
                    <span className="text-zinc-500 text-xs">{timeAgo(c.createdAt)}</span>
                  </div>

                  {isEditing ? (
                    <div className="mt-1.5">
                      <input
                        type="text"
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleEdit(c._id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                        className="w-full bg-transparent border-b border-zinc-500 focus:border-white text-white text-sm pb-1 outline-none transition-colors"
                      />
                      <div className="flex justify-end gap-2 mt-3">
                        <button
                          onClick={() => setEditingId(null)}
                          className="text-zinc-400 hover:text-white text-xs font-medium px-4 py-2 rounded-full hover:bg-zinc-800 transition-colors"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleEdit(c._id)}
                          disabled={editSubmitting || !editContent.trim()}
                          className="bg-zinc-100 hover:bg-white disabled:opacity-40 text-black text-xs font-semibold px-4 py-2 rounded-full transition-colors"
                        >
                          {editSubmitting ? "Saving…" : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-zinc-300 text-sm mt-1 leading-relaxed break-words">
                      {c.content}
                    </p>
                  )}
                </div>

                {/* 3-dot menu — only for comment owner */}
                {isOwner && !isEditing && (
                  <CommentMenu
                    onEdit={() => { setEditingId(c._id); setEditContent(c.content); }}
                    onDelete={() => handleDelete(c._id)}
                    deleting={deletingId === c._id}
                  />
                )}
              </li>
            );
          })}
        </ul>
      )}

      {hasNext && (
        <button
          onClick={() => fetchComments(page + 1, true)}
          disabled={loadingMore}
          className="mt-6 w-full py-2.5 text-sm text-zinc-400 hover:text-white border border-zinc-700 hover:border-zinc-500 rounded-xl transition-colors disabled:opacity-40"
        >
          {loadingMore ? "Loading…" : "Load more comments"}
        </button>
      )}
    </div>
  );
}
