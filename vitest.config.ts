import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    fileParallelism: false,
    testTimeout: 10000,
    hookTimeout: 15000,
    sequence: { hooks: 'stack' },
    projects: [
      { extends: true, test: { name: 'unit', include: ['src/**/*.spec.ts'] } },
      { extends: true, test: { name: 'db', include: ['tests/**/*.spec.ts'] } },
    ],
  },
})
