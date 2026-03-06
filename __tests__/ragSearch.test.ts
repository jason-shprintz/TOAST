/**
 * @format
 */

import ReferenceEntryType from '../src/types/data-type';
import {
  createExcerpt,
  ragSearch,
  scoreEntry,
  tokenize,
} from '../src/utils/ragSearch';

// --- tokenize ---

describe('tokenize', () => {
  test('lowercases and splits on whitespace', () => {
    const tokens = tokenize('Fire Safety Tips');
    expect(tokens).toContain('fire');
    expect(tokens).toContain('safety');
    expect(tokens).toContain('tips');
  });

  test('strips punctuation', () => {
    const tokens = tokenize("What's in a 72-hour kit?");
    expect(tokens).toContain('hour');
    expect(tokens).toContain('kit');
  });

  test('removes stop words', () => {
    const tokens = tokenize('how do i signal an aircraft');
    expect(tokens).not.toContain('how');
    expect(tokens).not.toContain('do');
    expect(tokens).not.toContain('i');
    expect(tokens).not.toContain('an');
    expect(tokens).toContain('signal');
    expect(tokens).toContain('aircraft');
  });

  test('filters tokens shorter than 3 characters', () => {
    const tokens = tokenize('go to the river');
    // 'go' is 2 chars, 'to' is 2 chars
    expect(tokens).not.toContain('go');
    expect(tokens).not.toContain('to');
    expect(tokens).toContain('river');
  });

  test('returns empty array for empty string', () => {
    expect(tokenize('')).toEqual([]);
  });

  test('returns empty array for stop-words-only input', () => {
    expect(tokenize('the is a an')).toEqual([]);
  });
});

// --- scoreEntry ---

const MOCK_ENTRY: ReferenceEntryType = {
  id: 'test_entry',
  category: 'Signaling',
  title: 'Aircraft Signaling',
  summary: 'How to signal aircraft in an emergency using mirrors and smoke.',
  difficulty: 'basic',
  tags: ['signal', 'aircraft', 'rescue', 'mirror', 'smoke'],
  steps: [
    'Find an open clearing with good visibility from the air.',
    'Use a signal mirror to reflect sunlight toward the aircraft.',
  ],
  do_not: ['Do not light smoke signals near dry vegetation.'],
  watch_for: ['Watch for aircraft response patterns.'],
  notes: ['Three of anything is the universal distress signal.'],
};

describe('scoreEntry', () => {
  test('returns 0 for empty query tokens', () => {
    expect(scoreEntry(MOCK_ENTRY, [])).toBe(0);
  });

  test('scores higher for title matches', () => {
    const titleScore = scoreEntry(MOCK_ENTRY, ['aircraft']);
    const stepScore = scoreEntry(MOCK_ENTRY, ['clearing']);
    expect(titleScore).toBeGreaterThan(stepScore);
  });

  test('scores non-zero for summary match', () => {
    const score = scoreEntry(MOCK_ENTRY, ['mirrors']);
    expect(score).toBeGreaterThan(0);
  });

  test('scores non-zero for tag match', () => {
    const score = scoreEntry(MOCK_ENTRY, ['rescue']);
    expect(score).toBeGreaterThan(0);
  });

  test('scores non-zero for step match', () => {
    const score = scoreEntry(MOCK_ENTRY, ['clearing']);
    expect(score).toBeGreaterThan(0);
  });

  test('scores non-zero for do_not match', () => {
    const score = scoreEntry(MOCK_ENTRY, ['vegetation']);
    expect(score).toBeGreaterThan(0);
  });

  test('scores non-zero for watch_for match', () => {
    const score = scoreEntry(MOCK_ENTRY, ['response']);
    expect(score).toBeGreaterThan(0);
  });

  test('scores non-zero for notes match', () => {
    const score = scoreEntry(MOCK_ENTRY, ['distress']);
    expect(score).toBeGreaterThan(0);
  });

  test('normalizes score by query token count', () => {
    const single = scoreEntry(MOCK_ENTRY, ['aircraft']);
    const multiple = scoreEntry(MOCK_ENTRY, ['aircraft', 'clearing']);
    // Both should be non-zero; normalization means they are not simply additive
    expect(single).toBeGreaterThan(0);
    expect(multiple).toBeGreaterThan(0);
  });
});

// --- createExcerpt ---

describe('createExcerpt', () => {
  test('always starts with the entry summary', () => {
    const excerpt = createExcerpt(MOCK_ENTRY, ['mirror']);
    expect(excerpt).toContain(MOCK_ENTRY.summary);
  });

  test('includes relevant steps when query matches', () => {
    const excerpt = createExcerpt(MOCK_ENTRY, ['mirror']);
    expect(excerpt).toContain('reflect sunlight toward the aircraft');
  });

  test('falls back to first step when no step matches the query', () => {
    const excerpt = createExcerpt(MOCK_ENTRY, ['xyz_nonexistent']);
    expect(excerpt).toContain('Find an open clearing');
  });

  test('includes at most 2 relevant steps', () => {
    // Both steps contain 'signal' or 'aircraft'; excerpt should cap at 2
    const excerpt = createExcerpt(MOCK_ENTRY, ['signal']);
    const matches = (excerpt.match(/^\d+\./gm) || []).length;
    expect(matches).toBeLessThanOrEqual(2);
  });
});

// --- ragSearch ---

describe('ragSearch', () => {
  test('returns hasResults=false for empty query', () => {
    const result = ragSearch('');
    expect(result.hasResults).toBe(false);
    expect(result.results).toHaveLength(0);
  });

  test('returns hasResults=false for whitespace-only query', () => {
    const result = ragSearch('   ');
    expect(result.hasResults).toBe(false);
  });

  test('returns hasResults=false for stop-words-only query', () => {
    const result = ragSearch('the is a');
    expect(result.hasResults).toBe(false);
  });

  test('returns relevant results for a natural language question about fire', () => {
    const result = ragSearch('how do I start a fire');
    expect(result.hasResults).toBe(true);
    const titles = result.results.map((r) => r.entry.title.toLowerCase());
    expect(titles.some((t) => t.includes('fire'))).toBe(true);
  });

  test('returns relevant results for a question about bleeding', () => {
    const result = ragSearch('how to stop severe bleeding from a wound');
    expect(result.hasResults).toBe(true);
    const titles = result.results.map((r) => r.entry.title.toLowerCase());
    expect(titles.some((t) => t.includes('bleeding'))).toBe(true);
  });

  test('returns at most topN results', () => {
    const result = ragSearch('survival', 2);
    expect(result.results.length).toBeLessThanOrEqual(2);
  });

  test('preserves the original query in the response', () => {
    const query = 'What should I do in an emergency?';
    const result = ragSearch(query);
    expect(result.query).toBe(query);
  });

  test('results are sorted by descending score', () => {
    const result = ragSearch('shelter water fire survival');
    if (result.results.length > 1) {
      for (let i = 0; i < result.results.length - 1; i++) {
        expect(result.results[i].score).toBeGreaterThanOrEqual(
          result.results[i + 1].score,
        );
      }
    }
  });

  test('each result includes a non-empty excerpt', () => {
    const result = ragSearch('fire starting');
    result.results.forEach((r) => {
      expect(r.excerpt.trim().length).toBeGreaterThan(0);
    });
  });

  test('returns hasResults=false for completely unrelated query', () => {
    // A very high threshold so nothing can match
    const result = ragSearch('xyzzy foobar quux', 3, 999);
    expect(result.hasResults).toBe(false);
  });

  // --- Extended coverage: scenario cards + synthetic tool entries ---

  test('finds Morse Code via synthetic index entry', () => {
    const result = ragSearch('morse code');
    expect(result.hasResults).toBe(true);
    const titles = result.results.map((r) => r.entry.title.toLowerCase());
    expect(titles.some((t) => t.includes('morse'))).toBe(true);
  });

  test('finds Morse Code when searching SOS signals', () => {
    const result = ragSearch('sos signal dots dashes');
    expect(result.hasResults).toBe(true);
    const titles = result.results.map((r) => r.entry.title.toLowerCase());
    expect(
      titles.some((t) => t.includes('morse') || t.includes('ground')),
    ).toBe(true);
  });

  test('finds Radio Frequencies via synthetic index entry', () => {
    const result = ragSearch('ham radio frequency');
    expect(result.hasResults).toBe(true);
    const titles = result.results.map((r) => r.entry.title.toLowerCase());
    expect(
      titles.some((t) => t.includes('radio') || t.includes('frequency')),
    ).toBe(true);
  });

  test('finds Ground-to-Air Signals when searching aircraft signaling', () => {
    const result = ragSearch('signal rescue aircraft');
    expect(result.hasResults).toBe(true);
    const titles = result.results.map((r) => r.entry.title.toLowerCase());
    expect(
      titles.some(
        (t) =>
          t.includes('ground') || t.includes('air') || t.includes('signal'),
      ),
    ).toBe(true);
  });

  test('finds scenario cards when searching for power outage', () => {
    const result = ragSearch('power outage electricity grid');
    expect(result.hasResults).toBe(true);
    const titles = result.results.map((r) => r.entry.title.toLowerCase());
    expect(
      titles.some((t) => t.includes('power') || t.includes('outage')),
    ).toBe(true);
  });

  test('synthetic entries have a related_screen set', () => {
    const morseResult = ragSearch('morse code translator');
    const morseEntry = morseResult.results.find((r) =>
      r.entry.title.toLowerCase().includes('morse'),
    );
    expect(morseEntry).toBeDefined();
    expect(morseEntry!.entry.related_screen).toBe('MorseCode');
  });
});
