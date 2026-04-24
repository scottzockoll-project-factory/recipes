"use client";

import { useState, useMemo } from "react";
import { Recipe as CooklangRecipe } from "@cooklang/cooklang-ts";
import { Check, X, Save, Trash2 } from "lucide-react";
import { IngredientHint } from "@/lib/ingredient-hints";
import {
  createPrepAction,
  updatePrepAction,
  deletePrepAction,
} from "@/app/prep/actions";

interface RecipeWithSource {
  slug: string;
  title: string;
  source: string;
  labels: string[];
}

interface ParsedIngredient {
  name: string;
  quantity: number | null;
  units: string;
  recipe: string;
}

interface AggregatedIngredient {
  name: string;
  entries: { quantity: number | null; units: string; recipes: string[] }[];
}

function parseQuantity(raw: string | number | undefined): number | null {
  if (raw === undefined || raw === "") return null;
  const str = String(raw);
  // Handle fractions like "1/2"
  const fractionMatch = str.match(/^(\d+)\s*\/\s*(\d+)$/);
  if (fractionMatch) {
    return parseInt(fractionMatch[1]) / parseInt(fractionMatch[2]);
  }
  // Handle mixed fractions like "1 1/2"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
  if (mixedMatch) {
    return parseInt(mixedMatch[1]) + parseInt(mixedMatch[2]) / parseInt(mixedMatch[3]);
  }
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function normalizeUnit(unit: string): string {
  const u = unit.toLowerCase().trim();
  const map: Record<string, string> = {
    tbsp: "tbsp", tablespoon: "tbsp", tablespoons: "tbsp",
    tsp: "tsp", teaspoon: "tsp", teaspoons: "tsp",
    cup: "cup", cups: "cup",
    oz: "oz", ounce: "oz", ounces: "oz",
    lb: "lb", lbs: "lb", pound: "lb", pounds: "lb",
    g: "g", gram: "g", grams: "g",
    kg: "kg", kilogram: "kg", kilograms: "kg",
    ml: "ml", milliliter: "ml", milliliters: "ml",
    l: "l", liter: "l", liters: "l",
    clove: "cloves", cloves: "cloves",
    slice: "slices", slices: "slices",
    pinch: "pinch", pinches: "pinch",
    bunch: "bunch", bunches: "bunch",
    can: "cans", cans: "cans",
  };
  return map[u] ?? u;
}

function formatQuantity(n: number): string {
  if (Number.isInteger(n)) return String(n);
  // Common fractions
  const frac = n % 1;
  const whole = Math.floor(n);
  const fractions: [number, string][] = [
    [0.25, "¼"], [0.333, "⅓"], [0.5, "½"], [0.667, "⅔"], [0.75, "¾"],
  ];
  for (const [val, sym] of fractions) {
    if (Math.abs(frac - val) < 0.01) {
      return whole > 0 ? `${whole} ${sym}` : sym;
    }
  }
  return n.toFixed(1).replace(/\.0$/, "");
}

function aggregateIngredients(ingredients: ParsedIngredient[]): AggregatedIngredient[] {
  const map = new Map<string, AggregatedIngredient>();

  for (const ing of ingredients) {
    const key = ing.name.toLowerCase().trim();
    if (!map.has(key)) {
      map.set(key, { name: ing.name, entries: [] });
    }
    const agg = map.get(key)!;
    const normUnit = normalizeUnit(ing.units);

    const existing = agg.entries.find((e) => normalizeUnit(e.units) === normUnit);
    if (existing && existing.quantity !== null && ing.quantity !== null) {
      existing.quantity += ing.quantity;
      if (!existing.recipes.includes(ing.recipe)) existing.recipes.push(ing.recipe);
    } else if (existing && existing.quantity === null && ing.quantity === null && normalizeUnit(existing.units) === normUnit) {
      if (!existing.recipes.includes(ing.recipe)) existing.recipes.push(ing.recipe);
    } else {
      agg.entries.push({
        quantity: ing.quantity,
        units: ing.units,
        recipes: [ing.recipe],
      });
    }
  }

  return [...map.values()].sort((a, b) => a.name.localeCompare(b.name));
}

interface MealPrep {
  id: number;
  name: string;
  recipeSlugs: string[];
  createdAt: Date;
  updatedAt: Date;
}

export default function PrepClient({
  recipes,
  initialPreps,
}: {
  recipes: RecipeWithSource[];
  initialPreps: MealPrep[];
}) {
  const [selectedSlugs, setSelectedSlugs] = useState<Set<string>>(new Set());
  const [checkedItems, setCheckedItems] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [preps, setPreps] = useState<MealPrep[]>(initialPreps);
  const [saveName, setSaveName] = useState("");
  const [showSave, setShowSave] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadedPrepId, setLoadedPrepId] = useState<number | null>(null);

  const sortedRecipes = useMemo(
    () => [...recipes].sort((a, b) => a.title.localeCompare(b.title)),
    [recipes],
  );

  const filteredRecipes = useMemo(() => {
    if (!search.trim()) return sortedRecipes;
    const q = search.toLowerCase();
    return sortedRecipes.filter((r) => r.title.toLowerCase().includes(q));
  }, [sortedRecipes, search]);

  function toggleRecipe(slug: string) {
    setSelectedSlugs((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });
  }

  const aggregated = useMemo(() => {
    const allIngredients: ParsedIngredient[] = [];

    for (const recipe of recipes) {
      if (!selectedSlugs.has(recipe.slug)) continue;
      const parsed = new CooklangRecipe(recipe.source);
      for (const ing of parsed.ingredients) {
        allIngredients.push({
          name: ing.name,
          quantity: parseQuantity(ing.quantity),
          units: ing.units ?? "",
          recipe: recipe.title,
        });
      }
    }

    return aggregateIngredients(allIngredients);
  }, [recipes, selectedSlugs]);

  function toggleChecked(key: string) {
    setCheckedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }

  async function handleSave() {
    const name = saveName.trim();
    if (!name || selectedSlugs.size === 0) return;
    setSaving(true);
    try {
      const slugs = [...selectedSlugs];
      if (loadedPrepId) {
        await updatePrepAction(loadedPrepId, name, slugs);
        setPreps((prev) =>
          prev.map((p) =>
            p.id === loadedPrepId ? { ...p, name, recipeSlugs: slugs, updatedAt: new Date() } : p,
          ),
        );
      } else {
        const prep = await createPrepAction(name, slugs);
        setPreps((prev) => [prep, ...prev]);
        setLoadedPrepId(prep.id);
      }
      setShowSave(false);
    } finally {
      setSaving(false);
    }
  }

  function handleLoad(prep: MealPrep) {
    setSelectedSlugs(new Set(prep.recipeSlugs));
    setCheckedItems(new Set());
    setLoadedPrepId(prep.id);
    setSaveName(prep.name);
  }

  async function handleDelete(id: number) {
    setPreps((prev) => prev.filter((p) => p.id !== id));
    if (loadedPrepId === id) setLoadedPrepId(null);
    await deletePrepAction(id);
  }

  const selectedCount = selectedSlugs.size;

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Meal Prep</h1>

      {/* Recipe selector */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Select recipes</h2>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Filter recipes…"
          className="w-full text-sm px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <div className="border border-stone-200 dark:border-stone-700 rounded-lg divide-y divide-stone-200 dark:divide-stone-700 max-h-64 overflow-y-auto">
          {filteredRecipes.map((recipe) => {
            const selected = selectedSlugs.has(recipe.slug);
            return (
              <button
                key={recipe.slug}
                onClick={() => toggleRecipe(recipe.slug)}
                className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 transition-colors ${
                  selected
                    ? "bg-amber-50 dark:bg-amber-900/20 text-amber-900 dark:text-amber-100"
                    : "hover:bg-stone-50 dark:hover:bg-stone-800/50"
                }`}
              >
                <span
                  className={`w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                    selected
                      ? "bg-amber-500 border-amber-500 text-white"
                      : "border-stone-300 dark:border-stone-600"
                  }`}
                >
                  {selected && <Check size={12} />}
                </span>
                <span className="truncate">{recipe.title}</span>
              </button>
            );
          })}
        </div>
        {selectedCount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-sm text-stone-500 dark:text-stone-400">
              {selectedCount} recipe{selectedCount !== 1 ? "s" : ""} selected
            </span>
            <button
              onClick={() => { setSelectedSlugs(new Set()); setCheckedItems(new Set()); }}
              className="text-sm text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
            >
              Clear all
            </button>
          </div>
        )}
      </div>

      {/* Saved preps */}
      {preps.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold">Saved Preps</h2>
          <div className="border border-stone-200 dark:border-stone-700 rounded-lg divide-y divide-stone-200 dark:divide-stone-700">
            {preps.map((prep) => {
              const isLoaded = loadedPrepId === prep.id;
              return (
                <div
                  key={prep.id}
                  className={`flex items-center justify-between px-3 py-2 ${
                    isLoaded ? "bg-amber-50 dark:bg-amber-900/20" : ""
                  }`}
                >
                  <button
                    onClick={() => handleLoad(prep)}
                    className="flex-1 text-left text-sm min-w-0"
                  >
                    <span className={`font-medium ${isLoaded ? "text-amber-700 dark:text-amber-400" : ""}`}>
                      {prep.name}
                    </span>
                    <span className="ml-2 text-xs text-stone-400 dark:text-stone-500">
                      {prep.recipeSlugs.length} recipe{prep.recipeSlugs.length !== 1 ? "s" : ""}
                    </span>
                  </button>
                  <button
                    onClick={() => handleDelete(prep.id)}
                    className="text-stone-400 dark:text-stone-500 hover:text-red-500 transition-colors shrink-0 p-1"
                    aria-label={`Delete ${prep.name}`}
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Save / Shopping list */}
      {selectedCount > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Shopping List</h2>
            <div className="flex items-center gap-3">
              <span className="text-sm text-stone-500 dark:text-stone-400">
                {aggregated.length} ingredient{aggregated.length !== 1 ? "s" : ""}
              </span>
              <button
                onClick={() => { setShowSave((v) => !v); if (!saveName) setSaveName(""); }}
                className="inline-flex items-center gap-1.5 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                <Save size={13} />
                {loadedPrepId ? "Update" : "Save"}
              </button>
            </div>
          </div>
          {showSave && (
            <div className="flex gap-2">
              <input
                type="text"
                value={saveName}
                onChange={(e) => setSaveName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSave(); }}
                placeholder="Prep name…"
                className="flex-1 text-sm px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
                autoFocus
              />
              <button
                onClick={handleSave}
                disabled={saving || !saveName.trim()}
                className="text-sm px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 disabled:opacity-50 text-white transition-colors"
              >
                {saving ? "Saving…" : loadedPrepId ? "Update" : "Save"}
              </button>
              <button
                onClick={() => setShowSave(false)}
                className="text-sm px-2 py-1.5 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition-colors"
              >
                <X size={14} />
              </button>
            </div>
          )}
          <div className="border border-stone-200 dark:border-stone-700 rounded-lg divide-y divide-stone-100 dark:divide-stone-800">
            {aggregated.map((item) => {
              const key = item.name.toLowerCase();
              const checked = checkedItems.has(key);
              return (
                <button
                  key={key}
                  onClick={() => toggleChecked(key)}
                  className={`w-full text-left px-3 py-2 flex items-start gap-3 transition-colors ${
                    checked ? "opacity-40" : "hover:bg-stone-50 dark:hover:bg-stone-800/50"
                  }`}
                >
                  <span
                    className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                      checked
                        ? "bg-green-500 border-green-500 text-white"
                        : "border-stone-300 dark:border-stone-600"
                    }`}
                  >
                    {checked && <Check size={12} />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className={`text-sm ${checked ? "line-through" : ""}`}>
                      {item.entries.map((entry, i) => (
                        <span key={i}>
                          {i > 0 && " + "}
                          {entry.quantity !== null && (
                            <span className="font-medium">{formatQuantity(entry.quantity)}</span>
                          )}
                          {entry.units && (
                            <span className="text-stone-500 dark:text-stone-400">
                              {entry.quantity !== null ? " " : ""}{entry.units}
                            </span>
                          )}
                          {(entry.quantity !== null || entry.units) && " "}
                        </span>
                      ))}
                      <span>{item.name}</span>
                      <IngredientHint name={item.name} />
                    </div>
                    <div className="text-xs text-stone-400 dark:text-stone-500 mt-0.5">
                      {[...new Set(item.entries.flatMap((e) => e.recipes))].join(", ")}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {selectedCount === 0 && (
        <p className="text-sm text-stone-500 dark:text-stone-400 text-center py-8">
          Select recipes above to see a combined shopping list
        </p>
      )}
    </div>
  );
}
