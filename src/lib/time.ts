// "13 hours ago" style relative time. Input is unix seconds.
export function ago(unixSeconds: number): string {
  const diff = Math.max(0, Math.floor(Date.now() / 1000) - unixSeconds);
  const units: [number, string][] = [
    [60, "second"],
    [60, "minute"],
    [24, "hour"],
    [30, "day"],
    [12, "month"],
    [Number.POSITIVE_INFINITY, "year"],
  ];
  let value = diff;
  let unit = "second";
  let acc = 1;
  for (const [size, name] of units) {
    if (value < size) {
      unit = name;
      break;
    }
    acc *= size;
    value = Math.floor(diff / acc);
    unit = name;
  }
  if (diff < 60) return "just now";
  const n = value;
  return `${n} ${unit}${n === 1 ? "" : "s"} ago`;
}

export function isNewUser(createdAt: number): boolean {
  // New for first 70 days.
  return Date.now() / 1000 - createdAt < 70 * 24 * 60 * 60;
}
