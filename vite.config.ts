// vite.config.ts

import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import WindiCSS from 'vite-plugin-windicss'; // Import plugin Windi CSS

export default defineConfig({
  plugins: [
    react(),
    WindiCSS(), // Tambahkan plugin Windi CSS ke dalam array plugin
  ],
});
