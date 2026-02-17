"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseIngredients } from "@/lib/parse-ingredients";
import { searchByIngredients } from "@/app/search/actions";
import type { IngredientSearchResult } from "@/data/recipes";

interface SearchSectionProps {
  recipes: { slug: string; title: string }[];
}

interface ResultItem {
  slug: string;
  title: string;
  href: string;
}

function useArrowNav(items: ResultItem[]) {
  const [activeIndex, setActiveIndex] = useState(-1);
  const router = useRouter();
  const itemsRef = useRef(items);
  itemsRef.current = items;

  // Reset to first item when results change
  const itemSlugs = items.map((i) => i.slug).join(",");
  useEffect(() => {
    setActiveIndex(items.length > 0 ? 0 : -1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemSlugs]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      const current = itemsRef.current;
      if (current.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((i) => (i < current.length - 1 ? i + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((i) => (i > 0 ? i - 1 : current.length - 1));
      } else if (e.key === "Enter") {
        setActiveIndex((i) => {
          if (i >= 0 && i < current.length) {
            e.preventDefault();
            router.push(current[i].href);
          }
          return i;
        });
      }
    },
    [router],
  );

  return { activeIndex, handleKeyDown };
}

export default function SearchSection({ recipes }: SearchSectionProps) {
  const [titleQuery, setTitleQuery] = useState("");
  const [ingredientInput, setIngredientInput] = useState("");
  const [ingredientResults, setIngredientResults] = useState<IngredientSearchResult[]>([]);
  const [searching, setSearching] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const ingredientRef = useRef<HTMLInputElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout>>(null);

  const ingredients = parseIngredients(ingredientInput);

  // Title search (client-side filter)
  const titleResults = titleQuery.trim()
    ? recipes.filter((r) =>
        r.title.toLowerCase().includes(titleQuery.trim().toLowerCase()),
      )
    : [];

  const titleItems: ResultItem[] = titleResults.map((r) => ({
    slug: r.slug,
    title: r.title,
    href: `/recipes/${r.slug}`,
  }));

  const ingredientItems: ResultItem[] = ingredientResults.map((r) => ({
    slug: r.slug,
    title: r.title,
    href: `/recipes/${r.slug}`,
  }));

  const titleNav = useArrowNav(titleItems);
  const ingredientNav = useArrowNav(ingredientItems);

  // Ingredient search (debounced server action)
  const doIngredientSearch = useCallback(async (ings: string[]) => {
    if (ings.length === 0) {
      setIngredientResults([]);
      return;
    }
    setSearching(true);
    const data = await searchByIngredients(ings);
    setIngredientResults(data);
    setSearching(false);
  }, []);

  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      doIngredientSearch(ingredients);
    }, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ingredientInput, doIngredientSearch]);

  // Global keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const active = document.activeElement?.tagName;
      const inInput = active === "INPUT" || active === "TEXTAREA";

      if (e.key === "/" && !inInput) {
        e.preventDefault();
        ingredientRef.current?.focus();
      }
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        titleRef.current?.focus();
      }
      if (e.key === "Escape") {
        titleRef.current?.blur();
        ingredientRef.current?.blur();
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  // Autofocus title search on mount
  useEffect(() => {
    titleRef.current?.focus();
  }, []);

  const showTitleResults = titleQuery.trim().length > 0;
  const showIngredientResults = ingredients.length > 0;

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">Search</h2>

      {/* Title search */}
      <div>
        <div className="flex items-center gap-2">
          <input
            ref={titleRef}
            type="text"
            value={titleQuery}
            onChange={(e) => setTitleQuery(e.target.value)}
            onKeyDown={titleNav.handleKeyDown}
            placeholder="Search by title..."
            className="w-full border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500"
          />
          <kbd className="hidden sm:inline-flex shrink-0 items-center gap-0.5 text-xs text-stone-400 border border-stone-300 dark:border-stone-600 rounded px-1.5 py-0.5 font-mono">
            <span>{"\u2318"}</span>
            <span>K</span>
          </kbd>
        </div>
        {showTitleResults && (
          <ul className="mt-2 space-y-1">
            {titleResults.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">No recipes match that title.</p>
            ) : (
              titleResults.map((r, i) => (
                <li key={r.slug}>
                  <a
                    href={`/recipes/${r.slug}`}
                    className={`block border border-stone-200 dark:border-stone-700 rounded px-4 py-3 text-sm transition-colors ${
                      i === titleNav.activeIndex
                        ? "bg-stone-200 dark:bg-stone-700"
                        : "hover:bg-stone-100 dark:hover:bg-stone-700"
                    }`}
                  >
                    {r.title}
                  </a>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      {/* Ingredient search */}
      <div>
        <div className="flex items-center gap-2">
          <input
            ref={ingredientRef}
            type="text"
            value={ingredientInput}
            onChange={(e) => setIngredientInput(e.target.value)}
            onKeyDown={ingredientNav.handleKeyDown}
            placeholder='Search by ingredients, e.g. tomato garlic "olive oil"'
            className="w-full border border-stone-300 dark:border-stone-600 rounded-md px-3 py-2 text-sm bg-white dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-stone-400 dark:focus:ring-stone-500"
          />
          <kbd className="hidden sm:inline-block shrink-0 text-xs text-stone-400 border border-stone-300 dark:border-stone-600 rounded px-1.5 py-0.5 font-mono">
            /
          </kbd>
        </div>

        {ingredients.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {ingredients.map((ing, i) => (
              <span
                key={`${ing}-${i}`}
                className="bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-300 text-xs rounded-full px-2.5 py-1"
              >
                {ing}
              </span>
            ))}
          </div>
        )}

        {searching && (
          <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">Searching...</p>
        )}

        {showIngredientResults && !searching && (
          <div className="mt-2">
            {ingredientResults.length === 0 ? (
              <p className="text-sm text-stone-500 dark:text-stone-400">No recipes match those ingredients.</p>
            ) : (
              <ul className="space-y-2">
                {ingredientResults.map((recipe, i) => (
                  <li key={recipe.slug}>
                    <a
                      href={`/recipes/${recipe.slug}`}
                      className={`block border border-stone-200 dark:border-stone-700 rounded-lg p-4 transition-colors ${
                        i === ingredientNav.activeIndex
                          ? "bg-stone-200 dark:bg-stone-700"
                          : "hover:bg-stone-100 dark:hover:bg-stone-700"
                      }`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium text-sm">{recipe.title}</span>
                        <span className="text-xs text-stone-500 dark:text-stone-400">
                          {recipe.matchedIngredients.length}/{recipe.totalIngredients} ingredients
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {recipe.matchedIngredients.map((ing) => (
                          <span
                            key={ing}
                            className="bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300 text-xs rounded-full px-2 py-0.5"
                          >
                            {ing}
                          </span>
                        ))}
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
