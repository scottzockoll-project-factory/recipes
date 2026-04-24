import type { InferSelectModel } from "drizzle-orm";
import type { mealPreps as mealPrepsTable } from "@/db/schema";

export type MealPrep = InferSelectModel<typeof mealPrepsTable>;

// --- Mock implementation ---

let mockPreps: MealPrep[] = [];
let nextId = 1;

function mockGetAll(): MealPrep[] {
  return [...mockPreps].sort((a, b) => b.updatedAt.getTime() - a.updatedAt.getTime());
}

function mockCreate(name: string, recipeSlugs: string[]): MealPrep {
  const now = new Date();
  const prep: MealPrep = { id: nextId++, name, recipeSlugs, createdAt: now, updatedAt: now };
  mockPreps.push(prep);
  return prep;
}

function mockUpdate(id: number, name: string, recipeSlugs: string[]): void {
  const prep = mockPreps.find((p) => p.id === id);
  if (prep) {
    prep.name = name;
    prep.recipeSlugs = recipeSlugs;
    prep.updatedAt = new Date();
  }
}

function mockDelete(id: number): void {
  mockPreps = mockPreps.filter((p) => p.id !== id);
}

// --- Real DB implementation ---

async function dbGetAll(): Promise<MealPrep[]> {
  const { db } = await import("@/db");
  const { mealPreps } = await import("@/db/schema");
  const { desc } = await import("drizzle-orm");
  return db.select().from(mealPreps).orderBy(desc(mealPreps.updatedAt));
}

async function dbCreate(name: string, recipeSlugs: string[]): Promise<MealPrep> {
  const { db } = await import("@/db");
  const { mealPreps } = await import("@/db/schema");
  const [inserted] = await db
    .insert(mealPreps)
    .values({ name, recipeSlugs })
    .returning();
  return inserted;
}

async function dbUpdate(id: number, name: string, recipeSlugs: string[]): Promise<void> {
  const { db } = await import("@/db");
  const { mealPreps } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db
    .update(mealPreps)
    .set({ name, recipeSlugs, updatedAt: new Date() })
    .where(eq(mealPreps.id, id));
}

async function dbDelete(id: number): Promise<void> {
  const { db } = await import("@/db");
  const { mealPreps } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db.delete(mealPreps).where(eq(mealPreps.id, id));
}

// --- Public API ---

const useDb = !!process.env.DATABASE_URL;

export async function getAllMealPreps(): Promise<MealPrep[]> {
  if (useDb) return dbGetAll();
  return mockGetAll();
}

export async function createMealPrep(name: string, recipeSlugs: string[]): Promise<MealPrep> {
  if (useDb) return dbCreate(name, recipeSlugs);
  return mockCreate(name, recipeSlugs);
}

export async function updateMealPrep(id: number, name: string, recipeSlugs: string[]): Promise<void> {
  if (useDb) return dbUpdate(id, name, recipeSlugs);
  return mockUpdate(id, name, recipeSlugs);
}

export async function deleteMealPrep(id: number): Promise<void> {
  if (useDb) return dbDelete(id);
  return mockDelete(id);
}
