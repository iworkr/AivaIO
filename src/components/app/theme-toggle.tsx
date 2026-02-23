"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="h-[32px] rounded-md flex items-center px-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--surface-hover)] transition-colors duration-150 w-full"
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
    >
      {isDark ? <Sun size={16} className="shrink-0 mr-3 text-[var(--text-tertiary)]" /> : <Moon size={16} className="shrink-0 mr-3 text-[var(--text-tertiary)]" />}
      <span className="flex-1 text-left">{isDark ? "Light mode" : "Dark mode"}</span>
      <kbd className="text-[9px] font-mono text-[var(--text-tertiary)] bg-[var(--surface-hover)] px-1.5 py-0.5 rounded">
        ⌘⇧L
      </kbd>
    </button>
  );
}
