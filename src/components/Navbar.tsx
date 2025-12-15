"use client";

import { useState, useEffect, useRef } from "react";
import { useTheme } from "next-themes";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { FiSun, FiMoon, FiMenu, FiUser, FiSettings } from "react-icons/fi";
import { PiCassetteTape } from "react-icons/pi";
import { FaDiceD20, FaBook, FaSignOutAlt } from "react-icons/fa";

interface UserProfile {
  id: string;
  username?: string;
  name?: string;
  email?: string;
}

export default function Navbar() {
  const { theme, setTheme } = useTheme();
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  // Only show nav links on pages other than home
  const isHomePage = pathname === "/";

  // Fetch user profile
  useEffect(() => {
    if (session?.user?.email) {
      fetch("/api/user/profile")
        .then((res) => {
          if (res.ok) {
            return res.json();
          }
          return null;
        })
        .then((data) => {
          if (data) {
            setUser({
              id: data.id,
              username: data.username,
              name: data.name,
              email: data.email,
            });
          }
        })
        .catch((err) => {
          console.error("Error fetching user profile:", err);
        });
    } else {
      setUser(null);
    }
  }, [session]);

  // Handle mounting to prevent hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };

    if (dropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [dropdownOpen]);

  // Logout handler
  const handleLogout = async () => {
    await signOut({ redirect: false });
    setUser(null);
    setDropdownOpen(false);
    router.push("/");
  };

  // Logout button hover classes based on theme
  const logoutButtonClasses =
    theme === "cassette"
      ? "flex items-center w-full text-left px-4 py-2 hover:!bg-neonGreen hover:!text-black"
      : theme === "homebrew"
      ? "flex items-center w-full text-left px-4 py-2 hover:!bg-maroon hover:!text-parchment"
      : "flex items-center w-full text-left px-4 py-2 hover:bg-red-500 hover:text-white";

  const displayName = user?.username || user?.name || session?.user?.name || session?.user?.email || "User";

  if (!mounted) {
    return null; // Prevent flash of unstyled content
  }

  return (
    <nav className="sticky top-0 backdrop-blur-sm bg-base-100/80" style={{ zIndex: 999999 }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ position: 'relative', zIndex: 999999 }}>
        <div className="flex justify-between items-center h-16" style={{ position: 'relative', zIndex: 999999 }}>
          <Link
            href="/"
            className="text-xl font-bold text-base-content transition-all duration-300 hover:scale-105 hover:opacity-80"
          >
            beavertr.app
          </Link>

          {/* Right Side: Username & Hamburger Menu */}
          <div className="relative flex items-center gap-4">
            {user && status === "authenticated" ? (
              <Link
                href="/profile"
                className="text-sm text-base-content/70 hover:text-base-content transition-all duration-300 hover:scale-105"
              >
                {displayName}
              </Link>
            ) : null}

            {/* Hamburger Menu Dropdown */}
            <div className="relative" ref={dropdownRef} style={{ zIndex: 9999999, position: 'relative' }}>
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="p-2 text-base-content/70 hover:text-base-content transition-all duration-300 hover:scale-110 hover:rotate-90"
                aria-label="Menu"
                style={{ zIndex: 9999999 }}
              >
                <FiMenu size={20} />
              </button>

              {/* Settings Dropdown */}
              {dropdownOpen && (
                <div 
                  className="navbar-dropdown absolute right-0 mt-2 min-w-[200px] border border-base-300 shadow-2xl rounded-lg bg-base-100" 
                  style={{ 
                    zIndex: 99999999,
                    position: 'absolute'
                  }}
                >
                  {/* Navigation Links */}
                  <Link
                    href="/portfolio"
                    className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Portfolio
                  </Link>
                  <Link
                    href="/wishlist"
                    className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Wishlists
                  </Link>
                  <Link
                    href="/tabletop-rpg"
                    className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1 whitespace-nowrap"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Tabletop RPG
                  </Link>
                  <Link
                    href="/streaming"
                    className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1 whitespace-nowrap"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Streaming
                  </Link>
                  <Link
                    href="/web-design"
                    className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1 whitespace-nowrap"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Web Design
                  </Link>
                  <Link
                    href="/about"
                    className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1 whitespace-nowrap"
                    onClick={() => setDropdownOpen(false)}
                  >
                    About
                  </Link>
                  <Link
                    href="/adventure95"
                    className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1 whitespace-nowrap"
                    onClick={() => setDropdownOpen(false)}
                  >
                    Adventure 95
                  </Link>

                  {/* User Section */}
                  <hr className="my-2 border-base-300" />
                  {user && status === "authenticated" ? (
                    <>
                      <Link
                        href="/profile"
                        className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiUser className="mr-2" /> Profile
                      </Link>
                      <Link
                        href="/settings"
                        className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiSettings className="mr-2" /> Settings
                      </Link>
                      <hr className="my-2 border-base-300" />
                      <button onClick={handleLogout} className={logoutButtonClasses}>
                        <FaSignOutAlt className="mr-2" /> Logout
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/api/auth/signin"
                        className="flex items-center px-4 py-2 hover:bg-base-200 text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                        onClick={() => setDropdownOpen(false)}
                      >
                        <FiUser className="mr-2" /> Sign In
                      </Link>
                    </>
                  )}

                  {/* Theme Selector */}
                  <hr className="my-2 border-base-300" />
                  <button
                    onClick={() => {
                      setTheme("light");
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 hover:bg-base-200 text-left text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                  >
                    <FiSun className="mr-2" /> Light
                  </button>
                  <button
                    onClick={() => {
                      setTheme("dark");
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 hover:bg-base-200 text-left text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                  >
                    <FiMoon className="mr-2" /> Dark
                  </button>
                  <button
                    onClick={() => {
                      setTheme("cassette");
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 hover:bg-base-200 text-left text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                  >
                    <PiCassetteTape className="mr-2" /> Cassette
                  </button>
                  <button
                    onClick={() => {
                      setTheme("homebrew");
                      setDropdownOpen(false);
                    }}
                    className="flex items-center w-full px-4 py-2 hover:bg-base-200 text-left text-sm text-base-content transition-all duration-200 hover:translate-x-1"
                  >
                    <FaDiceD20 className="mr-2" /> Homebrew
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
}
