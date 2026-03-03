"use client";

import { useState, useEffect, useRef } from "react";
import { Recipe } from "@cooklang/cooklang-ts";
import type { Ingredient, Timer } from "@cooklang/cooklang-ts/dist/cooklang";
import { Check, Eye, EyeOff, Timer as TimerIcon, X } from "lucide-react";

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

const CIRCLE_CHECK =
  "w-5 h-5 rounded-full border-2 shrink-0 flex items-center justify-center transition-all duration-150";
const CIRCLE_UNCHECKED =
  "border-stone-300 dark:border-stone-600 hover:border-stone-400 dark:hover:border-stone-500";
const CIRCLE_CHECKED =
  "bg-stone-700 dark:bg-stone-300 border-stone-700 dark:border-stone-300";

export default function RecipeView({ source }: { source: string }) {
  const recipe = new Recipe(source);
  const [checkedIngredients, setCheckedIngredients] = useState<Set<number>>(new Set());
  const [checkedSteps, setCheckedSteps] = useState<Set<number>>(new Set());
  const [timers, setTimers] = useState<ActiveTimer[]>([]);
  const [showFlash, setShowFlash] = useState(false);
  const [showUnits, setShowUnits] = useState(true);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const prevRemainingRef = useRef<Map<string, number>>(new Map());
  const soundIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem("recipe-show-units");
    if (stored === "false") setShowUnits(false);
  }, []);

  // Prevent screen sleep while recipe is open
  useEffect(() => {
    if (!("wakeLock" in navigator)) return;
    let sentinel: WakeLockSentinel | null = null;
    navigator.wakeLock
      .request("screen")
      .then((s) => {
        sentinel = s;
      })
      .catch(() => {});
    return () => {
      sentinel?.release().catch(() => {});
    };
  }, []);

  // Timer tick
  useEffect(() => {
    if (timers.length === 0) return;
    const interval = setInterval(() => {
      setTimers((prev) =>
        prev.map((t) => ({ ...t, remaining: Math.max(0, t.remaining - 1) })),
      );
    }, 1000);
    return () => clearInterval(interval);
  }, [timers.length]);

  // Detect timer completion → looping sound + flash until dismissed
  useEffect(() => {
    let anyJustDone = false;
    for (const t of timers) {
      const prev = prevRemainingRef.current.get(t.id);
      if (prev !== undefined && prev > 0 && t.remaining === 0) {
        anyJustDone = true;
      }
      prevRemainingRef.current.set(t.id, t.remaining);
    }
    const currentIds = new Set(timers.map((t) => t.id));
    for (const id of prevRemainingRef.current.keys()) {
      if (!currentIds.has(id)) prevRemainingRef.current.delete(id);
    }

    const anyDone = timers.some((t) => t.remaining === 0);
    setShowFlash(anyDone);

    if (anyDone) {
      if (anyJustDone && !soundIntervalRef.current) {
        playTimerSound();
        soundIntervalRef.current = setInterval(playTimerSound, 3000);
      }
    } else {
      if (soundIntervalRef.current) {
        clearInterval(soundIntervalRef.current);
        soundIntervalRef.current = null;
      }
    }
  }, [timers]);

  // Clean up sound interval on unmount
  useEffect(() => {
    return () => {
      if (soundIntervalRef.current) clearInterval(soundIntervalRef.current);
    };
  }, []);

  function playTimerSound() {
    const ctx = audioCtxRef.current;
    if (!ctx) return;
    const doPlay = () => {
      try {
        const now = ctx.currentTime;
        const beep = (t: number, freq: number, dur: number) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();
          osc.connect(gain);
          gain.connect(ctx.destination);
          osc.type = "sine";
          osc.frequency.value = freq;
          gain.gain.setValueAtTime(0.3, t);
          gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
          osc.start(t);
          osc.stop(t + dur);
        };
        beep(now, 880, 0.15);
        beep(now + 0.22, 880, 0.15);
        beep(now + 0.44, 1108, 0.5);
      } catch {
        // ignore
      }
    };
    if (ctx.state === "suspended") {
      ctx.resume().then(doPlay).catch(() => {});
    } else {
      doPlay();
    }
  }

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
    // Create AudioContext on first user gesture so it's allowed to play later
    if (!audioCtxRef.current) {
      try {
        audioCtxRef.current = new AudioContext();
      } catch {
        // not supported
      }
    }
    const seconds = toSeconds(token.quantity, token.units);
    const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
    setTimers((prev) => [
      ...prev,
      { id, label: `${token.quantity} ${token.units}`, totalSeconds: seconds, remaining: seconds },
    ]);
  }

  function dismissTimer(id: string) {
    setTimers((prev) => prev.filter((t) => t.id !== id));
  }

  return (
    <>
      <style>{`@keyframes recipe-timer-flash{0%,100%{opacity:1}50%{opacity:0}}`}</style>

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
                  <label className="flex items-center gap-2.5 cursor-pointer group">
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={checkedIngredients.has(i)}
                      onChange={() => toggleIngredient(i)}
                    />
                    <span
                      className={`${CIRCLE_CHECK} ${
                        checkedIngredients.has(i) ? CIRCLE_CHECKED : CIRCLE_UNCHECKED
                      }`}
                    >
                      {checkedIngredients.has(i) && (
                        <Check size={10} strokeWidth={3} className="text-white dark:text-stone-800" />
                      )}
                    </span>
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
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Steps</h2>
              <button
                onClick={() => {
                  const next = !showUnits;
                  setShowUnits(next);
                  localStorage.setItem("recipe-show-units", String(next));
                }}
                className="inline-flex items-center gap-1 text-xs text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-200 transition-colors"
              >
                {showUnits ? (
                  <><Eye size={13} /> Hide units</>
                ) : (
                  <><EyeOff size={13} /> Show units</>
                )}
              </button>
            </div>
            <ol className="space-y-3 text-sm list-none">
              {recipe.steps.map((step, i) => {
                const done = checkedSteps.has(i);
                return (
                  <li key={i} className="flex items-start gap-2.5">
                    <button
                      onClick={() => toggleStep(i)}
                      className={`${CIRCLE_CHECK} mt-0.5 ${done ? CIRCLE_CHECKED : CIRCLE_UNCHECKED}`}
                      aria-label={`Mark step ${i + 1} ${done ? "incomplete" : "complete"}`}
                    >
                      {done && (
                        <Check size={10} strokeWidth={3} className="text-white dark:text-stone-800" />
                      )}
                    </button>
                    <div
                      className={`flex-1 leading-relaxed ${
                        done ? "text-stone-400 dark:text-stone-500" : ""
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
                                className={`font-medium ${
                                  done
                                    ? "text-stone-400 dark:text-stone-500"
                                    : "text-amber-700 dark:text-amber-400"
                                }`}
                              >
                                {showUnits ? ingredientLabel(token) : token.name}
                              </span>
                            );
                          case "cookware":
                            return (
                              <span
                                key={j}
                                className={`font-medium ${
                                  done
                                    ? "text-stone-400 dark:text-stone-500"
                                    : "text-stone-600 dark:text-stone-400"
                                }`}
                              >
                                {token.name}
                              </span>
                            );
                          case "timer":
                            return (
                              <button
                                key={j}
                                onClick={() => startTimer(token)}
                                className={`inline-flex items-center gap-1 font-medium rounded px-1.5 py-0.5 transition-colors ${
                                  done
                                    ? "text-stone-400 dark:text-stone-500 bg-stone-100 dark:bg-stone-800"
                                    : "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30"
                                }`}
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
                );
              })}
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

      {showFlash && (
        <div
          className="fixed inset-0 pointer-events-none z-[100] border-[5px] border-green-500"
          style={{ animation: "recipe-timer-flash 0.8s ease-in-out infinite" }}
        />
      )}
    </>
  );
}
