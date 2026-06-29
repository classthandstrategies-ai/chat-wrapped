// Pure-CSS bar chart (no chart lib). Bars are flex divs whose length is a % of
// the max value; growth is animated via inline transform + the grow-bar idea.
//
// Designed to sit on a vibrant gradient: bars are translucent white, the
// highlighted bar is solid white, and labels/values use white text.

export default function BarChart({ data, highlightIndex = -1, horizontal = false }) {
  const max = Math.max(1, ...data.map((d) => d.value));

  if (horizontal) {
    return (
      <div className="flex w-full flex-col gap-2.5">
        {data.map((d, i) => {
          const pct = (d.value / max) * 100;
          const active = i === highlightIndex;
          return (
            <div key={d.label} className="flex items-center gap-3">
              <span className="w-10 shrink-0 text-right text-xs font-semibold text-white/80">
                {d.label}
              </span>
              <div className="relative h-7 flex-1 overflow-hidden rounded-full bg-white/15">
                <div
                  className="h-full origin-left rounded-full transition-transform"
                  style={{
                    width: `${pct}%`,
                    background: active ? d.color || '#ffffff' : 'rgba(255,255,255,0.55)',
                    animation: 'grow-bar 0.9s cubic-bezier(0.22,1,0.36,1) both',
                  }}
                />
              </div>
              <span className="tnum w-12 shrink-0 text-left text-xs font-bold text-white">
                {d.value}
              </span>
            </div>
          );
        })}
      </div>
    );
  }

  // Vertical bars (e.g. 24h / 7d distributions).
  return (
    <div className="flex h-44 w-full items-end justify-between gap-[3px]">
      {data.map((d, i) => {
        const pct = (d.value / max) * 100;
        const active = i === highlightIndex;
        return (
          <div key={d.label + i} className="flex flex-1 flex-col items-center justify-end gap-1.5">
            <div className="flex w-full flex-1 items-end">
              <div
                className="w-full origin-bottom rounded-t-md"
                style={{
                  height: `${Math.max(pct, 2)}%`,
                  background: active ? d.color || '#ffffff' : 'rgba(255,255,255,0.45)',
                  animation: 'grow-bar-y 0.9s cubic-bezier(0.22,1,0.36,1) both',
                }}
              />
            </div>
            <span className={`text-[9px] font-semibold ${active ? 'text-white' : 'text-white/65'}`}>
              {d.label}
            </span>
          </div>
        );
      })}
      {/* Vertical growth keyframe is defined locally since index.css only ships
          the horizontal (scaleX) one. */}
      <style>{`@keyframes grow-bar-y { from { transform: scaleY(0); } to { transform: scaleY(1); } }`}</style>
    </div>
  );
}
