"use client";

import { useState, useEffect } from "react";
import { signIn, signOut } from "next-auth/react";
import { useSession } from "next-auth/react";
import Link from "next/link";

export default function AuthButton() {
  const { data: session, status } = useSession();
  const [username, setUsername] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    if (session?.user?.email) {
      // Fetch user profile to get username and correct user ID
      // This endpoint finds user by email, so it always works
      fetch("/api/user/profile")
        .then(res => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then(data => {
          if (data) {
            if (data.username) {
              setUsername(data.username);
            }
            // Use the database user ID, not the session user ID
            if (data.id) {
              setUserId(data.id);
              console.log("AuthButton: Got database user ID:", data.id);
            }
          }
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
        });
    }
  }, [session]);

  if (status === "loading") {
    return <div className="text-white/50 text-sm">Loading...</div>;
  }

  if (session) {
    const displayName = session.user?.name || session.user?.email || "User";
    // Use simple /profile route that always works for the current user
    const profileUrl = "/profile";
    
    // Debug logging
    console.log("AuthButton - Session:", {
      sessionUserId: session.user?.id,
      databaseUserId: userId,
      email: session.user?.email,
      username: username,
      profileUrl: profileUrl
    });

    return (
      <div className="flex items-center gap-4">
        {profileUrl ? (
          <Link
            href={profileUrl}
            className="text-white/70 hover:text-white text-sm transition-colors cursor-pointer"
          >
            {displayName}
          </Link>
        ) : (
          <span className="text-white/70 text-sm">{displayName}</span>
        )}
        <button
          onClick={() => signOut()}
          className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
        >
          Sign out
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => signIn("google", { callbackUrl: window.location.href })}
      className="px-4 py-2 text-white/70 hover:text-white text-sm transition-colors"
    >
      Sign in
    </button>
  );
}



