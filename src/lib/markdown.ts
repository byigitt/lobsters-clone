// Minimal, safe markdown -> HTML (escapes first, then applies a few rules).
function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function renderMarkdown(src: string): string {
  const esc = escapeHtml(src.trim());
  const paragraphs = esc.split(/\n{2,}/).map((para) => {
    let p = para
      // links [text](url)
      .replace(
        /\[([^\]]+)\]\((https?:\/\/[^\s)]+)\)/g,
        '<a href="$2" rel="nofollow">$1</a>',
      )
      // bold
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      // italics
      .replace(/(^|\W)\*([^*]+)\*/g, "$1<em>$2</em>")
      // inline code
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      // bare urls
      .replace(
        /(^|\s)(https?:\/\/[^\s<]+)/g,
        '$1<a href="$2" rel="nofollow">$2</a>',
      )
      .replace(/\n/g, "<br/>");
    return `<p>${p}</p>`;
  });
  return paragraphs.join("\n");
}
