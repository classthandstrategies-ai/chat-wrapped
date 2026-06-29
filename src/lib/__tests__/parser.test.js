import { describe, it, expect } from 'vitest';
import { parseChat, detectDateOrder } from '../parser.js';

describe('parseChat - format auto-detection', () => {
  it('parses iOS bracketed 12-hour format', () => {
    const raw = '[12/03/2024, 9:41:07 PM] Aanya: hey there';
    const res = parseChat(raw);
    expect(res.ok).toBe(true);
    expect(res.messages).toHaveLength(1);
    const m = res.messages[0];
    expect(m.sender).toBe('Aanya');
    expect(m.text).toBe('hey there');
    expect(m.date.getHours()).toBe(21); // 9:41 PM -> 21
    expect(m.date.getMinutes()).toBe(41);
    expect(m.date.getSeconds()).toBe(7);
    expect(m.ts).toBe(m.date.getTime());
  });

  it('parses iOS bracketed 24-hour format', () => {
    const raw = '[12/03/2024, 21:41:07] Aanya: hey';
    const res = parseChat(raw);
    expect(res.messages[0].date.getHours()).toBe(21);
    expect(res.messages[0].date.getSeconds()).toBe(7);
  });

  it('parses Android dash 24-hour format', () => {
    const raw = '12/03/2024, 21:41 - Aanya: hey';
    const res = parseChat(raw);
    expect(res.ok).toBe(true);
    const m = res.messages[0];
    expect(m.sender).toBe('Aanya');
    expect(m.text).toBe('hey');
    expect(m.date.getHours()).toBe(21);
    expect(m.date.getMinutes()).toBe(41);
    expect(m.date.getSeconds()).toBe(0);
  });

  it('parses Android dash 12-hour format', () => {
    const raw = '12/03/2024, 9:41 PM - Aanya: hey';
    const res = parseChat(raw);
    expect(res.messages[0].date.getHours()).toBe(21);
    expect(res.messages[0].date.getMinutes()).toBe(41);
  });

  it('handles 12 AM as midnight and 12 PM as noon', () => {
    const raw = ['12/03/2024, 12:00 AM - A: midnight', '12/03/2024, 12:00 PM - A: noon'].join('\n');
    const res = parseChat(raw);
    expect(res.messages[0].date.getHours()).toBe(0);
    expect(res.messages[1].date.getHours()).toBe(12);
  });

  it('handles lowercase a.m. and a narrow no-break space (U+202F) before meridiem', () => {
    // iOS exports put a U+202F narrow no-break space between the time and AM/PM.
    const raw = '[12/03/2024, 9:41:07\u202Fa.m.] A: morning';
    const res = parseChat(raw);
    expect(res.messages).toHaveLength(1);
    expect(res.messages[0].date.getHours()).toBe(9);
  });

  it('handles a no-break space (U+00A0) before the meridiem', () => {
    const raw = '12/03/2024, 9:41\u00A0PM - A: evening';
    const res = parseChat(raw);
    expect(res.messages).toHaveLength(1);
    expect(res.messages[0].date.getHours()).toBe(21);
  });
});

describe('parseChat - date order', () => {
  it('detects US short-year MDY when second component > 12', () => {
    const raw = '3/13/24, 9:41 PM - Aanya: hey';
    const res = parseChat(raw);
    expect(res.meta.dateOrder).toBe('MDY');
    const m = res.messages[0];
    expect(m.date.getFullYear()).toBe(2024);
    expect(m.date.getMonth()).toBe(2); // March (0-based)
    expect(m.date.getDate()).toBe(13);
  });

  it('detectDateOrder picks DMY when a first component > 12 exists', () => {
    const lines = ['13/03/2024, 21:41 - A: x', '05/03/2024, 21:42 - A: y'];
    expect(detectDateOrder(lines)).toBe('DMY');
  });

  it('detectDateOrder picks MDY when a second component > 12 exists', () => {
    const lines = ['03/13/2024, 21:41 - A: x', '03/05/2024, 21:42 - A: y'];
    expect(detectDateOrder(lines)).toBe('MDY');
  });

  it('detectDateOrder defaults to DMY with no evidence', () => {
    const lines = ['03/05/2024, 21:41 - A: x'];
    expect(detectDateOrder(lines)).toBe('DMY');
  });

  it('detectDateOrder picks YMD for a 4-digit leading component', () => {
    const lines = ['2024/03/13, 21:41 - A: x'];
    expect(detectDateOrder(lines)).toBe('YMD');
  });

  it('parses with a consistent order across the whole file', () => {
    // Evidence (13) forces DMY; the ambiguous line must use DMY too.
    const raw = ['13/03/2024, 21:41 - A: evidence', '04/03/2024, 21:42 - A: ambiguous'].join('\n');
    const res = parseChat(raw);
    expect(res.meta.dateOrder).toBe('DMY');
    expect(res.messages[1].date.getDate()).toBe(4);
    expect(res.messages[1].date.getMonth()).toBe(2); // March
  });

  it('parses a YMD file correctly end to end', () => {
    const raw = '2024/03/13, 21:41 - A: ymd';
    const res = parseChat(raw);
    expect(res.meta.dateOrder).toBe('YMD');
    expect(res.messages[0].date.getFullYear()).toBe(2024);
    expect(res.messages[0].date.getMonth()).toBe(2); // March
    expect(res.messages[0].date.getDate()).toBe(13);
  });
});

describe('parseChat - separators', () => {
  it('handles dot and dash date separators', () => {
    const raw = ['13.03.2024, 21:41 - A: dots', '[13-03-2024, 21:42] A: dashes'].join('\n');
    const res = parseChat(raw);
    expect(res.messages).toHaveLength(2);
    expect(res.messages[0].text).toBe('dots');
    expect(res.messages[1].text).toBe('dashes');
  });
});

describe('parseChat - continuation lines', () => {
  it('joins multi-line messages with newlines', () => {
    const raw = [
      '12/03/2024, 21:41 - Aanya: line one',
      'line two',
      'line three',
      '12/03/2024, 21:42 - Rohan: reply',
    ].join('\n');
    const res = parseChat(raw);
    expect(res.messages).toHaveLength(2);
    expect(res.messages[0].text).toBe('line one\nline two\nline three');
    expect(res.messages[1].text).toBe('reply');
  });

  it('a continuation never creates a system skip', () => {
    const raw = [
      '12/03/2024, 21:41 - Aanya: hello',
      'a continuation line without a colon space',
    ].join('\n');
    const res = parseChat(raw);
    expect(res.meta.skippedSystem).toBe(0);
    expect(res.messages[0].text).toBe('hello\na continuation line without a colon space');
  });
});

describe('parseChat - system lines', () => {
  it('skips system/notification lines that lack a colon space', () => {
    const raw = [
      '12/03/2024, 21:40 - Messages and calls are end-to-end encrypted.',
      '12/03/2024, 21:40 - Aanya created group "Friends"',
      '12/03/2024, 21:41 - Aanya: hey',
    ].join('\n');
    const res = parseChat(raw);
    expect(res.meta.skippedSystem).toBe(2);
    expect(res.messages).toHaveLength(1);
    expect(res.messages[0].sender).toBe('Aanya');
  });
});

describe('parseChat - media & deleted flags', () => {
  it('flags <Media omitted> as media', () => {
    const raw = '12/03/2024, 21:41 - Aanya: <Media omitted>';
    const res = parseChat(raw);
    expect(res.messages[0].isMedia).toBe(true);
    expect(res.messages[0].isDeleted).toBe(false);
  });

  it('flags "image omitted" style as media', () => {
    const raw = '[12/03/2024, 9:41:07 PM] Aanya: image omitted';
    const res = parseChat(raw);
    expect(res.messages[0].isMedia).toBe(true);
  });

  it('flags deleted messages', () => {
    const raw = [
      '12/03/2024, 21:41 - Aanya: This message was deleted',
      '12/03/2024, 21:42 - Rohan: You deleted this message',
    ].join('\n');
    const res = parseChat(raw);
    expect(res.messages[0].isDeleted).toBe(true);
    expect(res.messages[0].isMedia).toBe(false);
    expect(res.messages[1].isDeleted).toBe(true);
  });
});

describe('parseChat - participants ordering', () => {
  it('sorts participants by message count DESC', () => {
    const raw = [
      '12/03/2024, 21:41 - Aanya: 1',
      '12/03/2024, 21:42 - Rohan: 1',
      '12/03/2024, 21:43 - Rohan: 2',
      '12/03/2024, 21:44 - Rohan: 3',
      '12/03/2024, 21:45 - Aanya: 2',
    ].join('\n');
    const res = parseChat(raw);
    expect(res.participants).toEqual(['Rohan', 'Aanya']); // Rohan 3 > Aanya 2
  });
});

describe('parseChat - robustness & meta', () => {
  it('strips BOM, CRLF and bidi marks without throwing', () => {
    // BOM (U+FEFF) at start; LTR mark (U+200E) before the sender name.
    const raw = '\uFEFF12/03/2024, 21:41 - \u200EAanya: hi\r\n12/03/2024, 21:42 - Rohan: yo\r\n';
    const res = parseChat(raw);
    expect(res.messages).toHaveLength(2);
    expect(res.messages[0].sender).toBe('Aanya');
  });

  it('returns ok=false and empty arrays for non-chat input', () => {
    const res = parseChat('just some random text\nwith no dates');
    expect(res.ok).toBe(false);
    expect(res.messages).toHaveLength(0);
    expect(res.participants).toEqual([]);
    expect(res.meta.firstTs).toBeNull();
    expect(res.meta.lastTs).toBeNull();
  });

  it('sets firstTs/lastTs from min/max ts', () => {
    const raw = ['12/03/2024, 21:45 - A: later', '12/03/2024, 21:41 - A: earlier'].join('\n');
    const res = parseChat(raw);
    expect(res.meta.firstTs).toBe(res.messages[1].ts); // earlier
    expect(res.meta.lastTs).toBe(res.messages[0].ts); // later
    expect(res.meta.firstTs).toBeLessThan(res.meta.lastTs);
  });

  it('does not throw on invalid dates and counts them', () => {
    const raw = '45/45/2024, 99:99 - A: bad';
    expect(() => parseChat(raw)).not.toThrow();
    const res = parseChat(raw);
    expect(res.messages).toHaveLength(0);
  });

  it('splits sender/text on the FIRST colon-space only', () => {
    const raw = '12/03/2024, 21:41 - Aanya: ratio is 3:1 today';
    const res = parseChat(raw);
    expect(res.messages[0].sender).toBe('Aanya');
    expect(res.messages[0].text).toBe('ratio is 3:1 today');
  });
});
