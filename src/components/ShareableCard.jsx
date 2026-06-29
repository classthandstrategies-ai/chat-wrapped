// Clean, standalone shareable summary rendered at fixed pixel dimensions so
// html-to-image produces crisp, predictable output. Two formats:
//   story  → 1080 x 1920 (9:16, IG/WA status)
//   square → 1080 x 1080 (1:1, feed)
//
// Styled like a Wrapped card: near-black base, a hero gradient header, wa-green
// accents, big tabular numbers. Inline styles (not Tailwind) for everything
// size/layout-critical so the export doesn't depend on class resolution timing.

import { forwardRef } from 'react';
import { formatNumber, formatDateRange } from '../lib/format.js';
import { gradientFor } from '../lib/theme.js';

const ACCENT = '#1ed760';

function Stat({ label, value, accent }) {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 6,
        padding: '24px 28px',
        borderRadius: 24,
        background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.08)',
      }}
    >
      <span
        style={{
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: '0.12em',
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.55)',
        }}
      >
        {label}
      </span>
      <span
        style={{
          fontSize: 46,
          fontWeight: 900,
          lineHeight: 1.05,
          color: accent ? ACCENT : '#ffffff',
          fontVariantNumeric: 'tabular-nums',
        }}
      >
        {value}
      </span>
    </div>
  );
}

const ShareableCard = forwardRef(function ShareableCard({ stats, format = 'story' }, ref) {
  const isStory = format === 'story';
  const width = 1080;
  const height = isStory ? 1920 : 1080;

  const participants = stats.participants || [];
  const names = participants.map((p) => p.name);
  const title =
    names.length === 2
      ? `${names[0]} & ${names[1]}`
      : names.length > 2
        ? `${names[0]} + ${names.length - 1} others`
        : names[0] || 'My Chat';

  const topTexter = stats.isGroup
    ? participants[0]?.name
    : stats.whoSentMore
      ? stats.whoSentMore.name
      : 'Perfectly tied';

  const hr = stats.busiestHour?.hour ?? 0;
  const hourLabel = `${((hr + 11) % 12) + 1}${hr < 12 ? 'am' : 'pm'}`;
  const topEmoji = stats.topEmojis?.overall?.[0]?.emoji || '—';

  return (
    <div
      ref={ref}
      style={{
        width,
        height,
        display: 'flex',
        flexDirection: 'column',
        background: '#000000',
        color: '#ffffff',
        fontFamily:
          "'Inter', ui-sans-serif, system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      {/* Hero header on a vibrant gradient */}
      <div
        style={{
          background: gradientFor(0),
          padding: isStory ? '90px 72px 64px' : '56px 64px 44px',
          display: 'flex',
          flexDirection: 'column',
          gap: 14,
        }}
      >
        <span
          style={{
            fontSize: 26,
            fontWeight: 800,
            letterSpacing: '0.32em',
            textTransform: 'uppercase',
            color: 'rgba(255,255,255,0.85)',
          }}
        >
          Chat Wrapped
        </span>
        <span style={{ fontSize: isStory ? 78 : 60, fontWeight: 900, lineHeight: 1.04 }}>
          {title}
        </span>
        <span style={{ fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>
          {stats.dateRange ? formatDateRange(stats.dateRange.start, stats.dateRange.end) : ''}
        </span>
      </div>

      {/* Stat grid */}
      <div
        style={{
          flex: 1,
          padding: isStory ? '64px 72px' : '40px 64px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: isStory ? 28 : 20,
          alignContent: isStory ? 'start' : 'center',
        }}
      >
        <Stat label="Messages" value={formatNumber(stats.totalMessages)} accent />
        <Stat label="Words" value={formatNumber(stats.totalWords)} />
        <Stat label={stats.isGroup ? 'Top texter' : 'Sent more'} value={topTexter} />
        <Stat label="Peak hour" value={hourLabel} />
        <Stat label="Longest streak" value={`${formatNumber(stats.longestStreak?.days || 0)}d`} />
        <Stat label="Top emoji" value={topEmoji} />
      </div>

      {/* Vibe footer */}
      <div
        style={{
          padding: isStory ? '0 72px 96px' : '0 64px 56px',
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
        }}
      >
        <span
          style={{
            fontSize: 22,
            fontWeight: 700,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: ACCENT,
          }}
        >
          Our vibe
        </span>
        <span style={{ fontSize: isStory ? 56 : 44, fontWeight: 900, lineHeight: 1.05 }}>
          {stats.vibe?.title || ''}
        </span>
        <span style={{ fontSize: 26, fontWeight: 500, color: 'rgba(255,255,255,0.75)' }}>
          {stats.vibe?.subtitle || ''}
        </span>
      </div>
    </div>
  );
});

export default ShareableCard;
