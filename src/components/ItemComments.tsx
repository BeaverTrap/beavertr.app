"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FaComment, FaTrash, FaEdit, FaReply } from "react-icons/fa";

interface Comment {
  id: string;
  itemId: string;
  userId: string;
  content: string;
  parentId?: string | null;
  createdAt: string;
  updatedAt: string;
  user?: {
    id: string;
    name?: string | null;
    image?: string | null;
  };
}

interface ItemCommentsProps {
  itemId: string;
  isOwner?: boolean;
}

export default function ItemComments({ itemId, isOwner = false }: ItemCommentsProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showComments, setShowComments] = useState(false);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  useEffect(() => {
    if (showComments) {
      fetchComments();
    }
  }, [showComments, itemId]);

  const fetchComments = async () => {
    try {
      const response = await fetch(`/api/wishlist/comments?itemId=${itemId}`);
      if (response.ok) {
        const data = await response.json();
        // Fetch user info for each comment
        const commentsWithUsers = await Promise.all(
          data.comments.map(async (comment: Comment) => {
            try {
              const userResponse = await fetch(`/api/user/${comment.userId}`);
              if (userResponse.ok) {
                const userData = await userResponse.json();
                return { ...comment, user: userData.user };
              }
            } catch (error) {
              console.error("Error fetching user:", error);
            }
            return comment;
          })
        );
        setComments(commentsWithUsers);
      }
    } catch (error) {
      console.error("Error fetching comments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async () => {
    if (!session?.user?.id || !newComment.trim()) return;

    try {
      const response = await fetch("/api/wishlist/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          content: newComment.trim(),
          parentId: replyingTo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Fetch user info for the new comment
        try {
          const userResponse = await fetch(`/api/user/${session.user.id}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setComments([{ ...data.comment, user: userData.user }, ...comments]);
          } else {
            setComments([data.comment, ...comments]);
          }
        } catch (error) {
          setComments([data.comment, ...comments]);
        }
        setNewComment("");
        setReplyingTo(null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add comment");
      }
    } catch (error) {
      console.error("Error adding comment:", error);
      alert("Error adding comment");
    }
  };

  const handleReply = async () => {
    if (!session?.user?.id || !replyContent.trim() || !replyingTo) return;

    try {
      const response = await fetch("/api/wishlist/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemId,
          content: replyContent.trim(),
          parentId: replyingTo,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        // Fetch user info for the new reply
        try {
          const userResponse = await fetch(`/api/user/${session.user.id}`);
          if (userResponse.ok) {
            const userData = await userResponse.json();
            setComments([{ ...data.comment, user: userData.user }, ...comments]);
          } else {
            setComments([data.comment, ...comments]);
          }
        } catch (error) {
          setComments([data.comment, ...comments]);
        }
        setReplyContent("");
        setReplyingTo(null);
      } else {
        const error = await response.json();
        alert(error.error || "Failed to add reply");
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      alert("Error adding reply");
    }
  };

  const handleEdit = async (commentId: string) => {
    if (!editContent.trim()) return;

    try {
      const response = await fetch("/api/wishlist/comments", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          commentId,
          content: editContent.trim(),
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setComments(
          comments.map((c) => (c.id === commentId ? { ...c, ...data.comment } : c))
        );
        setEditingId(null);
        setEditContent("");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to update comment");
      }
    } catch (error) {
      console.error("Error updating comment:", error);
      alert("Error updating comment");
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const response = await fetch(`/api/wishlist/comments?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setComments(comments.filter((c) => c.id !== commentId));
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete comment");
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      alert("Error deleting comment");
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  const topLevelComments = comments.filter((c) => !c.parentId);
  const repliesByParent: Record<string, Comment[]> = {};
  comments.filter((c) => c.parentId).forEach((reply) => {
    if (!repliesByParent[reply.parentId!]) {
      repliesByParent[reply.parentId!] = [];
    }
    repliesByParent[reply.parentId!].push(reply);
  });

  return (
    <div className="mt-3">
      <button
        onClick={() => setShowComments(!showComments)}
        className="flex items-center gap-2 text-sm text-zinc-400 hover:text-zinc-300 transition-colors"
      >
        <FaComment />
        <span>
          {comments.length} {comments.length === 1 ? "comment" : "comments"}
        </span>
      </button>

      {showComments && (
        <div className="mt-3 space-y-3">
          {/* Add Comment Form */}
          {session && (
            <div className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
              <textarea
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="Add a comment..."
                className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                rows={2}
              />
              <div className="flex justify-end gap-2 mt-2">
                <button
                  onClick={handleAddComment}
                  disabled={!newComment.trim()}
                  className="px-3 py-1.5 rounded bg-blue-600 hover:bg-blue-700 text-white text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Post
                </button>
              </div>
            </div>
          )}

          {/* Comments List */}
          {loading ? (
            <p className="text-sm text-zinc-500">Loading comments...</p>
          ) : topLevelComments.length === 0 ? (
            <p className="text-sm text-zinc-500">No comments yet. Be the first to comment!</p>
          ) : (
            <div className="space-y-3">
              {topLevelComments.map((comment) => {
                const isOwner = session?.user?.id === comment.userId;
                const isEditing = editingId === comment.id;
                const replies = repliesByParent[comment.id] || [];

                return (
                  <div key={comment.id} className="p-3 rounded-lg bg-zinc-800/50 border border-zinc-700">
                    <div className="flex items-start gap-2">
                      {comment.user?.image ? (
                        <img
                          src={comment.user.image}
                          alt={comment.user.name || "User"}
                          className="w-8 h-8 rounded-full"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                          {comment.user?.name?.[0]?.toUpperCase() || "?"}
                        </div>
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium text-white">
                            {comment.user?.name || "Anonymous"}
                          </span>
                          <span className="text-xs text-zinc-500">
                            {formatDate(comment.createdAt)}
                          </span>
                        </div>

                        {isEditing ? (
                          <div>
                            <textarea
                              value={editContent}
                              onChange={(e) => setEditContent(e.target.value)}
                              className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none"
                              rows={2}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleEdit(comment.id)}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => {
                                  setEditingId(null);
                                  setEditContent("");
                                }}
                                className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className="text-sm text-zinc-300 whitespace-pre-wrap">
                            {comment.content}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-2">
                          {session && !isEditing && (
                            <>
                              <button
                                onClick={() => {
                                  setReplyingTo(comment.id);
                                  setReplyContent("");
                                }}
                                className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
                              >
                                <FaReply />
                                Reply
                              </button>
                              {isOwner && (
                                <>
                                  <button
                                    onClick={() => {
                                      setEditingId(comment.id);
                                      setEditContent(comment.content);
                                    }}
                                    className="flex items-center gap-1 text-xs text-zinc-400 hover:text-zinc-300 transition-colors"
                                  >
                                    <FaEdit />
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDelete(comment.id)}
                                    className="flex items-center gap-1 text-xs text-red-400 hover:text-red-300 transition-colors"
                                  >
                                    <FaTrash />
                                    Delete
                                  </button>
                                </>
                              )}
                            </>
                          )}
                        </div>

                        {/* Reply Form */}
                        {replyingTo === comment.id && (
                          <div className="mt-3 p-2 rounded bg-zinc-900/50 border border-zinc-700">
                            <textarea
                              value={replyContent}
                              onChange={(e) => setReplyContent(e.target.value)}
                              placeholder="Write a reply..."
                              className="w-full p-2 rounded bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 resize-none text-sm"
                              rows={2}
                            />
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={handleReply}
                                disabled={!replyContent.trim()}
                                className="px-2 py-1 rounded bg-blue-600 hover:bg-blue-700 text-white text-xs disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Reply
                              </button>
                              <button
                                onClick={() => {
                                  setReplyingTo(null);
                                  setReplyContent("");
                                }}
                                className="px-2 py-1 rounded bg-zinc-700 hover:bg-zinc-600 text-white text-xs"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {/* Replies */}
                        {replies.length > 0 && (
                          <div className="mt-3 ml-4 space-y-2 border-l-2 border-zinc-700 pl-3">
                            {replies.map((reply) => {
                              const isReplyOwner = session?.user?.id === reply.userId;
                              return (
                                <div key={reply.id} className="p-2 rounded bg-zinc-900/50">
                                  <div className="flex items-center gap-2 mb-1">
                                    {reply.user?.image ? (
                                      <img
                                        src={reply.user.image}
                                        alt={reply.user.name || "User"}
                                        className="w-6 h-6 rounded-full"
                                      />
                                    ) : (
                                      <div className="w-6 h-6 rounded-full bg-zinc-700 flex items-center justify-center text-xs text-zinc-400">
                                        {reply.user?.name?.[0]?.toUpperCase() || "?"}
                                      </div>
                                    )}
                                    <span className="text-xs font-medium text-white">
                                      {reply.user?.name || "Anonymous"}
                                    </span>
                                    <span className="text-xs text-zinc-500">
                                      {formatDate(reply.createdAt)}
                                    </span>
                                    {isReplyOwner && (
                                      <button
                                        onClick={() => handleDelete(reply.id)}
                                        className="ml-auto text-xs text-red-400 hover:text-red-300"
                                      >
                                        <FaTrash />
                                      </button>
                                    )}
                                  </div>
                                  <p className="text-xs text-zinc-300 whitespace-pre-wrap">
                                    {reply.content}
                                  </p>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}



