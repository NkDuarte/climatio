import path from 'node:path';
import { defineConfig } from 'vite';

export default defineConfig(({ command }) => ({
  resolve: {
    alias: {
      '@environment': path.resolve(
        __dirname,
        command === 'build'
          ? 'src/config/environment.prod.js'
          : 'src/config/environment.js'
      )
    }
  },
  test: {
    environment: 'happy-dom',
    include: ['src/**/*.test.js']
  }
}));
