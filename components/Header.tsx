"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
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

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors px-3 py-2 rounded-md ${
        isActive
          ? "text-primary bg-primary/10"
          : "text-foreground hover:text-primary hover:bg-muted"
      }`}
    >
      {children}
    </Link>
  );
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

  const closeDropdown = useCallback(() => setShowDropdown(false), []);

  // Close dropdown when clicking outside or pressing Escape
  useEffect(() => {
    if (!showDropdown) return;

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as HTMLElement;
      if (!target.closest("[data-user-menu]")) {
        closeDropdown();
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        closeDropdown();
      }
    }

    document.addEventListener("click", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("click", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [showDropdown, closeDropdown]);

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

          {/* Navigation */}
          <nav className="flex items-center gap-1">
            {!isLoading && user && (
              <>
                <NavLink href="/courses">Courses</NavLink>
                {isManager && <NavLink href="/dashboard">Dashboard</NavLink>}
                {isTeamLeader && <NavLink href="/nominations">Nominate SMEs</NavLink>}
                {isCoordinator && <NavLink href="/department-smes">Department SMEs</NavLink>}
                {isSme && !needsProfileSetup && smeId && (
                  <NavLink href={`/experts/${smeId}`}>My Profile</NavLink>
                )}
              </>
            )}
          </nav>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggle />

            {!isLoading && user && (
              <>
                <NotificationBell />

                {needsProfileSetup && (
                  <Link
                    href="/sme-profile"
                    className="text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 px-3 py-2 rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <RiAddLine className="w-4 h-4" />
                    Complete SME Profile
                  </Link>
                )}

                {/* User Menu */}
                <div className="relative ml-2" data-user-menu>
                  <button
                    onClick={() => setShowDropdown(!showDropdown)}
                    aria-expanded={showDropdown}
                    aria-haspopup="true"
                    className="flex items-center gap-2 rounded-lg p-1.5 hover:bg-muted transition-colors"
                  >
                    <div className="text-right">
                      <p className="text-sm font-medium text-foreground">
                        {user.name || "User"}
                      </p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </div>
                    {user.image ? (
                      <img
                        src={user.image}
                        alt=""
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

                  {showDropdown && (
                    <div className="absolute right-0 mt-2 w-48 bg-popover rounded-lg shadow-lg border border-border py-1 z-50">
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
              </>
            )}

            {isLoading && <div className="w-9 h-9 rounded-full bg-muted animate-pulse" />}

            {!isLoading && !user && (
              <>
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
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
