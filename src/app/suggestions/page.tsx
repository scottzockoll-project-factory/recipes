import { revalidatePath } from "next/cache";
import {
  getAllSuggestions,
  createSuggestion,
  deleteSuggestion,
} from "@/data/suggestions";

export const metadata = {
  title: "Jenny's Suggestions | Scott's Recipes",
};

export default async function SuggestionsPage() {
  const suggestions = await getAllSuggestions();

  async function create(formData: FormData) {
    "use server";
    const title = (formData.get("title") as string)?.trim();
    if (!title) return;
    const url = (formData.get("url") as string)?.trim() || null;
    const notes = (formData.get("notes") as string)?.trim() || null;
    await createSuggestion(title, url, notes);
    revalidatePath("/suggestions");
  }

  async function remove(formData: FormData) {
    "use server";
    const id = Number(formData.get("id"));
    if (!id) return;
    await deleteSuggestion(id);
    revalidatePath("/suggestions");
  }

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold text-stone-800">Jenny&apos;s Suggestions</h1>

      <form action={create} className="space-y-4 bg-white p-6 rounded-lg border border-stone-200">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-stone-700 mb-1">
            Recipe title
          </label>
          <input
            id="title"
            name="title"
            type="text"
            required
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            placeholder="e.g. Grandma's banana bread"
          />
        </div>
        <div>
          <label htmlFor="url" className="block text-sm font-medium text-stone-700 mb-1">
            Link (optional)
          </label>
          <input
            id="url"
            name="url"
            type="url"
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            placeholder="https://..."
          />
        </div>
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-stone-700 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            className="w-full border border-stone-300 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-stone-400"
            placeholder="Any extra details..."
          />
        </div>
        <button
          type="submit"
          className="bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-700 text-sm"
        >
          Submit Suggestion
        </button>
      </form>

      {suggestions.length > 0 && (
        <ul className="space-y-3">
          {suggestions.map((s) => (
            <li
              key={s.id}
              className="flex items-start justify-between gap-4 bg-white p-4 rounded-lg border border-stone-200"
            >
              <div className="min-w-0">
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-medium text-stone-800 underline hover:text-stone-600"
                  >
                    {s.title}
                  </a>
                ) : (
                  <span className="font-medium text-stone-800">{s.title}</span>
                )}
                {s.notes && (
                  <p className="text-sm text-stone-500 mt-1">{s.notes}</p>
                )}
              </div>
              <form action={remove}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  className="text-stone-400 hover:text-red-600 text-sm shrink-0"
                >
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      )}

      {suggestions.length === 0 && (
        <p className="text-stone-500 text-sm">No suggestions yet. Be the first!</p>
      )}
    </div>
  );
}
