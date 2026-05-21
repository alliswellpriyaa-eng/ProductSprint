// Shared types used by both server routes and client components.
// Keep this file free of any server-only imports.

export interface ResearchInsight {
  outlierScore: number;
  clickReason: string;
  buyReason: string;
  emotionalTriggers: string[];
  positioningStrategy: string;
  seoPatterns: {
    titleStructure: string;
    repeatedKeywords: string[];
    tagStrategy: string;
  };
  thumbnailStrategy: {
    colorPalette: string;
    fontStyle: string;
    compositionNotes: string;
    clickabilityScore: number;
  };
  bundleOpportunities: string[];
  differentiationAngles: string[];
  pricingInsight: string;
  topListings: Array<{
    title: string;
    price: string;
    favorites: number;
    url: string;
    whyItWins: string;
  }>;
}

export interface GeneratedListing {
  title: string;
  tags: string[];
  description: string;
  faq: Array<{ question: string; answer: string }>;
  pricing: { suggested: string; reasoning: string };
  bundleIdeas: string[];
  thumbnailTextIdeas: string[];
  mockupIdeas: string[];
  emotionalHook: string;
  differentiator: string;
  pinterestPin: { title: string; description: string; hashtags: string[] };
}
