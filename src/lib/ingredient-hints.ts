const HINTS: Record<string, string> = {
  gochujang: "paste",
  gochugaru: "flakes",
};

export function getIngredientHint(name: string): string | null {
  return HINTS[name.toLowerCase().trim()] ?? null;
}
