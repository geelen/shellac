export default {
  preset: 'ts-jest/presets/default-esm', // or other ESM presets
  testEnvironment: 'node',
  extensionsToTreatAsEsm: ['.ts'],
  globals: {
    'ts-jest': {
      useESM: true,
    },
  },
}
