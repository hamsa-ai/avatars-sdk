import {defineConfig} from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    coverage: {
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['**/*.d.ts', '**/*.test.{ts,tsx}', '**/__tests__/**'],
      provider: 'v8',
      reporter: ['html', 'lcov', 'text'],
      all: true,
    },
    environment: 'jsdom',
    globals: true,
  },
});
