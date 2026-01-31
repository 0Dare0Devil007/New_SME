"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-client";

// Figma asset URLs (valid for 7 days)
const icons = {
  logo: "https://www.figma.com/api/mcp/asset/5620935f-81a4-4a77-92b8-6f7daf97b245",
};

interface UserInfo {
  user: { id: string; email: string; name?: string; image?: string } | null;
  roles: string[];
  isManager: boolean;
  isTeamLeader: boolean;
  isCoordinator: boolean;
  isSme: boolean;
  smeId?: string;
  needsProfileSetup: boolean;
}

export function Header() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    async function fetchUserInfo() {
      try {
        const response = await fetch("/api/auth/me");
        const data = await response.json();
        setUserInfo(data);
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        setUserInfo({ user: null, roles: [], isManager: false, isTeamLeader: false, isCoordinator: false, isSme: false, needsProfileSetup: false });
      } finally {
        setIsLoading(false);
      }
    }

    fetchUserInfo();
  }, []);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        setShowDropdown(false);
      }
    }

    if (showDropdown) {
      document.addEventListener("click", handleClickOutside);
      return () => document.removeEventListener("click", handleClickOutside);
    }
  }, [showDropdown]);

  const isManager = userInfo?.isManager ?? false;
  const isTeamLeader = userInfo?.isTeamLeader ?? false;
  const isCoordinator = userInfo?.isCoordinator ?? false;
  const needsProfileSetup = userInfo?.needsProfileSetup ?? false;
  const isSme = userInfo?.isSme ?? false;
  const smeId = userInfo?.smeId;
  const user = userInfo?.user;

  const handleSignOut = async () => {
    await signOut({
      fetchOptions: {
        onSuccess: () => {
          window.location.href = "/sign-in";
        },
      },
    });
  };

  // Get user initials for avatar
  const getInitials = (name?: string, email?: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    if (email) {
      return email[0].toUpperCase();
    }
    return "U";
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center shadow-md">
              <img src={icons.logo} alt="SME Directory" className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-gray-900">SME Directory</h1>
              <p className="text-xs text-gray-500">Learning Hub & Expert Network</p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {/* Dashboard link - only visible to Managers */}
            {!isLoading && isManager && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Dashboard
              </Link>
            )}

            {/* Nominate SMEs link - only visible to Team Leaders */}
            {!isLoading && isTeamLeader && (
              <Link
                href="/nominations"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Nominate SMEs
              </Link>
            )}

            {/* Department SMEs link - only visible to Coordinators */}
            {!isLoading && isCoordinator && (
              <Link
                href="/department-smes"
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                Department SMEs
              </Link>
            )}

            {/* Complete SME Profile link - visible to nominated employees who need to create profile */}
            {!isLoading && needsProfileSetup && (
              <Link
                href="/sme-profile"
                className="text-sm font-medium text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Complete SME Profile
              </Link>
            )}

            {/* SME Profile link - visible to existing SMEs, links to their expert page */}
            {!isLoading && isSme && !needsProfileSetup && smeId && (
              <Link
                href={`/experts/${smeId}`}
                className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
              >
                SME Profile
              </Link>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="w-9 h-9 rounded-full bg-gray-200 animate-pulse" />
            )}

            {/* Logged in user */}
            {!isLoading && user && (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-gray-900">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-gray-500">{user.email}</p>
                  </div>
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-9 h-9 rounded-full border-2 border-gray-200 object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 border-2 border-gray-200 flex items-center justify-center">
                      <span className="text-white text-sm font-medium">
                        {getInitials(user.name, user.email)}
                      </span>
                    </div>
                  )}
                  <svg
                    className={`w-4 h-4 text-gray-500 transition-transform ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                    <div className="px-4 py-2 border-b border-gray-100 sm:hidden">
                      <p className="text-sm font-medium text-gray-900">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                      </svg>
                      Sign out
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Not logged in */}
            {!isLoading && !user && (
              <div className="flex items-center gap-3">
                <Link
                  href="/sign-in"
                  className="text-sm font-medium text-gray-700 hover:text-blue-600 transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
