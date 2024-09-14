import js from '@eslint/js';
import globals from 'globals';
import prettier from 'eslint-plugin-prettier/recommended';

export default [
  js.configs.recommended,
  prettier,
  {
    rules: {
      semi: ['warn', 'always'],
    },
    languageOptions: {
      globals: {
        ...globals.browser,
      },
    },
  },
];
