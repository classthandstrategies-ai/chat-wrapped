// PNG export helpers built on html-to-image.
//
// We render a fixed-pixel ShareableCard node to a high-DPI PNG entirely in the
// browser (no upload). cacheBust avoids stale data: URIs when re-rendering, and
// pixelRatio: 2 keeps text crisp on retina + social uploads.

import { toPng } from 'html-to-image';

/** Render a DOM node to a PNG data URL. Returns null on failure. */
export async function renderCardPng(node) {
  if (!node) return null;
  try {
    return await toPng(node, {
      pixelRatio: 2,
      cacheBust: true,
      // Force a solid base so transparent corners don't pick up the page.
      backgroundColor: '#000000',
    });
  } catch (err) {
    // Swallow + surface so callers can show a friendly message instead of crashing.
    console.error('renderCardPng failed', err);
    return null;
  }
}

/**
 * Render `node` to a PNG and trigger a browser download.
 * Returns true on success, false if rendering failed.
 */
export async function downloadCardPng(node, filename = 'chat-wrapped.png') {
  const dataUrl = await renderCardPng(node);
  if (!dataUrl) return false;
  try {
    const link = document.createElement('a');
    link.download = filename;
    link.href = dataUrl;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    return true;
  } catch (err) {
    console.error('downloadCardPng failed', err);
    return false;
  }
}
