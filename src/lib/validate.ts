// Tiny input guards for API payloads (defense against malformed/hostile JSON).

export function isPositiveInt(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v > 0;
}

export function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

// Trim and hard-cap free text so a client can't store unbounded payloads.
export function clampText(v: string, max: number): string {
  return v.trim().slice(0, max);
}
