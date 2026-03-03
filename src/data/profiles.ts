import type { InferSelectModel } from "drizzle-orm";
import type { pantryProfiles } from "@/db/schema";

export type Profile = InferSelectModel<typeof pantryProfiles>;

const useDb = !!process.env.DATABASE_URL;

// --- Mock implementation ---

let mockProfiles: Profile[] = [];
let nextMockId = 1;

function mockGetAllProfiles(): Profile[] {
  return [...mockProfiles].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
}

function mockCreateProfile(name: string, ingredients: string[], isDefault: boolean): Profile {
  const now = new Date();
  if (isDefault) mockProfiles.forEach((p) => (p.isDefault = false));
  const profile: Profile = { id: nextMockId++, name, ingredients, isDefault, createdAt: now, updatedAt: now };
  mockProfiles.push(profile);
  return profile;
}

function mockUpdateProfile(id: number, name: string, ingredients: string[]): void {
  const p = mockProfiles.find((p) => p.id === id);
  if (p) { p.name = name; p.ingredients = ingredients; p.updatedAt = new Date(); }
}

function mockDeleteProfile(id: number): void {
  mockProfiles = mockProfiles.filter((p) => p.id !== id);
}

function mockSetDefaultProfile(id: number): void {
  mockProfiles.forEach((p) => (p.isDefault = p.id === id));
}

// --- Real DB implementation ---

async function dbGetAllProfiles(): Promise<Profile[]> {
  const { db } = await import("@/db");
  const { pantryProfiles } = await import("@/db/schema");
  const { asc } = await import("drizzle-orm");
  return db.select().from(pantryProfiles).orderBy(asc(pantryProfiles.createdAt));
}

async function dbCreateProfile(name: string, ingredients: string[], isDefault: boolean): Promise<Profile> {
  const { db } = await import("@/db");
  const { pantryProfiles } = await import("@/db/schema");
  if (isDefault) {
    await db.update(pantryProfiles).set({ isDefault: false });
  }
  const [inserted] = await db.insert(pantryProfiles).values({ name, ingredients, isDefault }).returning();
  return inserted;
}

async function dbUpdateProfile(id: number, name: string, ingredients: string[]): Promise<void> {
  const { db } = await import("@/db");
  const { pantryProfiles } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db.update(pantryProfiles).set({ name, ingredients, updatedAt: new Date() }).where(eq(pantryProfiles.id, id));
}

async function dbDeleteProfile(id: number): Promise<void> {
  const { db } = await import("@/db");
  const { pantryProfiles } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  await db.delete(pantryProfiles).where(eq(pantryProfiles.id, id));
}

async function dbSetDefaultProfile(id: number): Promise<void> {
  const { db } = await import("@/db");
  const { pantryProfiles } = await import("@/db/schema");
  const { eq, ne } = await import("drizzle-orm");
  await db.update(pantryProfiles).set({ isDefault: false }).where(ne(pantryProfiles.id, id));
  await db.update(pantryProfiles).set({ isDefault: true }).where(eq(pantryProfiles.id, id));
}

// --- Public API ---

export async function getAllProfiles(): Promise<Profile[]> {
  if (useDb) return dbGetAllProfiles();
  return mockGetAllProfiles();
}

export async function createProfile(name: string, ingredients: string[], isDefault = false): Promise<Profile> {
  if (useDb) return dbCreateProfile(name, ingredients, isDefault);
  return mockCreateProfile(name, ingredients, isDefault);
}

export async function updateProfile(id: number, name: string, ingredients: string[]): Promise<void> {
  if (useDb) return dbUpdateProfile(id, name, ingredients);
  return mockUpdateProfile(id, name, ingredients);
}

export async function deleteProfile(id: number): Promise<void> {
  if (useDb) return dbDeleteProfile(id);
  return mockDeleteProfile(id);
}

export async function setDefaultProfile(id: number): Promise<void> {
  if (useDb) return dbSetDefaultProfile(id);
  return mockSetDefaultProfile(id);
}
