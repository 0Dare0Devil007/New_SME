"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { RiSunLine, RiMoonLine } from "@remixicon/react";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button className="p-2 rounded-md bg-secondary text-secondary-foreground">
        <RiSunLine className="h-5 w-5" />
      </button>
    );
  }

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
      aria-label={`Current theme: ${theme}. Click to change.`}
    >
      {theme === "dark" ? <RiMoonLine className="h-5 w-5" /> : <RiSunLine className="h-5 w-5" />}
    </button>
  );
}
