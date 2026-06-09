import "dotenv/config";
import bcrypt from "bcryptjs";
import { db } from "./index";
import {
  users,
  tags,
  stories,
  storyTags,
  comments,
  invitations,
} from "./schema";
import { shortId, slugify, inviteCode } from "../lib/ids";
import { calcHotness } from "../lib/hotness";

const TAGS: { name: string; description: string; kind: string; privileged?: boolean }[] = [
  { name: "programming", description: "Use only when no more specific tag applies", kind: "default" },
  { name: "rust", description: "Rust programming", kind: "default" },
  { name: "go", description: "Go programming", kind: "default" },
  { name: "c", description: "C programming", kind: "default" },
  { name: "javascript", description: "Javascript programming", kind: "default" },
  { name: "python", description: "Python programming", kind: "default" },
  { name: "web", description: "Web development and news", kind: "default" },
  { name: "css", description: "Cascading Style Sheets", kind: "default" },
  { name: "databases", description: "Databases (SQL, NoSQL)", kind: "default" },
  { name: "security", description: "Netsec, appsec, and infosec", kind: "default" },
  { name: "networking", description: "Networking", kind: "default" },
  { name: "linux", description: "Linux", kind: "default" },
  { name: "osdev", description: "Operating system design and development", kind: "default" },
  { name: "performance", description: "Performance and optimization", kind: "default" },
  { name: "compilers", description: "Compiler design", kind: "default" },
  { name: "plt", description: "Programming language theory, types, design", kind: "default" },
  { name: "devops", description: "DevOps", kind: "default" },
  { name: "graphics", description: "Graphics programming", kind: "default" },
  { name: "games", description: "Game design and study", kind: "default" },
  { name: "historical", description: "History and retrospectives", kind: "default" },
  { name: "compsci", description: "Other computer science/programming", kind: "default" },
  { name: "culture", description: "Technical communities and culture", kind: "default", privileged: true },
  { name: "video", description: "Link to a video", kind: "media" },
  { name: "audio", description: "Link to audio/a podcast", kind: "media" },
  { name: "pdf", description: "Link to a PDF document", kind: "media" },
  { name: "slides", description: "Link to presentation slides", kind: "media" },
  { name: "show", description: "Show Lobsters / Projects", kind: "special", privileged: true },
  { name: "ask", description: "Ask Lobsters", kind: "special", privileged: true },
  { name: "announce", description: "Announcements", kind: "special", privileged: true },
  { name: "meta", description: "Site-related bikeshedding", kind: "meta", privileged: true },
  { name: "rant", description: "Rants and raves", kind: "meta", privileged: true },
];

async function main() {
  console.log("Seeding…");

  // wipe (order matters for FKs)
  db.delete(comments).run();
  db.delete(storyTags).run();
  db.delete(stories).run();
  db.delete(invitations).run();
  db.delete(tags).run();
  db.delete(users).run();

  const pw = await bcrypt.hash("password", 10);

  // root admin
  const [admin] = db
    .insert(users)
    .values({
      username: "admin",
      email: "admin@crab.news",
      passwordHash: pw,
      about: "Site administrator and founder.",
      isAdmin: true,
      isModerator: true,
      karma: 9001,
      createdAt: Math.floor(Date.now() / 1000) - 400 * 86400,
    })
    .returning()
    .all();

  const sampleUsers = [
    { username: "alice", about: "Backend engineer, Rust enthusiast." },
    { username: "bob", about: "Sysadmin & homelab tinkerer." },
    { username: "carol", about: "Frontend dev. CSS appreciator." },
    { username: "dave", about: "Compilers, type theory." },
  ];
  const created = [admin];
  for (const u of sampleUsers) {
    const [row] = db
      .insert(users)
      .values({
        username: u.username,
        email: `${u.username}@crab.news`,
        passwordHash: pw,
        about: u.about,
        invitedById: admin.id,
        karma: Math.floor(Math.random() * 800) + 50,
        createdAt: Math.floor(Date.now() / 1000) - Math.floor(Math.random() * 300) * 86400,
      })
      .returning()
      .all();
    created.push(row);
  }

  // tags
  const tagRows = db.insert(tags).values(TAGS).returning().all();
  const tagByName = new Map(tagRows.map((t) => [t.name, t]));

  const SAMPLE: {
    title: string;
    url?: string;
    text?: string;
    tags: string[];
    hours: number;
    up: number;
    by: string;
  }[] = [
    { title: "Cleaning up after AI rockstar developers", url: "https://www.codingwithjesse.com/blog/rockstar-developers/", tags: ["culture", "rant"], hours: 13, up: 63, by: "carol" },
    { title: "Test-case Reducers Are Underappreciated Debugging Tools", url: "https://tratt.net/laurie/blog/2026/test_case_reducers.html", tags: ["compilers", "programming"], hours: 4, up: 26, by: "dave" },
    { title: "The Decline of Search Engines is an Opportunity", url: "https://lewiscampbell.tech/blog/260609.html", tags: ["culture", "web"], hours: 8, up: 34, by: "bob" },
    { title: "Self-hosting email the hard way from your own IPv4 block up", url: "https://anil.recoil.org/notes/recoil-self-hosting-2026", tags: ["networking", "security", "linux"], hours: 17, up: 42, by: "bob" },
    { title: "What I got wrong about fast terminals", url: "https://mijndertstuij.nl/posts/what-i-got-wrong-about-fast-terminals/", tags: ["linux", "performance"], hours: 16, up: 45, by: "alice" },
    { title: "CSS: Unavoidable Bad Parts", url: "https://matklad.github.io/2026/06/04/css-unavoidable-bad-parts.html", tags: ["css", "web"], hours: 3, up: 30, by: "carol" },
    { title: "Premature Optimization is Fun Sometimes", url: "https://invlpg.com/posts/2025-06-19-premature-optimization.html", tags: ["c", "performance"], hours: 31, up: 89, by: "dave" },
    { title: "GentleOS - A pair of hobby OSes for vintage 32-bit and 16-bit PCs", url: "https://github.com/luke8086/gentleos32", tags: ["show", "c", "osdev"], hours: 30, up: 52, by: "alice" },
    { title: "Only Bounds", url: "https://smallcultfollowing.com/babysteps/blog/2026/06/09/only-bounds/", tags: ["plt", "rust"], hours: 2, up: 23, by: "dave" },
    { title: "Looking Forward to Postgres 19: Query Hints", url: "https://www.pgedge.com/blog/postgres-19-query-hints", tags: ["databases"], hours: 3, up: 18, by: "bob" },
    { title: "Ask: How do you structure large Go codebases?", text: "I've been growing a Go service past 80k lines and module boundaries are getting fuzzy. How do you keep packages cohesive without a dependency mess?", tags: ["ask", "go"], hours: 6, up: 27, by: "alice" },
    { title: "This Month in Redox - May 2026", url: "https://www.redox-os.org/news/this-month-260531/", tags: ["osdev", "rust"], hours: 22, up: 26, by: "carol" },
  ];

  const COMMENTS = [
    "This matches my experience exactly. The hard part is always the cleanup, not the writing.",
    "Great write-up. I'd add that benchmarking before optimizing saved me here more than once.",
    "Counterpoint: I think the tradeoffs are more nuanced than the article suggests.",
    "Bookmarking this. The section on tooling is gold.",
    "Has anyone tried this approach in production? Curious about the failure modes.",
    "I disagree with the framing but the data is solid.",
  ];

  const userByName = new Map(created.map((u) => [u.username, u]));

  for (const s of SAMPLE) {
    const author = userByName.get(s.by)!;
    const createdAt = Math.floor(Date.now() / 1000) - s.hours * 3600;
    const sid = shortId();
    const domain = s.url ? new URL(s.url).hostname.replace(/^www\./, "") : null;
    const tagMod = s.tags.reduce(
      (acc, t) => acc + (tagByName.get(t)?.hotnessMod ?? 0),
      0,
    );
    const numComments = Math.floor(Math.random() * 5);
    const [story] = db
      .insert(stories)
      .values({
        shortId: sid,
        title: s.title,
        url: s.url ?? null,
        domain,
        description: s.text ?? "",
        slug: slugify(s.title),
        userId: author.id,
        createdAt,
        upvotes: s.up,
        commentCount: numComments,
        hotness: calcHotness(s.up, numComments, createdAt, tagMod),
      })
      .returning()
      .all();

    for (const t of s.tags) {
      const tag = tagByName.get(t);
      if (tag) db.insert(storyTags).values({ storyId: story.id, tagId: tag.id }).run();
    }

    for (let i = 0; i < numComments; i++) {
      const commenter = created[Math.floor(Math.random() * created.length)];
      db.insert(comments)
        .values({
          shortId: shortId(),
          storyId: story.id,
          userId: commenter.id,
          parentId: null,
          body: COMMENTS[Math.floor(Math.random() * COMMENTS.length)],
          createdAt: createdAt + Math.floor(Math.random() * 3600),
          upvotes: Math.floor(Math.random() * 12) + 1,
        })
        .run();
    }
  }

  // one open invitation to demo the flow
  const code = inviteCode();
  db.insert(invitations)
    .values({
      code,
      email: "newcomer@example.com",
      memo: "Welcome to the community!",
      senderId: admin.id,
    })
    .run();

  console.log("Done.");
  console.log("\nLogin with any of: admin, alice, bob, carol, dave");
  console.log("Password for all: password");
  console.log(`\nOpen invite link: /signup/${code}`);
}

main();
