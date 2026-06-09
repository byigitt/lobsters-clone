// "no comments" / "1 comment" / "5 comments"
export function commentLabel(count: number): string {
  if (count === 0) return "no comments";
  return `${count} comment${count === 1 ? "" : "s"}`;
}

// Generic count + noun pluralizer: pluralize(1, "result") -> "1 result".
export function pluralize(count: number, noun: string): string {
  return `${count} ${noun}${count === 1 ? "" : "s"}`;
}
