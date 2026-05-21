/**
 * Client-side localStorage utility for saved Etsy ideas.
 * All functions guard against SSR (typeof window === "undefined").
 */

export interface EtsyExportPack {
  seoTitle: string;
  tags: string[];
  description: string;
  pricing: string;
  canvaInstructions: string;
  thumbnailText: string;
  pinterestTitle: string;
  pinterestDescription: string;
  reelCaption: string;
  launchChecklist: string[];
}

export interface SavedIdea {
  title: string;
  description: string;
  niche: string;
  productType: string;
  marketScore?: {
    demand: number;
    competition: string;
    seoOpportunity: string;
    trend: string;
    beginnerFriendly: boolean;
    estimatedPriceRange: string;
  };
  exportPack?: EtsyExportPack;
  savedAt: string; // ISO date string
}

const STORAGE_KEY = "ps_saved_ideas";

function readStore(): SavedIdea[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as SavedIdea[];
  } catch {
    return [];
  }
}

function writeStore(ideas: SavedIdea[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ideas));
  } catch {
    // Silently swallow quota errors
  }
}

/** Returns all saved ideas, newest first. */
export function getSavedIdeas(): SavedIdea[] {
  return readStore();
}

/** Adds a new idea or updates an existing one matched by title. */
export function saveIdea(idea: SavedIdea): void {
  if (typeof window === "undefined") return;
  const ideas = readStore();
  const idx = ideas.findIndex((i) => i.title === idea.title);
  if (idx >= 0) {
    ideas[idx] = idea;
  } else {
    ideas.unshift(idea);
  }
  writeStore(ideas);
}

/** Removes the idea with the given title, if present. */
export function unsaveIdea(title: string): void {
  if (typeof window === "undefined") return;
  const ideas = readStore().filter((i) => i.title !== title);
  writeStore(ideas);
}

/** Returns true if an idea with this title is currently saved. */
export function isIdeaSaved(title: string): boolean {
  if (typeof window === "undefined") return false;
  return readStore().some((i) => i.title === title);
}

/** Removes all saved ideas from localStorage. */
export function clearAllSavedIdeas(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {
    // Silently swallow errors
  }
}
