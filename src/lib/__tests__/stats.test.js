import { describe, it, expect } from 'vitest';
import { parseChat } from '../parser.js';
import { computeStats } from '../stats.js';

// A small deterministic Android (24h) WhatsApp export: 2 people, 12 messages
// across 3 consecutive days. Designed so every asserted stat is predictable:
//  - Alice (7 msgs) > Bob (5 msgs)            -> whoSentMore = Alice
//  - hour 23 has 5 messages (day 3)           -> busiestHour.hour = 23
//  - 3 consecutive calendar days each used    -> longestStreak.days = 3
//  - "hello" repeated several times           -> top word
//  - "😂" repeated                            -> top emoji
//  - day-2 morning opens after a >10h gap     -> Alice leads firstText
//  - the >10h overnight gap is >6h            -> excluded from responseTimes
const RAW = [
  // Day 1 — 07/03/2024 (late-night burst, hour 22)
  '07/03/2024, 22:00 - Alice: hello there 😂',
  '07/03/2024, 22:01 - Bob: hello back',
  '07/03/2024, 22:05 - Alice: hello again',
  '07/03/2024, 22:10 - Bob: ok cool',
  // Day 2 — 08/03/2024 (>10h overnight gap before this; new conversation)
  '08/03/2024, 09:00 - Alice: good morning',
  '08/03/2024, 09:02 - Bob: morning',
  '08/03/2024, 13:00 - Alice: lunch later',
  // Day 3 — 09/03/2024 (hour 23 burst, 5 messages)
  '09/03/2024, 23:00 - Bob: hey',
  '09/03/2024, 23:01 - Alice: hey hello',
  '09/03/2024, 23:02 - Bob: 😂😂',
  '09/03/2024, 23:03 - Alice: bye',
  '09/03/2024, 23:04 - Alice: bye for real',
].join('\n');

describe('computeStats', () => {
  const parsed = parseChat(RAW);
  const stats = computeStats(parsed);

  it('parses all 12 messages', () => {
    expect(parsed.ok).toBe(true);
    expect(stats.totalMessages).toBe(12);
  });

  it('identifies who sent more (Alice)', () => {
    expect(stats.whoSentMore).not.toBeNull();
    expect(stats.whoSentMore.name).toBe('Alice');
  });

  it('finds the busiest hour (23)', () => {
    expect(stats.busiestHour.hour).toBe(23);
    expect(stats.busiestHour.distribution).toHaveLength(24);
    expect(stats.busiestHour.distribution[23]).toBe(5);
  });

  it('computes the longest streak as 3 consecutive days', () => {
    expect(stats.longestStreak.days).toBe(3);
    expect(stats.longestStreak.start).toBeInstanceOf(Date);
    expect(stats.longestStreak.end).toBeInstanceOf(Date);
  });

  it('surfaces "hello" as a top word', () => {
    const words = stats.topWords.overall.map((w) => w.word);
    expect(words).toContain('hello');
  });

  it('surfaces "😂" as a top emoji', () => {
    const emojis = stats.topEmojis.overall.map((e) => e.emoji);
    expect(emojis).toContain('😂');
  });

  it('names the first-text leader (Alice opens conversations)', () => {
    expect(stats.firstText.leader).toBe('Alice');
    expect(stats.firstText.gapHours).toBe(3);
  });

  it('excludes the >6h overnight gaps from response times', () => {
    // Cross-sender replies, with the two >6h gaps (Alice 08/03 09:00 after Bob
    // 07/03 22:10, and Bob 09/03 23:00 after Alice 08/03 13:00) excluded:
    //   Bob replies (prev sender Alice): 22:01, 22:10, 09:02, 23:02 -> 4 samples
    //   Alice replies (prev sender Bob): 22:05, 13:00, 23:01, 23:03 -> 4 samples
    const bob = stats.responseTimes.find((r) => r.name === 'Bob');
    const alice = stats.responseTimes.find((r) => r.name === 'Alice');
    expect(bob.samples).toBe(4);
    expect(alice.samples).toBe(4);
    // Every retained gap is under the 6h cutoff.
    expect(bob.medianMs).not.toBeNull();
    expect(bob.medianMs).toBeLessThanOrEqual(6 * 60 * 60 * 1000);
    expect(alice.medianMs).toBeLessThanOrEqual(6 * 60 * 60 * 1000);
  });

  it('never mutates the input parseResult', () => {
    const before = parsed.messages.length;
    computeStats(parsed);
    expect(parsed.messages.length).toBe(before);
  });

  it('handles an empty chat without throwing', () => {
    const empty = computeStats({
      messages: [],
      participants: [],
      meta: {},
      ok: false,
    });
    expect(empty.totalMessages).toBe(0);
    expect(empty.whoSentMore).toBeNull();
    expect(empty.longestStreak.days).toBe(0);
    expect(empty.dateRange.start).toBeInstanceOf(Date);
  });
});
