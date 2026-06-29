// Visual theme helpers — the "Wrapped" palette.
//
// Each story card gets its own vibrant gradient so the background visibly
// shifts as you scroll (the signature Spotify-Wrapped effect). Sender accent
// colors are assigned by participant index and reused everywhere that person
// appears (bars, leaderboards, names) so the chat reads consistently.

/** Bold full-bleed gradients, assigned per card in order. */
export const CARD_GRADIENTS = [
  'linear-gradient(160deg, #1ed760 0%, #0a7d3b 100%)', // wrapped green
  'linear-gradient(160deg, #8b5cf6 0%, #d946ef 100%)', // violet → fuchsia
  'linear-gradient(160deg, #f59e0b 0%, #ef4444 100%)', // amber → red
  'linear-gradient(160deg, #06b6d4 0%, #3b82f6 100%)', // cyan → blue
  'linear-gradient(160deg, #ec4899 0%, #8b5cf6 100%)', // pink → violet
  'linear-gradient(160deg, #25d366 0%, #128c4a 100%)', // whatsapp green
  'linear-gradient(160deg, #f43f5e 0%, #f59e0b 100%)', // rose → amber
  'linear-gradient(160deg, #3b82f6 0%, #6366f1 100%)', // blue → indigo
  'linear-gradient(160deg, #14b8a6 0%, #22c55e 100%)', // teal → green
  'linear-gradient(160deg, #a855f7 0%, #ec4899 100%)', // purple → pink
  'linear-gradient(160deg, #fb7185 0%, #c026d3 100%)', // coral → magenta
  'linear-gradient(160deg, #0ea5e9 0%, #14b8a6 100%)', // sky → teal
  'linear-gradient(160deg, #f97316 0%, #db2777 100%)', // orange → pink
  'linear-gradient(160deg, #84cc16 0%, #16a34a 100%)', // lime → green
  'linear-gradient(160deg, #6366f1 0%, #0ea5e9 100%)', // indigo → sky
];

/** Per-participant accent colors (WhatsApp green leads). */
export const SENDER_COLORS = [
  '#25d366', // green
  '#8b5cf6', // violet
  '#f59e0b', // amber
  '#06b6d4', // cyan
  '#ec4899', // pink
  '#f43f5e', // rose
  '#3b82f6', // blue
  '#14b8a6', // teal
  '#a855f7', // purple
  '#84cc16', // lime
];

export function gradientFor(index) {
  return CARD_GRADIENTS[index % CARD_GRADIENTS.length];
}

export function senderColor(index) {
  return SENDER_COLORS[index % SENDER_COLORS.length];
}

/**
 * Build a stable name → color map for a chat's participants, ordered by the
 * order they're given (callers pass participants sorted by message count).
 */
export function buildSenderColorMap(participants) {
  const map = {};
  participants.forEach((name, i) => {
    map[name] = senderColor(i);
  });
  return map;
}
