/// <reference types="vitest" />
import { defineConfig, mergeConfig } from 'vite';
import viteConfig from './vite.config';

export default mergeConfig(viteConfig, defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test-setup.ts'],
    server: {
      deps: {
        inline: ['@mui/material', '@mui/icons-material', '@emotion/react', '@emotion/styled', 'mui-tel-input', 'react-transition-group', '@mui/x-date-pickers'],
      },
    },
  },
}));
