// WhatsApp chat parser - the highest-risk component of the app.
//
// Auto-detects the export format (iOS bracketed vs Android dash), the date
// order (DMY / MDY / YMD) and the time format (12h / 24h), then turns the raw
// .txt into a chronological list of structured messages. It never throws on
// malformed input: bad lines are counted and skipped.

/**
 * iOS bracketed prefix:  [12/03/2024, 9:41:07 PM] Sender: text
 * Captures: rawDate, rawTime (incl. optional seconds + optional AM/PM), rest.
 * The time group is greedy enough to grab "9:41:07 PM" but stops at the
 * closing bracket.
 */
const IOS_RE =
  /^\[(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap]\.?[Mm]\.?)?)\]\s?(.*)$/;

/**
 * Android dash prefix:  12/03/2024, 21:41 - Sender: text
 * Captures: rawDate, rawTime, rest. The " - " separator divides the datetime
 * from the body.
 */
const ANDROID_RE =
  /^(\d{1,4}[./-]\d{1,2}[./-]\d{1,4}),\s*(\d{1,2}:\d{2}(?::\d{2})?(?:\s*[APap]\.?[Mm]\.?)?)\s-\s(.*)$/;

/**
 * Strip a datetime prefix from a single line, trying iOS first then Android.
 * Returns { rawDate, rawTime, rest } or null if the line is a continuation.
 */
function matchPrefix(line) {
  const ios = IOS_RE.exec(line);
  if (ios) return { rawDate: ios[1], rawTime: ios[2], rest: ios[3] };
  const android = ANDROID_RE.exec(line);
  if (android) return { rawDate: android[1], rawTime: android[2], rest: android[3] };
  return null;
}

// Invisible characters cleaned during normalization. Defined via \u-escaped
// string literals (no raw invisible code points) so the source stays pure
// ASCII and is immune to editors mangling the characters.
const BOM_RE = new RegExp('^\\uFEFF'); // byte-order mark
// U+200E/200F LTR/RTL marks; U+202A-202E bidi embedding controls.
const BIDI_RE = new RegExp('[\\u200E\\u200F\\u202A-\\u202E]', 'g');
// U+202F narrow no-break space; U+00A0 no-break space.
const NBSP_RE = new RegExp('[\\u202F\\u00A0]', 'g');

/**
 * Normalize raw export text:
 * - strip BOM
 * - normalize CRLF / CR line endings to LF
 * - remove LTR/RTL marks and bidi embedding controls
 * - normalize narrow no-break space (U+202F) and no-break space (U+00A0) to ' '
 */
export function normalizeRaw(raw) {
  return raw.replace(BOM_RE, '').replace(/\r\n?/g, '\n').replace(BIDI_RE, '').replace(NBSP_RE, ' ');
}

/** Split a raw date string into its 3 numeric components. */
function splitDateParts(rawDate) {
  const m = /^(\d{1,4})[./-](\d{1,2})[./-](\d{1,4})$/.exec(rawDate);
  if (!m) return null;
  return [Number(m[1]), Number(m[2]), Number(m[3])];
}

/**
 * Pre-scan every datetime prefix in the file to decide DMY vs MDY vs YMD.
 * Evidence rules:
 *  - first component is 4 digits   -> YMD
 *  - first component  > 12         -> DMY
 *  - second component > 12         -> MDY
 * Choose by majority of evidence; DEFAULT to "DMY" on a tie or no evidence.
 */
export function detectDateOrder(lines) {
  let dmy = 0;
  let mdy = 0;
  let ymd = 0;
  for (const line of lines) {
    const pre = matchPrefix(line);
    if (!pre) continue;
    const parts = splitDateParts(pre.rawDate);
    if (!parts) continue;
    const [a, b] = parts;
    // A 4-digit leading component is an unambiguous YMD signal.
    if (/^\d{4}/.test(pre.rawDate)) {
      ymd += 1;
      continue;
    }
    if (a > 12) dmy += 1;
    else if (b > 12) mdy += 1;
  }
  if (ymd > dmy && ymd > mdy) return 'YMD';
  if (mdy > dmy) return 'MDY';
  return 'DMY'; // default on tie / no evidence
}

/** Map date components to {y, mo, d} given the detected order. */
function applyDateOrder(parts, order) {
  const [a, b, c] = parts;
  if (order === 'YMD') return { y: a, mo: b, d: c };
  if (order === 'MDY') return { y: c, mo: a, d: b };
  return { y: c, mo: b, d: a }; // DMY: day, month, year
}

/** Expand a 2-digit year to 4 digits (00-69 => 2000s, 70-99 => 1900s). */
function expandYear(y) {
  if (y >= 100) return y;
  return y < 70 ? 2000 + y : 1900 + y;
}

/**
 * Parse a raw time string ("9:41:07 PM", "21:41", "11:05 a.m.") into
 * { hh, mm, ss } in 24-hour form. Returns null if unparseable.
 */
function parseTime(rawTime) {
  const m = /^(\d{1,2}):(\d{2})(?::(\d{2}))?\s*([APap]\.?[Mm]\.?)?$/.exec(rawTime.trim());
  if (!m) return null;
  let hh = Number(m[1]);
  const mm = Number(m[2]);
  const ss = m[3] !== undefined ? Number(m[3]) : 0;
  const ampm = m[4] ? m[4].replace(/\./g, '').toUpperCase() : null;
  if (ampm === 'AM') {
    if (hh === 12) hh = 0; // 12 AM -> 0
  } else if (ampm === 'PM') {
    if (hh !== 12) hh += 12; // 12 PM stays 12
  }
  if (hh > 23 || mm > 59 || ss > 59) return null;
  return { hh, mm, ss };
}

/**
 * Build a local Date from raw date/time strings using the detected order.
 * Returns a valid Date or null (caller counts nulls as invalid/skipped).
 */
function buildDate(rawDate, rawTime, order) {
  const parts = splitDateParts(rawDate);
  if (!parts) return null;
  const { y, mo, d } = applyDateOrder(parts, order);
  const time = parseTime(rawTime);
  if (!time) return null;
  const year = expandYear(y);
  const date = new Date(year, mo - 1, d, time.hh, time.mm, time.ss);
  if (Number.isNaN(date.getTime())) return null;
  // Guard against JS Date rollover (e.g. month 13, day 32) silently shifting.
  if (date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return date;
}

const DELETED_RE = /^(This message was deleted\.?|You deleted this message\.?)$/i;

/** Decide media/deleted flags from the message body. */
function classifyText(text) {
  const trimmed = text.trim();
  const isDeleted = DELETED_RE.test(trimmed);
  let isMedia = false;
  if (!isDeleted) {
    if (/<Media omitted>/i.test(trimmed)) isMedia = true;
    else if (/\b(image|video|audio|sticker|GIF|document|Contact card)\b.*omitted/i.test(trimmed))
      isMedia = true;
    else if (trimmed.length <= 24 && /omitted/i.test(trimmed)) isMedia = true; // short "... omitted"
  }
  return { isMedia, isDeleted };
}

/**
 * Parse a WhatsApp export into structured messages.
 * See the data contract for exact shapes. Never throws.
 */
export function parseChat(raw) {
  if (typeof raw !== 'string') raw = String(raw == null ? '' : raw);
  const text = normalizeRaw(raw);
  const lines = text.split('\n');
  const totalLines = lines.length;

  const order = detectDateOrder(lines);

  const messages = [];
  const counts = new Map(); // sender -> message count (for participant sorting)
  let skippedSystem = 0;
  let invalidCount = 0; // dated lines whose date couldn't be built
  let current = null; // the message currently accepting continuation lines

  for (const line of lines) {
    const pre = matchPrefix(line);

    if (!pre) {
      // Continuation of the previous authored message (multi-line support).
      // Lines before any message, and continuations of skipped system lines,
      // have no current message to attach to and are simply ignored.
      if (current) current.text += '\n' + line;
      continue;
    }

    const date = buildDate(pre.rawDate, pre.rawTime, order);
    if (!date) {
      invalidCount += 1;
      current = null; // don't let later continuations attach to nothing
      continue;
    }

    // Split body on the FIRST ": " - present => authored, absent => system.
    const idx = pre.rest.indexOf(': ');
    if (idx === -1) {
      skippedSystem += 1;
      current = null;
      continue;
    }

    const sender = pre.rest.slice(0, idx);
    const body = pre.rest.slice(idx + 2);
    const { isMedia, isDeleted } = classifyText(body);
    const msg = {
      ts: date.getTime(),
      date,
      sender,
      text: body,
      isMedia,
      isDeleted,
    };
    messages.push(msg);
    counts.set(sender, (counts.get(sender) || 0) + 1);
    current = msg;
  }

  // Participants sorted by message count DESC (stable for ties via name).
  const participants = Array.from(counts.keys()).sort((x, y) => {
    const diff = counts.get(y) - counts.get(x);
    return diff !== 0 ? diff : x.localeCompare(y);
  });

  let firstTs = null;
  let lastTs = null;
  for (const m of messages) {
    if (firstTs === null || m.ts < firstTs) firstTs = m.ts;
    if (lastTs === null || m.ts > lastTs) lastTs = m.ts;
  }

  return {
    messages,
    participants,
    meta: {
      totalLines,
      parsedCount: messages.length,
      skippedSystem,
      invalidCount,
      dateOrder: order,
      firstTs,
      lastTs,
    },
    ok: messages.length > 0,
  };
}
