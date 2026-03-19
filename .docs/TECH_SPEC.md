# 기술 명세서

> 최종 업데이트: 2026-03-19 (Phase 4-h 완료 기준)

---

## 아키텍처 개요

### 런타임 및 배포

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 15.5 (App Router) |
| 런타임 | Cloudflare Workers (`nodejs_compat`) |
| 배포 어댑터 | `@opennextjs/cloudflare` v1.17.1 — `cloudflare-node` wrapper, `edge` converter |
| 개발 환경 | Docker (Node 22 Alpine, `linux/arm64`) |
| 빌드 | `NODE_ENV=production next build` → `opennextjs-cloudflare build` |

### open-next.config.ts

```typescript
{
  default: {
    wrapper: 'cloudflare-node',
    converter: 'edge',
    proxyExternalRequest: 'fetch',
    incrementalCache: 'dummy',
    tagCache: 'dummy',
    queue: 'dummy',
  },
  edgeExternals: ['node:crypto'],
  middleware: {
    external: true,
    wrapper: 'cloudflare-edge',
    converter: 'edge',
  },
}
```

### Cloudflare 리소스 바인딩 (wrangler.json)

| 바인딩 | 리소스 | 용도 |
|--------|--------|------|
| `DB` | D1 `stann-lumo-db` | 콘텐츠 + 세션 저장 |
| `MEDIA` | R2 `stann-lumo-media` | 이미지 / 동영상 파일 저장 |

---

## 디렉토리 구조

```
src/
  app/
    layout.tsx              # Root layout (Server Component, force-dynamic)
    Providers.tsx           # 'use client' — i18n + ContentContext + LanguageContext 공급자
    not-found.tsx           # 404 (Server Component, force-dynamic)
    global-error.tsx        # 루트 에러 바운더리
    globals.css
    (public)/
      layout.tsx            # TerminalLayout 그룹
      page.tsx              # /
      about/page.tsx        # /about
      music/page.tsx        # /music
      events/page.tsx       # /events
      contact/page.tsx      # /contact
      link/page.tsx         # /link
      gallery/page.tsx      # /gallery
    admin/
      page.tsx              # /admin (로그인)
      (dashboard)/
        layout.tsx          # ProtectedRoute + AdminLayout 그룹
        home/page.tsx
        about/page.tsx
        music/page.tsx
        events/page.tsx
        contact/page.tsx
        link/page.tsx
        theme/page.tsx
        gallery/page.tsx
    api/
      auth/
        login/route.ts      # POST
        logout/route.ts     # POST
        session/route.ts    # GET
      content/[lang]/
        route.ts            # GET — 공개 콘텐츠 (17테이블 batch)
      gallery/
        route.ts            # GET — 공개 갤러리
      media/[id]/
        route.ts            # GET — R2 프록시
      admin/
        artist-info/        # GET/PUT
        about-sections/     # GET/PUT
        page-meta/          # GET/PUT
        home-sections/      # GET/PUT
        tracks/             # GET/PUT
        performances/       # GET/PUT
        events-info/        # GET/PUT
        link-platforms/     # GET/PUT
        contact-info/       # GET/PUT
        theme/              # GET/PUT
        site-config/        # GET/PUT
        ra-api-config/      # GET/PUT
        display-settings/   # GET/PUT
        gallery/
          route.ts          # GET/PUT
          [id]/route.ts     # DELETE
          upload/route.ts   # POST
          youtube/route.ts  # POST
        gallery-settings/   # GET/PUT
        migrate/            # POST (일회성)
  components/
    feature/                # TerminalLayout, AdminLayout, ProtectedRoute, PageLayout
    home/                   # TypingText, CursorGlow, LiveClock
    base/                   # RadioGroup, DeleteConfirmModal, ListItemEditor 등
  contexts/
    LanguageContext.tsx      # 언어 상태 (hydration-safe: 초기값 'en')
    ContentContext.tsx       # 콘텐츠 상태 — D1 API fetch, displaySettings 노출
  lib/
    db.ts                   # CF Workers D1/R2 바인딩 헬퍼 (Node.js 개발 폴백)
    auth.ts                 # D1 세션 CRUD + 쿠키 헤더 빌더
    adminAuth.ts            # Route Handler 세션 인증 미들웨어
  services/
    apiClient.ts            # fetch 래퍼 (apiGet / apiPut / apiPost)
    contentService.ts       # fetchContent(lang)
    adminService.ts         # 어드민 API 전체 CRUD (23개 함수)
    authService.ts          # login / logout / checkSession
  types/
    content.ts              # ContentData, GalleryPhoto, GallerySettings 등
    displaySettings.ts      # AllDisplaySettings, 7개 페이지 설정 인터페이스
  utils/
    displaySettingsMap.ts   # Tailwind 클래스 매핑 상수
    raApi.ts                # RA API XML 파싱
    colorMix.ts             # 테마 색상 유틸
  constants/site.ts
migrations/
  0001_initial_schema.sql
  0002_dynamic_content.sql
  0003_gallery.sql
  0004_gallery_media.sql
  0005_display_settings.sql
```

---

## 상태 관리

```
LanguageContext ('en' | 'ko')
  └─ 초기값 'en' → useEffect에서 localStorage 복원 (SSR hydration-safe)

ContentContext (ContentData × 2 언어)
  └─ 초기값: DISPLAY_SETTINGS_DEFAULTS 포함 기본값
  └─ useEffect → contentService.fetchContent('en') + fetchContent('ko') 병렬
       └─ 성공: D1 데이터 적용
       └─ 실패(503): 기본값 유지 (개발 환경 폴백)
  └─ displaySettings: AllDisplaySettings — 공개 페이지 동적 렌더링에 사용
  └─ updateContent(): 인메모리 업데이트 (어드민 즉시 UI 반영용)
```

---

## 인증 흐름

```
클라이언트 POST /api/auth/login
  → getEnv().ADMIN_PASSWORD 비교
  → createSession() → D1 admin_sessions INSERT
  → Set-Cookie: admin_session=<id>; HttpOnly; SameSite=Lax; Max-Age=86400

어드민 API 요청
  → requireAdminSession(request)
  → validateSession(sessionId) → D1 SELECT
  → 유효: null 반환 (통과)
  → 무효/만료: NextResponse 401

ProtectedRoute (클라이언트)
  → 마운트 시 checkSession()
  → 5분 주기 setInterval → 만료 감지 시 /admin 리다이렉트
```

---

## D1 스키마 (마이그레이션 파일별)

### 0001_initial_schema.sql — 초기 스키마

**설정 테이블 (단일 행)**

| 테이블 | 설명 |
|--------|------|
| `site_config` | 사이트 브랜드, 터미널 정보 |
| `theme_colors` | CSS 색상 변수 |
| `ra_api_config` | Resident Advisor API 설정 |

**콘텐츠 테이블 (다국어: `lang = 'en' | 'ko'`)**

| 테이블 | 설명 |
|--------|------|
| `artist_info` | 아티스트 정보 (key-value) |
| `home_sections` | 홈 섹션 카드 |
| `tracks` | 음악 트랙 |
| `performances` | 공연 일정 (lang 없음 — 공통) |
| `events_info` | 이벤트 정보 (단일 행) |
| `events_set_durations` | 세트 시간 목록 |
| `events_tech_requirements` | 기술 요구사항 목록 |
| `link_platforms` | 외부 링크 |
| `contact_info` | 연락처 |

**인증 테이블**

| 테이블 | 설명 |
|--------|------|
| `admin_sessions` | HTTP-only 세션 (id, created_at, expires_at) |

### 0002_dynamic_content.sql — 동적 섹션 + 페이지 메타

| 테이블 | 설명 |
|--------|------|
| `about_sections` | About 섹션 헤더 (id, lang, title, type, section_order) |
| `about_section_paragraphs` | 섹션 단락 항목 |
| `about_section_philosophy_items` | 섹션 철학 항목 |
| `page_meta` | 페이지 메타 key-value (page, lang, key, value) |

### 0003_gallery.sql — 갤러리 기초

| 테이블 | 설명 |
|--------|------|
| `gallery_photos` | 사진 메타 (id, filename, mime_type, size_bytes, alt_text, caption, sort_order) |

### 0004_gallery_media.sql — 갤러리 고도화

**ALTER** `gallery_photos`: `media_type`, `focal_x`, `focal_y`, `video_youtube_id`, `video_thumbnail_url` 컬럼 추가

**DROP**: `biography_paragraphs`, `musical_philosophy`, `design_philosophy_paragraphs`, `media_files` (레거시)

| 테이블 | 설명 |
|--------|------|
| `gallery_settings` | 레이아웃 설정 (layout_mode, columns, gap_size, aspect_ratio, hover_effect, caption_display, lightbox_enabled) |

### 0005_display_settings.sql — 전 페이지 Display Settings

| 테이블 | 설명 |
|--------|------|
| `display_settings` | 7개 페이지 설정 (`page` PK + `settings` JSON) |

페이지 키: `global` / `home` / `about` / `music` / `events` / `contact` / `link`

---

## API 엔드포인트 목록

### 공개 API

| 메서드 | 경로 | 설명 | 인증 |
|--------|------|------|------|
| `GET` | `/api/content/[lang]` | 전체 콘텐츠 (lang: en\|ko) — 17테이블 batch | ✗ |
| `GET` | `/api/gallery` | 갤러리 사진 목록 + settings | ✗ |
| `GET` | `/api/media/[id]` | R2 미디어 프록시 서빙 | ✗ |

### 인증

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `POST` | `/api/auth/login` | 비밀번호 검증 → 세션 쿠키 발급 |
| `POST` | `/api/auth/logout` | 세션 삭제 |
| `GET` | `/api/auth/session` | 세션 유효성 확인 |

### 어드민 콘텐츠 CRUD

| 메서드 | 경로 | 설명 |
|--------|------|------|
| `GET/PUT` | `/api/admin/artist-info` | 아티스트 정보 |
| `GET/PUT` | `/api/admin/about-sections` | 동적 섹션 (3테이블 batch) |
| `GET/PUT` | `/api/admin/page-meta` | 페이지 메타 |
| `GET/PUT` | `/api/admin/home-sections` | 홈 섹션 카드 |
| `GET/PUT` | `/api/admin/tracks` | 음악 트랙 |
| `GET/PUT` | `/api/admin/performances` | 공연 일정 |
| `GET/PUT` | `/api/admin/events-info` | 이벤트 정보 (3테이블 batch) |
| `GET/PUT` | `/api/admin/link-platforms` | 외부 링크 |
| `GET/PUT` | `/api/admin/contact-info` | 연락처 |
| `GET/PUT` | `/api/admin/theme` | 테마 색상 |
| `GET/PUT` | `/api/admin/site-config` | 사이트 설정 |
| `GET/PUT` | `/api/admin/ra-api-config` | RA API 설정 |
| `GET/PUT` | `/api/admin/display-settings` | Display Settings |
| `GET/PUT` | `/api/admin/gallery-settings` | 갤러리 레이아웃 설정 |
| `GET/PUT` | `/api/admin/gallery` | 갤러리 목록 + 메타 업데이트 |
| `POST` | `/api/admin/gallery/upload` | 다중 파일 업로드 (R2 + D1) |
| `DELETE` | `/api/admin/gallery/[id]` | 갤러리 항목 삭제 (D1 + R2) |
| `POST` | `/api/admin/gallery/youtube` | YouTube URL 추가 |
| `POST` | `/api/admin/migrate` | localStorage → D1 일괄 마이그레이션 (일회성) |

### API 응답 형식

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: 'UNAUTHORIZED' | 'BAD_REQUEST' | 'NOT_FOUND' | 'INTERNAL_ERROR';
    message: string;
  };
}
```

---

## Display Settings 구조

어드민에서 관리, `display_settings` 테이블에 JSON으로 저장, 공개 페이지에서 동적 렌더링에 사용.

| 페이지 | 주요 설정 키 |
|--------|------------|
| `global` | pageMaxWidth, defaultSpacing, typingSpeed, animationEnabled |
| `home` | navGridColumns, navCardPadding, navGridGap, showTerminalInfo |
| `about` | typingSpeed, infoGridColumns, infoCardGap, spacing |
| `music` | cardPadding, trackGap, showDuration, showYear, showTypeBadge, spacing |
| `events` | initialPastCount, loadMoreCount, pastEventOpacity, cardPadding, cardGap, spacing |
| `contact` | messageMaxLength, textareaRows, contactInfoColumns, bookingColumns, spacing |
| `link` | gridColumns, cardPadding, gridGap, showTerminalCard, spacing |

---

## R2 스토리지 구조

```
stann-lumo-media/
  gallery/{uuid}.{ext}        # 갤러리 이미지
  gallery/{uuid}.mp4          # 갤러리 동영상
```

---

## 빌드 + 배포 파이프라인

```
1. next build (NODE_ENV=production)
   └─ .next/ 생성

2. opennextjs-cloudflare build
   └─ .open-next/ 생성 (익명 볼륨 — VirtioFS 권한 문제 해결)

3. wrangler deploy
   └─ Cloudflare Workers 배포

⚠️ 2 + 3 은 반드시 동일 Docker 세션에서 실행
   docker compose run --rm web npm run deploy
```
