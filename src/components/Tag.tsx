import Link from "next/link";
import type { TagLite } from "@/lib/queries";

export function Tag({ tag }: { tag: TagLite }) {
  const kindClass =
    tag.kind === "media"
      ? "media"
      : tag.kind === "meta"
        ? "meta"
        : tag.kind === "special"
          ? "special"
          : "";
  return (
    <Link
      href={`/t/${tag.name}`}
      className={`tag ${kindClass}`}
      title={tag.description}
    >
      {tag.name}
    </Link>
  );
}
