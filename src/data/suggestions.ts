import type { InferSelectModel } from "drizzle-orm";
import type { suggestions as suggestionsTable } from "@/db/schema";

type Suggestion = InferSelectModel<typeof suggestionsTable>;

// --- Mock implementation ---

let mockSuggestions: Suggestion[] = [];
let nextId = 1;

function mockGetAll(): Suggestion[] {
  return [...mockSuggestions].sort(
    (a, b) => b.createdAt.getTime() - a.createdAt.getTime(),
  );
}

function mockCreate(
  title: string,
  url: string | null,
  notes: string | null,
): Suggestion {
  const suggestion: Suggestion = {
    id: nextId++,
    title,
    url,
    notes,
    createdAt: new Date(),
  };
  mockSuggestions.push(suggestion);
  return suggestion;
}

function mockDelete(id: number): void {
  mockSuggestions = mockSuggestions.filter((s) => s.id !== id);
}

// --- Real DB implementation ---

async function dbGetAll(): Promise<Suggestion[]> {
  const { db } = await import("@/db");
  const { suggestions } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(suggestions).orderBy(desc(suggestions.createdAt));
}

async function dbCreate(
  title: string,
  url: string | null,
  notes: string | null,
): Promise<Suggestion> {
  const { db } = await import("@/db");
  const { suggestions } = await import("@/db/schema");
  const [inserted] = await db
    .insert(suggestions)
    .values({ title, url, notes })
    .returning();
  return inserted;
}

async function dbDelete(id: number): Promise<void> {
  const { db } = await import("@/db");
  const { suggestions } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db.delete(suggestions).where(eq(suggestions.id, id));
}

// --- Public API ---

const useDb = !!process.env.DATABASE_URL;

export async function getAllSuggestions(): Promise<Suggestion[]> {
  if (useDb) return dbGetAll();
  return mockGetAll();
}

export async function createSuggestion(
  title: string,
  url: string | null,
  notes: string | null,
): Promise<Suggestion> {
  if (useDb) return dbCreate(title, url, notes);
  return mockCreate(title, url, notes);
}

export async function deleteSuggestion(id: number): Promise<void> {
  if (useDb) return dbDelete(id);
  return mockDelete(id);
}
