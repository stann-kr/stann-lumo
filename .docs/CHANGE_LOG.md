# 변경 이력

---

## [Unreleased] — 2026-03-20 (iOS 모바일 개선 + 갤러리 힌트 라벨 수정)

### iOS 안전영역 배경색 수정
- `app/globals.css` — `body { background-color: var(--color-bg) }` 추가 → 노치/홈 인디케이터 영역이 앱 배경색과 일치
- `app/layout.tsx` — `<meta name="viewport" content="...viewport-fit=cover">` 추가, `<meta name="theme-color">` DB 테마값으로 동적 주입
- `components/feature/TerminalLayout.tsx` — 모바일 헤더에 `padding-top: env(safe-area-inset-top)` 적용
- `app/globals.css` — `.mobile-header-offset` 클래스 추가: 모바일 `calc(4rem + env(safe-area-inset-top))`, 데스크톱(lg) `0`

### 페이지 타이틀 상단 여백 축소
- `components/feature/PageLayout.tsx` — `py-8` → `pt-4 pb-8 md:pt-8` (모바일 상단 여백 절반 축소)

### 로고 클릭 → Home 이동
- `components/feature/TerminalLayout.tsx`
  - 데스크톱 사이드바 `<h1>` → `<Link href="/">` 전환
  - 모바일 헤더 `<h1>` → `<Link href="/">` 전환

### 갤러리 상세 키보드 힌트 라벨 수정
- `(public)/gallery/[id]/page.tsx`
  - `t('gallery_navigate')` / `t('gallery_back')` — 키 미존재 시 키 문자열 그대로 반환(truthy) → `||` 폴백 미동작 문제 수정
  - `t('back')` 동일 문제 수정
  - 모두 하드코딩 문자열(`NAVIGATE`, `BACK TO GALLERY`)로 교체

---

## [Unreleased] — 2026-03-20 (Link 어드민 아이콘 선택 UI + 갤러리 상세 페이지 수정)

### Link 어드민 아이콘 선택 UI
- `admin/link/page.tsx`
  - ICON CLASS 텍스트 입력 → 아이콘 선택 팝업으로 교체 (Contact 페이지와 동일한 UX 패턴)
  - `AVAILABLE_ICONS` 31종 정의: SoundCloud·Spotify·YouTube·Instagram·X·TikTok·Bandcamp·Mixcloud·Discord·RA 등 플랫폼 특화
  - 현재 선택 아이콘 미리보기 + 이름 표시, 6열 그리드 팝업, 선택 시 팝업 자동 닫힘

### 갤러리 상세 페이지 수정 3건
- `(public)/gallery/[id]/page.tsx`
  - 키보드 힌트 하단 i18n 키 노출(`gallery_navigate`, `gallery_back`) → 하드코딩 문자열로 교체
  - 페이지 타이틀에 파일명(IMG_5392.PNG 등) 노출 → `caption > altText > GALLERY N` 폴백으로 변경
  - 카테고리 뱃지 추가: PHOTO / YOUTUBE / VIDEO / EVENT + 대응 remixicon

---

## [Unreleased] — 2026-03-20 (크리티컬 버그 3건 + Events-Gallery 개선 + 갤러리 상세 페이지)

### 갤러리 상세 페이지 신규 구현
- `(public)/gallery/[id]/page.tsx` (신규)
  - `/api/gallery` 전체 목록 조회로 이전/다음 사진 네비게이션 지원
  - 키보드 단축키: `←` 이전, `→` 다음, `ESC` 목록으로
  - 미디어 오버레이 화살표 (호버 시 좌우 그라디언트 + 화살표 표시)
  - 하단 이전/다음 버튼 + 캡션 + VIEW EVENT 링크 (linkedEventId 있을 때)
  - YouTube embed / video_file / 이미지 미디어 타입 분기 렌더링
- `(public)/gallery/page.tsx`
  - Lightbox 팝업 제거 → `router.push('/gallery/${photo.id}')` 페이지 전환으로 교체
  - `selectedPhoto`, `closeLightbox`, ESC 핸들러 등 Lightbox 관련 로직 전체 제거

### Events 어드민 수정
- `admin/events/page.tsx`
  - TITLE `FormInput` 누락 → 추가 (미입력 시 "New Performance"로만 표시되던 버그 수정)
  - 이벤트 카드 좌측에 포스터 썸네일(`w-20 h-20`) 표시 추가
  - Status 옵션 변경: `Confirmed→Announced`, `Pending→TBA`
  - 신규 이벤트 기본 status: `'Pending' → 'TBA'`
  - DB 구 값(`Confirmed`/`Pending`) 로드 시 자동 정규화 처리

### Events 공개 페이지 포스터 표시
- `(public)/events/page.tsx`
  - 이벤트 카드 좌측에 포스터 썸네일(`w-12 h-12`) 추가 (posterImageId 있을 때만 표시)
  - 카드 레이아웃 `flex items-center gap-4` 구조로 변경

### 이벤트 상세 → 사이드바 활성 상태 유지
- `components/feature/TerminalLayout.tsx`
  - 네비게이션 활성 판정: `pathname === item.path` → `pathname.startsWith(item.path + '/')` 확장
  - `/events/[id]` 방문 시 사이드바 EVENTS 항목 하이라이트 유지

### Performance Status 네이밍 변경
- `types/content.ts` — `'Confirmed' | 'Pending' | 'Cancelled'` → `'Announced' | 'TBA' | 'Cancelled'`
- `utils/raApi.ts` — `convertRAEventsToPerformances`: `status: 'Confirmed'` → `status: 'Announced'`
- `contexts/ContentContext.tsx` — 기본값 performances 4건 status `"Confirmed"` → `"Announced"` 변경
- `migrations/0008_performance_status_rename.sql` (신규)
  - CREATE/INSERT CASE/DROP/RENAME 패턴으로 테이블 재생성 (CHECK 제약 우회)
  - `Confirmed→Announced`, `Pending→TBA` 값 마이그레이션
  - status 컬럼 `TEXT NOT NULL DEFAULT 'Announced'` (CHECK 제약 없음 — 향후 값 추가 시 마이그레이션 불필요)

### 테마 색상 플래시 방지 (첫 방문 포함)
- `app/layout.tsx`
  - async 서버 컴포넌트로 전환
  - D1 `theme_colors` 직접 조회 → `<style>` 태그로 CSS 변수 SSR 주입 (JS 실행 전 적용)
  - DB 미사용/오류 환경 → 기본 테마값 폴백
- `contexts/ContentContext.tsx`
  - API 응답 후 `localStorage.setItem('stann_content_multilang', ...)` 저장
  - 다음 방문 시 layout.tsx 인라인 스크립트가 즉시 테마 덮어쓰기 가능하도록

### 홈 방문 시 로딩 플래시 방지
- `contexts/ContentContext.tsx`
  - `setAllContent(next)` + `setIsLoading(false)` 동일 `.then()` 내 배치 처리 → 기본 데이터 중간 렌더 차단
- `components/feature/TerminalLayout.tsx`
  - 사이드바 아티스트명: isLoading 중 `opacity-0` 처리 → 기본값 플래시 방지
  - 모바일 헤더 아티스트명: isLoading 중 빈 문자열 처리

### Contact 게스트북 섹션 비표시
- `(public)/contact/page.tsx`
  - 게스트북 폼 전체 JSX 주석(`{/* */}`)으로 비표시 처리
  - 폼 로직(handleSubmit, state, imports)은 `//` 주석으로 보존
  - Direct Contact 섹션이 첫 번째 visible 섹션으로 승격

### 빌드 오류 수정
- `(public)/events/[id]/page.tsx` — `setIsLoading(true)` useEffect 동기 호출 제거 (`react-hooks/set-state-in-effect`)
- `admin/events/page.tsx` — `setPerformances((prev) => ...)` functional updater → 직접 참조 `performances.map(...)` (useListEditor 타입 불일치)
- `utils/raApi.ts` — `status: 'Confirmed'` → `'Announced'` (Performance type union 변경 반영 누락)

---

## [Unreleased] — 2026-03-20 (추가 개선: 갤러리 이벤트 연결 완성 + Contact 섹션 정리)

### Contact 게스트북 섹션 비표시 처리
- `(public)/contact/page.tsx`
  - 게스트북 폼 및 COMING SOON 플레이스홀더 전체를 JSX 주석(`{/* */}`)으로 감싸 비표시 처리
  - 폼 로직(`handleSubmit`, state, JSX)은 코드 주석으로 보존 → 메일링 서비스 연결 시 주석 해제만으로 즉시 활성화 가능
  - Direct Contact 섹션이 첫 번째 visible 섹션이 되어 `border-t` / `pt-8` 제거, 게스트북 활성화 시 재추가 안내 TODO 주석 포함

### Events 포스터 선택 사항 표시
- `admin/events/page.tsx` — POSTER IMAGE 라벨에 "(선택)" 표시 추가

---

## [Unreleased] — 2026-03-20 (갤러리-이벤트 연결 누락 사항 수정)

### API 수정
- `api/admin/gallery/route.ts` — GET: `linked_event_id` 응답 포함 / PUT: `linked_event_id` DB 저장 추가
- `api/admin/gallery/youtube/route.ts` — 요청 바디에 `linkedEventId?` 추가, INSERT + 응답 반영
- `api/content/[lang]/route.ts` — PerformanceRow에 `poster_image_id` 추가, performances 매핑에 `posterImageId` 포함

### 어드민 UI
- `admin/gallery/page.tsx`
  - `Performance[]` state + fetch 추가 (`/api/admin/performances`)
  - `EventSelect` 공통 컴포넌트 추가 (이벤트 선택 드롭다운)
  - YouTube 추가 폼에 LINKED EVENT 선택 드롭다운 추가
  - 각 사진 카드에 LINKED EVENT 선택 드롭다운 추가

---

## [Unreleased] — 2026-03-20 (Terminal Info 커스텀 강화)

### DB 마이그레이션
- `migrations/0007_terminal_info_extended.sql`
  - `terminal_custom_fields` 테이블 신규 생성 (id/field_key/field_value/field_type/sort_order)
  - `site_config`에 터미널 스타일 5개 컬럼 추가 (font_size/animation_speed/prompt_text/show_embed/embed_height)

### 타입 확장
- `types/content.ts`
  - `TerminalCustomField` 인터페이스 추가
  - `TerminalStyleConfig` 인터페이스 추가
  - `TerminalInfo`에 `customFields?`, `style?` 필드 추가

### API 추가/확장
- `api/admin/terminal-config/route.ts` (신규) — GET/PUT 터미널 통합 설정
- `api/content/[lang]/route.ts` — `terminal_custom_fields` 배치 쿼리 + 스타일 컬럼 포함
- `services/adminService.ts` — `fetchTerminalConfig()`, `updateTerminalConfig()` 추가

### 어드민 UI
- `admin/home/page.tsx` — TERMINAL INFO 섹션 확장:
  1. 기존 URL/Description 유지
  2. STYLE OPTIONS — 폰트 크기, 애니메이션 속도, 프롬프트 텍스트, 임베드 토글 + 높이
  3. 임베드 미리보기 인라인 토글 (관리자 페이지 내 iframe 프리뷰)
  4. CUSTOM FIELDS — 추가/삭제/순서 이동, 타입 선택 (text/url/badge)
  5. saveChanges → `updateTerminalConfig` API 통합 호출

### 공개 페이지
- `(public)/page.tsx` — Terminal Info 섹션 확장:
  - 커스텀 필드 그리드 표시 (text/url/badge 타입별 렌더링)
  - `showEmbed: true` 시 iframe 임베드 렌더링

---

## [Unreleased] — 2026-03-20 (버그 수정 3건 + Events-Gallery 연결 + 이벤트 상세 페이지)

### Bug 1: 어드민 Artist Name 입력 불가 수정
- `admin/home/page.tsx` — `setArtistName()`: DB 빈 상태(Name 키 항목 없음)에서 새 항목 append 처리 추가

### Bug 2: Gallery Lightbox 뷰포트 초과 수정
- `(public)/gallery/page.tsx`
  - 닫기 버튼 `absolute -top-10` → flex 행 내부 배치 (뷰포트 내부 보장)
  - 미디어+캡션 래퍼에 `flex-1 min-h-0 overflow-y-auto` 추가
  - 이미지 `max-h-[80vh]` → `max-h-[70vh]` 축소

### Bug 3: 모바일 스크롤 잘림 수정
- `components/feature/TerminalLayout.tsx`
  - `min-h-screen` → `min-h-[calc(100dvh-4rem)] lg:min-h-[100dvh]` (모바일 동적 주소창 대응)

### DB 마이그레이션 추가
- `migrations/0006_event_gallery_link.sql`
  - `performances.poster_image_id` 컬럼 추가
  - `gallery_photos.linked_event_id` 컬럼 추가 + 인덱스 생성

### 타입 확장
- `types/content.ts`
  - `Performance.posterImageId?: string` 추가
  - `GalleryPhoto.linkedEventId?: string` 추가

### API 추가/확장
- `api/events/[id]/route.ts` (신규) — 공개 이벤트 상세 GET (포스터 이미지 포함)
- `api/admin/events/[id]/poster/route.ts` (신규) — 포스터 POST/DELETE (R2 + D1)
- `api/admin/performances/route.ts` — `poster_image_id` 컬럼 처리 추가
- `api/gallery/route.ts` — `linked_event_id` 조회 및 응답 포함

### 프론트엔드
- `(public)/events/[id]/page.tsx` (신규) — 이벤트 상세 페이지 (포스터/날짜/장소/라인업/RA 링크)
- `(public)/events/page.tsx` — 이벤트 카드 `<Link href=/events/{id}>` 래핑
- `admin/(dashboard)/events/page.tsx` — 포스터 업로드/미리보기/삭제 UI 추가
- `(public)/gallery/page.tsx` — Lightbox에 linkedEventId 있으면 'VIEW EVENT' 링크 버튼 표시
- `services/adminService.ts` — `uploadEventPoster()`, `deleteEventPoster()` 추가

---

## [Unreleased] — 2026-03-20 (어드민 Home 아티스트명 편집 기능 추가)

### `admin/home/page.tsx` — ARTIST INFO 섹션 추가
- `artistInfo` 상태 관리 추가 (`useState`, `useEffect` 동기화)
- `getArtistName()` / `setArtistName()` 헬퍼 — `Name` / `이름` 키 자동 매핑 (언어별)
- Save Changes 시 `updateArtistInfo` API 호출 포함 → About 페이지 Artist Info Name 연동
- 홈 화면 타이핑 애니메이션 타이틀을 About 페이지 방문 없이 Home 어드민에서 직접 수정 가능

---

## [Unreleased] — 2026-03-20 (ESLint react-hooks 코드 패턴 근본 수정)

### `crypto.randomUUID()` 전환 (react-hooks/purity)
- `admin/about/page.tsx`, `admin/events/page.tsx`, `admin/link/page.tsx`, `admin/music/page.tsx`
  - `Date.now().toString()` → `crypto.randomUUID()` (렌더 중 impure 함수 호출 제거)

### `TerminalLayout.tsx` — `isTransitioning` 상태 제거 (react-hooks/set-state-in-effect)
- `useState(isTransitioning)` + `useEffect([pathname])` 패턴 제거
- `key={pathname}` 자연 재마운트로 `animate-fadeIn` 항상 적용 (동일 효과)

### `TypingText.tsx` — useEffect 내 동기 setState 제거 (react-hooks/set-state-in-effect)
- `setDisplayed('')` + `setDone(false)` 는 `started: false→true` 단방향 전환 시 dead code — 제거

### `LanguageContext.tsx` — `useSyncExternalStore` 재작성 (react-hooks/set-state-in-effect)
- `useState + useEffect(setLanguageState)` → `useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot)`
- localStorage를 외부 스토어로 취급 — SSR 안전 + setState-in-effect 패턴 완전 제거
- `storage` 이벤트 수동 dispatch로 같은 탭 내 스토어 업데이트 트리거

### `ProtectedRoute.tsx` — setState 비동기 분리 (react-hooks/set-state-in-effect)
- `verifySession()` 내 `setAuthenticated` + `setChecked` 제거 → `boolean` 반환으로 변경
- 호출 측 useEffect에서 `.then(isAuth => { setState })` 패턴으로 이동

### `eslint.config.ts` — override 제거 (0 errors 달성)
- `react-hooks/purity: 'off'` + `react-hooks/set-state-in-effect: 'off'` 제거
- 코드 패턴 수정으로 근본 해결 완료

---

## [2026-03-19] — Cloudflare 빌드 오류 근본 수정

### TypeScript 타입 충돌 해소 (`src/lib/db.ts`)
- `export interface CloudflareEnv` → `declare global { interface CloudflareEnv }` 전환
  - `@opennextjs/cloudflare`가 선언한 전역 `CloudflareEnv`를 확장하는 방식으로 변경
  - 모듈 레벨 인터페이스와 전역 인터페이스 간 타입 불일치 해소
  - `getCloudflareContext()` 반환 타입에 `DB`/`MEDIA`/`ADMIN_PASSWORD` 자동 포함 — 캐스트 불필요

### ESLint `react-hooks` 중복 플러그인 등록 + 엄격 규칙 (`eslint.config.ts`)
- `import reactHooks` 및 `plugins: { 'react-hooks': reactHooks }` 제거
  - `eslint-config-next` v16+ 배열이 이미 `react-hooks` 플러그인 포함
  - 중복 등록 → "Cannot redefine plugin" 빌드 오류 발생
- `react-hooks/purity`, `react-hooks/set-state-in-effect`, `import/no-anonymous-default-export` 비활성화
  - `eslint-plugin-react-hooks` v5+ 신규 엄격 규칙이 기존 코드 패턴과 충돌

---

## [Unreleased] — 2026-03-19 (Cloudflare 배포 버그 수정 + UX 개선)

### 언어 초기화 버그 수정
- `src/i18n/index.ts`:
  - `i18next-browser-languagedetector` 제거 — 브라우저 언어(`navigator.language`, 한국어)가 자동 감지되어 초기 언어가 한국어로 고정되던 문제 해결
  - `lng: 'en'` 고정으로 초기화, `LanguageContext` hydration 후 `changeLanguage()` 호출로 전환
- `src/contexts/LanguageContext.tsx`:
  - `i18n.changeLanguage()` 연동 추가 — React state와 i18next가 분리되어 `t()` 번역에 언어 설정이 반영되지 않던 문제 해결
  - `setLanguage()` / `toggleLanguage()` / 초기 `localStorage` 복원 시 모두 `i18n.changeLanguage()` 호출
  - `LanguageContext`가 단일 언어 소스로 동작

### 사이드바 네비게이션 수정
- `src/components/feature/TerminalLayout.tsx`:
  - `<button onClick={() => router.push()}>` → `<Link href>` 전환 (데스크톱/모바일 모두)
  - `<Link>`는 `<a>` 태그로 렌더링되어 JS 하이드레이션 없이도 클릭 시 이동 가능 — CF Workers 정적 자산 로딩 전 네비게이션 불가 문제 해결
  - NAV_ITEMS 레이블을 i18n 키 → 영어 직접 값으로 변경 (`'nav_home'` → `'Home'` 등)
  - 언어 설정(KO/EN)과 무관하게 사이드바 메뉴 항상 영어 표시
  - `useTranslation` / `t()` 제거 (사이드바에서 불필요)
- 페이지 전환 애니메이션: `isTransitioning` 상태 + `animate-fadeOut`/`animate-fadeIn` 클래스 + `key={pathname}` 적용

### Cloudflare CF 환경변수 바인딩 수정
- `src/lib/db.ts`:
  - `require('@opennextjs/cloudflare')` dynamic require → `import { getCloudflareContext }` 정적 import 전환
  - 기존 dynamic require가 CF Workers 번들에서 실패 시 `null` 반환 → `ADMIN_PASSWORD = ''` 폴백 → 어드민 로그인 불가 원인 제거
  - `@opennextjs/cloudflare` v1.17.1 실제 export명: `getCloudflareContext` (이전 코드의 `getRequestContext`는 미존재)

### ESLint 빌드 오류 수정
- `eslint.config.ts`:
  - `eslint-config-next` v16+가 flat config에서 배열 반환 → 직접 포함 시 ESLint "Unexpected array" 오류 발생
  - `Array.isArray` 체크 후 스프레드 처리로 해결

### Cloudflare 배포 연동 수정
- `wrangler.json`:
  - `"vars": { "ADMIN_PASSWORD": "" }` → `"vars": {}` — 빈 값 vars가 Cloudflare Dashboard Variable을 덮어쓰던 문제 제거
  - `"main": ".open-next/worker.js"` 추가 — `wrangler versions upload` 진입점 지정
  - `"assets": { "directory": ".open-next/assets" }` 추가 — 정적 자산(`_next/static/`) 404 해결

### 갤러리 + 레이아웃 통일
- `src/app/(public)/gallery/page.tsx`: 커스텀 헤더 → `PageLayout` 래퍼로 교체 (다른 페이지와 동일 구조)
- `src/components/feature/PageLayout.tsx`: `mx-auto` 제거 → 좌측 정렬 적용

---

## [Unreleased] — 2026-03-19 (빌드 환경 수정 — Cloudflare 배포 준비)

### 빌드 파이프라인 수정

- `docker-compose.yml`:
  - `volumes`에 `/app/.open-next` 익명 볼륨 추가
  - Docker Desktop VirtioFS의 `copyFileSync` → 바인드 마운트 시 `--w-------` 권한 문제 해결
- `open-next.config.mjs` 삭제:
  - 수동 생성 파일 제거 — `open-next.config.ts` 컴파일 결과로 대체
- `package.json`:
  - `"deploy": "opennextjs-cloudflare build && wrangler deploy"` 스크립트 추가
  - 빌드 + 배포 단일 세션 실행 지원 (익명 볼륨 유지)
- `.docs/DEPLOYMENT.md` 신규:
  - 최초 배포 체크리스트, 단계별 명령어, 트러블슈팅 절차 문서화

---

## [Unreleased] — 2026-03-19 (전 페이지 Display Settings — Phase 4-h)

### 어드민 레이아웃 동적 제어 전 페이지 확장

- `migrations/0005_display_settings.sql`:
  - `display_settings` 테이블 신규 (`page` PK + `settings` JSON 컬럼)
  - 7개 페이지 기본 행 삽입 (global/home/about/music/events/contact/link)
- `src/types/displaySettings.ts` 신규:
  - `GlobalDisplaySettings`, `HomeDisplaySettings`, `AboutDisplaySettings`, `MusicDisplaySettings`, `EventsDisplaySettings`, `ContactDisplaySettings`, `LinkDisplaySettings` 인터페이스 정의
  - `AllDisplaySettings` 통합 맵 타입
  - `DISPLAY_SETTINGS_DEFAULTS` 기본값 상수 (기존 하드코딩 값 100% 보존)
- `src/utils/displaySettingsMap.ts` 신규:
  - `PADDING_MAP`, `GAP_MAP`, `SPACE_Y_MAP`, `MAX_WIDTH_MAP`, `GRID_COLS_MAP`, `MD_GRID_COLS_MAP` Tailwind 클래스 매핑 상수
- `src/components/base/RadioGroup.tsx` 신규:
  - 갤러리 어드민 내부 컴포넌트 → 공용 베이스 컴포넌트로 추출
- `src/app/api/admin/display-settings/route.ts` 신규:
  - `GET /api/admin/display-settings[?page=]` — 단일/전체 설정 조회
  - `PUT /api/admin/display-settings` — 페이지별 설정 UPSERT
- `src/app/api/content/[lang]/route.ts` 수정:
  - 17번째 배치 쿼리 추가 (`SELECT * FROM display_settings`)
  - 응답 `ContentData`에 `displaySettings: AllDisplaySettings` 포함
- `src/types/content.ts` 수정: `ContentData`에 `displaySettings?` 옵셔널 필드 추가
- `src/contexts/ContentContext.tsx` 수정: `displaySettings` context value 노출
- `src/services/adminService.ts` 수정: `fetchDisplaySettings()`, `updateDisplaySettings()` 추가
- **어드민 페이지 7개** DISPLAY SETTINGS 카드 추가:
  - `events`, `music`, `about`, `contact`, `home`, `link` — RadioGroup/checkbox/number input 조합
  - `theme` — GLOBAL DISPLAY SETTINGS (pageMaxWidth·defaultSpacing·typingSpeed·animationEnabled)
- **공개 페이지 6개** 하드코딩 → settings 기반 동적 렌더링 전환:
  - `events`: initialPastCount·loadMoreCount·pastEventOpacity·cardPadding·cardGap·spacing
  - `music`: cardPadding·trackGap·showDuration·showYear·showTypeBadge·spacing
  - `about`: typingSpeed·infoGridColumns·infoCardGap·spacing
  - `contact`: messageMaxLength·textareaRows·contactInfoColumns·bookingColumns·spacing
  - `home`: navGridColumns·navCardPadding·navGridGap·showTerminalInfo
  - `link`: gridColumns·cardPadding·gridGap·showTerminalCard·spacing
- `src/components/feature/PageLayout.tsx` 수정:
  - `max-w-5xl` → `MAX_WIDTH_MAP[global.pageMaxWidth]` 동적 적용
  - `typingSpeed` props 없으면 `global.typingSpeed` 폴백
  - `spacing` props 없으면 `global.defaultSpacing` 폴백
  - `global.animationEnabled` false 시 애니메이션 클래스/딜레이 스킵

---

## [Unreleased] — 2026-03-18 (갤러리 고도화 — Phase 4-g)

### 갤러리 레이아웃 제어 + 미디어 확장 + DB 정리

- `migrations/0004_gallery_media.sql`:
  - 레거시 테이블 DROP (`biography_paragraphs`, `musical_philosophy`, `design_philosophy_paragraphs`, `media_files`)
  - `gallery_photos` ALTER: `media_type`, `focal_x`, `focal_y`, `video_youtube_id`, `video_thumbnail_url` 컬럼 추가
  - `gallery_settings` 테이블 신규 (단일 행 설정: layout_mode·columns·gap_size·aspect_ratio·hover_effect·caption_display·lightbox_enabled)
- `src/types/content.ts`:
  - `GalleryPhoto` 확장 (mediaType·focalX·focalY·videoYoutubeId·videoThumbnailUrl)
  - `GallerySettings` 인터페이스 신규
  - `GalleryData` 인터페이스 신규 (photos + settings)
- **API 3개 신규 · 4개 수정:**
  - 신규 `GET|PUT /api/admin/gallery-settings` — 레이아웃 설정 조회/저장
  - 신규 `POST /api/admin/gallery/youtube` — YouTube URL → D1 INSERT (R2 없음)
  - 수정 `GET /api/gallery` — 응답에 `settings` 포함 (db.batch 2쿼리)
  - 수정 `GET|PUT /api/admin/gallery` — 신규 컬럼(mediaType·focalX·focalY) 포함
  - 수정 `POST /api/admin/gallery/upload` — 동영상 MIME 추가 + `file.stream()` 전환 + media_type 자동 판별
  - 수정 `GET /api/media/[id]` — 동영상 Content-Type 대응 + 캐시 정책 분리
- **어드민 페이지** `src/app/admin/(dashboard)/gallery/page.tsx` 전면 개편:
  - DISPLAY SETTINGS 카드: layout_mode·columns·gap_size·aspect_ratio·hover_effect·caption_display·lightbox 토글
  - 이미지 카드: 포컬 포인트 피커 (crosshair 클릭 → objectPosition 실시간 미리보기)
  - YouTube 추가 섹션: URL 입력 → 실시간 ID 파싱 → 썸네일 미리보기 → 갤러리 추가
  - 파일 업로드 accept에 MP4/WebM/QuickTime 추가
  - 미디어 타입별 카드 렌더 (image·video_file·video_youtube)
  - 저장 시 photos + settings 병렬 PUT
- **공개 페이지** `src/app/(public)/gallery/page.tsx` 설정 기반 동적 렌더링:
  - DB 설정 → CSS 클래스 동적 생성 (masonry columns / grid, gap, 열 수)
  - 포컬 포인트 objectPosition 적용
  - captionDisplay: overlay(호버) / below(하단 항상) / hidden
  - hoverEffect: zoom / fade / none
  - 미디어별 그리드 렌더 (img + focal / video + 플레이 아이콘 / YT 썸네일 + 뱃지)
  - 미디어별 라이트박스 렌더 (img 확대 / video controls autoPlay / YouTube iframe autoplay)

---

## [Unreleased] — 2026-03-18 (갤러리 기능 구현 — Phase 4-f)

### 갤러리 페이지 신규 구현
- `migrations/0003_gallery.sql`: `gallery_photos` 테이블 (id·filename·mime_type·size_bytes·alt_text·caption·sort_order·created_at)
- `src/types/content.ts`: `GalleryPhoto` 인터페이스 추가
- **API 라우트 5개 신규:**
  - `GET /api/gallery` — 공개 사진 목록 (인증 불필요)
  - `GET /api/media/[id]` — R2 이미지 프록시 서빙 (Cache-Control: immutable)
  - `GET|PUT /api/admin/gallery` — 어드민 목록 조회 + 메타 일괄 업데이트
  - `POST /api/admin/gallery/upload` — 다중 파일 업로드 (R2 + D1)
  - `DELETE /api/admin/gallery/[id]` — D1 삭제 + R2 삭제
- **공개 페이지** `src/app/(public)/gallery/page.tsx`:
  - CSS columns 마소니 그리드 (2→3→4열 반응형)
  - 호버 시 캡션 오버레이 + 확대 아이콘
  - 클릭 시 라이트박스 (ESC/배경클릭 닫기, 스크롤 잠금)
- **어드민 페이지** `src/app/admin/(dashboard)/gallery/page.tsx`:
  - 드래그 앤 드롭 + 파일 선택 업로드
  - 썸네일 미리보기 + altText/caption 인라인 편집
  - 위/아래 버튼 순서 변경 + 삭제 확인 모달
- 네비게이션 양쪽에 GALLERY 항목 추가 (TerminalLayout · AdminLayout)
- i18n en/ko: `nav_gallery`, `gallery_*` 키 추가

---

## [Unreleased] — 2026-03-18 (raApiConfig D1 연동)

### raApiConfig D1 영속화
- `src/app/api/admin/ra-api-config/route.ts` 신규 생성 (`GET` / `PUT`)
  - `ra_api_config` 테이블 단일 행(id=1) 조회·업데이트
- `src/services/adminService.ts`: `fetchRaApiConfig`, `updateRaApiConfig` 함수 추가
- `src/app/admin/(dashboard)/events/page.tsx`: `saveChanges`에 `apiUpdateRaApiConfig(raApiConfig)` 추가
  - `Promise.allSettled` 병렬 저장 (performances + pageMeta + raApiConfig)

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
