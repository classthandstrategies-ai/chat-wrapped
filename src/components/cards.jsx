// Individual story-card *content* components. These render INSIDE a StoryCard
// (which supplies the gradient, kicker, footer, watermark). Kept in one file so
// the whole story stays visually consistent — punchy captions, huge numbers,
// minimal prose.

import { formatNumber, formatDateRange, DAY_LABELS } from '../lib/format.js';
import BarChart from './BarChart.jsx';
import Leaderboard, { OthersRow } from './Leaderboard.jsx';

/* ---------- tiny shared primitives ---------- */

function BigStat({ children }) {
  return (
    <p className="tnum text-7xl font-black leading-none tracking-tight text-white sm:text-8xl">
      {children}
    </p>
  );
}

function Caption({ children }) {
  return <p className="mt-5 text-lg font-medium text-white/90">{children}</p>;
}

function SplitBar({ a, b }) {
  // Two-person share bar. `a`/`b` = { name, color, share, messages }.
  const aPct = Math.round(a.share * 100);
  const bPct = 100 - aPct;
  return (
    <div className="w-full">
      <div className="flex h-12 w-full overflow-hidden rounded-full ring-2 ring-white/20">
        <div
          className="flex items-center justify-start pl-3"
          style={{ width: `${Math.max(aPct, 6)}%`, background: a.color }}
        >
          <span className="tnum text-sm font-bold text-white drop-shadow">{aPct}%</span>
        </div>
        <div
          className="flex items-center justify-end pr-3"
          style={{ width: `${Math.max(bPct, 6)}%`, background: b.color }}
        >
          <span className="tnum text-sm font-bold text-white drop-shadow">{bPct}%</span>
        </div>
      </div>
      <div className="mt-3 flex justify-between text-sm font-semibold text-white">
        <span className="truncate">{a.name}</span>
        <span className="truncate">{b.name}</span>
      </div>
    </div>
  );
}

/* ---------- 1. Intro ---------- */

export function IntroCard({ stats }) {
  const names = stats.participants.map((p) => p.name);
  const who =
    names.length === 2
      ? `${names[0]} & ${names[1]}`
      : names.length > 2
        ? `${names[0]}, ${names[1]} & ${names.length - 2} more`
        : names[0] || 'this chat';
  return (
    <>
      <p className="text-2xl font-bold text-white/90">Your chat with</p>
      <h1 className="mt-3 text-balance text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl">
        {who}
      </h1>
      <Caption>Let&apos;s unwrap the story.</Caption>
    </>
  );
}

/* ---------- 2. Total messages + date range ---------- */

export function TotalsCard({ stats }) {
  const { dateRange } = stats;
  return (
    <>
      <p className="text-xl font-bold text-white/90">You sent</p>
      <BigStat>{formatNumber(stats.totalMessages)}</BigStat>
      <p className="mt-3 text-2xl font-bold text-white">messages</p>
      <Caption>
        across {formatNumber(dateRange.days)} days
        <br />
        {formatDateRange(dateRange.start, dateRange.end)}
      </Caption>
      <p className="mt-4 text-base font-medium text-white/80">
        That&apos;s {formatNumber(stats.totalWords)} words between you.
      </p>
    </>
  );
}

/* ---------- 3. Who sent more / top texter ---------- */

export function WhoSentMoreCard({ stats }) {
  if (stats.isGroup) {
    const leader = stats.participants[0];
    return (
      <>
        <p className="text-xl font-bold text-white/90">Top texter</p>
        <h2 className="mt-3 text-balance text-5xl font-black leading-tight text-white">
          {leader?.name}
        </h2>
        <Caption>
          {formatNumber(leader?.messages || 0)} messages · {Math.round((leader?.share || 0) * 100)}%
          of the chat
        </Caption>
        <div className="mt-7 w-full">
          <Leaderboard items={stats.detailed} formatValue={formatNumber} />
          <OthersRow others={stats.others} formatValue={formatNumber} />
        </div>
      </>
    );
  }

  if (!stats.whoSentMore) {
    return (
      <>
        <p className="text-2xl font-bold text-white/90">It&apos;s a perfect tie</p>
        <Caption>Neither of you could stop texting.</Caption>
      </>
    );
  }

  const a = stats.participants[0];
  const b = stats.participants[1];
  return (
    <>
      <p className="text-xl font-bold text-white/90">Who texted more?</p>
      <h2 className="mt-3 text-5xl font-black leading-tight text-white">
        {stats.whoSentMore.name}
      </h2>
      <Caption>sent {Math.round(stats.whoSentMore.share * 100)}% of all messages</Caption>
      <div className="mt-8 w-full">{a && b ? <SplitBar a={a} b={b} /> : null}</div>
    </>
  );
}

/* ---------- 4. Busiest hour ---------- */

export function BusiestHourCard({ stats }) {
  const { busiestHour } = stats;
  const data = busiestHour.distribution.map((v, h) => ({
    label: h % 6 === 0 ? String(h) : '',
    value: v,
  }));
  const hr = busiestHour.hour;
  const label = `${((hr + 11) % 12) + 1}${hr < 12 ? 'am' : 'pm'}`;
  return (
    <>
      <p className="text-xl font-bold text-white/90">Peak texting hour</p>
      <BigStat>{label}</BigStat>
      <Caption>{formatNumber(busiestHour.count)} messages at this hour</Caption>
      <div className="mt-8 w-full">
        <BarChart data={data} highlightIndex={hr} />
      </div>
    </>
  );
}

/* ---------- 5. Busiest day ---------- */

export function BusiestDayCard({ stats }) {
  const { busiestDay } = stats;
  const data = busiestDay.distribution.map((v, d) => ({ label: DAY_LABELS[d], value: v }));
  return (
    <>
      <p className="text-xl font-bold text-white/90">Your favorite day</p>
      <h2 className="mt-2 text-5xl font-black leading-tight text-white">
        {DAY_LABELS[busiestDay.day]}
      </h2>
      <Caption>
        {formatNumber(busiestDay.count)} messages on {DAY_LABELS[busiestDay.day]}s
      </Caption>
      <div className="mt-8 w-full">
        <BarChart data={data} highlightIndex={busiestDay.day} />
      </div>
    </>
  );
}

/* ---------- 6. Longest streak ---------- */

export function StreakCard({ stats }) {
  const { longestStreak } = stats;
  return (
    <>
      <p className="text-xl font-bold text-white/90">Longest streak</p>
      <BigStat>{formatNumber(longestStreak.days)}</BigStat>
      <p className="mt-3 text-2xl font-bold text-white">days in a row</p>
      <Caption>
        {longestStreak.start && longestStreak.end
          ? formatDateRange(longestStreak.start, longestStreak.end)
          : 'Not a single day skipped.'}
      </Caption>
    </>
  );
}

/* ---------- 7. Response time ---------- */

export function ResponseTimeCard({ stats }) {
  const rows = stats.responseTimes.filter((r) => r.medianMs != null);
  return (
    <>
      <p className="text-xl font-bold text-white/90">Reply speed</p>
      <h2 className="mt-2 text-4xl font-black leading-tight text-white">Median reply time</h2>
      <div className="mt-8 flex w-full flex-col gap-3">
        {rows.length === 0 ? (
          <Caption>Not enough back-and-forth to measure.</Caption>
        ) : (
          rows.map((r) => (
            <div
              key={r.name}
              className="flex items-center justify-between rounded-2xl bg-white/12 px-5 py-4"
            >
              <span className="truncate text-base font-semibold text-white">{r.name}</span>
              <span className="tnum text-xl font-black text-white">{r.label}</span>
            </div>
          ))
        )}
      </div>
    </>
  );
}

/* ---------- 8. Who texts first ---------- */

export function FirstTextCard({ stats }) {
  const { firstText } = stats;
  const rows = firstText.perPerson || [];
  return (
    <>
      <p className="text-xl font-bold text-white/90">Who texts first?</p>
      {firstText.leader ? (
        <>
          <h2 className="mt-3 text-5xl font-black leading-tight text-white">{firstText.leader}</h2>
          <Caption>starts the conversation most often</Caption>
        </>
      ) : (
        <Caption>You both reach out about equally.</Caption>
      )}
      <div className="mt-8 w-full">
        <BarChart
          data={rows.map((r) => ({ label: r.name.slice(0, 6), value: r.count }))}
          horizontal
          highlightIndex={rows.findIndex((r) => r.name === firstText.leader)}
        />
      </div>
    </>
  );
}

/* ---------- 9. Top words ---------- */

export function TopWordsCard({ stats }) {
  const overall = stats.topWords.overall || [];
  const perPerson = stats.topWords.perPerson || [];
  return (
    <>
      <p className="text-xl font-bold text-white/90">Most-used words</p>
      {perPerson.length >= 2 && !stats.isGroup ? (
        <div className="mt-6 grid w-full grid-cols-2 gap-4">
          {perPerson.slice(0, 2).map((person) => (
            <div key={person.name} className="text-left">
              <p className="mb-2 truncate text-sm font-bold uppercase tracking-wide text-white/80">
                {person.name}
              </p>
              <ol className="flex flex-col gap-1">
                {person.words.slice(0, 8).map((w, i) => (
                  <li key={w.word} className="flex items-baseline gap-2 text-white">
                    <span className="tnum w-4 text-xs text-white/55">{i + 1}</span>
                    <span className="truncate text-sm font-semibold">{w.word}</span>
                  </li>
                ))}
              </ol>
            </div>
          ))}
        </div>
      ) : (
        <ol className="mt-6 flex w-full flex-col gap-2">
          {overall.map((w, i) => (
            <li key={w.word} className="flex items-center gap-3 rounded-xl bg-white/12 px-4 py-2.5">
              <span className="tnum w-5 text-sm font-bold text-white/60">{i + 1}</span>
              <span className="flex-1 truncate text-left text-base font-semibold text-white">
                {w.word}
              </span>
              <span className="tnum text-sm font-bold text-white/85">{formatNumber(w.count)}</span>
            </li>
          ))}
        </ol>
      )}
    </>
  );
}

/* ---------- 10. Top emojis ---------- */

export function TopEmojisCard({ stats }) {
  const overall = stats.topEmojis.overall || [];
  const top = overall[0];
  return (
    <>
      <p className="text-xl font-bold text-white/90">Your top emoji</p>
      {top ? (
        <>
          <p className="mt-4 text-8xl leading-none">{top.emoji}</p>
          <Caption>used {formatNumber(top.count)} times</Caption>
        </>
      ) : (
        <Caption>No emojis here — straight shooters.</Caption>
      )}
      {overall.length > 1 ? (
        <div className="mt-7 flex w-full flex-wrap justify-center gap-3">
          {overall.slice(1, 9).map((e) => (
            <div
              key={e.emoji}
              className="flex items-center gap-1.5 rounded-full bg-white/12 px-3 py-1.5"
            >
              <span className="text-xl">{e.emoji}</span>
              <span className="tnum text-xs font-bold text-white/85">{formatNumber(e.count)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </>
  );
}

/* ---------- 11. Highlights (longest message + most in one day) ---------- */

export function HighlightsCard({ stats }) {
  const { longestMessage, mostInOneDay } = stats;
  return (
    <>
      <p className="text-xl font-bold text-white/90">Highlights</p>
      {longestMessage ? (
        <div className="mt-5 w-full rounded-2xl bg-white/12 p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">
            Longest message · {formatNumber(longestMessage.length)} chars
          </p>
          <p className="mt-2 line-clamp-4 text-sm font-medium italic text-white">
            &ldquo;{longestMessage.text}&rdquo;
          </p>
          <p className="mt-2 text-xs font-semibold text-white/70">— {longestMessage.sender}</p>
        </div>
      ) : null}
      {mostInOneDay ? (
        <div className="mt-4 w-full rounded-2xl bg-white/12 p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-white/70">
            Busiest single day
          </p>
          <p className="tnum mt-1 text-3xl font-black text-white">
            {formatNumber(mostInOneDay.count)} messages
          </p>
        </div>
      ) : null}
    </>
  );
}

/* ---------- 12. Extras (silence + double texts + peak month) ---------- */

export function ExtrasCard({ stats }) {
  const { longestSilence, doubleTexts, peakMonth } = stats;
  return (
    <>
      <p className="text-xl font-bold text-white/90">A few more things</p>
      <div className="mt-6 flex w-full flex-col gap-3">
        {longestSilence ? (
          <div className="rounded-2xl bg-white/12 p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">
              Longest silence
            </p>
            <p className="tnum mt-1 text-3xl font-black text-white">{longestSilence.label}</p>
          </div>
        ) : null}
        {peakMonth ? (
          <div className="rounded-2xl bg-white/12 p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">Peak month</p>
            <p className="mt-1 text-2xl font-black text-white">{peakMonth.label}</p>
            <p className="tnum text-sm font-semibold text-white/75">
              {formatNumber(peakMonth.count)} messages
            </p>
          </div>
        ) : null}
        {doubleTexts && doubleTexts.length > 0 ? (
          <div className="rounded-2xl bg-white/12 p-5 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-white/70">
              Double-texter champ
            </p>
            <p className="mt-1 text-2xl font-black text-white">{doubleTexts[0].name}</p>
            <p className="tnum text-sm font-semibold text-white/75">
              {formatNumber(doubleTexts[0].count)} double texts
            </p>
          </div>
        ) : null}
      </div>
    </>
  );
}

/* ---------- 13. Vibe ---------- */

export function VibeCard({ stats }) {
  return (
    <>
      <p className="text-xl font-bold uppercase tracking-[0.2em] text-white/80">Your chat vibe</p>
      <h2 className="mt-4 text-balance text-5xl font-black leading-tight tracking-tight text-white sm:text-6xl">
        {stats.vibe.title}
      </h2>
      <Caption>{stats.vibe.subtitle}</Caption>
    </>
  );
}

export { SplitBar, BigStat, Caption };
