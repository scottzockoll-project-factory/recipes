"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { tokenize } from "@/lib/cooklang-highlight";

interface CooklangEditorProps {
  name: string;
  defaultValue?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
  knownIngredients: string[];
  knownCookware: string[];
}

const TOKEN_CLASSES: Record<string, string> = {
  ingredient: "text-amber-700 font-medium",
  cookware: "text-stone-600 font-medium",
  timer: "text-blue-600 font-medium",
  comment: "text-stone-400 italic",
  "metadata-key": "text-purple-600 font-medium",
  "metadata-value": "text-purple-500",
  text: "",
};

interface AutocompleteState {
  trigger: "@" | "#";
  query: string;
  triggerIndex: number;
  items: string[];
  selectedIndex: number;
}

function getAutocompleteContext(
  text: string,
  cursorPos: number,
): { trigger: "@" | "#"; query: string; triggerIndex: number } | null {
  const before = text.slice(0, cursorPos);
  // Search backwards for @ or # not preceded by an alphanumeric char
  for (let i = before.length - 1; i >= 0; i--) {
    const ch = before[i];
    if (ch === "\n" || ch === "\r") return null;
    if (ch === "@" || ch === "#") {
      // Make sure trigger isn't preceded by a word char
      if (i > 0 && /\w/.test(before[i - 1])) return null;
      const query = before.slice(i + 1);
      // Don't trigger if there's a { in the query (already completed)
      if (query.includes("{")) return null;
      return { trigger: ch as "@" | "#", query, triggerIndex: i };
    }
    // Stop looking if we hit a space after some text and then more space
    // (but allow spaces in multi-word names)
  }
  return null;
}

function parseNamesFromSource(source: string): {
  ingredients: string[];
  cookware: string[];
} {
  const ingredients = new Set<string>();
  const cookware = new Set<string>();

  // Match @name{...} or @word
  const ingWithBraces = source.matchAll(/@([^{@#~\n]*?)\{/g);
  for (const m of ingWithBraces) {
    const name = m[1].trim();
    if (name) ingredients.add(name);
  }
  const ingSimple = source.matchAll(/@(\w+)(?![{])/g);
  for (const m of ingSimple) {
    ingredients.add(m[1]);
  }

  // Match #name{...} or #word
  const cwWithBraces = source.matchAll(/#([^{@#~\n]*?)\{/g);
  for (const m of cwWithBraces) {
    const name = m[1].trim();
    if (name) cookware.add(name);
  }
  const cwSimple = source.matchAll(/#(\w+)(?![{])/g);
  for (const m of cwSimple) {
    cookware.add(m[1]);
  }

  return {
    ingredients: [...ingredients],
    cookware: [...cookware],
  };
}

export default function CooklangEditor({
  name,
  defaultValue = "",
  required,
  placeholder,
  rows = 12,
  knownIngredients,
  knownCookware,
}: CooklangEditorProps) {
  const [value, setValue] = useState(defaultValue);
  const [autocomplete, setAutocomplete] = useState<AutocompleteState | null>(
    null,
  );
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const tokens = tokenize(value);

  const syncScroll = useCallback(() => {
    if (textareaRef.current && backdropRef.current) {
      backdropRef.current.scrollTop = textareaRef.current.scrollTop;
      backdropRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  }, []);

  const updateAutocomplete = useCallback(
    (text: string, cursorPos: number) => {
      const ctx = getAutocompleteContext(text, cursorPos);
      if (!ctx) {
        setAutocomplete(null);
        return;
      }

      const currentNames = parseNamesFromSource(text);
      const pool =
        ctx.trigger === "@"
          ? [...new Set([...knownIngredients, ...currentNames.ingredients])]
          : [...new Set([...knownCookware, ...currentNames.cookware])];

      const query = ctx.query.toLowerCase();
      const filtered = pool
        .filter((n) => n.toLowerCase().includes(query))
        .sort((a, b) => {
          // Prioritize starts-with matches
          const aStarts = a.toLowerCase().startsWith(query) ? 0 : 1;
          const bStarts = b.toLowerCase().startsWith(query) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          return a.localeCompare(b);
        });

      if (filtered.length === 0) {
        setAutocomplete(null);
        return;
      }

      setAutocomplete((prev) => ({
        trigger: ctx.trigger,
        query: ctx.query,
        triggerIndex: ctx.triggerIndex,
        items: filtered,
        selectedIndex: prev?.trigger === ctx.trigger ? Math.min(prev.selectedIndex, filtered.length - 1) : 0,
      }));
    },
    [knownIngredients, knownCookware],
  );

  const insertCompletion = useCallback(
    (item: string) => {
      if (!autocomplete || !textareaRef.current) return;

      const ta = textareaRef.current;
      const before = value.slice(0, autocomplete.triggerIndex);
      const after = value.slice(ta.selectionStart);

      const needsBraces = item.includes(" ");
      const insertion = needsBraces
        ? `${autocomplete.trigger}${item}{}`
        : `${autocomplete.trigger}${item}`;

      const newValue = before + insertion + after;
      const newCursor = before.length + insertion.length;

      setValue(newValue);
      setAutocomplete(null);

      // Restore cursor position after React re-render
      requestAnimationFrame(() => {
        ta.selectionStart = newCursor;
        ta.selectionEnd = newCursor;
        ta.focus();
      });
    },
    [autocomplete, value],
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLTextAreaElement>) => {
      const newValue = e.target.value;
      setValue(newValue);
      updateAutocomplete(newValue, e.target.selectionStart);
    },
    [updateAutocomplete],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (!autocomplete) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setAutocomplete((prev) =>
          prev
            ? {
                ...prev,
                selectedIndex: Math.min(
                  prev.selectedIndex + 1,
                  prev.items.length - 1,
                ),
              }
            : null,
        );
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setAutocomplete((prev) =>
          prev
            ? { ...prev, selectedIndex: Math.max(prev.selectedIndex - 1, 0) }
            : null,
        );
      } else if (e.key === "Enter" || e.key === "Tab") {
        e.preventDefault();
        insertCompletion(autocomplete.items[autocomplete.selectedIndex]);
      } else if (e.key === "Escape") {
        e.preventDefault();
        setAutocomplete(null);
      }
    },
    [autocomplete, insertCompletion],
  );

  const handleClick = useCallback(
    (e: React.MouseEvent<HTMLTextAreaElement>) => {
      const ta = e.currentTarget;
      updateAutocomplete(ta.value, ta.selectionStart);
    },
    [updateAutocomplete],
  );

  // Scroll the selected autocomplete item into view
  useEffect(() => {
    if (!autocomplete) return;
    const el = document.getElementById(
      `cooklang-ac-${autocomplete.selectedIndex}`,
    );
    el?.scrollIntoView({ block: "nearest" });
  }, [autocomplete?.selectedIndex, autocomplete]);

  return (
    <div className="relative">
      <div className="relative border border-stone-300 rounded overflow-hidden focus-within:ring-2 focus-within:ring-stone-500">
        {/* Backdrop with highlighted tokens */}
        <div
          ref={backdropRef}
          aria-hidden
          className="absolute inset-0 overflow-auto pointer-events-none px-3 py-2 font-mono text-sm whitespace-pre-wrap break-words"
        >
          {tokens.map((token, i) => (
            <span key={i} className={TOKEN_CLASSES[token.type] || ""}>
              {token.text}
            </span>
          ))}
          {/* Extra space so backdrop height matches textarea */}
          <br />
        </div>

        {/* Transparent textarea on top */}
        <textarea
          ref={textareaRef}
          id={name}
          name={name}
          required={required}
          rows={rows}
          value={value}
          placeholder={placeholder}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onClick={handleClick}
          onScroll={syncScroll}
          className="relative w-full px-3 py-2 font-mono text-sm bg-transparent text-transparent caret-stone-900 resize-y focus:outline-none whitespace-pre-wrap break-words"
          style={{ WebkitTextFillColor: "transparent" }}
          spellCheck={false}
        />
      </div>

      {/* Autocomplete dropdown */}
      {autocomplete && autocomplete.items.length > 0 && (
        <div className="absolute z-50 mt-1 w-64 max-h-48 overflow-y-auto bg-white border border-stone-300 rounded-md shadow-lg">
          {autocomplete.items.map((item, i) => (
            <button
              key={item}
              id={`cooklang-ac-${i}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault();
                insertCompletion(item);
              }}
              className={`w-full text-left px-3 py-1.5 text-sm ${
                i === autocomplete.selectedIndex
                  ? "bg-stone-100 text-stone-900"
                  : "text-stone-700 hover:bg-stone-50"
              }`}
            >
              <span className="text-stone-400 mr-1">
                {autocomplete.trigger}
              </span>
              {item}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
