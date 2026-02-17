export type TokenType =
  | "ingredient"
  | "cookware"
  | "timer"
  | "comment"
  | "metadata-key"
  | "metadata-value"
  | "text";

export interface Token {
  type: TokenType;
  text: string;
}

const PATTERNS: { type: TokenType; regex: RegExp }[] = [
  // Block comments [- ... -]
  { type: "comment", regex: /\[-[\s\S]*?-\]/ },
  // Line comments (-- to end of line)
  { type: "comment", regex: /--.*/ },
  // Metadata lines: >> key: value
  { type: "metadata-key", regex: /^>>.*$/m },
  // Timers: ~name{quantity%units} or ~{quantity%units}
  { type: "timer", regex: /~[^{]*?\{[^}]*?\}/ },
  // Ingredients: @name{quantity%units} or @name{quantity} or @single-word
  { type: "ingredient", regex: /@[^{@#~\n]*?\{[^}]*?\}/ },
  { type: "ingredient", regex: /@[\w][\w ]*?(?=\{)/ },
  { type: "ingredient", regex: /@\w+/ },
  // Cookware: #name{} or #name{quantity} or #single-word
  { type: "cookware", regex: /#[^{@#~\n]*?\{[^}]*?\}/ },
  { type: "cookware", regex: /#\w+/ },
];

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let remaining = source;

  while (remaining.length > 0) {
    let earliest: { index: number; length: number; type: TokenType } | null =
      null;

    for (const { type, regex } of PATTERNS) {
      const match = remaining.match(regex);
      if (match && match.index !== undefined) {
        if (!earliest || match.index < earliest.index) {
          earliest = { index: match.index, length: match[0].length, type };
        }
      }
    }

    if (!earliest) {
      tokens.push({ type: "text", text: remaining });
      break;
    }

    if (earliest.index > 0) {
      tokens.push({ type: "text", text: remaining.slice(0, earliest.index) });
    }

    const matchText = remaining.slice(
      earliest.index,
      earliest.index + earliest.length,
    );

    if (earliest.type === "metadata-key") {
      const colonIdx = matchText.indexOf(":");
      if (colonIdx !== -1) {
        tokens.push({
          type: "metadata-key",
          text: matchText.slice(0, colonIdx + 1),
        });
        tokens.push({
          type: "metadata-value",
          text: matchText.slice(colonIdx + 1),
        });
      } else {
        tokens.push({ type: "metadata-key", text: matchText });
      }
    } else {
      tokens.push({ type: earliest.type, text: matchText });
    }

    remaining = remaining.slice(earliest.index + earliest.length);
  }

  return tokens;
}
