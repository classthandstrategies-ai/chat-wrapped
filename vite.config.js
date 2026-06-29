import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

// Vite config doubles as the Vitest config (via vitest/config).
// Parser/stats tests run in a plain Node environment — no DOM needed.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    environment: 'node',
    include: ['src/**/*.test.{js,jsx}'],
  },
});
