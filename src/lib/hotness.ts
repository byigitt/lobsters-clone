// Lobsters-inspired hotness. Higher is hotter.
// score grows with upvotes & comments, decays with age.
export function calcHotness(
  upvotes: number,
  commentCount: number,
  createdAt: number,
  tagMod = 0,
): number {
  const score = upvotes - 1 + commentCount * 0.5 + tagMod;
  const order = Math.log10(Math.max(Math.abs(score), 1));
  const sign = score > 0 ? 1 : score < 0 ? -1 : 0;
  // age in hours since a fixed epoch; newer => larger
  const hours = createdAt / 3600;
  return Number((sign * order + hours / 6).toFixed(7));
}
