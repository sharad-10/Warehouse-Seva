// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    files: ['src/components/Rack.tsx', 'src/components/Stick.tsx', 'src/components/warehouse/**/*.tsx'],
    rules: {
      'react/no-unknown-property': 'off',
    },
  },
]);
