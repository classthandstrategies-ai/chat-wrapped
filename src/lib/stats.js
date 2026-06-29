// The stats engine — turns a ParseResult into the full Stats object the UI
// renders as Wrapped story cards. Pure and deterministic: same input always
// yields the same output, and parseResult is never mutated.

import { tokenizeWords, extractEmojis } from './text.js';
import { isStopword } from './stopwords.js';
import { formatDuration, MONTH_LABELS } from './format.js';
import { buildSenderColorMap } from './theme.js';

const SIX_HOURS_MS = 21600000; // response-time cutoff (new conversation)
const THREE_HOURS_MS = 10800000; // first-text conversation gap

/** Calendar-day key in local time, e.g. "2024-03-07". Stable & sortable. */
function dayKey(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** JS getDay() has Sunday=0; Wrapped weeks start Monday, so remap to Mon=0. */
function mondayIndex(d) {
  return (d.getDay() + 6) % 7;
}

/** Median of a numeric array (ascending). Returns null for empty input. */
function median(nums) {
  if (nums.length === 0) return null;
  const sorted = [...nums].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
}

/** Grapheme-ish character length so emoji/CJK count as single chars. */
function charLen(text) {
  return Array.from(text).length;
}

/** Top-N [key, count] pairs from a Map, sorted by count DESC then key ASC. */
function topEntries(map, n) {
  return [...map.entries()]
    .sort((a, b) => b[1] - a[1] || (a[0] < b[0] ? -1 : a[0] > b[0] ? 1 : 0))
    .slice(0, n);
}

/** A non-counted message for word/emoji/longest-message stats. */
function isContentMessage(m) {
  return !m.isMedia && !m.isDeleted;
}

export function computeStats(parseResult) {
  const messages = parseResult && parseResult.messages ? parseResult.messages : [];
  const total = messages.length;

  // Participants sorted by message count DESC (stable tiebreak by name) so
  // colors and ordering are deterministic regardless of parser ordering.
  const msgCountByName = new Map();
  for (const m of messages) {
    msgCountByName.set(m.sender, (msgCountByName.get(m.sender) || 0) + 1);
  }
  const namesByMsgs = [...msgCountByName.keys()].sort((a, b) => {
    const diff = msgCountByName.get(b) - msgCountByName.get(a);
    return diff !== 0 ? diff : a < b ? -1 : a > b ? 1 : 0;
  });
  const colorMap = buildSenderColorMap(namesByMsgs);

  // ---- Per-participant aggregates ----
  const agg = new Map(); // name -> { messages, words, chars, emojiCount, mediaCount }
  for (const name of namesByMsgs) {
    agg.set(name, {
      messages: 0,
      words: 0,
      chars: 0,
      emojiCount: 0,
      mediaCount: 0,
    });
  }
  for (const m of messages) {
    const a = agg.get(m.sender);
    a.messages += 1;
    if (m.isMedia) a.mediaCount += 1;
    if (isContentMessage(m)) {
      a.words += tokenizeWords(m.text).length;
      a.chars += charLen(m.text);
      a.emojiCount += extractEmojis(m.text).length;
    }
  }

  const participants = namesByMsgs.map((name) => {
    const a = agg.get(name);
    return {
      name,
      color: colorMap[name],
      messages: a.messages,
      words: a.words,
      chars: a.chars,
      emojiCount: a.emojiCount,
      mediaCount: a.mediaCount,
      share: total > 0 ? a.messages / total : 0,
    };
  });

  const totalWords = participants.reduce((s, p) => s + p.words, 0);
  const isGroup = participants.length >= 3;

  // ---- Date range ----
  let start = null;
  let end = null;
  if (total > 0) {
    start = new Date(messages[0].ts);
    end = new Date(messages[0].ts);
    for (const m of messages) {
      if (m.ts < start.getTime()) start = new Date(m.ts);
      if (m.ts > end.getTime()) end = new Date(m.ts);
    }
  }
  const dateRange = {
    start: start || new Date(0),
    end: end || new Date(0),
    // Inclusive day span between first and last calendar day.
    days:
      total > 0
        ? Math.round(
            (new Date(end.getFullYear(), end.getMonth(), end.getDate()) -
              new Date(start.getFullYear(), start.getMonth(), start.getDate())) /
              86400000
          ) + 1
        : 0,
  };

  // ---- whoSentMore (head-to-head leader; null if tie or solo) ----
  let whoSentMore = null;
  if (participants.length >= 2) {
    const a = participants[0];
    const b = participants[1];
    if (a.messages !== b.messages) {
      whoSentMore = { name: a.name, share: a.share };
    }
  }

  // ---- Busiest hour & day (with full distributions) ----
  const hourDist = new Array(24).fill(0);
  const dayDist = new Array(7).fill(0);
  for (const m of messages) {
    hourDist[m.date.getHours()] += 1;
    dayDist[mondayIndex(m.date)] += 1;
  }
  let busiestHourIdx = 0;
  for (let h = 1; h < 24; h++) {
    if (hourDist[h] > hourDist[busiestHourIdx]) busiestHourIdx = h;
  }
  let busiestDayIdx = 0;
  for (let d = 1; d < 7; d++) {
    if (dayDist[d] > dayDist[busiestDayIdx]) busiestDayIdx = d;
  }
  const busiestHour = {
    hour: busiestHourIdx,
    count: total > 0 ? hourDist[busiestHourIdx] : 0,
    distribution: hourDist,
  };
  const busiestDay = {
    day: busiestDayIdx,
    count: total > 0 ? dayDist[busiestDayIdx] : 0,
    distribution: dayDist,
  };

  // ---- Longest streak of consecutive calendar days with >=1 message ----
  const longestStreak = computeLongestStreak(messages);

  // ---- Response times (per person, gaps after a different sender) ----
  const responseTimes = computeResponseTimes(messages, namesByMsgs);

  // ---- Top words & emojis (content messages only) ----
  const overallWords = new Map();
  const overallEmojis = new Map();
  const wordsByPerson = new Map();
  const emojisByPerson = new Map();
  for (const name of namesByMsgs) {
    wordsByPerson.set(name, new Map());
    emojisByPerson.set(name, new Map());
  }
  for (const m of messages) {
    if (!isContentMessage(m)) continue;
    for (const w of tokenizeWords(m.text)) {
      if (isStopword(w)) continue;
      overallWords.set(w, (overallWords.get(w) || 0) + 1);
      const pm = wordsByPerson.get(m.sender);
      pm.set(w, (pm.get(w) || 0) + 1);
    }
    for (const e of extractEmojis(m.text)) {
      overallEmojis.set(e, (overallEmojis.get(e) || 0) + 1);
      const pe = emojisByPerson.get(m.sender);
      pe.set(e, (pe.get(e) || 0) + 1);
    }
  }
  const topWords = {
    overall: topEntries(overallWords, 10).map(([word, count]) => ({ word, count })),
    perPerson: namesByMsgs.map((name) => ({
      name,
      words: topEntries(wordsByPerson.get(name), 10).map(([word, count]) => ({
        word,
        count,
      })),
    })),
  };
  const topEmojis = {
    overall: topEntries(overallEmojis, 10).map(([emoji, count]) => ({
      emoji,
      count,
    })),
    perPerson: namesByMsgs.map((name) => ({
      name,
      emojis: topEntries(emojisByPerson.get(name), 8).map(([emoji, count]) => ({
        emoji,
        count,
      })),
    })),
  };

  // ---- First-text leader (who opens new conversations after a >3h gap) ----
  const firstText = computeFirstText(messages, namesByMsgs);

  // ---- Longest single message (content only) ----
  let longestMessage = null;
  for (const m of messages) {
    if (!isContentMessage(m)) continue;
    const len = charLen(m.text);
    if (!longestMessage || len > longestMessage.length) {
      longestMessage = {
        sender: m.sender,
        text: m.text,
        length: len,
        date: new Date(m.ts),
      };
    }
  }

  // ---- Most messages in one calendar day ----
  let mostInOneDay = null;
  const perDay = new Map();
  for (const m of messages) {
    const k = dayKey(m.date);
    perDay.set(k, (perDay.get(k) || 0) + 1);
  }
  if (perDay.size > 0) {
    let bestKey = null;
    let bestCount = -1;
    for (const [k, c] of perDay.entries()) {
      // Strict max; earliest day wins ties for determinism.
      if (c > bestCount || (c === bestCount && k < bestKey)) {
        bestCount = c;
        bestKey = k;
      }
    }
    // Resolve the representative Date for the winning day from its first message.
    const winning = messages.find((m) => dayKey(m.date) === bestKey);
    mostInOneDay = { date: new Date(winning.ts), count: bestCount };
  }

  // ---- Longest silence (largest gap between consecutive messages) ----
  let longestSilence = null;
  for (let i = 1; i < messages.length; i++) {
    const gap = messages[i].ts - messages[i - 1].ts;
    if (gap > 0 && (!longestSilence || gap > longestSilence.ms)) {
      longestSilence = {
        ms: gap,
        label: formatDuration(gap),
        start: new Date(messages[i - 1].ts),
        end: new Date(messages[i].ts),
      };
    }
  }

  // ---- Double texts (consecutive same-sender messages before a reply) ----
  const doubleMap = new Map();
  for (const name of namesByMsgs) doubleMap.set(name, 0);
  for (let i = 1; i < messages.length; i++) {
    if (messages[i].sender === messages[i - 1].sender) {
      doubleMap.set(messages[i].sender, (doubleMap.get(messages[i].sender) || 0) + 1);
    }
  }
  const doubleTexts = namesByMsgs
    .map((name) => ({ name, count: doubleMap.get(name) || 0 }))
    .sort((a, b) => b.count - a.count || (a.name < b.name ? -1 : 1));

  // ---- Peak month (calendar year+month with most messages) ----
  let peakMonth = null;
  const perMonth = new Map(); // "YYYY-MM" -> count
  for (const m of messages) {
    const k = `${m.date.getFullYear()}-${String(m.date.getMonth()).padStart(2, '0')}`;
    perMonth.set(k, (perMonth.get(k) || 0) + 1);
  }
  if (perMonth.size > 0) {
    let bestKey = null;
    let bestCount = -1;
    for (const [k, c] of perMonth.entries()) {
      if (c > bestCount || (c === bestCount && k < bestKey)) {
        bestCount = c;
        bestKey = k;
      }
    }
    const [yStr, mStr] = bestKey.split('-');
    const monthIdx = parseInt(mStr, 10);
    peakMonth = {
      label: `${MONTH_LABELS[monthIdx]} ${yStr}`,
      count: bestCount,
    };
  }

  // ---- detailed / others split (top 6) ----
  const detailed = participants.slice(0, 6);
  const others = participants.slice(6);

  // ---- Vibe (one deterministic personality label from thresholds) ----
  const vibe = deriveVibe({
    busiestHour,
    responseTimes,
    longestSilence,
    participants,
    totalWords,
    total,
  });

  return {
    totalMessages: total,
    totalWords,
    dateRange,
    isGroup,
    participants,
    detailed,
    others,
    whoSentMore,
    busiestHour,
    busiestDay,
    longestStreak,
    responseTimes,
    topWords,
    topEmojis,
    firstText,
    longestMessage,
    mostInOneDay,
    longestSilence,
    doubleTexts,
    peakMonth,
    vibe,
  };
}

/** Longest run of consecutive calendar days each having >=1 message. */
function computeLongestStreak(messages) {
  if (messages.length === 0) {
    return { days: 0, start: null, end: null };
  }
  // Unique sorted day timestamps (midnight epoch) for set membership.
  const daySet = new Set();
  for (const m of messages) {
    const d = m.date;
    daySet.add(new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime());
  }
  const sortedDays = [...daySet].sort((a, b) => a - b);

  let bestLen = 1;
  let bestStart = sortedDays[0];
  let bestEnd = sortedDays[0];
  let curLen = 1;
  let curStart = sortedDays[0];
  for (let i = 1; i < sortedDays.length; i++) {
    // 86400000ms apart => consecutive calendar days (DST-tolerant via Date math).
    const prev = new Date(sortedDays[i - 1]);
    const nextDay = new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1).getTime();
    if (sortedDays[i] === nextDay) {
      curLen += 1;
    } else {
      curLen = 1;
      curStart = sortedDays[i];
    }
    if (curLen > bestLen) {
      bestLen = curLen;
      bestStart = curStart;
      bestEnd = sortedDays[i];
    }
  }
  return {
    days: bestLen,
    start: new Date(bestStart),
    end: new Date(bestEnd),
  };
}

/** Median reply gap per person, excluding gaps > 6h (new conversations). */
function computeResponseTimes(messages, namesByMsgs) {
  const gapsByName = new Map();
  for (const name of namesByMsgs) gapsByName.set(name, []);
  for (let i = 1; i < messages.length; i++) {
    const cur = messages[i];
    const prev = messages[i - 1];
    if (cur.sender === prev.sender) continue; // only replies to a different person
    const gap = cur.ts - prev.ts;
    if (gap < 0 || gap > SIX_HOURS_MS) continue; // exclude long/negative gaps
    gapsByName.get(cur.sender).push(gap);
  }
  return namesByMsgs.map((name) => {
    const gaps = gapsByName.get(name);
    const med = median(gaps);
    return {
      name,
      medianMs: med,
      label: med === null ? 'no replies yet' : formatDuration(med),
      samples: gaps.length,
    };
  });
}

/** Count who opens each new conversation (gap from previous message > 3h). */
function computeFirstText(messages, namesByMsgs) {
  const counts = new Map();
  for (const name of namesByMsgs) counts.set(name, 0);
  for (let i = 0; i < messages.length; i++) {
    const isNewConvo = i === 0 || messages[i].ts - messages[i - 1].ts > THREE_HOURS_MS;
    if (isNewConvo) {
      counts.set(messages[i].sender, (counts.get(messages[i].sender) || 0) + 1);
    }
  }
  const perPerson = namesByMsgs.map((name) => ({
    name,
    count: counts.get(name) || 0,
  }));
  // Leader = strict max; null on tie or empty.
  let leader = null;
  if (perPerson.length > 0) {
    const sorted = [...perPerson].sort((a, b) => b.count - a.count);
    if (sorted.length === 1 ? sorted[0].count > 0 : sorted[0].count > sorted[1].count) {
      leader = sorted[0].name;
    }
  }
  return { perPerson, leader, gapHours: 3 };
}

/** Pick ONE vibe label from deterministic thresholds (most specific first). */
function deriveVibe({
  busiestHour,
  responseTimes,
  longestSilence,
  participants,
  totalWords,
  total,
}) {
  const hour = busiestHour.hour;
  const validMedians = responseTimes.map((r) => r.medianMs).filter((v) => v !== null);
  const fastestMedian = validMedians.length > 0 ? Math.min(...validMedians) : null;
  const totalEmojis = participants.reduce((s, p) => s + p.emojiCount, 0);
  const emojiRate = totalWords > 0 ? totalEmojis / totalWords : 0;
  const silenceDays = longestSilence ? longestSilence.ms / 86400000 : 0;

  // Night owls: peak chatter happens late night / early morning.
  if (total > 0 && (hour >= 22 || hour <= 4)) {
    return {
      title: 'Night Owls',
      subtitle: 'Your best conversations happen after dark.',
    };
  }
  // Always-on: someone typically replies within two minutes.
  if (fastestMedian !== null && fastestMedian <= 120000) {
    return {
      title: 'Always-On Texters',
      subtitle: 'Replies fly back almost instantly — phones never down.',
    };
  }
  // Emoji maximalists: heavy emoji use relative to word count.
  if (emojiRate >= 0.15) {
    return {
      title: 'Emoji Maximalists',
      subtitle: 'Why use words when an emoji says it better?',
    };
  }
  // Slow burn: at least one very long silence in the history.
  if (silenceDays >= 7) {
    return {
      title: 'Slow Burn',
      subtitle: 'You take your time — and pick right back up.',
    };
  }
  // Default steady vibe.
  return {
    title: 'Steady Companions',
    subtitle: 'A consistent, easy back-and-forth.',
  };
}
