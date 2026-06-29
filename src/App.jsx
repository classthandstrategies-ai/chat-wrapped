// App state machine: landing → (parse + compute) → report, with an error state
// when parsing yields zero messages. Raw chat text lives in memory only and is
// dropped on restart; the only fetches are the bundled demo files in /public.

import { useState } from 'react';
import Landing from './components/Landing.jsx';
import WrappedReport from './components/WrappedReport.jsx';
import { parseChat } from './lib/parser.js';
import { computeStats } from './lib/stats.js';

export default function App() {
  const [phase, setPhase] = useState('landing'); // 'landing' | 'report' | 'error'
  const [stats, setStats] = useState(null);
  const [errorMsg, setErrorMsg] = useState('');

  // Parse raw text → stats, flipping into the right phase. All failure modes
  // (throws or zero messages) land in the friendly error state.
  function ingest(rawText) {
    try {
      const parsed = parseChat(rawText);
      if (!parsed || !parsed.ok || parsed.messages.length === 0) {
        setErrorMsg(
          "We couldn't find any messages in that file. Make sure it's the .txt you exported from WhatsApp."
        );
        setPhase('error');
        return;
      }
      const computed = computeStats(parsed);
      setStats(computed);
      setPhase('report');
    } catch (err) {
      console.error('Failed to process chat', err);
      setErrorMsg('Something went wrong reading that chat. Try a different export.');
      setPhase('error');
    }
  }

  // Load a bundled demo chat from /public (the only network read we ever make).
  async function loadDemo(which) {
    const file = which === 'group' ? '/sample-group-chat.txt' : '/sample-chat.txt';
    try {
      const res = await fetch(file);
      if (!res.ok) throw new Error(`fetch ${file} → ${res.status}`);
      const text = await res.text();
      ingest(text);
    } catch (err) {
      console.error('Failed to load demo', err);
      setErrorMsg("Couldn't load the sample chat. Try uploading your own export instead.");
      setPhase('error');
    }
  }

  function restart() {
    setStats(null);
    setErrorMsg('');
    setPhase('landing');
  }

  if (phase === 'report' && stats) {
    return <WrappedReport stats={stats} onRestart={restart} />;
  }

  if (phase === 'error') {
    return <ErrorScreen message={errorMsg} onRetry={restart} onDemo={loadDemo} />;
  }

  return <Landing onChat={ingest} onDemo={loadDemo} />;
}

/* ---------- Friendly error state ---------- */

function ErrorScreen({ message, onRetry, onDemo }) {
  return (
    <main className="min-h-dscreen flex w-full flex-col items-center justify-center bg-void px-6 py-12">
      <div className="w-full max-w-md text-center">
        <span className="text-5xl" aria-hidden>
          🤔
        </span>
        <h1 className="mt-5 text-3xl font-black text-white">Hmm, that didn&apos;t work</h1>
        <p className="mt-3 text-base font-medium text-mist">{message}</p>

        <div className="mt-7 rounded-2xl border border-iron bg-carbon p-5 text-left">
          <p className="text-xs font-bold uppercase tracking-wide text-fog">How to export</p>
          <p className="mt-2 text-sm leading-relaxed text-bone">
            WhatsApp &rsaquo; open a chat &rsaquo; <span className="text-white">⋮</span> &rsaquo;{' '}
            <span className="text-white">More</span> &rsaquo;{' '}
            <span className="text-white">Export chat</span> &rsaquo;{' '}
            <span className="text-white">Without Media</span>. Share the{' '}
            <span className="text-white">.txt</span> to yourself and upload it. If you got a{' '}
            <span className="text-white">.zip</span>, unzip it first.
          </p>
        </div>

        <div className="mt-6 flex flex-col gap-3">
          <button
            type="button"
            onClick={onRetry}
            className="rounded-2xl bg-wa-green px-5 py-3.5 text-base font-bold text-void transition-transform hover:scale-[1.02] active:scale-95"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => onDemo('single')}
            className="rounded-2xl border border-iron bg-carbon px-5 py-3.5 text-base font-bold text-white transition-colors hover:border-wa-green/70 hover:bg-graphite"
          >
            Use a sample chat instead
          </button>
        </div>
      </div>
    </main>
  );
}
