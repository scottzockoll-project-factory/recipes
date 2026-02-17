"use client";

export default function RecipeForm({
  action,
  defaultValues,
}: {
  action: (formData: FormData) => void;
  defaultValues?: { title: string; source: string };
}) {
  return (
    <form action={action} className="space-y-4">
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
          className="w-full border border-stone-300 rounded px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>
      <div>
        <label htmlFor="source" className="block text-sm font-medium mb-1">
          Recipe (Cooklang)
        </label>
        <textarea
          id="source"
          name="source"
          required
          rows={12}
          defaultValue={defaultValues?.source}
          placeholder="Preheat the @oven to 350°F. Mix @flour{2%cups} with @sugar{1%cup}..."
          className="w-full border border-stone-300 rounded px-3 py-2 bg-white font-mono text-sm focus:outline-none focus:ring-2 focus:ring-stone-500"
        />
      </div>
      <button
        type="submit"
        className="bg-stone-800 text-white px-4 py-2 rounded hover:bg-stone-700"
      >
        Save Recipe
      </button>
    </form>
  );
}
