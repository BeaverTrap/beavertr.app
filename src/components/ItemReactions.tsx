"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { FaThumbsUp, FaHeart, FaStar, FaCheckCircle } from "react-icons/fa";

interface Reaction {
  id: string;
  itemId: string;
  userId: string;
  type: string;
  createdAt: string;
}

interface ItemReactionsProps {
  itemId: string;
}

const REACTION_TYPES = [
  { type: "like", icon: FaThumbsUp, label: "Like", color: "text-blue-400" },
  { type: "love", icon: FaHeart, label: "Love", color: "text-red-400" },
  { type: "want", icon: FaStar, label: "Want", color: "text-yellow-400" },
  { type: "helpful", icon: FaCheckCircle, label: "Helpful", color: "text-green-400" },
];

export default function ItemReactions({ itemId }: ItemReactionsProps) {
  const { data: session } = useSession();
  const [reactionCounts, setReactionCounts] = useState<Record<string, number>>({});
  const [userReactions, setUserReactions] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReactions();
  }, [itemId]);

  const fetchReactions = async () => {
    try {
      const response = await fetch(`/api/wishlist/reactions?itemId=${itemId}`);
      if (response.ok) {
        const data = await response.json();
        setReactionCounts(data.counts || {});
        setUserReactions(data.userReactions || {});
      }
    } catch (error) {
      console.error("Error fetching reactions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleReaction = async (type: string) => {
    if (!session?.user?.id) {
      alert("Please sign in to react");
      return;
    }

    try {
      const response = await fetch("/api/wishlist/reactions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ itemId, type }),
      });

      if (response.ok) {
        const data = await response.json();
        // Update local state
        const currentUserReactions = userReactions[session.user.id] || [];
        const hasReaction = currentUserReactions.includes(type);

        if (data.action === "removed") {
          // Remove reaction
          const newUserReactions = { ...userReactions };
          if (newUserReactions[session.user.id]) {
            newUserReactions[session.user.id] = newUserReactions[session.user.id].filter(
              (t) => t !== type
            );
          }
          setUserReactions(newUserReactions);
          setReactionCounts({
            ...reactionCounts,
            [type]: Math.max(0, (reactionCounts[type] || 0) - 1),
          });
        } else {
          // Add reaction
          const newUserReactions = { ...userReactions };
          if (!newUserReactions[session.user.id]) {
            newUserReactions[session.user.id] = [];
          }
          if (!newUserReactions[session.user.id].includes(type)) {
            newUserReactions[session.user.id].push(type);
          }
          setUserReactions(newUserReactions);
          setReactionCounts({
            ...reactionCounts,
            [type]: (reactionCounts[type] || 0) + 1,
          });
        }
      } else {
        const error = await response.json();
        alert(error.error || "Failed to toggle reaction");
      }
    } catch (error) {
      console.error("Error toggling reaction:", error);
      alert("Error toggling reaction");
    }
  };

  const isReacted = (type: string) => {
    if (!session?.user?.id) return false;
    return userReactions[session.user.id]?.includes(type) || false;
  };

  if (loading) {
    return <div className="h-8" />;
  }

  const hasAnyReactions = Object.values(reactionCounts).some((count) => count > 0);

  if (!hasAnyReactions && !session) {
    return null;
  }

  return (
    <div className="flex items-center gap-3 mt-2 flex-wrap">
      {REACTION_TYPES.map(({ type, icon: Icon, label, color }) => {
        const count = reactionCounts[type] || 0;
        const reacted = isReacted(type);

        return (
          <button
            key={type}
            onClick={() => handleToggleReaction(type)}
            disabled={!session}
            className={`flex items-center gap-1.5 px-2 py-1 rounded-full transition-colors ${
              reacted
                ? "bg-zinc-700 hover:bg-zinc-600"
                : "bg-zinc-800/50 hover:bg-zinc-700/50"
            } ${!session ? "opacity-50 cursor-not-allowed" : "cursor-pointer"}`}
            title={label}
          >
            <Icon
              className={`${reacted ? color : "text-zinc-400"} ${
                reacted ? "fill-current" : ""
              }`}
              size={14}
            />
            {count > 0 && (
              <span className={`text-xs ${reacted ? color : "text-zinc-400"}`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}




