"use client";

import { useEffect, useState } from "react";
import { X } from "lucide-react";
import CooklangEditor from "@/components/CooklangEditor";

export default function RecipeForm({
  action,
  defaultValues,
  knownIngredients = [],
  knownCookware = [],
  knownLabels = [],
}: {
  action: (formData: FormData) => void;
  defaultValues?: { slug?: string; title: string; source: string; labels?: string[] };
  knownIngredients?: string[];
  knownCookware?: string[];
  knownLabels?: string[];
}) {
  const isEdit = !!defaultValues?.slug;
  const [labels, setLabels] = useState<string[]>(defaultValues?.labels ?? []);
  const [labelInput, setLabelInput] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [activeSuggIndex, setActiveSuggIndex] = useState(-1);

  const suggestions = knownLabels.filter(
    (l) =>
      labelInput.trim() &&
      l.toLowerCase().includes(labelInput.trim().toLowerCase()) &&
      !labels.includes(l),
  );

  useEffect(() => {
    setActiveSuggIndex(-1);
  }, [suggestions.length]);

  function addLabel(raw: string) {
    const parts = raw
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean);
    setLabels((prev) => {
      const set = new Set(prev);
      return [...prev, ...parts.filter((p) => !set.has(p))];
    });
    setLabelInput("");
  }

  return (
    <form action={action} className="space-y-4">
      <div>
        <label htmlFor="slug" className="block text-sm font-medium mb-1">
          URL Slug
        </label>
        {isEdit ? (
          <p className="text-sm text-stone-600 dark:text-stone-400 font-mono bg-stone-100 dark:bg-stone-700 rounded px-3 py-2">
            {defaultValues.slug}
          </p>
        ) : (
          <input
            id="slug"
            name="slug"
            type="text"
            required
            pattern="[a-z0-9\-]+"
            title="Lowercase letters, numbers, and hyphens only"
            placeholder="my-recipe-name"
            className="w-full border border-stone-300 dark:border-stone-600 rounded px-3 py-2 bg-white dark:bg-stone-800 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
          />
        )}
      </div>
      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-1">
          Title
        </label>
        <input
          id="title"
          name="title"
          type="text"
          required
          defaultValue={defaultValues?.title}
          className="w-full border border-stone-300 dark:border-stone-600 rounded px-3 py-2 bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>
      <div>
        <label className="block text-sm font-medium mb-1">Labels</label>
        <div className="relative flex gap-2 mb-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={labelInput}
              onChange={(e) => {
                setLabelInput(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") {
                  e.preventDefault();
                  setActiveSuggIndex((i) => Math.min(i + 1, suggestions.length - 1));
                } else if (e.key === "ArrowUp") {
                  e.preventDefault();
                  setActiveSuggIndex((i) => Math.max(i - 1, -1));
                } else if (e.key === "Enter" || e.key === ",") {
                  e.preventDefault();
                  if (activeSuggIndex >= 0 && suggestions[activeSuggIndex]) {
                    addLabel(suggestions[activeSuggIndex]);
                  } else if (labelInput.trim()) {
                    addLabel(labelInput);
                  }
                  setShowSuggestions(false);
                } else if (e.key === "Escape") {
                  setShowSuggestions(false);
                  setActiveSuggIndex(-1);
                }
              }}
              placeholder="Add a label, press Enter"
              className="w-full border border-stone-300 dark:border-stone-600 rounded px-3 py-2 bg-white dark:bg-stone-800 text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
            />
            {showSuggestions && suggestions.length > 0 && (
              <ul className="absolute z-10 left-0 right-0 top-full mt-1 bg-white dark:bg-stone-800 border border-stone-200 dark:border-stone-600 rounded shadow-md text-sm max-h-40 overflow-y-auto">
                {suggestions.map((s, i) => (
                  <li
                    key={s}
                    onMouseDown={() => {
                      addLabel(s);
                      setShowSuggestions(false);
                    }}
                    className={`px-3 py-1.5 cursor-pointer ${
                      i === activeSuggIndex
                        ? "bg-stone-100 dark:bg-stone-700"
                        : "hover:bg-stone-50 dark:hover:bg-stone-700"
                    }`}
                  >
                    {s}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              if (labelInput.trim()) addLabel(labelInput);
              setShowSuggestions(false);
            }}
            className="px-3 py-2 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 text-sm transition-colors"
          >
            Add
          </button>
        </div>
        {labels.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {labels.map((label) => (
              <span
                key={label}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400"
              >
                {label}
                <button
                  type="button"
                  onClick={() => setLabels((prev) => prev.filter((l) => l !== label))}
                  aria-label={`Remove label ${label}`}
                  className="hover:text-red-500 transition-colors"
                >
                  <X size={10} />
                </button>
                <input type="hidden" name="labels" value={label} />
              </span>
            ))}
          </div>
        )}
      </div>
      <div>
        <label htmlFor="source" className="block text-sm font-medium mb-1">
          Recipe (Cooklang)
        </label>
        <CooklangEditor
          name="source"
          required
          rows={12}
          defaultValue={defaultValues?.source}
          placeholder="Preheat the @oven to 350°F. Mix @flour{2%cups} with @sugar{1%cup}..."
          knownIngredients={knownIngredients}
          knownCookware={knownCookware}
        />
      </div>
      <button
        type="submit"
        className="bg-stone-800 dark:bg-stone-200 text-white dark:text-stone-900 px-4 py-2 rounded hover:bg-stone-700 dark:hover:bg-stone-300"
      >
        Save Recipe
      </button>
    </form>
  );
}
