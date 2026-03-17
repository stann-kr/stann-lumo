import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'

export default [
  { ignores: ['dist', 'node_modules', '.next'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        NodeJS: 'readonly',
        JSX: 'readonly',
      },
    },
    plugins: {
      'react-hooks': reactHooks,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off', // @typescript-eslint/no-unused-vars 사용
      'no-useless-escape': 'off',
      'prefer-const': 'warn',
      'prefer-rest-params': 'off',
      'prefer-spread': 'off',
      'no-unused-expressions': 'off',
      'no-case-declarations': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-useless-catch': 'off',
      'no-irregular-whitespace': 'off',
      'no-undef': 'error',
    },
  },
]
