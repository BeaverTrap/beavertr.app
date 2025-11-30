"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AuthButton from "@/components/AuthButton";
import WishlistIcon from "@/components/WishlistIcon";
import ImageCropper from "@/components/ImageCropper";
import { signIn } from "next-auth/react";

interface User {
  id: string;
  name: string;
  email: string;
  image?: string;
  username?: string;
  bio?: string;
  amazonAffiliateTag?: string;
  shippingAddress?: string;
}

interface Wishlist {
  id: string;
  name: string;
  description?: string;
  privacy: string;
  icon?: string;
  color?: string;
}

interface ConnectedAccount {
  provider: string;
  type: string;
  providerAccountId: string;
}

export default function ProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [wishlists, setWishlists] = useState<Wishlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [isOwnProfile, setIsOwnProfile] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [imageToCrop, setImageToCrop] = useState<string | null>(null);
  const [fileToCrop, setFileToCrop] = useState<File | null>(null);
  const [connectedAccounts, setConnectedAccounts] = useState<ConnectedAccount[]>([]);
  const [availableProviders, setAvailableProviders] = useState<{ google: boolean; twitch: boolean; steam: boolean }>({
    google: true,
    twitch: false,
    steam: false,
  });
  const [editForm, setEditForm] = useState({
    username: "",
    bio: "",
    amazonAffiliateTag: "",
    shippingAddress: "",
  });

  useEffect(() => {
    if (session?.user?.email) {
      fetchUserData();
      fetchConnectedAccounts();
      fetchAvailableProviders();
    } else {
      setLoading(false);
    }
  }, [session, status]);

  // Refresh connected accounts when returning to the page (after OAuth redirect)
  useEffect(() => {
    const handleFocus = () => {
      if (session && isOwnProfile) {
        fetchConnectedAccounts();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session, isOwnProfile]);

  const fetchUserData = async () => {
    try {
      const response = await fetch("/api/user/profile");
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
        setIsOwnProfile(true);
        setEditForm({
          username: userData.username || "",
          bio: userData.bio || "",
          amazonAffiliateTag: userData.amazonAffiliateTag || "",
          shippingAddress: userData.shippingAddress || "",
        });
        
        const wishlistsResponse = await fetch(`/api/users/${userData.id}/wishlists`);
        if (wishlistsResponse.ok) {
          const wishlistsData = await wishlistsResponse.json();
          setWishlists(wishlistsData);
        }
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchConnectedAccounts = async () => {
    try {
      const response = await fetch("/api/user/accounts");
      if (response.ok) {
        const data = await response.json();
        setConnectedAccounts(data.accounts || []);
      }
    } catch (error) {
      console.error("Error fetching connected accounts:", error);
    }
  };

  const fetchAvailableProviders = async () => {
    try {
      const response = await fetch("/api/auth/providers");
      if (response.ok) {
        const data = await response.json();
        setAvailableProviders(data.providers || { google: true, twitch: false, steam: false });
      }
    } catch (error) {
      console.error("Error fetching available providers:", error);
    }
  };

  const handleLinkAccount = (provider: string) => {
    // Go directly to linking endpoint which bypasses sign-in page
    window.location.href = `/api/auth/link/${provider}`;
  };

  const isAccountConnected = (provider: string) => {
    return connectedAccounts.some(account => account.provider === provider);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editForm),
      });

      if (response.ok) {
        const updated = await response.json();
        setUser({ ...user!, ...updated });
        setIsEditing(false);
        alert("Profile updated!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save profile");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const imageUrl = event.target?.result as string;
      setImageToCrop(imageUrl);
      setFileToCrop(file);
      setShowCropper(true);
    };
    reader.readAsDataURL(file);
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          {!session ? (
            <>
              <p className="text-zinc-400 mb-4">Please sign in to view your profile</p>
              <AuthButton />
            </>
          ) : (
            <p className="text-zinc-400">Profile not found</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white">
      <nav className="border-b border-zinc-800/50 backdrop-blur-sm bg-zinc-900/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <Link
              href="/"
              className="text-xl font-bold bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent"
            >
              beavertr.app
            </Link>
            <div className="flex items-center gap-6">
              <Link
                href="/wishlist"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                My Wishlists
              </Link>
              <Link
                href="/wishlist/friends"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Friends
              </Link>
              <Link
                href="/wishlist/browse"
                className="text-sm text-zinc-400 hover:text-white transition-colors"
              >
                Browse
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* User Profile Header */}
        <div className="bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 rounded-2xl p-8 mb-8 border border-zinc-700/50 backdrop-blur-sm">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-6">
              {isEditing ? (
                <div className="relative">
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || ""}
                      className="w-32 h-32 rounded-full object-cover border-4 border-zinc-600"
                    />
                  ) : (
                    <div className="w-32 h-32 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-4xl font-bold">
                      {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="avatar-upload"
                  />
                  <label
                    htmlFor="avatar-upload"
                    className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-700 flex items-center justify-center cursor-pointer border-2 border-zinc-900 transition-colors"
                    title="Change profile picture"
                  >
                    📷
                  </label>
                </div>
              ) : (
                user.image ? (
                  <img
                    src={user.image}
                    alt={user.name || ""}
                    className="w-32 h-32 rounded-full object-cover border-4 border-zinc-600"
                  />
                ) : (
                  <div className="w-32 h-32 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400 text-4xl font-bold">
                    {user.name?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase() || "?"}
                  </div>
                )
              )}
              <div className="flex-1">
                {isEditing ? (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Username</label>
                      <input
                        type="text"
                        value={editForm.username}
                        onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                        placeholder="your-username"
                        className="w-full px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-zinc-300">Bio</label>
                      <textarea
                        value={editForm.bio}
                        onChange={(e) => setEditForm({ ...editForm, bio: e.target.value })}
                        placeholder="Tell us about yourself..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
                      />
                    </div>
                  </div>
                ) : (
                  <>
                    <h1 className="text-4xl font-bold mb-2">{user.name || user.email}</h1>
                    {user.username ? (
                      <p className="text-zinc-400 text-lg mb-4">@{user.username}</p>
                    ) : (
                      <p className="text-zinc-500 text-sm mb-4">No username set</p>
                    )}
                    {user.bio ? (
                      <p className="text-zinc-300 text-lg leading-relaxed">{user.bio}</p>
                    ) : (
                      <p className="text-zinc-500 italic">No bio yet</p>
                    )}
                  </>
                )}
              </div>
            </div>
            {isOwnProfile && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white font-semibold transition-all disabled:opacity-50 shadow-lg hover:shadow-xl"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditForm({
                          username: user.username || "",
                          bio: user.bio || "",
                          amazonAffiliateTag: user.amazonAffiliateTag || "",
                          shippingAddress: user.shippingAddress || "",
                        });
                      }}
                      className="px-6 py-3 rounded-xl bg-zinc-700/80 hover:bg-zinc-600/80 text-white font-medium transition-all border border-zinc-600/50"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="px-6 py-3 rounded-xl bg-zinc-700/80 hover:bg-zinc-600/80 text-white font-medium transition-all border border-zinc-600/50 shadow-sm hover:shadow-md"
                  >
                    ✏️ Edit Profile
                  </button>
                )}
              </div>
            )}
          </div>
          
          {/* Profile Stats */}
          <div className="flex gap-8 pt-6 border-t border-zinc-700/50">
            <div className="text-center">
              <div className="text-3xl font-bold text-white">
                {wishlists.filter((w: Wishlist) => w.privacy === 'public').length}
              </div>
              <div className="text-sm text-zinc-400 mt-1">Public Wishlist{wishlists.filter((w: Wishlist) => w.privacy === 'public').length !== 1 ? 's' : ''}</div>
            </div>
            {isOwnProfile && (
              <>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {wishlists.filter((w: Wishlist) => w.privacy === 'private').length}
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">Private Wishlist{wishlists.filter((w: Wishlist) => w.privacy === 'private').length !== 1 ? 's' : ''}</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-white">
                    {wishlists.filter((w: Wishlist) => w.privacy === 'personal').length}
                  </div>
                  <div className="text-sm text-zinc-400 mt-1">Personal Wishlist{wishlists.filter((w: Wishlist) => w.privacy === 'personal').length !== 1 ? 's' : ''}</div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Connected Accounts - Only show when editing own profile */}
        {isOwnProfile && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
            <p className="text-sm text-zinc-400 mb-4">
              Link your accounts to sign in with different providers
            </p>
            
            <div className="space-y-3">
              {/* Google */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/80 border border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Google</p>
                    <p className="text-xs text-zinc-400">
                      {isAccountConnected("google") ? "Connected" : "Not connected"}
                    </p>
                    {!availableProviders.google && (
                      <p className="text-xs text-yellow-400 mt-1">Not configured</p>
                    )}
                  </div>
                </div>
                {isAccountConnected("google") ? (
                  <span className="px-3 py-1 rounded-lg bg-green-600/20 text-green-400 text-sm font-medium">
                    ✓ Connected
                  </span>
                ) : availableProviders.google ? (
                  <button
                    type="button"
                    onClick={() => handleLinkAccount("google")}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    Connect
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-yellow-600/20 text-yellow-400 text-sm font-medium">
                    Not Available
                  </span>
                )}
              </div>

              {/* Twitch */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/80 border border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#9146FF] flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M11.571 4.714h1.715v5.143H11.57zm4.715 0H18v5.143h-1.714zM6 0L1.714 4.286v15.428h5.143V24l4.286-4.286h3.428L22.286 12V0zm14.571 11.143l-3.428 3.428h-3.429l-3 3v-3H6.857V1.714h13.714Z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Twitch</p>
                    <p className="text-xs text-zinc-400">
                      {isAccountConnected("twitch") ? "Connected" : availableProviders.twitch ? "Not connected" : "Not configured"}
                    </p>
                    {!availableProviders.twitch && (
                      <p className="text-xs text-yellow-400 mt-1">See ADD_CREDENTIALS_GUIDE.md</p>
                    )}
                  </div>
                </div>
                {isAccountConnected("twitch") ? (
                  <span className="px-3 py-1 rounded-lg bg-green-600/20 text-green-400 text-sm font-medium">
                    ✓ Connected
                  </span>
                ) : availableProviders.twitch ? (
                  <button
                    type="button"
                    onClick={() => handleLinkAccount("twitch")}
                    className="px-4 py-2 rounded-lg bg-[#9146FF] hover:bg-[#7c3ae0] text-white text-sm font-medium transition-colors"
                  >
                    Connect
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-yellow-600/20 text-yellow-400 text-sm font-medium">
                    Not Available
                  </span>
                )}
              </div>

              {/* Steam */}
              <div className="flex items-center justify-between p-4 rounded-xl bg-zinc-900/80 border border-zinc-700/50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-[#171a21] border border-zinc-700 flex items-center justify-center">
                    <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm0 22c-5.514 0-10-4.486-10-10S6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/>
                      <path d="M8.5 10.5c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5zm7 0c-.828 0-1.5.672-1.5 1.5s.672 1.5 1.5 1.5 1.5-.672 1.5-1.5-.672-1.5-1.5-1.5z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">Steam</p>
                    <p className="text-xs text-zinc-400">
                      {isAccountConnected("steam") ? "Connected" : availableProviders.steam ? "Not connected" : "Not configured"}
                    </p>
                    {!availableProviders.steam && (
                      <p className="text-xs text-yellow-400 mt-1">See ADD_CREDENTIALS_GUIDE.md</p>
                    )}
                  </div>
                </div>
                {isAccountConnected("steam") ? (
                  <span className="px-3 py-1 rounded-lg bg-green-600/20 text-green-400 text-sm font-medium">
                    ✓ Connected
                  </span>
                ) : availableProviders.steam ? (
                  <button
                    type="button"
                    onClick={() => handleLinkAccount("steam")}
                    className="px-4 py-2 rounded-lg bg-[#171a21] hover:bg-[#1b2838] text-white text-sm font-medium transition-colors border border-zinc-700"
                  >
                    Connect
                  </button>
                ) : (
                  <span className="px-3 py-1 rounded-lg bg-yellow-600/20 text-yellow-400 text-sm font-medium">
                    Not Available
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Additional Settings - Only when editing own profile */}
        {isOwnProfile && isEditing && (
          <div className="mb-8 p-6 rounded-2xl bg-gradient-to-br from-zinc-800/50 to-zinc-900/50 border border-zinc-700/50 backdrop-blur-sm">
            <h2 className="text-xl font-semibold mb-4">Additional Settings</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Amazon Affiliate Tag</label>
                <input
                  type="text"
                  value={editForm.amazonAffiliateTag}
                  onChange={(e) => setEditForm({ ...editForm, amazonAffiliateTag: e.target.value })}
                  placeholder="your-tag-20"
                  className="w-full px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 transition-all"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Your Amazon Associates affiliate tag (e.g., "beavertr-20")
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2 text-zinc-300">Shipping Address</label>
                <textarea
                  value={editForm.shippingAddress}
                  onChange={(e) => setEditForm({ ...editForm, shippingAddress: e.target.value })}
                  placeholder="Your shipping address (optional)"
                  rows={4}
                  className="w-full px-4 py-2 rounded-xl bg-zinc-900/80 border border-zinc-700/50 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500/50 resize-none transition-all"
                />
                <div className="mt-2 p-3 rounded-lg bg-yellow-900/20 border border-yellow-800/50">
                  <p className="text-xs text-yellow-200">
                    <strong className="text-yellow-100">⚠️ Privacy Notice:</strong> If your wishlist is set to <strong>Public</strong>, this address will be visible to everyone.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Wishlists Section */}
        <div className="mb-8">
          {/* Public Wishlists */}
          {wishlists.filter((w: Wishlist) => w.privacy === 'public').length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Public Wishlists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlists
                  .filter((w: Wishlist) => w.privacy === 'public')
                  .map((wishlist) => (
                    <Link
                      key={wishlist.id}
                      href={user.username ? `/wishlist/user/${user.username}` : `/wishlist/user/${user.id}`}
                      className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 hover:border-zinc-600 transition-all hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {wishlist.icon && wishlist.color && (
                          <WishlistIcon icon={wishlist.icon} color={wishlist.color} size={24} />
                        )}
                        <h3 className="text-xl font-semibold">{wishlist.name}</h3>
                      </div>
                      {wishlist.description && (
                        <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{wishlist.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-zinc-500">
                        <span className="capitalize px-2 py-1 rounded bg-green-600/20 text-green-400">Public</span>
                        <span className="text-zinc-400 hover:text-white transition-colors">View →</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Private Wishlists (only for owner or friends) */}
          {wishlists.filter((w: Wishlist) => w.privacy === 'private').length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">
                Private Wishlists
                {!isOwnProfile && (
                  <span className="text-sm text-zinc-400 font-normal ml-2">(Friends Only)</span>
                )}
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlists
                  .filter((w: Wishlist) => w.privacy === 'private')
                  .map((wishlist) => (
                    <Link
                      key={wishlist.id}
                      href={user.username ? `/wishlist/user/${user.username}` : `/wishlist/user/${user.id}`}
                      className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 hover:border-zinc-600 transition-all hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {wishlist.icon && wishlist.color && (
                          <WishlistIcon icon={wishlist.icon} color={wishlist.color} size={24} />
                        )}
                        <h3 className="text-xl font-semibold">{wishlist.name}</h3>
                      </div>
                      {wishlist.description && (
                        <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{wishlist.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-zinc-500">
                        <span className="capitalize px-2 py-1 rounded bg-yellow-600/20 text-yellow-400">Private</span>
                        <span className="text-zinc-400 hover:text-white transition-colors">View →</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* Personal Wishlists (only for owner) */}
          {isOwnProfile && wishlists.filter((w: Wishlist) => w.privacy === 'personal').length > 0 && (
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-4">Personal Wishlists</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {wishlists
                  .filter((w: Wishlist) => w.privacy === 'personal')
                  .map((wishlist) => (
                    <Link
                      key={wishlist.id}
                      href={user.username ? `/wishlist/user/${user.username}` : `/wishlist/user/${user.id}`}
                      className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700 hover:border-zinc-600 transition-all hover:bg-zinc-800"
                    >
                      <div className="flex items-center gap-3 mb-2">
                        {wishlist.icon && wishlist.color && (
                          <WishlistIcon icon={wishlist.icon} color={wishlist.color} size={24} />
                        )}
                        <h3 className="text-xl font-semibold">{wishlist.name}</h3>
                      </div>
                      {wishlist.description && (
                        <p className="text-zinc-400 text-sm mb-3 line-clamp-2">{wishlist.description}</p>
                      )}
                      <div className="flex items-center justify-between text-sm text-zinc-500">
                        <span className="capitalize px-2 py-1 rounded bg-red-600/20 text-red-400">Personal</span>
                        <span className="text-zinc-400 hover:text-white transition-colors">View →</span>
                      </div>
                    </Link>
                  ))}
              </div>
            </div>
          )}

          {/* No Wishlists Message */}
          {wishlists.length === 0 && (
            <div className="bg-zinc-800/50 rounded-lg p-12 border border-zinc-700 text-center">
              <p className="text-zinc-400 mb-4">
                {isOwnProfile 
                  ? "You don't have any wishlists yet." 
                  : "This user doesn't have any wishlists visible to you."}
              </p>
              {isOwnProfile && (
                <Link 
                  href="/wishlist" 
                  className="text-white hover:underline font-medium"
                >
                  Create a wishlist →
                </Link>
              )}
            </div>
          )}
        </div>

        {/* Account Information - Only for own profile */}
        {isOwnProfile && !isEditing && (
          <div className="bg-zinc-800/50 rounded-lg p-6 border border-zinc-700">
            <h3 className="text-lg font-semibold mb-4">Account Information</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-400">Email:</span>
                <span className="text-white">{user.email || "Not set"}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          originalFile={fileToCrop || undefined}
          onCropComplete={async (croppedImageUrl, mimeType) => {
            try {
              const response = await fetch(croppedImageUrl);
              const blob = await response.blob();
              
              let extension = 'jpg';
              if (mimeType === 'image/gif') extension = 'gif';
              else if (mimeType === 'image/png') extension = 'png';
              else if (mimeType === 'image/webp') extension = 'webp';
              
              const formData = new FormData();
              formData.append("file", blob, `cropped-avatar.${extension}`);

              const uploadResponse = await fetch("/api/user/upload-avatar", {
                method: "POST",
                body: formData,
              });

              if (uploadResponse.ok) {
                const data = await uploadResponse.json();
                setUser({ ...user!, image: data.imageUrl });
                setShowCropper(false);
                setImageToCrop(null);
                setFileToCrop(null);
                alert("Profile picture updated!");
              } else {
                const error = await uploadResponse.json();
                alert(error.error || "Failed to upload image");
              }
            } catch (error) {
              console.error("Error uploading cropped image:", error);
              alert("Error uploading image");
            }
          }}
          onCancel={() => {
            setShowCropper(false);
            setImageToCrop(null);
            setFileToCrop(null);
          }}
        />
      )}
    </div>
  );
}
