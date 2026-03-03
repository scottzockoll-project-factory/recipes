"use client";

import { useState, useEffect } from "react";
import { Recipe } from "@cooklang/cooklang-ts";
import type { Ingredient, Timer } from "@cooklang/cooklang-ts/dist/cooklang";
import { Timer as TimerIcon, X } from "lucide-react";

interface ActiveTimer {
  id: string;
  label: string;
  totalSeconds: number;
  remaining: number;
}

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

function formatTime(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  }
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

function ingredientLabel(ing: Ingredient): string {
  const qty = ing.quantity && ing.quantity !== "some" ? `${ing.quantity} ` : "";
  const units = ing.units ? `${ing.units} ` : "";
  return `${qty}${units}${ing.name}`;
}

export default function RecipeView({ source }: { source: string }) {
  const recipe = new Recipe(source);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [timers, setTimers] = useState<ActiveTimer[]>([]);

  useEffect(() => {
    if (timers.length === 0) return;
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => ({ ...t, remaining: Math.max(0, t.remaining - 1) })),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [timers.length]);

  function toggleIngredient(index: number) {
    setCheckedIngredients((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function toggleStep(index: number) {
    setCheckedSteps((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  }

  function startTimer(token: Timer) {
    const seconds = toSeconds(token.quantity, token.units);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    const label = `${token.quantity} ${token.units}`;
    setTimers((prev) => [...prev, { id, label, totalSeconds: seconds, remaining: seconds }]);
  }

  function dismissTimer(id: string) {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <div className="space-y-6">
      {Object.keys(recipe.metadata).length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Info</h2>
          <dl className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm">
            {Object.entries(recipe.metadata).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="font-medium text-stone-600 dark:text-stone-400">{key}</dt>
                <dd>{value}</dd>
              </div>
            ))}
          </dl>
        </div>
      )}

      {recipe.ingredients.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Ingredients</h2>
          <ul className="space-y-1 text-sm">
            {recipe.ingredients.map((ing, i) => (
              <li key={i}>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={checkedIngredients.has(i)}
                    onChange={() => toggleIngredient(i)}
                    className="accent-stone-700 dark:accent-stone-300"
                  />
                  <span
                    className={
                      checkedIngredients.has(i)
                        ? "line-through text-stone-400 dark:text-stone-500"
                        : ""
                    }
                  >
                    {ingredientLabel(ing)}
                  </span>
                </label>
              </li>
            ))}
          </ul>
        </div>
      )}

      {recipe.steps.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold mb-2">Steps</h2>
          <ol className="space-y-3 text-sm list-none">
            {recipe.steps.map((step, i) => (
              <li key={i} className="flex items-start gap-2">
                <input
                  type="checkbox"
                  checked={checkedSteps.has(i)}
                  onChange={() => toggleStep(i)}
                  className="mt-0.5 accent-stone-700 dark:accent-stone-300 shrink-0"
                />
                <div
                  className={`flex-1 leading-relaxed ${
                    checkedSteps.has(i) ? "text-stone-400 dark:text-stone-500" : ""
                  }`}
                >
                  <span className="text-stone-400 dark:text-stone-500 mr-1.5 select-none">
                    {i + 1}.
                  </span>
                  {step.map((token, j) => {
                    switch (token.type) {
                      case "ingredient":
                        return (
                          <span
                            key={j}
                            className="font-medium text-amber-700 dark:text-amber-400"
                          >
                            {ingredientLabel(token)}
                          </span>
                        );
                      case "cookware":
                        return (
                          <span
                            key={j}
                            className="font-medium text-stone-600 dark:text-stone-400"
                          >
                            {token.name}
                          </span>
                        );
                      case "timer":
                        return (
                          <button
                            key={j}
                            onClick={() => startTimer(token)}
                            className="inline-flex items-center gap-1 font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded px-1.5 py-0.5 transition-colors"
                            style={{ textDecoration: "none" }}
                            title="Tap to start timer"
                          >
                            <TimerIcon size={13} />
                            {token.quantity} {token.units}
                          </button>
                        );
                      case "text":
                        return <span key={j}>{token.value}</span>;
                      default:
                        return null;
                    }
                  })}
                </div>
              </li>
            ))}
          </ol>
        </div>
      )}

      {timers.length > 0 && (
        <div className="fixed bottom-4 right-4 flex flex-col gap-2 z-50">
          {timers.map((timer) => (
            <div
              key={timer.id}
              className={`bg-white dark:bg-stone-800 border rounded-xl shadow-lg px-4 py-3 flex items-center gap-3 min-w-[160px] ${
                timer.remaining === 0
                  ? "border-green-400 dark:border-green-500"
                  : "border-stone-200 dark:border-stone-700"
              }`}
            >
              <div className="flex-1 min-w-0">
                <div className="text-xs text-stone-500 dark:text-stone-400 truncate">
                  {timer.label}
                </div>
                <div
                  className={`text-xl font-mono font-semibold tabular-nums ${
                    timer.remaining === 0 ? "text-green-600 dark:text-green-400" : ""
                  }`}
                >
                  {timer.remaining === 0 ? "Done!" : formatTime(timer.remaining)}
                </div>
              </div>
              <button
                onClick={() => dismissTimer(timer.id)}
                className="text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors shrink-0"
                aria-label="Dismiss timer"
              >
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
