import { Fragment, type ReactNode } from "react";

// Renders a safe subset of markdown as React nodes. User text is never treated
// as HTML, so there is no XSS surface (no dangerouslySetInnerHTML).

// Capture groups: 1=link label, 2=link url, 3=bold, 4=italic, 5=code, 6=bare url.
const INLINE =
  /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)|(\*\*[^*]+\*\*)|(\*[^*]+\*)|(`[^`]+`)|(https?:\/\/[^\s]+)/g;

function parseInline(text: string, keyPrefix: string): ReactNode[] {
  const nodes: ReactNode[] = [];
  let last = 0;
  let match: RegExpExecArray | null;
  let i = 0;
  INLINE.lastIndex = 0;
  while ((match = INLINE.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index));
    const [token, label, url, bold, italic, code, bareUrl] = match;
    const key = `${keyPrefix}-${i++}`;
    if (label && url) {
      nodes.push(
        <a key={key} href={url} rel="nofollow noopener" target="_blank">
          {label}
        </a>,
      );
    } else if (bold) {
      nodes.push(<strong key={key}>{bold.slice(2, -2)}</strong>);
    } else if (italic) {
      nodes.push(<em key={key}>{italic.slice(1, -1)}</em>);
    } else if (code) {
      nodes.push(<code key={key}>{code.slice(1, -1)}</code>);
    } else if (bareUrl) {
      nodes.push(
        <a key={key} href={bareUrl} rel="nofollow noopener" target="_blank">
          {bareUrl}
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
