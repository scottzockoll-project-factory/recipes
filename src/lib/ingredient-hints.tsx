import type { ReactNode } from "react";

function JarIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="inline-block align-text-bottom text-red-800 dark:text-red-400"
      aria-label="paste"
    >
      <rect x="3" y="5" width="10" height="9" rx="1.5" />
      <path d="M5 5V3.5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1V5" />
      <path d="M3 9.5h10" />
    </svg>
  );
}

function FlakesIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="currentColor"
      className="inline-block align-text-bottom text-red-600 dark:text-red-400"
      aria-label="flakes"
    >
      <path d="M4.5 3.5 L6 5.5 L4 5 Z" />
      <path d="M9 2.5 L10 5 L8 4 Z" />
      <path d="M12.5 4 L13 6.5 L11 5.5 Z" />
      <path d="M3 7.5 L5 9 L3 9.5 Z" />
      <path d="M7.5 7 L9.5 8.5 L7 9 Z" />
      <path d="M11.5 8 L13 10 L11 9.5 Z" />
      <path d="M5 11 L7 12.5 L5 13 Z" />
      <path d="M9.5 11.5 L11 13.5 L9 13 Z" />
    </svg>
  );
}

const HINTS: Record<string, () => ReactNode> = {
  gochujang: () => <JarIcon />,
  gochugaru: () => <FlakesIcon />,
};

export function IngredientHint({ name }: { name: string }): ReactNode {
  const factory = HINTS[name.toLowerCase().trim()];
  if (!factory) return null;
  return <span className="ml-1">{factory()}</span>;
}

export function hasIngredientHint(name: string): boolean {
  return name.toLowerCase().trim() in HINTS;
}
