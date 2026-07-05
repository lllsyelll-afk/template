function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = Array(b.length + 1)
    .fill(null)
    .map(() => Array(a.length + 1).fill(null));

  for (let i = 0; i <= a.length; i++) matrix[0][i] = i;
  for (let j = 0; j <= b.length; j++) matrix[j][0] = j;

  for (let j = 1; j <= b.length; j++) {
    for (let i = 1; i <= a.length; i++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      matrix[j][i] = Math.min(
        matrix[j][i - 1] + 1, // deletion
        matrix[j - 1][i] + 1, // insertion
        matrix[j - 1][i - 1] + cost, // substitution
      );
    }
  }

  return matrix[b.length][a.length];
}

export function fuzzySearch(string: string, searchFor: string): boolean {
  if (!searchFor) return true;

  const str = string.toLowerCase();
  const search = searchFor.toLowerCase();

  // Exact match gets highest priority
  if (str.includes(search)) return true;

  // Check if search term is close enough to any substring
  const maxDistance = Math.floor(search.length * 0.4); // Allow 40% character differences

  for (let i = 0; i <= str.length - search.length; i++) {
    const substring = str.slice(i, i + search.length);
    const distance = levenshteinDistance(substring, search);

    if (distance <= maxDistance) return true;
  }

  // Check character-by-character sequential matching
  let strIndex = 0;
  let searchIndex = 0;
  let matchedChars = 0;

  while (strIndex < str.length && searchIndex < search.length) {
    if (str[strIndex] === search[searchIndex]) {
      matchedChars++;
      searchIndex++;
    }
    strIndex++;
  }

  // Return true if at least 60% of characters are in correct order
  return matchedChars / search.length >= 0.6;
}
