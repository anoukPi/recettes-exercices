function levenshtein(a: string, b: string): number {
  const dp: number[][] = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function normalize(s: string): string {
  return s
    .trim()
    .toLowerCase()
    .replace(/[àâä]/g, 'a')
    .replace(/[éèêë]/g, 'e')
    .replace(/[îï]/g, 'i')
    .replace(/[ôö]/g, 'o')
    .replace(/[ùûü]/g, 'u')
    .replace(/ç/g, 'c');
}

/** Returns an existing option that closely resembles `value`, or null if `value`
 * is empty, already an exact match, or too different from every option. */
export function findClosestMatch(value: string, options: string[]): string | null {
  const normValue = normalize(value);
  if (!normValue) return null;

  let best: { option: string; distance: number } | null = null;
  for (const option of options) {
    const normOption = normalize(option);
    if (normOption === normValue) return null;
    const distance = levenshtein(normValue, normOption);
    const threshold = normValue.length <= 4 ? 1 : 2;
    if (distance <= threshold && (!best || distance < best.distance)) {
      best = { option, distance };
    }
  }
  return best ? best.option : null;
}
