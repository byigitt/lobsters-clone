"use client";

import { memo, useState, useTransition } from "react";

// Pure leaf island: memoized so a parent re-render never re-renders every
// vote button on the page. Props are primitives, so the default shallow
// comparison is correct.
export const Voter = memo(function Voter({
  kind,
  id,
  initialVoted,
  initialScore,
  loggedIn,
}: {
  kind: "story" | "comment";
  id: number;
  initialVoted: boolean;
  initialScore: number;
  loggedIn: boolean;
}) {
  const [voted, setVoted] = useState(initialVoted);
  const [score, setScore] = useState(initialScore);
  const [pending, startTransition] = useTransition();

  function toggle() {
    if (!loggedIn) {
      window.location.href = "/login";
      return;
    }
    const next = !voted;
    setVoted(next);
    setScore((s) => s + (next ? 1 : -1));
    startTransition(async () => {
      const res = await fetch("/api/vote", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ kind, id }),
      });
      if (!res.ok) {
        // revert
        setVoted(!next);
        setScore((s) => s + (next ? -1 : 1));
      } else {
        const data = await res.json();
        if (typeof data.score === "number") setScore(data.score);
        if (typeof data.voted === "boolean") setVoted(data.voted);
      }
    });
  }

  return (
    <div className="voters">
      <button
        type="button"
        className={`upvoter ${voted ? "voted" : ""}`}
        aria-label="upvote"
        onClick={toggle}
        disabled={pending}
        title={loggedIn ? "upvote" : "login to vote"}
      />
      <span className="score">{score}</span>
    </div>
  );
});
