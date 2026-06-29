// Full-screen story slide. Each card paints its own vibrant gradient so the
// background visibly shifts as you scroll-snap — the signature Wrapped effect.

export default function StoryCard({ gradient, index, kicker, footer, children }) {
  return (
    <section
      className="snap-card h-dscreen w-full shrink-0 overflow-hidden"
      style={{ background: gradient }}
      data-card-index={index}
    >
      <div className="relative flex h-full w-full flex-col items-center justify-center px-7 py-16 text-center">
        {/* Soft top vignette keeps the kicker legible over bright gradients. */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/10 via-transparent to-black/20" />

        {kicker ? (
          <p className="animate-rise relative z-10 mb-6 text-xs font-bold uppercase tracking-[0.28em] text-white/80">
            {kicker}
          </p>
        ) : null}

        <div className="animate-rise relative z-10 flex w-full max-w-md flex-1 flex-col items-center justify-center">
          {children}
        </div>

        {footer ? (
          <p className="animate-rise relative z-10 mt-6 max-w-xs text-sm font-medium text-white/85">
            {footer}
          </p>
        ) : null}

        {/* Persistent watermark — ties every slide back to the app. */}
        <p className="absolute bottom-5 left-0 right-0 z-10 text-center text-[11px] font-semibold uppercase tracking-[0.3em] text-white/55">
          Chat Wrapped
        </p>
      </div>
    </section>
  );
}
