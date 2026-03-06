import emergencyData from '../data/emergency.json';
import healthData from '../data/health.json';
import survivalData from '../data/survival.json';
import toolsData from '../data/tools.json';
import weatherData from '../data/weather.json';
import ReferenceEntryType from '../types/data-type';

export interface RagResult {
  entry: ReferenceEntryType;
  score: number;
  excerpt: string;
}

export interface RagResponse {
  query: string;
  results: RagResult[];
  hasResults: boolean;
}

// Common English stop words to filter out during tokenization
const STOP_WORDS = new Set([
  'a',
  'an',
  'the',
  'is',
  'are',
  'was',
  'were',
  'be',
  'been',
  'being',
  'have',
  'has',
  'had',
  'do',
  'does',
  'did',
  'will',
  'would',
  'could',
  'should',
  'may',
  'might',
  'can',
  'shall',
  'to',
  'of',
  'in',
  'on',
  'at',
  'by',
  'for',
  'with',
  'about',
  'into',
  'through',
  'from',
  'up',
  'if',
  'it',
  'its',
  'this',
  'that',
  'these',
  'those',
  'i',
  'you',
  'he',
  'she',
  'we',
  'they',
  'me',
  'him',
  'her',
  'us',
  'them',
  'my',
  'your',
  'his',
  'our',
  'their',
  'what',
  'which',
  'who',
  'how',
  'when',
  'where',
  'why',
  'all',
  'and',
  'but',
  'or',
  'nor',
  'not',
  'so',
  'yet',
  'both',
  'each',
  'few',
  'more',
  'most',
  'other',
  'some',
  'such',
  'than',
  'too',
  'very',
  'just',
  'any',
  'here',
  'there',
  'get',
  'use',
  'make',
  'need',
  'like',
]);

// All reference entries indexed once at module load time
const ALL_ENTRIES: ReferenceEntryType[] = [
  ...(healthData.entries as ReferenceEntryType[]),
  ...(survivalData.entries as ReferenceEntryType[]),
  ...(emergencyData.entries as ReferenceEntryType[]),
  ...(toolsData.entries as ReferenceEntryType[]),
  ...(weatherData.entries as ReferenceEntryType[]),
];

/**
 * Tokenizes text into meaningful words by lowercasing, stripping punctuation,
 * splitting on whitespace, and removing stop words and very short tokens.
 */
export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((word) => word.length > 2 && !STOP_WORDS.has(word));
}

/**
 * Scores a reference entry against a list of query tokens using field-weighted
 * substring matching. Fields are weighted by how specifically they represent
 * the entry's topic:
 *
 * - title      ×5 — the authoritative label for this topic
 * - category   ×3 — broad topic group
 * - tags       ×3 — curated keywords
 * - summary    ×2 — concise description
 * - steps      ×1.5 — procedural content
 * - do_not     ×1 — cautionary content
 * - watch_for  ×1 — warning signals
 * - notes      ×1 — supplementary context
 *
 * The raw score is divided by the number of query tokens to normalize across
 * different query lengths.
 */
export function scoreEntry(
  entry: ReferenceEntryType,
  queryTokens: string[],
): number {
  if (queryTokens.length === 0) return 0;

  let score = 0;

  for (const token of queryTokens) {
    if (entry.title.toLowerCase().includes(token)) {
      score += 5;
    }
    if (entry.category.toLowerCase().includes(token)) {
      score += 3;
    }
    if (entry.tags.some((tag) => tag.toLowerCase().includes(token))) {
      score += 3;
    }
    if (entry.summary.toLowerCase().includes(token)) {
      score += 2;
    }
    if (entry.steps.some((step) => step.toLowerCase().includes(token))) {
      score += 1.5;
    }
    if (entry.do_not?.some((item) => item.toLowerCase().includes(token))) {
      score += 1;
    }
    if (entry.watch_for?.some((item) => item.toLowerCase().includes(token))) {
      score += 1;
    }
    if (entry.notes?.some((note) => note.toLowerCase().includes(token))) {
      score += 1;
    }
  }

  // Normalize by query length so longer queries don't inflate scores
  return score / queryTokens.length;
}

/**
 * Builds a focused excerpt from a reference entry that is most relevant to the
 * query. Always starts with the entry's summary. If any individual steps contain
 * query tokens, the two most relevant steps are appended; otherwise the first
 * step is shown as a starting point.
 */
export function createExcerpt(
  entry: ReferenceEntryType,
  queryTokens: string[],
): string {
  const parts: string[] = [entry.summary];

  const relevantSteps = entry.steps
    .filter((step) =>
      queryTokens.some((token) => step.toLowerCase().includes(token)),
    )
    .slice(0, 2);

  if (relevantSteps.length > 0) {
    parts.push('Key steps:');
    relevantSteps.forEach((step, i) => {
      parts.push(`${i + 1}. ${step}`);
    });
  } else if (entry.steps.length > 0) {
    parts.push(`First step: ${entry.steps[0]}`);
  }

  return parts.join('\n\n');
}

/**
 * Performs an on-device, offline natural language search over all indexed
 * reference entries using TF-IDF-style term matching.
 *
 * @param query    The user's natural language question.
 * @param topN     Maximum number of results to return (default: 3).
 * @param threshold Minimum normalized score required to include a result (default: 1.0).
 * @returns A {@link RagResponse} containing ranked results or an empty set when
 *          nothing meets the threshold.
 */
export function ragSearch(
  query: string,
  topN: number = 3,
  threshold: number = 1.0,
): RagResponse {
  if (!query || query.trim() === '') {
    return { query, results: [], hasResults: false };
  }

  const queryTokens = tokenize(query);
  if (queryTokens.length === 0) {
    return { query, results: [], hasResults: false };
  }

  const scored = ALL_ENTRIES.map((entry) => ({
    entry,
    score: scoreEntry(entry, queryTokens),
  })).filter((item) => item.score >= threshold);

  scored.sort((a, b) => b.score - a.score);

  const results: RagResult[] = scored.slice(0, topN).map((item) => ({
    entry: item.entry,
    score: item.score,
    excerpt: createExcerpt(item.entry, queryTokens),
  }));

  return {
    query,
    results,
    hasResults: results.length > 0,
  };
}
