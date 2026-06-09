import { Fragment, type ReactNode } from "react";

// Renders a safe subset of markdown as React nodes. User text is never treated
// as HTML, so there is no XSS surface (no dangerouslySetInnerHTML).

const INLINE =
  /(\[[^\]]+\]\(https?:\/\/[^\s)]+\))|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(https?:\/\/[^\s]+)/g;

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const token = match[0];
    const key = `${keyPrefix}-${i++}`;
    if (match[1]) {
      // [text](url)
      const close = token.indexOf("](");
      const label = token.slice(1, close);
      const url = token.slice(close + 2, -1);
      nodes.push(
        <a key={key} href={url} rel="nofollow noopener" target="_blank">
          {label}
        </a>,
      );
    } else if (match[2]) {
      nodes.push(<strong key={key}>{token.slice(2, -2)}</strong>);
    } else if (match[3]) {
      nodes.push(<em key={key}>{token.slice(1, -1)}</em>);
    } else if (match[4]) {
      nodes.push(<code key={key}>{token.slice(1, -1)}</code>);
    } else {
      nodes.push(
        <a key={key} href={token} rel="nofollow noopener" target="_blank">
          {token}
        </a>,
      );
    }
    last = match.index + token.length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

export function Markdown({ text }: { text: string }) {
  const paragraphs = text.trim().split(/\n{2,}/);
  return (
    <>
      {paragraphs.map((para, p) => {
        const lines = para.split("\n");
        return (
          <p key={p}>
            {lines.map((line, l) => (
              <Fragment key={l}>
                {l > 0 && <br />}
                {parseInline(line, `${p}-${l}`)}
              </Fragment>
            ))}
          </p>
        );
      })}
    </>
  );
}
