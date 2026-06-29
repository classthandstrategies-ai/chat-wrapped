// Ranked participant list with colored dots. Used in group chats to show the
// top texters plus a condensed "and N others" tail. Reads well on a gradient.

export default function Leaderboard({ items, valueKey = 'messages', formatValue }) {
  const fmt = formatValue || ((v) => v);
  return (
    <ul className="flex w-full flex-col gap-2.5">
      {items.map((p, i) => (
        <li
          key={p.name}
          className="flex items-center gap-3 rounded-2xl bg-white/12 px-4 py-3 backdrop-blur-sm"
        >
          <span className="tnum w-5 shrink-0 text-sm font-bold text-white/70">{i + 1}</span>
          <span
            className="h-3 w-3 shrink-0 rounded-full ring-2 ring-white/25"
            style={{ background: p.color }}
          />
          <span className="flex-1 truncate text-left text-sm font-semibold text-white">
            {p.name}
          </span>
          <span className="tnum text-sm font-bold text-white">{fmt(p[valueKey])}</span>
          {typeof p.share === 'number' ? (
            <span className="tnum w-12 shrink-0 text-right text-xs font-medium text-white/70">
              {Math.round(p.share * 100)}%
            </span>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

/** Compact summary row for the participants that didn't make the top list. */
export function OthersRow({ others, valueKey = 'messages', formatValue }) {
  if (!others || others.length === 0) return null;
  const fmt = formatValue || ((v) => v);
  const total = others.reduce((sum, p) => sum + (p[valueKey] || 0), 0);
  return (
    <div className="mt-2 flex items-center justify-between rounded-2xl bg-white/8 px-4 py-3 text-sm">
      <span className="font-medium text-white/75">and {others.length} others</span>
      <span className="tnum font-bold text-white/90">{fmt(total)}</span>
    </div>
  );
}
