import "server-only";
import { desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  stories,
  users,
  tags,
  storyTags,
  comments,
  storyVotes,
} from "@/db/schema";

export type TagLite = { name: string; description: string; kind: string };

export type StoryListItem = {
  id: number;
  shortId: string;
  title: string;
  url: string | null;
  domain: string | null;
  description: string;
  slug: string;
  createdAt: number;
  upvotes: number;
  commentCount: number;
  author: { username: string; createdAt: number };
  tags: TagLite[];
  voted: boolean;
};

async function attachMeta(
  rows: (typeof stories.$inferSelect & {
    authorName: string;
    authorCreated: number;
  })[],
  viewerId?: number,
): Promise<StoryListItem[]> {
  if (rows.length === 0) return [];
  const ids = rows.map((r) => r.id);

  const tagRows = await db
    .select({
      storyId: storyTags.storyId,
      name: tags.name,
      description: tags.description,
      kind: tags.kind,
    })
    .from(storyTags)
    .innerJoin(tags, eq(storyTags.tagId, tags.id))
    .where(inArray(storyTags.storyId, ids))
    .all();

  const tagMap = new Map<number, TagLite[]>();
  for (const t of tagRows) {
    const arr = tagMap.get(t.storyId) ?? [];
    arr.push({ name: t.name, description: t.description, kind: t.kind });
    tagMap.set(t.storyId, arr);
  }

  let votedSet = new Set<number>();
  if (viewerId) {
    const votes = await db
      .select({ storyId: storyVotes.storyId })
      .from(storyVotes)
      .where(
        sql`${storyVotes.userId} = ${viewerId} and ${storyVotes.storyId} in ${ids}`,
      )
      .all();
    votedSet = new Set(votes.map((v) => v.storyId));
  }

  return rows.map((r) => ({
    id: r.id,
    shortId: r.shortId,
    title: r.title,
    url: r.url,
    domain: r.domain,
    description: r.description,
    slug: r.slug,
    createdAt: r.createdAt,
    upvotes: r.upvotes,
    commentCount: r.commentCount,
    author: { username: r.authorName, createdAt: r.authorCreated },
    tags: (tagMap.get(r.id) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
    voted: votedSet.has(r.id),
  }));
}

function baseSelect() {
  return db
    .select({
      id: stories.id,
      shortId: stories.shortId,
      title: stories.title,
      url: stories.url,
      domain: stories.domain,
      description: stories.description,
      slug: stories.slug,
      userId: stories.userId,
      createdAt: stories.createdAt,
      upvotes: stories.upvotes,
      hotness: stories.hotness,
      commentCount: stories.commentCount,
      authorName: users.username,
      authorCreated: users.createdAt,
    })
    .from(stories)
    .innerJoin(users, eq(stories.userId, users.id));
}

export async function getHottest(viewerId?: number, limit = 25, offset = 0) {
  const rows = await baseSelect()
    .orderBy(desc(stories.hotness))
    .limit(limit)
    .offset(offset)
    .all();
  return attachMeta(rows, viewerId);
}

export async function getRecent(viewerId?: number, limit = 25, offset = 0) {
  const rows = await baseSelect()
    .orderBy(desc(stories.createdAt))
    .limit(limit)
    .offset(offset)
    .all();
  return attachMeta(rows, viewerId);
}

export async function getStoriesByTag(
  tagName: string,
  viewerId?: number,
  limit = 25,
) {
  const rows = await baseSelect()
    .innerJoin(storyTags, eq(storyTags.storyId, stories.id))
    .innerJoin(tags, eq(tags.id, storyTags.tagId))
    .where(eq(tags.name, tagName))
    .orderBy(desc(stories.hotness))
    .limit(limit)
    .all();
  return attachMeta(rows, viewerId);
}

export async function getStoriesByUser(username: string, viewerId?: number) {
  const rows = await baseSelect()
    .where(eq(users.username, username))
    .orderBy(desc(stories.createdAt))
    .all();
  return attachMeta(rows, viewerId);
}

export async function getStory(shortId: string, viewerId?: number) {
  const row = await baseSelect().where(eq(stories.shortId, shortId)).get();
  if (!row) return null;
  const [withMeta] = await attachMeta([row], viewerId);
  return withMeta;
}

export type CommentNode = {
  id: number;
  shortId: string;
  body: string;
  createdAt: number;
  upvotes: number;
  parentId: number | null;
  author: { username: string; createdAt: number };
  children: CommentNode[];
};

export async function getComments(storyId: number): Promise<CommentNode[]> {
  const rows = await db
    .select({
      id: comments.id,
      shortId: comments.shortId,
      body: comments.body,
      createdAt: comments.createdAt,
      upvotes: comments.upvotes,
      parentId: comments.parentId,
      authorName: users.username,
      authorCreated: users.createdAt,
    })
    .from(comments)
    .innerJoin(users, eq(comments.userId, users.id))
    .where(eq(comments.storyId, storyId))
    .orderBy(desc(comments.upvotes))
    .all();

  const map = new Map<number, CommentNode>();
  for (const r of rows) {
    map.set(r.id, {
      id: r.id,
      shortId: r.shortId,
      body: r.body,
      createdAt: r.createdAt,
      upvotes: r.upvotes,
      parentId: r.parentId,
      author: { username: r.authorName, createdAt: r.authorCreated },
      children: [],
    });
  }
  const roots: CommentNode[] = [];
  for (const node of map.values()) {
    if (node.parentId && map.has(node.parentId)) {
      map.get(node.parentId)!.children.push(node);
    } else {
      roots.push(node);
    }
  }
  return roots;
}

export async function getAllTags() {
  return db.select().from(tags).orderBy(tags.name).all();
}
