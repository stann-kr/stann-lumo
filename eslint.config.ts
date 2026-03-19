import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import tseslint from 'typescript-eslint'
import nextPlugin from 'eslint-config-next'

export default [
  { ignores: ['dist', 'node_modules', '.next'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // eslint-config-next v16+는 배열을 반환할 수 있으므로 스프레드 처리
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ...(Array.isArray(nextPlugin) ? nextPlugin : [nextPlugin]) as any[],
  {
    files: ['src/**/*.{ts,tsx}', 'app/**/*.{ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2020,
      globals: {
        ...globals.browser,
        ...globals.node,
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
      'no-undef': 'off', // TypeScript가 타입 체크 담당 — ESLint no-undef는 TS 프로젝트에서 불필요
      '@next/next/no-img-element': 'off', // @next/next 플러그인 미설치 환경 대응
    },
  },
]
