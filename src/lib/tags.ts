export function parseTagList(input: string): string[] {
  const seen = new Set<string>();
  for (const raw of input.split(',')) {
    const tag = raw.trim();
    if (tag) seen.add(tag);
  }
  return Array.from(seen);
}

export function formatTagList(tags: string[]): string {
  return tags.join(', ');
}
