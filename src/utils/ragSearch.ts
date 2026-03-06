import emergencyData from '../data/emergency.json';
import healthData from '../data/health.json';
import scenarioCardsData from '../data/scenarioCards.json';
import survivalData from '../data/survival.json';
import toolsData from '../data/tools.json';
import weatherData from '../data/weather.json';
import ReferenceEntryType, { ScenarioCardType } from '../types/data-type';

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

/**
 * Converts a ScenarioCardType to a ReferenceEntryType so scenario cards can
 * be scored and excerpted by the same pipeline as reference entries.
 *
 * Mapping:
 *   first_5_minutes + first_hour + first_day → steps (chronological actions)
 *   immediate_risks                           → do_not (things to watch/avoid)
 *   watch_for                                 → watch_for
 *   notes                                     → notes
 */
function scenarioCardToEntry(card: ScenarioCardType): ReferenceEntryType {
  return {
    id: card.id,
    category: card.category,
    title: card.title,
    summary: card.summary,
    difficulty: card.difficulty,
    tags: card.tags,
    steps: [...card.first_5_minutes, ...card.first_hour, ...card.first_day],
    do_not: card.immediate_risks,
    watch_for: card.watch_for,
    notes: card.notes,
  };
}

/**
 * Synthetic reference entries for app modules and tools that have no backing
 * JSON file. These make communication tools, Morse code, radio frequencies, etc.
 * discoverable through natural language search. Each entry's `related_screen`
 * is used by SearchScreen to navigate directly to the corresponding tool screen.
 */
const SYNTHETIC_TOOL_ENTRIES: ReferenceEntryType[] = [
  {
    id: 'synthetic_morse_code',
    category: 'Communications',
    title: 'Morse Code',
    summary:
      'International Morse code translator, trainer, and cheat sheet. Encode and decode text using dots and dashes for signaling or radio communication.',
    difficulty: 'intermediate',
    tags: [
      'morse',
      'code',
      'communication',
      'sos',
      'dots',
      'dashes',
      'signal',
      'decode',
      'encode',
      'ham',
      'radio',
      'international',
    ],
    steps: [
      'Represent each letter or number as a sequence of dots (.) and dashes (-)',
      'SOS distress signal: ... --- ... (dot dot dot, dash dash dash, dot dot dot)',
      'Use Alpha to Morse to convert text into Morse code',
      'Use Morse to Alpha to decode incoming Morse signals',
      'Practice with the Morse Trainer to build speed and accuracy',
      'Use the Cheat Sheet for a quick reference of all characters',
    ],
    do_not: [],
    watch_for: [],
    notes: [
      'Based on the ITU-R International Morse Code standard',
      'Commonly used by HAM (amateur) radio operators and in maritime communication',
    ],
    related_screen: 'MorseCode',
    related_screen_label: 'Open Morse Code',
  },
  {
    id: 'synthetic_nato_phonetic',
    category: 'Communications',
    title: 'NATO Phonetic Alphabet',
    summary:
      'The NATO/ICAO phonetic alphabet for spelling out words clearly over radio or telephone. Alpha, Bravo, Charlie — reduces miscommunication in noisy environments.',
    difficulty: 'basic',
    tags: [
      'nato',
      'phonetic',
      'alphabet',
      'radio',
      'spelling',
      'alpha',
      'bravo',
      'charlie',
      'communication',
      'military',
    ],
    steps: [
      'Use the phonetic alphabet to spell call signs, names, or critical words over radio',
      'Alpha = A, Bravo = B, Charlie = C, Delta = D, Echo = E, Foxtrot = F',
      'Golf = G, Hotel = H, India = I, Juliet = J, Kilo = K, Lima = L',
      'Mike = M, November = N, Oscar = O, Papa = P, Quebec = Q, Romeo = R',
      'Sierra = S, Tango = T, Uniform = U, Victor = V, Whiskey = W, X-ray = X',
      'Yankee = Y, Zulu = Z',
    ],
    do_not: [],
    watch_for: [],
    notes: [
      'Standardized by NATO and the ICAO for international interoperability',
      'Essential for clear radio communication when voice quality is poor',
    ],
    related_screen: 'NatoPhonetic',
    related_screen_label: 'Open NATO Phonetic',
  },
  {
    id: 'synthetic_radio_frequencies',
    category: 'Communications',
    title: 'Radio Frequency References',
    summary:
      'Reference guide for emergency and off-grid radio frequencies — HAM amateur radio, CB, GMRS, FRS, and MURS. Includes channel frequencies, modes, and license requirements.',
    difficulty: 'intermediate',
    tags: [
      'radio',
      'frequency',
      'ham',
      'cb',
      'gmrs',
      'frs',
      'murs',
      'amateur',
      'channel',
      'communication',
      'emergency',
      'repeater',
      'simplex',
      'uhf',
      'vhf',
    ],
    steps: [
      'HAM (Amateur Radio) — requires FCC license; national simplex calling 146.520 MHz',
      'CB (Citizens Band) — no license required; Channel 9 emergency (27.065 MHz)',
      'GMRS — requires FCC license; 462–467 MHz range; higher power than FRS',
      'FRS (Family Radio Service) — no license; 462–467 MHz; limited to 2W',
      'MURS (Multi-Use Radio Service) — no license; 151–154 MHz; 5 channels',
    ],
    do_not: [
      'Do not transmit on amateur radio frequencies without a valid FCC license',
      'Do not exceed legal power limits for each radio service',
    ],
    watch_for: [],
    notes: [
      'Always comply with FCC regulations and local laws',
      'Channel 9 CB and 146.520 MHz HAM are monitored emergency frequencies',
    ],
    related_screen: 'RadioFrequencies',
    related_screen_label: 'Open Radio Frequencies',
  },
  {
    id: 'synthetic_ground_to_air',
    category: 'Survival',
    title: 'Ground-to-Air Signals',
    summary:
      'Internationally recognised ground-to-air distress symbols for signaling rescue aircraft. Lay symbols on open ground using rocks, logs, or high-contrast materials.',
    difficulty: 'basic',
    tags: [
      'ground',
      'air',
      'signal',
      'rescue',
      'aircraft',
      'distress',
      'sar',
      'search',
      'survival',
      'icao',
      'symbols',
      'sos',
    ],
    steps: [
      'V — Need assistance (3 m × 3 m minimum)',
      'X — Need medical help',
      '→ (Arrow) — Traveling in this direction',
      'F — Need food and water',
      'LL — All is well',
      'N — No / Negative',
      'Y — Yes / Affirmative',
      'Choose a clearing with maximum sky visibility and high contrast materials',
    ],
    do_not: [
      'Do not make symbols smaller than 3 m — they must be visible from altitude',
    ],
    watch_for: [
      'Aircraft circling overhead — they may have spotted your signal',
      'Drop message from aircraft indicating help is coming',
    ],
    notes: [
      'Based on ICAO Annex 12 and standard Search and Rescue conventions',
      'Trampled vegetation, snow trenches, or rock arrangements all work',
    ],
    related_screen: 'GroundToAirSignals',
    related_screen_label: 'Open Ground-to-Air Signals',
  },
  {
    id: 'synthetic_digital_whistle',
    category: 'Communications',
    title: 'Digital Whistle',
    summary:
      'Emergency distress whistle and SOS signal generator. Produces loud audio tones for attracting attention when lost or in danger.',
    difficulty: 'basic',
    tags: [
      'whistle',
      'sos',
      'distress',
      'emergency',
      'signal',
      'audio',
      'alert',
      'lost',
      'rescue',
      'sound',
    ],
    steps: [
      'Activate the digital whistle to emit a loud, piercing emergency tone',
      'SOS pattern: three short blasts, three long blasts, three short blasts',
      'Use in open areas where sound carries further',
    ],
    do_not: [
      'Do not use in enclosed spaces at maximum volume — risk of hearing damage',
    ],
    watch_for: [],
    notes: [
      'Works offline — no cellular signal required',
      'Three blasts is the universal distress signal in wilderness',
    ],
    related_screen: 'DigitalWhistle',
    related_screen_label: 'Open Digital Whistle',
  },
];

// All reference entries indexed once at module load time
const ALL_ENTRIES: ReferenceEntryType[] = [
  ...(healthData.entries as ReferenceEntryType[]),
  ...(survivalData.entries as ReferenceEntryType[]),
  ...(emergencyData.entries as ReferenceEntryType[]),
  ...(toolsData.entries as ReferenceEntryType[]),
  ...(weatherData.entries as ReferenceEntryType[]),
  ...(scenarioCardsData.entries as ScenarioCardType[]).map(scenarioCardToEntry),
  ...SYNTHETIC_TOOL_ENTRIES,
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
