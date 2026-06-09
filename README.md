# Crab News — invite-only link aggregator

A self-hosted, **invite-only** Hacker-News-style computing community, visually
modeled on [lobste.rs](https://lobste.rs). Built with **Next.js 15 (App Router)**,
**Drizzle ORM** + **better-sqlite3**, and cookie-session auth.

## Features

- **Invite-only registration** — you can only sign up via an invite link from an
  existing member. The full **invitation tree** is public (`/users`), so every
  account traces back to whoever vouched for them.
- **New user restrictions** — accounts are "new" for 70 days (shown in green) and
  can't send invites or use privileged tags (`show`, `ask`, `meta`, `rant`, …).
- **Stories** — link or text/ask posts, predefined **tag** system with
  lobsters-style colored tags (default / media / meta / special).
- **Hotness ranking** — upvotes + comment activity decayed by age (`/`), plus a
  chronological `/recent` feed.
- **Threaded comments** with markdown, **upvoting** on stories & comments,
  **karma**, per-user profiles, tag & domain pages, and search.

## Stack

| Concern   | Choice                          |
| --------- | ------------------------------- |
| Framework | Next.js 15 / React 19           |
| DB / ORM  | SQLite + Drizzle ORM            |
| Auth      | bcrypt + DB-backed session cookie |

## Getting started

```bash
pnpm install
pnpm db:push      # create the SQLite schema (dev.db)
pnpm db:seed      # seed demo users, tags, stories
pnpm dev          # http://localhost:3000
```

### Demo accounts

Login at `/login` with `admin`, `alice`, `bob`, `carol`, or `dave` —
password `password` for all.

### Try the invite flow

1. Login as `alice` (an established user).
2. Go to **Invite** (`/settings/invite`), generate an invitation.
3. Open the generated `/signup/<code>` link in a private window and register.
4. The new account now appears under Alice in the `/users` tree.

> The seed also prints one ready-to-use open invite link.

## Project layout

```
src/
  db/            schema.ts, index.ts (drizzle client), seed.ts
  lib/           auth, queries, hotness, markdown, ids, time
  components/    Header, StoryList, CommentTree, Voter, Tag
  app/           routes (App Router)
    page.tsx              hottest
    recent/ comments/ tags/ users/ about/ search/
    login/ logout/ signup/[code]/        auth + invite-only signup
    settings/ settings/invite/           profile + send invites
    stories/new/                         submit
    s/[shortId]/[slug]/                  story + comments
    u/[username]/  t/[tag]/  domains/[domain]/
    api/vote/  api/comment/              JSON mutations
```

## Notes

- Drizzle schema lives in `src/db/schema.ts`; `pnpm db:push` syncs it.
- `pnpm db:reset` wipes and re-seeds.
- Change the site name via `SITE_NAME` in `.env`.
