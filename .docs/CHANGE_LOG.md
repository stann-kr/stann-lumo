# 변경 이력

---

## [Unreleased] — 2026-03-18 (기타 개선: i18n + 세션 만료 처리)

### events/page.tsx i18n 전환
- `개의 이벤트를 가져왔습니다` → `t('events_sync_success') + 카운트`
- `RA API 호출 중 오류가 발생했습니다` → `t('events_sync_error')`
- `공연 일정 및 이벤트 관리` → `t('admin_events_subtitle')`

### 어드민 세션 만료 처리
- `ProtectedRoute.tsx`: 5분 주기 세션 재검증 (`setInterval`)
  - 초기 마운트: 세션 유효성 확인 (기존 동작 유지)
  - 이후 5분마다: `/api/auth/session` 재검증 → 만료/실패 시 `/admin` 리다이렉트

---

## [Unreleased] — 2026-03-18 (Phase 4-e + 어드민 페이지 D1 API 연동)

### Phase 4-e: 데이터 마이그레이션 라우트
- `src/app/api/admin/migrate/route.ts` — `POST /api/admin/migrate`
  - `MultiLanguageContent` JSON 수신 → 전체 테이블 초기화 + D1 재삽입
  - batch 90개 청크 분할 실행 (D1 100개 제한 대응)

### 어드민 페이지 D1 API 연동
- 6개 어드민 페이지 `saveChanges` / `handleSave`: `adminService` 호출 + `Promise.allSettled` 패턴
  - home: `updateHomeSections` + `updatePageMeta` + `updateTerminalInfo`
  - about: `updateArtistInfo` + `updateAboutSections` (useAdminForm `handleSave` 교체)
  - music: `updateTracks` + `updatePageMeta`
  - events: `updatePerformances` + `updatePageMeta`
  - contact: `updateContactInfo` + `updateEventsInfo` + `updatePageMeta`
  - link: `updateLinkPlatforms` + `updatePageMeta` + `updateTerminalInfo`
- `adminService.ts`: `updateTerminalInfo()` 추가 (site-config 조회 후 terminal 필드만 갱신)
- `useAdminForm` / `AdminFormReturn`: 제네릭 제약 `Record<string, unknown>` → `object` 완화

---

## [Unreleased] — 2026-03-18 (Phase 4-b/c/d: D1 콘텐츠 API + 서비스 계층 + ContentContext 전환)

### D1 콘텐츠 API 구현 (Phase 4-b)

#### 공개 API
- `src/app/api/content/[lang]/route.ts` — `GET`: D1 16테이블 batch 조회 → `ContentData` 반환
  - DB 미사용 환경: 503 반환 (ContentContext 기본값 폴백)

#### 어드민 CRUD API (모두 `requireAdminSession()` 적용)
- `src/app/api/admin/artist-info/route.ts` — `GET` / `PUT`
- `src/app/api/admin/about-sections/route.ts` — `GET` / `PUT` (3테이블 batch)
- `src/app/api/admin/page-meta/route.ts` — `GET` / `PUT`
- `src/app/api/admin/home-sections/route.ts` — `GET` / `PUT`
- `src/app/api/admin/tracks/route.ts` — `GET` / `PUT`
- `src/app/api/admin/performances/route.ts` — `GET` / `PUT` (lang 무관)
- `src/app/api/admin/events-info/route.ts` — `GET` / `PUT` (3테이블 batch)
- `src/app/api/admin/link-platforms/route.ts` — `GET` / `PUT`
- `src/app/api/admin/contact-info/route.ts` — `GET` / `PUT`
- `src/app/api/admin/theme/route.ts` — `GET` / `PUT` (단일행 UPDATE)
- `src/app/api/admin/site-config/route.ts` — `GET` / `PUT` (단일행 UPDATE)

### 서비스 계층 구현 (Phase 4-c)
- `src/services/apiClient.ts` — fetch 래퍼 (`apiGet` / `apiPut` / `apiPost`)
- `src/services/contentService.ts` — `fetchContent(lang)`
- `src/services/adminService.ts` — 어드민 API 전체 CRUD 함수
- `src/services/authService.ts` — `login` / `logout` / `checkSession`

### ContentContext API 전환 (Phase 4-d)
- `src/contexts/ContentContext.tsx`: localStorage 제거 → `contentService.fetchContent()` 호출
  - 마운트 시 en/ko 병렬 fetch → 성공 시 D1 데이터 적용, 실패 시 기본값 유지
  - `migrateContent()` / `loadFromStorage()` 제거
  - `updateContent()` 인메모리 업데이트 유지 (어드민 즉시 UI 반영용)

---

## [Unreleased] — 2026-03-18 (동적 섹션 시스템 + 페이지 메타 커스텀)

### 동적 섹션 시스템 및 페이지 메타 커스텀 구현

#### 타입 변경 (`src/types/content.ts`)
- `Biography`, `DesignPhilosophy` 인터페이스 제거
- `DynamicSectionType`, `DynamicSection` 타입 추가 — About 섹션 동적 관리
- `HomePageMeta`, `MusicPageMeta`, `EventsPageMeta`, `ContactPageMeta`, `LinkPageMeta`, `PageMeta` 타입 추가
- `ContentData`: `biography`/`musicalPhilosophy`/`designPhilosophy` 제거 → `aboutSections: DynamicSection[]`, `pageMeta: PageMeta` 추가

#### 콘텍스트 변경 (`src/contexts/ContentContext.tsx`)
- EN/KO 기본값: `aboutSections` 3개 (bio/musical-phil/design-phil) + `pageMeta` 전체 추가
- `migrateContent`: 구형 biography/musicalPhilosophy/designPhilosophy → `aboutSections` 자동 변환
- `pageMeta` 누락 키 deep merge 처리

#### 공개 페이지
- `about/page.tsx`: `order` 기준 정렬 후 `DynamicSection` 동적 렌더링 (paragraphs / philosophy-items)
- `page.tsx`: `pageMeta.home.navTitle` 적용 (i18n fallback 유지)
- `music/page.tsx`: `pageMeta.music.title/subtitle` 적용
- `events/page.tsx`: `pageMeta.events.title/subtitle/upcomingTitle/pastTitle` 적용
- `contact/page.tsx`: `pageMeta.contact.title/subtitle/guestbookTitle/directTitle/bookingTitle` 적용
- `link/page.tsx`: `pageMeta.link.title/subtitle/terminalTitle` 적용

#### 어드민 페이지
- `admin/about/page.tsx`: 완전 재작성 — ADD SECTION 드롭다운, 섹션 타입/타이틀 변경, ↑↓ 순서 변경, DELETE (최소 1개 유지)
- `admin/home/page.tsx`: PAGE SETTINGS 카드 (navTitle)
- `admin/music/page.tsx`: PAGE SETTINGS 카드 (title, subtitle)
- `admin/events/page.tsx`: PAGE SETTINGS 카드 (title, subtitle, upcomingTitle, pastTitle)
- `admin/contact/page.tsx`: PAGE SETTINGS 카드 (title, subtitle, guestbookTitle, directTitle, bookingTitle)
- `admin/link/page.tsx`: PAGE SETTINGS 카드 (title, subtitle, terminalTitle)

#### D1 마이그레이션
- `migrations/0002_dynamic_content.sql`: `about_sections`, `about_section_paragraphs`, `about_section_philosophy_items`, `page_meta` 테이블 신규

---

## [Unreleased] — 2026-03-18

### Hydration 오류 수정

#### 수정

- `src/app/layout.tsx`: `<html suppressHydrationWarning>` — inline 스크립트의 CSS 변수 주입으로 인한 hydration 불일치 억제
- `src/contexts/LanguageContext.tsx`: `useState` 초기값 `'en'` 고정 → `useEffect`에서 localStorage 복원 (SSR/CSR 불일치 해소)
- `src/contexts/ContentContext.tsx`: `useState` 초기값 `defaultMultiLanguageContent` 고정 → `useEffect`에서 `loadFromStorage()` 호출. `migrateContent` 함수 모듈 수준으로 추출

---

## [Unreleased] — 2026-03-17 (Phase 4-a Cloudflare 기반)

### Phase 4-a: Cloudflare 인프라 기반 구축

#### 추가

- `wrangler.json`: Cloudflare Workers 설정 — D1(`DB`), R2(`MEDIA`) 바인딩, `nodejs_compat` 플래그
- `open-next.config.ts`: `@opennextjs/cloudflare` 어댑터 설정 (`cloudflare-node` wrapper, `edge` converter)
- `migrations/0001_initial_schema.sql`: D1 전체 스키마 (콘텐츠 12개 + 인증 + 미디어 테이블)
- `src/lib/db.ts`: CF Workers/Node.js 이중 환경 D1·R2 바인딩 헬퍼 (`getDB`, `getR2`, `getEnv`)
- `src/lib/auth.ts`: D1 기반 세션 관리 (`createSession`, `validateSession`, `deleteSession`, `buildSessionCookieHeader`)
- `src/lib/adminAuth.ts`: Route Handler 세션 인증 미들웨어 (`requireAdminSession`)
- `src/app/api/auth/login/route.ts`: `POST` — 비밀번호 검증 → 세션 쿠키 발급
- `src/app/api/auth/logout/route.ts`: `POST` — 세션 삭제
- `src/app/api/auth/session/route.ts`: `GET` — 세션 유효성 확인

#### 수정

- `package.json`: `@opennextjs/cloudflare`, `wrangler`, `@cloudflare/workers-types` devDependencies 추가
- `docker-compose.yml`: `CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN` 환경변수 추가
- `.env.example`: Cloudflare 관련 변수 추가
- `eslint.config.ts`: `no-require-imports` 규칙 조정 (dynamic require 허용)

---

## [Unreleased] — 2026-03-17 (Phase 4)

### Phase 4: 빌드 오류 수정 + 파일 구조 정리 (완료)

#### 추가

- `src/app/global-error.tsx`: 루트 레이아웃 에러 바운더리 (App Router, `<html>/<body>` 포함)
- `src/components/home/TypingText.tsx`: 터미널 타이핑 애니메이션 컴포넌트 (이동)
- `src/components/home/CursorGlow.tsx`: 마우스 커서 글로우 효과 컴포넌트 (이동)
- `src/components/home/LiveClock.tsx`: 서울 시간 실시간 시계 컴포넌트 (이동)

#### 수정

- `src/app/layout.tsx`: `export const dynamic = 'force-dynamic'` 추가 — 정적 사전 렌더링 비활성화
- `src/app/not-found.tsx`: Server Component로 전환, `export const dynamic = 'force-dynamic'` 추가
- `src/components/feature/TerminalLayout.tsx`: 미사용 `Link` import 제거, home 서브컴포넌트 경로 갱신
- `src/components/feature/PageLayout.tsx`: TypingText import 경로 갱신
- `src/lib/db.ts`: eslint-disable 주석 정비
- `package.json`: build 스크립트에 `NODE_ENV=production` 명시 (Docker 환경 영향 차단)
- `src/app/(public)/page.tsx` ~ `src/app/admin/(dashboard)/music/page.tsx`: `src/views/` 컴포넌트 직접 이관

#### 삭제

- `src/views/` (전체) — thin wrapper 이중 레이어 제거

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
