// Landing / hero screen. Bold title, one-line export instructions, a loud
// privacy promise, the UploadZone, and two demo buttons.

import UploadZone from './UploadZone.jsx';

export default function Landing({ onChat, onDemo }) {
  return (
    <main className="min-h-dscreen flex w-full flex-col items-center justify-center bg-void px-6 py-12">
      <div className="w-full max-w-lg">
        {/* Hero */}
        <div className="animate-rise text-center">
          <p className="text-sm font-bold uppercase tracking-[0.3em] text-wa-green">
            100% in your browser
          </p>
          <h1 className="mt-4 text-6xl font-black leading-none tracking-tight text-white sm:text-7xl">
            Chat
            <br />
            <span className="bg-gradient-to-r from-wa-green to-spotify-green bg-clip-text text-transparent">
              Wrapped
            </span>
          </h1>
          <p className="mx-auto mt-5 max-w-md text-lg font-medium text-mist">
            Turn your WhatsApp chat export into a Spotify-Wrapped-style story.
          </p>
        </div>

        {/* Upload */}
        <div className="animate-rise-slow mt-10">
          <UploadZone onChat={onChat} />
        </div>

        {/* Demo buttons */}
        <div className="animate-rise-slow mt-4 flex flex-col gap-3 sm:flex-row">
          <button
            type="button"
            onClick={() => onDemo('single')}
            className="flex-1 rounded-2xl bg-wa-green px-5 py-3.5 text-base font-bold text-void transition-transform hover:scale-[1.02] active:scale-95"
          >
            Try with sample chat
          </button>
          <button
            type="button"
            onClick={() => onDemo('group')}
            className="flex-1 rounded-2xl border border-iron bg-carbon px-5 py-3.5 text-base font-bold text-white transition-colors hover:border-wa-green/70 hover:bg-graphite"
          >
            Try a group chat
          </button>
        </div>

        {/* Export instructions */}
        <div className="animate-rise-slow mt-10 rounded-2xl border border-iron bg-carbon p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-fog">How to export</p>
          <p className="mt-2 text-sm leading-relaxed text-bone">
            WhatsApp &rsaquo; open a chat &rsaquo; <span className="text-white">⋮</span> &rsaquo;{' '}
            <span className="text-white">More</span> &rsaquo;{' '}
            <span className="text-white">Export chat</span> &rsaquo;{' '}
            <span className="text-white">Without Media</span> &rsaquo; share the{' '}
            <span className="text-white">.txt</span> to yourself, then drop it above.
          </p>
        </div>

        {/* Privacy promise */}
        <p className="animate-rise-slow mt-6 text-center text-sm font-semibold text-wa-green">
          Nothing is uploaded anywhere — this runs entirely in your browser.
        </p>
      </div>
    </main>
  );
}
