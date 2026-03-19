import js from '@eslint/js'
import globals from 'globals'
import tseslint from 'typescript-eslint'
import nextPlugin from 'eslint-config-next'

export default [
  { ignores: ['dist', 'node_modules', '.next'] },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  // eslint-config-next v16+는 배열을 반환하며 react-hooks 플러그인 포함
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
    // react-hooks 플러그인은 eslint-config-next에서 이미 등록 — 중복 등록 금지
    rules: {
      '@typescript-eslint/no-namespace': 'off',
      '@typescript-eslint/no-explicit-any': 'warn',
      '@typescript-eslint/no-unused-vars': 'warn',
      'no-unused-vars': 'off',
      'no-useless-escape': 'off',
      'prefer-const': 'warn',
      'prefer-rest-params': 'off',
      'prefer-spread': 'off',
      'no-unused-expressions': 'off',
      'no-case-declarations': 'off',
      '@typescript-eslint/no-unused-expressions': 'off',
      'no-useless-catch': 'off',
      'no-irregular-whitespace': 'off',
      'no-undef': 'off',
      '@next/next/no-img-element': 'off',
      // i18n 로케일 파일은 anonymous default export 패턴 사용
      'import/no-anonymous-default-export': 'off',
    },
  },
]
