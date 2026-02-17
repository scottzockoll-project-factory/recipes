import type { InferSelectModel } from "drizzle-orm";
import type { recipes as recipesTable } from "@/db/schema";

type Recipe = InferSelectModel<typeof recipesTable>;

// --- Mock implementation ---

const seedRecipes: Recipe[] = [
  {
    id: 1,
    slug: "classic-tomato-pasta",
    title: "Classic Tomato Pasta",
    source: `Bring a large pot of @water to a boil and cook @pasta{500%g} until al dente.

In a large pan, heat @olive oil{2%tbsp} over medium heat. Add @garlic{3%cloves}, minced, and sauté for ~{1%minute}.

Add @canned tomatoes{400%g} and @salt{1%tsp}. Simmer for ~{15%minutes}.

Toss the cooked pasta with the sauce and top with @parmesan cheese{50%g}, grated.`,
    createdAt: new Date("2025-01-15"),
    updatedAt: new Date("2025-01-15"),
  },
  {
    id: 2,
    slug: "scrambled-eggs-on-toast",
    title: "Scrambled Eggs on Toast",
    source: `Crack @eggs{3} into a bowl and whisk with @salt{1%pinch} and @pepper{1%pinch}.

Melt @butter{1%tbsp} in a non-stick pan over low heat. Pour in the eggs and stir gently with a spatula for ~{3%minutes} until just set.

Toast @bread{2%slices} and serve the eggs on top. Garnish with @chives{1%tbsp}, chopped.`,
    createdAt: new Date("2025-02-10"),
    updatedAt: new Date("2025-02-10"),
  },
  {
    id: 3,
    slug: "simple-green-salad",
    title: "Simple Green Salad",
    source: `Wash and tear @mixed greens{200%g} into bite-sized pieces.

Whisk together @olive oil{3%tbsp}, @lemon juice{1%tbsp}, @dijon mustard{1%tsp}, and @honey{1%tsp} to make a vinaigrette.

Toss the greens with the dressing. Top with @cherry tomatoes{100%g}, halved, and @cucumber{1}, sliced.`,
    createdAt: new Date("2025-03-05"),
    updatedAt: new Date("2025-03-05"),
  },
];

let mockRecipes: Recipe[] = [...seedRecipes];
let nextId = 4;

function mockGetAllRecipes(): { slug: string; title: string }[] {
  return [...mockRecipes]
    .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime())
    .map(({ slug, title }) => ({ slug, title }));
}

function mockGetRecipe(slug: string): Recipe | undefined {
  return mockRecipes.find((r) => r.slug === slug);
}

function mockCreateRecipe(slug: string, title: string, source: string): { slug: string } {
  if (mockRecipes.some((r) => r.slug === slug)) {
    throw new Error(`A recipe with slug "${slug}" already exists`);
  }
  const now = new Date();
  const recipe: Recipe = { id: nextId++, slug, title, source, createdAt: now, updatedAt: now };
  mockRecipes.push(recipe);
  return { slug: recipe.slug };
}

function mockUpdateRecipe(slug: string, title: string, source: string): void {
  const recipe = mockRecipes.find((r) => r.slug === slug);
  if (recipe) {
    recipe.title = title;
    recipe.source = source;
    recipe.updatedAt = new Date();
  }
}

function mockIsSlugAvailable(slug: string): boolean {
  return !mockRecipes.some((r) => r.slug === slug);
}

// --- Real DB implementation ---

async function dbGetAllRecipes(): Promise<{ slug: string; title: string }[]> {
  const { db } = await import("@/db");
  const { recipes } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");
  return db
    .select({ slug: recipes.slug, title: recipes.title })
    .from(recipes)
    .orderBy(desc(recipes.createdAt));
}

async function dbGetRecipe(slug: string): Promise<Recipe | undefined> {
  const { db } = await import("@/db");
  const { recipes } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const [recipe] = await db.select().from(recipes).where(eq(recipes.slug, slug));
  return recipe;
}

async function dbCreateRecipe(slug: string, title: string, source: string): Promise<{ slug: string }> {
  const { db } = await import("@/db");
  const { recipes } = await import("@/db/schema");
  const [inserted] = await db
    .insert(recipes)
    .values({ slug, title, source })
    .returning({ slug: recipes.slug });
  return inserted;
}

async function dbUpdateRecipe(slug: string, title: string, source: string): Promise<void> {
  const { db } = await import("@/db");
  const { recipes } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db
    .update(recipes)
    .set({ title, source, updatedAt: new Date() })
    .where(eq(recipes.slug, slug));
}

async function dbIsSlugAvailable(slug: string): Promise<boolean> {
  const { db } = await import("@/db");
  const { recipes } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const [existing] = await db.select({ slug: recipes.slug }).from(recipes).where(eq(recipes.slug, slug));
  return !existing;
}

// --- Search helpers ---

type RecipeWithSource = { slug: string; title: string; source: string };

function mockGetAllRecipesWithSource(): RecipeWithSource[] {
  return mockRecipes.map(({ slug, title, source }) => ({ slug, title, source }));
}

async function dbGetAllRecipesWithSource(): Promise<RecipeWithSource[]> {
  const { db } = await import("@/db");
  const { recipes } = await import("@/db/schema");
  return db
    .select({ slug: recipes.slug, title: recipes.title, source: recipes.source })
    .from(recipes);
}

export interface IngredientSearchResult {
  slug: string;
  title: string;
  matchedIngredients: string[];
  totalIngredients: number;
}

export async function searchRecipesByIngredients(
  userIngredients: string[],
): Promise<IngredientSearchResult[]> {
  const allRecipes = useDb
    ? await dbGetAllRecipesWithSource()
    : mockGetAllRecipesWithSource();

  const { Recipe: CooklangRecipe } = await import("@cooklang/cooklang-ts");

  const normalized = userIngredients.map((i) => i.toLowerCase().trim());
  if (normalized.length === 0) return [];

  const results: IngredientSearchResult[] = [];

  for (const recipe of allRecipes) {
    const parsed = new CooklangRecipe(recipe.source);
    const recipeIngredients = parsed.ingredients.map((ing) =>
      ing.name.toLowerCase().trim(),
    );

    const matched = new Set<string>();
    for (const userIng of normalized) {
      for (const recipeIng of recipeIngredients) {
        if (recipeIng.includes(userIng) || userIng.includes(recipeIng)) {
          matched.add(recipeIng);
        }
      }
    }

    if (matched.size > 0) {
      results.push({
        slug: recipe.slug,
        title: recipe.title,
        matchedIngredients: [...matched],
        totalIngredients: recipeIngredients.length,
      });
    }
  }

  results.sort((a, b) => b.matchedIngredients.length - a.matchedIngredients.length);
  return results;
}

// --- Public API ---

const useDb = !!process.env.DATABASE_URL;

export async function getAllRecipes(): Promise<{ slug: string; title: string }[]> {
  if (useDb) return dbGetAllRecipes();
  return mockGetAllRecipes();
}

export async function getRecipe(slug: string): Promise<Recipe | undefined> {
  if (useDb) return dbGetRecipe(slug);
  return mockGetRecipe(slug);
}

export async function createRecipe(slug: string, title: string, source: string): Promise<{ slug: string }> {
  if (useDb) return dbCreateRecipe(slug, title, source);
  return mockCreateRecipe(slug, title, source);
}

export async function updateRecipe(slug: string, title: string, source: string): Promise<void> {
  if (useDb) return dbUpdateRecipe(slug, title, source);
  return mockUpdateRecipe(slug, title, source);
}

export async function isSlugAvailable(slug: string): Promise<boolean> {
  if (useDb) return dbIsSlugAvailable(slug);
  return mockIsSlugAvailable(slug);
}
