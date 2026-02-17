"use client";

import { useEffect, useRef, useState } from "react";

export default function OverflowMenu() {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="More options"
        className="w-8 h-8 flex items-center justify-center rounded hover:bg-stone-200 dark:hover:bg-stone-700 text-stone-600 dark:text-stone-400 transition-colors text-lg leading-none"
      >
        &#8942;
      </button>
      {open && (
        <div className="absolute right-0 mt-3 w-48 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-md shadow-lg z-50">
          <a
            href="/suggestions"
            className="block px-4 py-2 text-sm text-stone-700 dark:text-stone-300 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-md"
          >
            Jenny&apos;s Suggestions
          </a>
        </div>
      )}
    </div>
  );
}
