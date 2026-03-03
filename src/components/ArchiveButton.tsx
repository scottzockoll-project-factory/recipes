"use client";

interface ArchiveButtonProps {
  action: () => Promise<void>;
  isArchived: boolean;
}

export default function ArchiveButton({ action, isArchived }: ArchiveButtonProps) {
  async function handleClick() {
    if (!isArchived) {
      const confirmed = window.confirm(
        "Archive this recipe? It will be hidden from the main list.",
      );
      if (!confirmed) return;
    }
    await action();
  }

  return (
    <button
      onClick={handleClick}
      className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-800 dark:hover:text-stone-200 border border-stone-300 dark:border-stone-600 rounded px-3 py-1"
    >
      {isArchived ? "Unarchive" : "Archive"}
    </button>
  );
}
