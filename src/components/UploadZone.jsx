// Drag-and-drop + click-to-pick file input. Reads a .txt export entirely in the
// browser via FileReader (never uploaded). .zip is detected and the user is
// nudged to unzip — we deliberately avoid adding a zip dependency.

import { useRef, useState } from 'react';

export default function UploadZone({ onChat }) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState('');

  function handleFile(file) {
    if (!file) return;
    setError('');
    const name = (file.name || '').toLowerCase();

    if (name.endsWith('.zip')) {
      setError(
        'That looks like a .zip. Unzip it first, then drop the _chat.txt / .txt file inside.'
      );
      return;
    }
    // Accept .txt or any text/* — WhatsApp exports are plain text.
    const looksText = name.endsWith('.txt') || file.type.startsWith('text');
    if (!looksText) {
      setError('Please choose the exported .txt chat file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => onChat(String(reader.result || ''));
    reader.onerror = () => setError("Couldn't read that file. Try exporting again.");
    reader.readAsText(file);
  }

  function onDrop(e) {
    e.preventDefault();
    setDragging(false);
    const file = e.dataTransfer?.files?.[0];
    handleFile(file);
  }

  return (
    <div className="w-full">
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
        className={`flex w-full flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed px-6 py-12 transition-colors ${
          dragging
            ? 'border-wa-green bg-wa-green/10'
            : 'border-iron bg-carbon hover:border-wa-green/70 hover:bg-graphite'
        }`}
      >
        <span className="text-4xl" aria-hidden>
          📂
        </span>
        <span className="text-lg font-bold text-white">
          {dragging ? 'Drop it here' : 'Drop your chat .txt here'}
        </span>
        <span className="text-sm font-medium text-mist">or tap to choose a file</span>
        <input
          ref={inputRef}
          type="file"
          accept=".txt,text/plain"
          className="hidden"
          onChange={(e) => handleFile(e.target.files?.[0])}
        />
      </button>

      {error ? (
        <p className="mt-3 text-center text-sm font-semibold text-rose-400">{error}</p>
      ) : null}
    </div>
  );
}
