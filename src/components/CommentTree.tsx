"use client";

import { useState } from "react";
import Link from "next/link";
import type { CommentNode } from "@/lib/queries";
import { Voter } from "./Voter";
import { Markdown } from "./Markdown";
import { AuthorLink } from "./AuthorLink";
import { ago } from "@/lib/time";

function CommentItem({
  node,
  loggedIn,
  votedIds,
  onReply,
}: {
  node: CommentNode;
  loggedIn: boolean;
  votedIds: Set<number>;
  onReply: (parentId: number, body: string) => Promise<void>;
}) {
  const [replying, setReplying] = useState(false);
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);

  return (
    <li className="comment" id={`c_${node.shortId}`}>
      <div style={{ display: "grid", gridTemplateColumns: "1.6rem 1fr", gap: "0.3rem" }}>
        <Voter
          kind="comment"
          id={node.id}
          initialVoted={votedIds.has(node.id)}
          initialScore={node.upvotes}
          loggedIn={loggedIn}
        />
        <div>
          <div className="byline">
            <AuthorLink
              username={node.author.username}
              createdAt={node.author.createdAt}
            />{" "}
            {ago(node.createdAt)}
            {loggedIn && (
              <>
                <span className="tagline-sep">|</span>
                <button
                  type="button"
                  className="linklike"
                  onClick={() => setReplying((r) => !r)}
                >
                  reply
                </button>
              </>
            )}
          </div>
          <div className="body">
            <Markdown text={node.body} />
          </div>
          {replying && (
            <div style={{ margin: "0.4rem 0" }}>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                style={{ minHeight: "4rem" }}
                placeholder="Write a reply…"
                aria-label="Reply text"
              />
              <button
                type="button"
                className="btn btn-primary"
                disabled={busy || !body.trim()}
                onClick={async () => {
                  setBusy(true);
                  await onReply(node.id, body);
                  setBody("");
                  setReplying(false);
                  setBusy(false);
                }}
              >
                Post reply
              </button>
            </div>
          )}
          {node.children.length > 0 && (
            <ul className="comments">
              {node.children.map((child) => (
                <CommentItem
                  key={child.id}
                  node={child}
                  loggedIn={loggedIn}
                  votedIds={votedIds}
                  onReply={onReply}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </li>
  );
}

export function CommentTree({
  comments,
  storyId,
  loggedIn,
  votedIds,
}: {
  comments: CommentNode[];
  storyId: number;
  loggedIn: boolean;
  votedIds: number[];
}) {
  const votedSet = new Set(votedIds);

  async function postComment(parentId: number | null, body: string) {
    await fetch("/api/comment", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ storyId, parentId, body }),
    });
    window.location.reload();
  }

  return (
    <div>
      {loggedIn ? (
        <TopLevelForm onSubmit={(b) => postComment(null, b)} />
      ) : (
        <p className="muted" style={{ marginTop: "1rem" }}>
          <Link href="/login">Login</Link> to comment.
        </p>
      )}
      {comments.length === 0 ? (
        <p className="muted">No comments yet.</p>
      ) : (
        <ul className="comments">
          {comments.map((c) => (
            <CommentItem
              key={c.id}
              node={c}
              loggedIn={loggedIn}
              votedIds={votedSet}
              onReply={(pid, b) => postComment(pid, b)}
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function TopLevelForm({ onSubmit }: { onSubmit: (body: string) => Promise<void> }) {
  const [body, setBody] = useState("");
  const [busy, setBusy] = useState(false);
  return (
    <div className="box" style={{ marginTop: "1rem" }}>
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Add to the discussion… (markdown supported)"
        aria-label="Comment text"
      />
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy || !body.trim()}
        onClick={async () => {
          setBusy(true);
          await onSubmit(body);
          setBody("");
          setBusy(false);
        }}
      >
        Post comment
      </button>
    </div>
  );
}
