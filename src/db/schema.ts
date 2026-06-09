import { sql } from "drizzle-orm";
import {
  sqliteTable,
  text,
  integer,
  real,
  primaryKey,
  index,
} from "drizzle-orm/sqlite-core";

const now = sql`(unixepoch())`;

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  username: text("username").notNull().unique(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  about: text("about").default("").notNull(),
  createdAt: integer("created_at").notNull().default(now),
  invitedById: integer("invited_by_id"),
  karma: integer("karma").notNull().default(0),
  isAdmin: integer("is_admin", { mode: "boolean" }).notNull().default(false),
  isModerator: integer("is_moderator", { mode: "boolean" })
    .notNull()
    .default(false),
  bannedAt: integer("banned_at"),
  canInvite: integer("can_invite", { mode: "boolean" })
    .notNull()
    .default(true),
});

export const sessions = sqliteTable("sessions", {
  token: text("token").primaryKey(),
  userId: integer("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: integer("created_at").notNull().default(now),
});

// Invitation tokens. An invitation is "used" once someone signs up with it.
export const invitations = sqliteTable("invitations", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  email: text("email").notNull(),
  memo: text("memo").default("").notNull(),
  senderId: integer("sender_id")
    .notNull()
    .references(() => users.id),
  usedById: integer("used_by_id").references(() => users.id),
  createdAt: integer("created_at").notNull().default(now),
});

export const tags = sqliteTable("tags", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  description: text("description").default("").notNull(),
  // kind drives the tag color: default | media | meta | special
  kind: text("kind").notNull().default("default"),
  hotnessMod: real("hotness_mod").notNull().default(0),
  // privileged tags require non-new users
  privileged: integer("privileged", { mode: "boolean" })
    .notNull()
    .default(false),
});

export const stories = sqliteTable(
  "stories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    shortId: text("short_id").notNull().unique(),
    title: text("title").notNull(),
    url: text("url"),
    domain: text("domain"),
    description: text("description").default("").notNull(), // text story body
    slug: text("slug").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    createdAt: integer("created_at").notNull().default(now),
    upvotes: integer("upvotes").notNull().default(1),
    hotness: real("hotness").notNull().default(0),
    commentCount: integer("comment_count").notNull().default(0),
  },
  (t) => ({
    hotnessIdx: index("stories_hotness_idx").on(t.hotness),
    createdIdx: index("stories_created_idx").on(t.createdAt),
  }),
);

export const storyTags = sqliteTable(
  "story_tags",
  {
    storyId: integer("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    tagId: integer("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => ({ pk: primaryKey({ columns: [t.storyId, t.tagId] }) }),
);

export const comments = sqliteTable(
  "comments",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    shortId: text("short_id").notNull().unique(),
    storyId: integer("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id),
    parentId: integer("parent_id"),
    body: text("body").notNull(),
    createdAt: integer("created_at").notNull().default(now),
    upvotes: integer("upvotes").notNull().default(1),
  },
  (t) => ({ storyIdx: index("comments_story_idx").on(t.storyId) }),
);

export const storyVotes = sqliteTable(
  "story_votes",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storyId: integer("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.storyId] }) }),
);

export const commentVotes = sqliteTable(
  "comment_votes",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    commentId: integer("comment_id")
      .notNull()
      .references(() => comments.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.commentId] }) }),
);

export const savedStories = sqliteTable(
  "saved_stories",
  {
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    storyId: integer("story_id")
      .notNull()
      .references(() => stories.id, { onDelete: "cascade" }),
    createdAt: integer("created_at").notNull().default(now),
  },
  (t) => ({ pk: primaryKey({ columns: [t.userId, t.storyId] }) }),
);

export type User = typeof users.$inferSelect;
export type Story = typeof stories.$inferSelect;
export type Comment = typeof comments.$inferSelect;
export type Tag = typeof tags.$inferSelect;
