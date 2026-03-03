"use client";

import { useState, useEffect, useMemo } from "react";
import { Recipe as CooklangRecipe } from "@cooklang/cooklang-ts";
import type { Timer } from "@cooklang/cooklang-ts/dist/cooklang";
import { X } from "lucide-react";

interface RecipeWithSource {
  slug: string;
  title: string;
  source: string;
}

interface Profile {
  id: string;
  name: string;
  ingredients: string[];
}

interface Recommendation {
  slug: string;
  title: string;
  matchedIngredients: string[];
  missingIngredients: string[];
  totalIngredients: number;
  cookingTimeSeconds: number;
}

const PROFILES_KEY = "recipe-profiles";

function toSeconds(quantity: string | number, units: string): number {
  const qty = typeof quantity === "string" ? parseFloat(quantity) : quantity;
  if (isNaN(qty)) return 60;
  const unit = units.toLowerCase().trim();
  if (unit.startsWith("hour") || unit === "h" || unit === "hr" || unit === "hrs") {
    return Math.round(qty * 3600);
  }
  if (unit.startsWith("min") || unit === "m") {
    return Math.round(qty * 60);
  }
  return Math.round(qty);
}

function formatCookingTime(seconds: number): string {
  if (seconds <= 0) return "";
  const totalMinutes = Math.round(seconds / 60);
  if (totalMinutes < 60) return `${totalMinutes} min`;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

function computeRecommendations(
  recipes: RecipeWithSource[],
  allIngredients: string[],
): Recommendation[] {
  const normalized = allIngredients.map((i) => i.toLowerCase().trim()).filter(Boolean);
  const results: Recommendation[] = [];

  for (const recipe of recipes) {
    const parsed = new CooklangRecipe(recipe.source);
    const recipeIngredients = parsed.ingredients.map((ing) => ing.name.toLowerCase().trim());

    const matched = new Set<string>();
    for (const userIng of normalized) {
      for (const recipeIng of recipeIngredients) {
        if (recipeIng.includes(userIng) || userIng.includes(recipeIng)) {
          matched.add(recipeIng);
        }
      }
    }

    const missing = recipeIngredients.filter((ri) => !matched.has(ri));

    let cookingTimeSeconds = 0;
    for (const step of parsed.steps) {
      for (const token of step) {
        if (token.type === "timer") {
          const t = token as Timer;
          cookingTimeSeconds += toSeconds(t.quantity, t.units);
        }
      }
    }

    results.push({
      slug: recipe.slug,
      title: recipe.title,
      matchedIngredients: [...matched],
      missingIngredients: missing,
      totalIngredients: recipeIngredients.length,
      cookingTimeSeconds,
    });
  }

  results.sort((a, b) => {
    const ratioA = a.totalIngredients > 0 ? a.matchedIngredients.length / a.totalIngredients : 0;
    const ratioB = b.totalIngredients > 0 ? b.matchedIngredients.length / b.totalIngredients : 0;
    return ratioB - ratioA;
  });

  return results;
}

function ProfileEditForm({
  initialName,
  initialIngredients,
  onSave,
  onCancel,
}: {
  initialName: string;
  initialIngredients: string[];
  onSave: (name: string, ingredients: string[]) => void;
  onCancel: () => void;
}) {
  const [name, setName] = useState(initialName);
  const [ingredients, setIngredients] = useState<string[]>(initialIngredients);
  const [ingInput, setIngInput] = useState("");

  function addIngredient(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setIngredients((prev) => {
      const set = new Set(prev.map((i) => i.toLowerCase()));
      const next = [...prev];
      for (const p of parts) {
        if (!set.has(p.toLowerCase())) next.push(p);
      }
      return next;
    });
    setIngInput("");
  }

  function removeIngredient(index: number) {
    setIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  return (
    <div className="mt-2 p-3 bg-stone-50 dark:bg-stone-800/50 rounded-lg border border-stone-200 dark:border-stone-700 space-y-3">
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Profile name"
        className="w-full text-sm px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
      />
      <div className="flex gap-2">
        <input
          type="text"
          value={ingInput}
          onChange={(e) => setIngInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === ",") {
              e.preventDefault();
              if (ingInput.trim()) addIngredient(ingInput);
            }
          }}
          placeholder="Add ingredient, press Enter"
          className="flex-1 text-sm px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
        />
        <button
          onClick={() => { if (ingInput.trim()) addIngredient(ingInput); }}
          className="text-sm px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition-colors"
        >
          Add
        </button>
      </div>
      {ingredients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {ingredients.map((ing, i) => (
            <span
              key={i}
              className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-stone-200 dark:bg-stone-700 text-stone-700 dark:text-stone-200"
            >
              {ing}
              <button
                onClick={() => removeIngredient(i)}
                className="hover:text-red-500 transition-colors"
                aria-label={`Remove ${ing}`}
              >
                <X size={10} />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2">
        <button
          onClick={() => { if (name.trim()) onSave(name.trim(), ingredients); }}
          className="text-sm px-3 py-1.5 rounded bg-amber-600 hover:bg-amber-700 text-white transition-colors"
        >
          Save
        </button>
        <button
          onClick={onCancel}
          className="text-sm px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}

export default function DecideClient({ recipes }: { recipes: RecipeWithSource[] }) {
  const [mounted, setMounted] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string | null>(null);
  const [extraIngredients, setExtraIngredients] = useState<string[]>([]);
  const [addInput, setAddInput] = useState("");
  const [showManage, setShowManage] = useState(false);
  const [editingId, setEditingId] = useState<string | "new" | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILES_KEY);
      if (raw) setProfiles(JSON.parse(raw));
    } catch {
      // ignore
    }
    setMounted(true);
  }, []);

  function saveProfiles(next: Profile[]) {
    setProfiles(next);
    localStorage.setItem(PROFILES_KEY, JSON.stringify(next));
  }

  function addExtra(raw: string) {
    const parts = raw.split(",").map((s) => s.trim()).filter(Boolean);
    setExtraIngredients((prev) => {
      const set = new Set(prev.map((i) => i.toLowerCase()));
      const next = [...prev];
      for (const p of parts) {
        if (!set.has(p.toLowerCase())) next.push(p);
      }
      return next;
    });
    setAddInput("");
  }

  function removeExtra(index: number) {
    setExtraIngredients((prev) => prev.filter((_, i) => i !== index));
  }

  const profileIngredients = useMemo(() => {
    if (!selectedProfileId) return [];
    return profiles.find((p) => p.id === selectedProfileId)?.ingredients ?? [];
  }, [profiles, selectedProfileId]);

  const uniqueExtras = useMemo(() => {
    const profileSet = new Set(profileIngredients.map((i) => i.toLowerCase()));
    return extraIngredients.filter((e) => !profileSet.has(e.toLowerCase()));
  }, [profileIngredients, extraIngredients]);

  const allIngredients = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];
    for (const i of [...profileIngredients, ...uniqueExtras]) {
      const key = i.toLowerCase();
      if (!seen.has(key)) { seen.add(key); result.push(i); }
    }
    return result;
  }, [profileIngredients, uniqueExtras]);

  const recommendations = useMemo(
    () => computeRecommendations(recipes, allIngredients),
    [recipes, allIngredients],
  );

  function handleCreateProfile(name: string, ingredients: string[]) {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    saveProfiles([...profiles, { id, name, ingredients }]);
    setEditingId(null);
  }

  function handleUpdateProfile(id: string, name: string, ingredients: string[]) {
    saveProfiles(profiles.map((p) => (p.id === id ? { ...p, name, ingredients } : p)));
    setEditingId(null);
  }

  function handleDeleteProfile(id: string) {
    saveProfiles(profiles.filter((p) => p.id !== id));
    if (selectedProfileId === id) setSelectedProfileId(null);
  }

  if (!mounted) {
    return <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse h-64 rounded-lg bg-stone-100 dark:bg-stone-800" />;
  }

  const matchedRecipes = recommendations.filter((r) => r.matchedIngredients.length > 0);

  return (
    <div className="max-w-2xl mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">What to Make?</h1>

      {/* Profile selector */}
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <label className="text-sm font-medium text-stone-600 dark:text-stone-400 shrink-0">
            Profile:
          </label>
          <select
            value={selectedProfileId ?? ""}
            onChange={(e) => setSelectedProfileId(e.target.value || null)}
            className="flex-1 text-sm px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="">— No profile —</option>
            {profiles.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
          <button
            onClick={() => setShowManage((v) => !v)}
            className="text-sm px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition-colors shrink-0"
          >
            Manage {showManage ? "▲" : "▼"}
          </button>
        </div>

        {/* Manage panel */}
        {showManage && (
          <div className="border border-stone-200 dark:border-stone-700 rounded-lg p-3 space-y-2">
            <button
              onClick={() => setEditingId("new")}
              className="text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              + New profile
            </button>
            {editingId === "new" && (
              <ProfileEditForm
                initialName=""
                initialIngredients={[]}
                onSave={handleCreateProfile}
                onCancel={() => setEditingId(null)}
              />
            )}
            {profiles.map((profile) => (
              <div key={profile.id}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">{profile.name}</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setEditingId(profile.id)}
                      className="text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200"
                      aria-label={`Edit ${profile.name}`}
                    >
                      ✏
                    </button>
                    <button
                      onClick={() => handleDeleteProfile(profile.id)}
                      className="text-xs text-stone-500 dark:text-stone-400 hover:text-red-500"
                      aria-label={`Delete ${profile.name}`}
                    >
                      🗑
                    </button>
                  </div>
                </div>
                {editingId === profile.id && (
                  <ProfileEditForm
                    initialName={profile.name}
                    initialIngredients={profile.ingredients}
                    onSave={(name, ingredients) => handleUpdateProfile(profile.id, name, ingredients)}
                    onCancel={() => setEditingId(null)}
                  />
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* What do you have? */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">What do you have?</h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={addInput}
            onChange={(e) => setAddInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === ",") {
                e.preventDefault();
                if (addInput.trim()) addExtra(addInput);
              }
            }}
            placeholder="Add ingredient, press Enter"
            className="flex-1 text-sm px-2.5 py-1.5 rounded border border-stone-300 dark:border-stone-600 bg-white dark:bg-stone-800 text-stone-900 dark:text-stone-100 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
          <button
            onClick={() => { if (addInput.trim()) addExtra(addInput); }}
            className="text-sm px-3 py-1.5 rounded bg-stone-200 dark:bg-stone-700 hover:bg-stone-300 dark:hover:bg-stone-600 text-stone-700 dark:text-stone-200 transition-colors"
          >
            Add
          </button>
        </div>

        {(profileIngredients.length > 0 || uniqueExtras.length > 0) && (
          <div className="flex flex-wrap gap-1.5">
            {profileIngredients.map((ing, i) => (
              <span
                key={`profile-${i}`}
                className="text-xs px-2 py-0.5 rounded-full bg-stone-100 dark:bg-stone-800 text-stone-500 dark:text-stone-400 border border-stone-200 dark:border-stone-700"
              >
                {ing}
              </span>
            ))}
            {uniqueExtras.map((ing, i) => (
              <span
                key={`extra-${i}`}
                className="inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full bg-stone-800 dark:bg-stone-200 text-stone-100 dark:text-stone-800"
              >
                {ing}
                <button
                  onClick={() => {
                    const idx = extraIngredients.findIndex(
                      (e) => e.toLowerCase() === ing.toLowerCase(),
                    );
                    if (idx >= 0) removeExtra(idx);
                  }}
                  aria-label={`Remove ${ing}`}
                  className="hover:text-red-400 dark:hover:text-red-600 transition-colors"
                >
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}
        {selectedProfileId && profileIngredients.length > 0 && (
          <p className="text-xs text-stone-400 dark:text-stone-500">
            Muted chips are from your profile. Dark chips are extras you added.
          </p>
        )}
      </div>

      {/* Results */}
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">
          {allIngredients.length === 0
            ? "Add ingredients above to see suggestions"
            : `${matchedRecipes.length} recipe${matchedRecipes.length !== 1 ? "s" : ""} found`}
        </h2>
        {matchedRecipes.map((rec) => {
          const ratio =
            rec.totalIngredients > 0
              ? Math.round((rec.matchedIngredients.length / rec.totalIngredients) * 100)
              : 0;
          const timeStr = formatCookingTime(rec.cookingTimeSeconds);
          return (
            <a
              key={rec.slug}
              href={`/recipes/${rec.slug}`}
              className="block border border-stone-200 dark:border-stone-700 rounded-lg p-4 hover:bg-stone-50 dark:hover:bg-stone-800/50 transition-colors space-y-2"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="font-medium text-stone-900 dark:text-stone-100">{rec.title}</span>
                <div className="flex items-center gap-2 shrink-0">
                  {timeStr && (
                    <span className="text-xs px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800">
                      {timeStr}
                    </span>
                  )}
                  <span className="text-xs text-stone-500 dark:text-stone-400">
                    {rec.matchedIngredients.length}/{rec.totalIngredients} ({ratio}%)
                  </span>
                </div>
              </div>
              {rec.matchedIngredients.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {rec.matchedIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="text-xs px-1.5 py-0.5 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                    >
                      {ing}
                    </span>
                  ))}
                  {rec.missingIngredients.map((ing) => (
                    <span
                      key={ing}
                      className="text-xs px-1.5 py-0.5 rounded bg-stone-100 dark:bg-stone-800 text-stone-400 dark:text-stone-500"
                    >
                      {ing}
                    </span>
                  ))}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </div>
  );
}
