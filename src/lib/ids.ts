import { randomBytes } from "crypto";

const ALPHABET = "abcdefghijklmnopqrstuvwxyz0123456789";

// Lobsters-style short id: 6 base36 chars.
export function shortId(len = 6): string {
  const bytes = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function inviteCode(): string {
  return randomBytes(16).toString("hex");
}

export function sessionToken(): string {
  return randomBytes(32).toString("hex");
}

// Lobsters slug: lowercase, words joined by underscore, max ~8 words.
export function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, "")
    .trim()
    .split(/\s+/)
    .slice(0, 8)
    .join("_");
}
