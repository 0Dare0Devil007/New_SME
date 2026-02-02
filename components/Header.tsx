"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { signOut } from "@/lib/auth-client";
import { NotificationBell } from "@/components/NotificationBell";
import { ThemeToggle } from "@/components/ThemeToggle";
import {
  RiAddLine,
  RiArrowDownSLine,
  RiLogoutBoxLine,
  RiUserStarLine,
} from "@remixicon/react";

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
    <header className="bg-card border-b border-border shadow-sm sticky top-0 z-50">
      <div className="max-w-[1200px] mx-auto px-8 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-[14px] bg-primary flex items-center justify-center shadow-md">
              <RiUserStarLine className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">SME Directory</h1>
              <p className="text-xs text-muted-foreground">Learning Hub & Expert Network</p>
            </div>
          </Link>

          <div className="flex items-center gap-6">
            {/* Theme Toggle */}
            <ThemeToggle />

            {/* Notification Bell - visible when authenticated */}
            {!isLoading && user && <NotificationBell />}

            {/* Courses link - visible to all authenticated users */}
            {!isLoading && user && (
              <Link
                href="/courses"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Courses
              </Link>
            )}

            {/* Dashboard link - only visible to Managers */}
            {!isLoading && isManager && (
              <Link
                href="/dashboard"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Dashboard
              </Link>
            )}

            {/* Nominate SMEs link - only visible to Team Leaders */}
            {!isLoading && isTeamLeader && (
              <Link
                href="/nominations"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Nominate SMEs
              </Link>
            )}

            {/* Department SMEs link - only visible to Coordinators */}
            {!isLoading && isCoordinator && (
              <Link
                href="/department-smes"
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                Department SMEs
              </Link>
            )}

            {/* Complete SME Profile link - visible to nominated employees who need to create profile */}
            {!isLoading && needsProfileSetup && (
              <Link
                href="/sme-profile"
                className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1"
              >
                <RiAddLine className="w-4 h-4" />
                Complete SME Profile
              </Link>
            )}

            {/* SME Profile link - visible to existing SMEs, links to their expert page */}
            {!isLoading && isSme && !needsProfileSetup && smeId && (
              <Link
                href={`/experts/${smeId}`}
                className="text-sm font-medium text-foreground hover:text-primary transition-colors"
              >
                SME Profile
              </Link>
            )}

            {/* Loading state */}
            {isLoading && (
              <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />
            )}

            {/* Logged in user */}
            {!isLoading && user && (
              <div className="relative" data-user-menu>
                <button
                  onClick={() => setShowDropdown(!showDropdown)}
                  className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-sm font-medium text-foreground">
                      {user.name || "User"}
                    </p>
                    <p className="text-xs text-muted-foreground">{user.email}</p>
                  </div>
                  {user.image ? (
                    <img
                      src={user.image}
                      alt={user.name || "User"}
                      className="w-9 h-9 rounded-full border-2 border-border object-cover"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-full bg-primary border-2 border-border flex items-center justify-center">
                      <span className="text-primary-foreground text-sm font-medium">
                        {getInitials(user.name, user.email)}
                      </span>
                    </div>
                  )}
                  <RiArrowDownSLine
                    className={`w-4 h-4 text-muted-foreground transition-transform ${
                      showDropdown ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {/* Dropdown menu */}
                {showDropdown && (
                  <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
                    <div className="px-4 py-2 border-b border-border sm:hidden">
                      <p className="text-sm font-medium text-popover-foreground">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>
                    <button
                      onClick={handleSignOut}
                      className="w-full text-left px-4 py-2 text-sm text-destructive hover:bg-destructive/10 transition-colors flex items-center gap-2"
                    >
                      <RiLogoutBoxLine className="w-4 h-4" />
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
                  className="text-sm font-medium text-foreground hover:text-primary transition-colors"
                >
                  Sign in
                </Link>
                <Link
                  href="/sign-up"
                  className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-4 py-2 rounded-lg transition-colors"
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
