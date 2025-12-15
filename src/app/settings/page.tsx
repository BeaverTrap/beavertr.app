"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    // Redirect to profile page (which now has all the settings)
    if (status !== "loading") {
      router.push("/profile");
    }
  }, [status, router]);

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

  // Refresh connected accounts when returning to the page (after OAuth redirect)
  useEffect(() => {
    const handleFocus = () => {
      if (session) {
        fetchConnectedAccounts();
      }
    };
    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [session]);

  const fetchSettings = async () => {
    try {
      const response = await fetch("/api/user/settings");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
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

  const handleLinkAccount = async (provider: string) => {
    try {
      console.log(`Attempting to link ${provider} account...`);
      
      // Check if provider is available by trying to get the sign-in URL
      const signInUrl = `/api/auth/signin/${provider}`;
      
      // Sign in with the provider - NextAuth will automatically link if user is already logged in
      const result = await signIn(provider, {
        callbackUrl: `${window.location.origin}/settings`,
        redirect: false,
      });
      
      console.log(`Sign in result for ${provider}:`, result);
      
      if (result?.error) {
        console.error(`Error signing in with ${provider}:`, result.error);
        if (result.error === "Configuration" || result.error.includes("not found")) {
          alert(
            `${provider} is not configured.\n\n` +
            `To enable ${provider} login:\n` +
            `1. Get your ${provider === "twitch" ? "Twitch Client ID and Secret from https://dev.twitch.tv/console" : "Steam API Key from https://steamcommunity.com/dev/apikey"}\n` +
            `2. Add them to your .env.local file\n` +
            `3. Restart your development server`
          );
        } else {
          alert(`Failed to connect ${provider}: ${result.error}`);
        }
        return;
      }
      
      // If successful, redirect to the OAuth provider
      if (result?.ok !== false) {
        // Redirect to the provider's OAuth page
        window.location.href = signInUrl + `?callbackUrl=${encodeURIComponent(`${window.location.origin}/settings`)}`;
      } else {
        alert(`Failed to connect ${provider}. Please try again.`);
      }
    } catch (error: any) {
      console.error(`Error linking ${provider}:`, error);
      alert(`Failed to link ${provider} account: ${error.message || 'Unknown error'}\n\nPlease check the browser console for details.`);
    }
  };

  const isAccountConnected = (provider: string) => {
    return connectedAccounts.some(account => account.provider === provider);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch("/api/user/settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        alert("Settings saved!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to save settings");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-zinc-400 mb-4">Please sign in to access settings</p>
          <AuthButton />
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-zinc-900 via-black to-zinc-900 text-white flex items-center justify-center">
        <div className="text-zinc-400">Loading...</div>
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
                Wishlist
              </Link>
              <AuthButton />
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Profile Section */}
          <div className="p-6 rounded-lg bg-zinc-800 border border-zinc-700">
            <h2 className="text-xl font-semibold mb-4">Profile</h2>
            
            <div className="space-y-4">
              {/* Profile Picture */}
              <div>
                <label className="block text-sm font-medium mb-2">Profile Picture</label>
                <div className="flex items-center gap-4">
                  {settings.image ? (
                    <img
                      src={settings.image}
                      alt="Profile"
                      className="w-20 h-20 rounded-full object-cover border-2 border-zinc-700"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-zinc-700 flex items-center justify-center text-zinc-400">
                      No Image
                    </div>
                  )}
                  <div className="flex-1">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Validate file size (max 5MB)
                        if (file.size > 5 * 1024 * 1024) {
                          alert("File size must be less than 5MB");
                          return;
                        }

                        // Create a preview URL and show cropper
                        const reader = new FileReader();
                        reader.onload = (event) => {
                          const imageUrl = event.target?.result as string;
                          setImageToCrop(imageUrl);
                          setFileToCrop(file);
                          setShowCropper(true);
                        };
                        reader.readAsDataURL(file);
                      }}
                      className="hidden"
                      id="avatar-upload"
                    />
                    <label
                      htmlFor="avatar-upload"
                      className="inline-block px-4 py-2 rounded-lg bg-zinc-700 hover:bg-zinc-600 text-white cursor-pointer transition-colors"
                    >
                      Upload Image
                    </label>
                    <p className="text-xs text-zinc-500 mt-1">
                      JPG, PNG, or GIF. Max 5MB. You can crop and zoom after uploading.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Username</label>
                <input
                  type="text"
                  value={settings.username || ""}
                  onChange={(e) => setSettings({ ...settings, username: e.target.value })}
                  placeholder="your-username"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Used for your public profile URL: beavertr.app/user/your-username
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Bio</label>
                <textarea
                  value={settings.bio || ""}
                  onChange={(e) => setSettings({ ...settings, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Shipping Address</label>
                <textarea
                  value={settings.shippingAddress || ""}
                  onChange={(e) => setSettings({ ...settings, shippingAddress: e.target.value })}
                  placeholder="Your shipping address (optional)"
                  rows={4}
                  className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600 resize-none"
                />
                <div className="mt-2 p-3 rounded-lg bg-yellow-900/20 border border-yellow-800/50">
                  <p className="text-xs text-yellow-200">
                    <strong className="text-yellow-100">⚠️ Privacy Notice:</strong> If your wishlist is set to <strong>Public</strong>, this address will be visible to everyone who views your wishlist. 
                    For your safety, we recommend using a <strong>PO Box</strong> address if you plan to make your wishlist public.
                  </p>
                  <p className="text-xs text-yellow-200/80 mt-2">
                    Your wishlist will still function without an address - people just won't know where to ship items.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Connected Accounts */}
          <div className="p-6 rounded-lg bg-zinc-800 border border-zinc-700">
            <h2 className="text-xl font-semibold mb-4">Connected Accounts</h2>
            <p className="text-sm text-zinc-400 mb-4">
              You can sign in with any provider. When you sign in, your account is automatically linked. Use "Connect" to link additional accounts to your profile so you can sign in with multiple methods.
            </p>
            {session && (
              <div className="mb-4 p-3 rounded-lg bg-blue-900/20 border border-blue-800/50">
                <p className="text-xs text-blue-300">
                  💡 <strong>Note:</strong> If you signed in before this feature was added, you may need to sign out and sign back in once to link your account.
                </p>
              </div>
            )}
            
            <div className="space-y-3">
              {/* Google */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-700">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center">
                    <svg className="w-6 h-6" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-white">Google</p>
                    <p className="text-xs text-zinc-400">
                      {isAccountConnected("google") ? "Connected" : "Not connected"}
                    </p>
                  </div>
                </div>
                {isAccountConnected("google") ? (
                  <span className="px-3 py-1 rounded-lg bg-green-600/20 text-green-400 text-sm font-medium">
                    ✓ Connected
                  </span>
                ) : (
                  <button
                    type="button"
                    onClick={() => handleLinkAccount("google")}
                    className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium transition-colors"
                  >
                    Connect
                  </button>
                )}
              </div>

              {/* Twitch */}
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-700">
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
                      <p className="text-xs text-yellow-400 mt-1">
                        Server needs Twitch credentials in .env.local
                      </p>
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
              <div className="flex items-center justify-between p-4 rounded-lg bg-zinc-900 border border-zinc-700">
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
                      <p className="text-xs text-yellow-400 mt-1">
                        Server needs Steam API key in .env.local
                      </p>
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

          {/* Affiliate Settings */}
          <div className="p-6 rounded-lg bg-zinc-800 border border-zinc-700">
            <h2 className="text-xl font-semibold mb-4">Amazon Affiliate</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Amazon Affiliate Tag</label>
                <input
                  type="text"
                  value={settings.amazonAffiliateTag || ""}
                  onChange={(e) => setSettings({ ...settings, amazonAffiliateTag: e.target.value })}
                  placeholder="your-tag-20"
                  className="w-full px-4 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-600"
                />
                <p className="text-xs text-zinc-500 mt-1">
                  Your Amazon Associates affiliate tag (e.g., "beavertr-20"). 
                  This will be automatically applied to Amazon links in your wishlists.
                </p>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <button
              type="submit"
              disabled={saving}
              className="px-6 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-medium transition-colors disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Settings"}
            </button>
            <Link
              href="/wishlist"
              className="px-6 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-white font-medium transition-colors"
            >
              Cancel
            </Link>
          </div>
        </form>
      </main>

      {/* Image Cropper Modal */}
      {showCropper && imageToCrop && (
        <ImageCropper
          image={imageToCrop}
          originalFile={fileToCrop || undefined}
          onCropComplete={async (croppedImageUrl, mimeType) => {
            // Convert the cropped image URL to a blob and upload it
            try {
              const response = await fetch(croppedImageUrl);
              const blob = await response.blob();
              
              // Determine file extension based on mime type
              let extension = 'jpg';
              if (mimeType === 'image/gif') {
                extension = 'gif';
              } else if (mimeType === 'image/png') {
                extension = 'png';
              } else if (mimeType === 'image/webp') {
                extension = 'webp';
              }
              
              const formData = new FormData();
              formData.append("file", blob, `cropped-avatar.${extension}`);

              const uploadResponse = await fetch("/api/user/upload-avatar", {
                method: "POST",
                body: formData,
              });

              if (uploadResponse.ok) {
                const data = await uploadResponse.json();
                setSettings({ ...settings, image: data.imageUrl });
                alert("Profile picture updated!");
                setShowCropper(false);
                setImageToCrop(null);
                setFileToCrop(null);
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

