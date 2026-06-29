// The scrollable Wrapped story: a snap container of full-screen StoryCards built
// from the Stats object, plus side progress dots, a floating restart button, and
// a final summary slide that renders the ShareableCard with a format toggle and
// PNG download.

import { useEffect, useRef, useState } from 'react';
import StoryCard from './StoryCard.jsx';
import ShareableCard from './ShareableCard.jsx';
import { downloadCardPng } from '../lib/shareCard.js';
import { gradientFor } from '../lib/theme.js';
import {
  IntroCard,
  TotalsCard,
  WhoSentMoreCard,
  BusiestHourCard,
  BusiestDayCard,
  StreakCard,
  ResponseTimeCard,
  FirstTextCard,
  TopWordsCard,
  TopEmojisCard,
  HighlightsCard,
  ExtrasCard,
  VibeCard,
} from './cards.jsx';

// Each entry → one story slide. Kicker rides above the card content.
const CARD_DEFS = [
  { key: 'intro', kicker: null, Comp: IntroCard },
  { key: 'totals', kicker: 'The numbers', Comp: TotalsCard },
  { key: 'who', kicker: 'Head to head', Comp: WhoSentMoreCard },
  { key: 'hour', kicker: 'Time of day', Comp: BusiestHourCard },
  { key: 'day', kicker: 'Day of week', Comp: BusiestDayCard },
  { key: 'streak', kicker: 'Consistency', Comp: StreakCard },
  { key: 'response', kicker: 'Reply speed', Comp: ResponseTimeCard },
  { key: 'first', kicker: 'First move', Comp: FirstTextCard },
  { key: 'words', kicker: 'Vocabulary', Comp: TopWordsCard },
  { key: 'emojis', kicker: 'Emoji energy', Comp: TopEmojisCard },
  { key: 'highlights', kicker: 'Highlights', Comp: HighlightsCard },
  { key: 'extras', kicker: 'Odds & ends', Comp: ExtrasCard },
  { key: 'vibe', kicker: 'The verdict', Comp: VibeCard },
];

export default function WrappedReport({ stats, onRestart }) {
  const scrollerRef = useRef(null);
  const [active, setActive] = useState(0);
  const totalCards = CARD_DEFS.length + 1; // +1 for the final summary slide

  // Track which card fills the viewport for the progress dots.
  useEffect(() => {
    const scroller = scrollerRef.current;
    if (!scroller) return;
    const cards = Array.from(scroller.querySelectorAll('[data-card-index]'));
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const idx = Number(entry.target.getAttribute('data-card-index'));
            setActive(idx);
          }
        });
      },
      { root: scroller, threshold: 0.6 }
    );
    cards.forEach((c) => observer.observe(c));
    return () => observer.disconnect();
  }, [stats]);

  function goTo(idx) {
    const scroller = scrollerRef.current;
    const target = scroller?.querySelector(`[data-card-index="${idx}"]`);
    target?.scrollIntoView({ behavior: 'smooth' });
  }

  return (
    <div className="relative h-dscreen w-full bg-void">
      {/* Restart (upload another) */}
      <button
        type="button"
        onClick={onRestart}
        className="fixed right-4 top-4 z-30 rounded-full bg-black/40 px-4 py-2 text-xs font-bold text-white backdrop-blur-md transition-colors hover:bg-black/60"
      >
        ↺ New chat
      </button>

      {/* Progress dots */}
      <div className="fixed right-3 top-1/2 z-30 flex -translate-y-1/2 flex-col gap-2">
        {Array.from({ length: totalCards }).map((_, i) => (
          <button
            key={i}
            type="button"
            aria-label={`Go to card ${i + 1}`}
            onClick={() => goTo(i)}
            className={`h-2 w-2 rounded-full transition-all ${
              i === active ? 'scale-125 bg-white' : 'bg-white/35 hover:bg-white/60'
            }`}
          />
        ))}
      </div>

      {/* Story scroller */}
      <div ref={scrollerRef} className="snap-story no-scrollbar h-dscreen w-full overflow-y-scroll">
        {CARD_DEFS.map((def, i) => {
          const { Comp } = def;
          return (
            <StoryCard key={def.key} gradient={gradientFor(i)} index={i} kicker={def.kicker}>
              <Comp stats={stats} />
            </StoryCard>
          );
        })}

        {/* Final summary slide */}
        <FinalCard stats={stats} index={CARD_DEFS.length} onRestart={onRestart} />
      </div>
    </div>
  );
}

/* ---------- Final summary + share ---------- */

function FinalCard({ stats, index, onRestart }) {
  const cardRef = useRef(null);
  const [format, setFormat] = useState('story'); // 'story' | 'square'
  const [busy, setBusy] = useState(false);
  const [failed, setFailed] = useState(false);

  async function handleDownload() {
    if (busy) return;
    setBusy(true);
    setFailed(false);
    const ok = await downloadCardPng(cardRef.current, `chat-wrapped-${format}.png`);
    if (!ok) setFailed(true);
    setBusy(false);
  }

  return (
    <section
      className="snap-card min-h-dscreen w-full shrink-0 bg-void"
      style={{ background: gradientFor(index) }}
      data-card-index={index}
    >
      <div className="flex min-h-dscreen w-full flex-col items-center justify-center gap-6 px-6 py-14">
        <p className="animate-rise text-xs font-bold uppercase tracking-[0.28em] text-white/80">
          That&apos;s a wrap
        </p>

        {/* Live preview — scaled down so the 1080px card fits the screen.
            We export the unscaled clone via the ref. */}
        <div className="animate-rise relative">
          <div
            style={{
              width: format === 'story' ? 270 : 320,
              height: format === 'story' ? 480 : 320,
              overflow: 'hidden',
              borderRadius: 18,
              boxShadow: '0 24px 60px rgba(0,0,0,0.45)',
            }}
          >
            <div
              style={{
                transform: `scale(${format === 'story' ? 270 / 1080 : 320 / 1080})`,
                transformOrigin: 'top left',
                width: 1080,
              }}
            >
              <ShareableCard ref={cardRef} stats={stats} format={format} />
            </div>
          </div>
        </div>

        {/* Format toggle */}
        <div className="animate-rise flex gap-2 rounded-full bg-black/25 p-1 backdrop-blur-sm">
          {[
            ['story', 'Story 9:16'],
            ['square', 'Square 1:1'],
          ].map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setFormat(val)}
              className={`rounded-full px-4 py-2 text-sm font-bold transition-colors ${
                format === val ? 'bg-white text-void' : 'text-white/80 hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Actions */}
        <div className="animate-rise flex w-full max-w-xs flex-col gap-3">
          <button
            type="button"
            onClick={handleDownload}
            disabled={busy}
            className="rounded-2xl bg-white px-5 py-3.5 text-base font-bold text-void transition-transform hover:scale-[1.02] active:scale-95 disabled:opacity-60"
          >
            {busy ? 'Rendering…' : '↓ Download PNG'}
          </button>
          <button
            type="button"
            onClick={onRestart}
            className="rounded-2xl border border-white/40 px-5 py-3 text-base font-bold text-white transition-colors hover:bg-white/10"
          >
            Start over
          </button>
          {failed ? (
            <p className="text-center text-sm font-semibold text-white">
              Couldn&apos;t render the image. Try again.
            </p>
          ) : null}
        </div>

        <p className="absolute bottom-5 left-0 right-0 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">
          Chat Wrapped
        </p>
      </div>
    </section>
  );
}
