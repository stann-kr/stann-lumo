# 변경 이력

---

## [Unreleased] — 2026-03-17

### Phase 3: Next.js 15 App Router 이주 (완료)

#### 추가

- `next.config.ts`: Next.js 설정 (standalone 출력)
- `app/layout.tsx`: Root layout (Server Component, metadata + hydration script)
- `app/Providers.tsx`: Client 측 I18nextProvider + LanguageProvider + ContentProvider
- `app/globals.css`: 전역 CSS (src/index.css → app/globals.css)
- `app/not-found.tsx`: 404 페이지 래퍼
- `app/(public)/layout.tsx`: 공개 페이지 그룹 — TerminalLayout 래핑
- `app/(public)/(page).tsx`: 공개 6개 페이지 라우트 래퍼 (/, /about, /music, /events, /contact, /link)
- `app/admin/page.tsx`: 어드민 로그인 래퍼
- `app/admin/(dashboard)/layout.tsx`: ProtectedRoute + AdminLayout 그룹 레이아웃
- `app/admin/(dashboard)/(page).tsx`: 어드민 7개 페이지 라우트 래퍼
- `app/api/auth/login/route.ts`: 인증 Route Handler (ADMIN_PASSWORD 서버사이드 검증)
- `postcss.config.js`: Next.js 호환 PostCSS 설정 (CJS)

#### 수정

- `package.json`: next@15 추가, vite/react-router-dom/unplugin-auto-import/eslint-plugin-react-refresh 제거
- `tsconfig.json`: jsx: preserve, plugins: next, app/ include — Next.js 호환 tsconfig로 대체
- `docker-compose.yml`: .next 익명 볼륨 추가, 환경변수 VITE_ → NEXT_PUBLIC_ 전환
- `.env.example`: VITE_ 접두사 제거, ADMIN_PASSWORD 서버사이드 전용
- `.gitignore`: .next/ 추가
- `tailwind.config.ts`: app/**/*.{ts,tsx} content 경로 추가
- `eslint.config.ts`: autoImportGlobals, react-refresh, route-element-jsx 제거
- `src/i18n/local/index.ts`: import.meta.glob → 정적 import (en, ko)
- `src/constants/site.ts`: VITE_TERMINAL_URL → NEXT_PUBLIC_TERMINAL_URL
- `src/contexts/LanguageContext.tsx`: SSR 가드 (typeof window === 'undefined')
- `src/contexts/ContentContext.tsx`: SSR 가드 (typeof window === 'undefined')
- `src/components/feature/TerminalLayout.tsx`: useNavigate/useLocation → useRouter/usePathname (next/navigation), 'use client' 추가
- `src/components/feature/AdminLayout.tsx`: useNavigate/useLocation → useRouter/usePathname, 'use client' 추가
- `src/components/feature/ProtectedRoute.tsx`: Navigate → useRouter + useEffect, 'use client' 추가
- `src/pages/admin/login/page.tsx`: VITE_ADMIN_PASSWORD 제거 → /api/auth/login Route Handler 호출
- `src/pages/NotFound.tsx`: useLocation → usePathname (next/navigation), 'use client' 추가
- `src/pages/contact/page.tsx`: VITE_FORM_ENDPOINT → NEXT_PUBLIC_FORM_ENDPOINT
- `src/pages/home/page.tsx`: Link to= → Link href= (next/link), 'use client' 추가

#### 삭제

- `vite.config.ts`, `index.html`, `vite-env.d.ts`, `tsconfig.app.json`, `tsconfig.node.json`, `postcss.config.ts`, `auto-imports.d.ts`
- `src/router/` (전체), `src/App.tsx`, `src/main.tsx`

---

## [Unreleased] — 2026-03-17

### Phase 1: 인프라 기반 정비

#### 추가

- `Dockerfile`: Node 22 Alpine, `platform: linux/arm64` 명시
- `docker-compose.yml`: `web` 서비스, port 3000, 볼륨 마운트 + `node_modules` 익명 볼륨
- `.dockerignore`: `node_modules`, `out`, `.git`, `.DS_Store` 제외
- `.gitignore`: `node_modules/`, `out/`, `.env`, `.DS_Store`, `auto-imports.d.ts` 등 추가
- `.env.example`: 환경 변수 템플릿 생성
- `.docs/` 문서 폴더: README, CHANGE_LOG, TROUBLESHOOTING, REQUIREMENTS, TECH_SPEC

### Phase 2: 코드 정리 및 품질 개선

#### 제거

- `package.json`: 미사용 의존성 제거 (`firebase`, `@supabase/supabase-js`, `@stripe/react-stripe-js`, `recharts`, `lucide-react`)
- `src/utils/validation.ts`: 미사용 파일 삭제
- `src/components/base/SectionHeader.tsx`: 미사용 파일 삭제
- `src/components/base/LanguageTab.tsx`: 미사용 파일 삭제

#### 수정

- `src/utils/raApi.ts`: `RAEvent` → `RAEventXML` 타입 불일치 수정, `userid`/`djid` → `userId`/`djId` camelCase 통일
- `src/types/admin.ts`: `AdminFormReturn`, `ListEditorReturn`, `DeleteConfirmReturn` 인터페이스 실제 hook 반환값과 일치하도록 갱신
- `src/router/index.ts`: `window.REACT_APP_NAVIGATE` 전역 패턴 제거
- `src/router/config.tsx`: `withSuspense` 헬퍼 제거 → 각 라우트에 `<Suspense>` 인라인 적용, `PageFallback`/`ProtectedRoute` 별도 파일 분리
- `src/components/feature/PageLayout.tsx`: 미사용 `currentView` prop 제거
- `src/pages/admin/login/page.tsx`: 하드코딩 색상 → CSS 변수, 비밀번호 → `VITE_ADMIN_PASSWORD` 환경변수
- `src/pages/admin/theme/page.tsx`: 미사용 `saved` 상태 제거 → `useSaveNotification` + `SuccessMessage` 통일
- `src/pages/NotFound.tsx`: Tailwind 기본 색상 → CSS 커스텀 프로퍼티 전환
- `src/pages/contact/page.tsx`: 하드코딩 폼 엔드포인트 → `VITE_FORM_ENDPOINT` 환경변수 전환
- `src/components/feature/TerminalLayout.tsx`: 하드코딩 브랜드 텍스트/URL → 환경변수/상수 분리
- `src/components/base/DeleteConfirmModal.tsx`: 한국어 하드코딩 → i18n 키 전환
- `src/components/base/ListItemEditor.tsx`: 한국어 하드코딩 → i18n 키 전환
- `src/utils/colorMix.ts`: 미사용 `COLOR_VARS` import 제거
- `src/contexts/ContentContext.tsx`: 미사용 타입 import 제거, fast-refresh eslint-disable 주석 추가
- `src/contexts/LanguageContext.tsx`: fast-refresh eslint-disable 주석 추가
- `src/i18n/local/index.ts`: 중국어 주석 → 한국어 전환
- `tsconfig.app.json`: `"strict": true` 활성화
- `eslint.config.ts`: `no-explicit-any`, `no-unused-vars`, `prefer-const` → `'warn'` 전환

#### 파일 추가

- `src/components/feature/PageFallback.tsx`: 라우트 로딩 폴백 컴포넌트 분리
- `src/components/feature/ProtectedRoute.tsx`: 어드민 인증 가드 컴포넌트 분리
- `src/constants/site.ts`: 사이트 브랜드 상수 (`SITE_NAME`, `SITE_TAGLINE`, `SITE_VERSION`, `TERMINAL_URL`)

#### 검증

- `npm run type-check`: 타입 에러 0개
- `npm run lint`: 경고/에러 0개
- Docker 개발 서버 (`localhost:3000`) 정상 실행 확인
