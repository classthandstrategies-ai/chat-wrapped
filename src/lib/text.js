// Text utilities — tokenization, emoji extraction, word counting.
//
// All functions are Unicode-aware so multi-script chats (English, Hindi,
// emoji, ZWJ sequences, flags) tokenize correctly. No external deps.

// Strip URLs (http(s)://… and www.…) so they don't pollute word tokens.
const URL_RE = /(?:https?:\/\/|www\.)\S+/giu;

// Runs of letters / marks / numbers / underscore (Unicode-aware).
const WORD_RUN_RE = /[\p{L}\p{M}\p{N}_]+/gu;

// Used to keep only runs that contain at least one actual letter.
const HAS_LETTER_RE = /\p{L}/u;

// Emoji detection: a grapheme is an emoji if it contains a pictographic codepoint.
const EMOJI_CP_RE = /\p{Extended_Pictographic}/u;

// Fallback emoji matcher for environments without Intl.Segmenter. Matches a
// pictographic base plus any trailing variation selectors / ZWJ-joined parts /
// skin-tone modifiers, and regional-indicator flag pairs, as single units.
const EMOJI_FALLBACK_RE =
  /\p{RI}\p{RI}|\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?(?:‍\p{Extended_Pictographic}(?:️|\p{Emoji_Modifier})?)*/gu;

let _segmenter = null;
function getSegmenter() {
  if (_segmenter !== null) return _segmenter;
  if (typeof Intl !== 'undefined' && typeof Intl.Segmenter === 'function') {
    try {
      _segmenter = new Intl.Segmenter('und', { granularity: 'grapheme' });
    } catch {
      _segmenter = false;
    }
  } else {
    _segmenter = false;
  }
  return _segmenter;
}

/**
 * Lowercase, URL-stripped word tokens. Keeps multi-script letters, drops pure
 * numbers and tokens shorter than 2 chars. NOT stopword-filtered (stats does that).
 */
export function tokenizeWords(text) {
  if (!text) return [];
  const cleaned = String(text).replace(URL_RE, ' ').toLowerCase();
  const runs = cleaned.match(WORD_RUN_RE);
  if (!runs) return [];
  const out = [];
  for (const run of runs) {
    if (run.length < 2) continue; // drop length < 2
    if (!HAS_LETTER_RE.test(run)) continue; // drop pure numbers
    out.push(run);
  }
  return out;
}

/**
 * Grapheme-safe emoji extraction. Returns one entry per emoji occurrence, in
 * order. ZWJ sequences and flags count as a single emoji.
 */
export function extractEmojis(text) {
  if (!text) return [];
  const str = String(text);
  const out = [];
  const seg = getSegmenter();
  if (seg) {
    for (const { segment } of seg.segment(str)) {
      if (EMOJI_CP_RE.test(segment)) out.push(segment);
    }
    return out;
  }
  // Fallback: regex match of emoji clusters.
  const matches = str.match(EMOJI_FALLBACK_RE);
  if (matches) {
    for (const m of matches) {
      if (EMOJI_CP_RE.test(m)) out.push(m);
    }
  }
  return out;
}

/**
 * Count word-ish runs (length >= 1 containing a letter). Looser than
 * tokenizeWords so short words like "I" / "a" still count toward word totals.
 */
export function countWords(text) {
  if (!text) return 0;
  const cleaned = String(text).replace(URL_RE, ' ');
  const runs = cleaned.match(WORD_RUN_RE);
  if (!runs) return 0;
  let n = 0;
  for (const run of runs) {
    if (HAS_LETTER_RE.test(run)) n += 1;
  }
  return n;
}
