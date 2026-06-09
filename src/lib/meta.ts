import type { Metadata } from "next";

const SITE = process.env.SITE_NAME || "Crab News";

// Builds a page <title> as "Page Title | Site" with a matching description,
// so every route ships consistent SEO/social metadata from one place.
export function pageMeta(title: string, description?: string): Metadata {
  return {
    title: `${title} | ${SITE}`,
    description: description ?? `${title} on ${SITE}`,
  };
}
