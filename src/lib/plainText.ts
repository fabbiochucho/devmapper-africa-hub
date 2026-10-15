// Summaries imported from IATI, HDX, OpenAlex etc. arrive as HTML or Markdown. React shows them
// literally ("<p class=...>", "[DHS data portal](https://...)"), so reduce them to plain text.
// Display-only; the stored text is left as the source published it.

const ENTITIES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', '#39': "'" };

export function plainText(input: string | null | undefined): string {
  if (!input) return '';
  return input
    .replace(/<br\s*\/?>|<\/(p|div|li|h[1-6])>/gi, '\n') // block ends become line breaks
    .replace(/<[^>]*>/g, '') // remaining tags
    .replace(/&(#?\w+);/g, (m, e: string) => ENTITIES[e.toLowerCase()] ?? m)
    .replace(/!\[([^\]]*)\]\([^)]*\)/g, '$1') // markdown images -> alt text
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1') // markdown links -> link text
    .replace(/^\s{0,3}#{1,6}\s+/gm, '') // headings
    .replace(/(\*\*|__)(.+?)\1/g, '$2') // bold
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}
