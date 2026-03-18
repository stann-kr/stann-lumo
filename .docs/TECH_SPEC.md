# 기술 명세서

> 최종 업데이트: 2026-03-18

---

## 현재 아키텍처 (Phase 4-a + 동적 섹션/pageMeta 완료 시점)

### 런타임 및 배포

| 항목 | 내용 |
|---|---|
| 프레임워크 | Next.js 15.5 (App Router) |
| 런타임 | Cloudflare Workers (`@opennextjs/cloudflare`) |
| 배포 어댑터 | `open-next.config.ts` — `cloudflare-node` wrapper, `edge` converter |
| 개발 환경 | Docker (Node 22 Alpine, `linux/arm64`) |
| 빌드 | `NODE_ENV=production next build` |

### 디렉토리 구조

```
src/
  app/
    layout.tsx              # Root layout (Server Component), force-dynamic
    Providers.tsx           # 'use client' — I18n + Context 공급자
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
    admin/
      page.tsx              # /admin (로그인)
      (dashboard)/
        layout.tsx          # ProtectedRoute + AdminLayout 그룹
        home/page.tsx       # /admin/home
        about/page.tsx
        music/page.tsx
        events/page.tsx
        contact/page.tsx
        link/page.tsx
        theme/page.tsx
    api/
      auth/
        login/route.ts      # POST — 로그인, 세션 쿠키 발급
        logout/route.ts     # POST — 세션 삭제
        session/route.ts    # GET  — 세션 유효성 확인
  components/
    feature/                # TerminalLayout, AdminLayout, ProtectedRoute, PageLayout ...
    home/                   # TypingText, CursorGlow, LiveClock
    base/                   # 공통 UI
  contexts/
    LanguageContext.tsx     # 언어 상태 (hydration-safe: 초기값 'en', useEffect로 복원)
    ContentContext.tsx      # 콘텐츠 상태 (hydration-safe: 초기값 기본값, useEffect로 복원)
  lib/
    db.ts                   # CF Workers D1/R2 바인딩 헬퍼 (Node.js 개발 폴백 포함)
    auth.ts                 # D1 세션 CRUD, 쿠키 헤더 빌더
    adminAuth.ts            # Route Handler 세션 인증 미들웨어
  services/                 # (미구현) API 호출 계층
  types/
    content.ts              # ContentData, MultiLanguageContent 등
  i18n/                     # i18next 초기화 (브라우저 전용 LanguageDetector)
  utils/                    # raApi, colorMix 등
  constants/site.ts
migrations/
  0001_initial_schema.sql   # D1 전체 스키마
  0002_dynamic_content.sql  # 동적 섹션·pageMeta 테이블
wrangler.json               # CF Workers 바인딩 설정
open-next.config.ts         # OpenNext Cloudflare 어댑터 설정
```

### 상태 관리 (현재 — localStorage 기반)

```
LanguageContext ('en' | 'ko')
  └─ useEffect → localStorage.app_language 복원

ContentContext (MultiLanguageContent)
  └─ useEffect → localStorage.stann_content_multilang 복원
       └─ migrateContent() — 구버전 스키마 마이그레이션
  └─ useEffect(allContent) → CSS 변수 적용 + localStorage 저장
```

> Phase 4-d 이후: localStorage → D1 API 호출로 전환 예정

### 인증 흐름

```
클라이언트 POST /api/auth/login
  → getEnv().ADMIN_PASSWORD 비교
  → createSession() → D1 admin_sessions INSERT (dev: DEV_SESSION_VALUE 폴백)
  → Set-Cookie: admin_session=<id>; HttpOnly; SameSite=Lax

어드민 API 요청
  → requireAdminSession(request)
  → validateSession(sessionId) → D1 SELECT (dev: DEV_SESSION_VALUE 통과)
  → null(통과) or NextResponse 401
```

---

## D1 스키마 (migrations/0001_initial_schema.sql)

### 설정 테이블

```sql
site_config      -- 사이트 전역 설정 (단일 행, id=1)
theme_colors     -- 테마 색상 CSS 변수 (단일 행, id=1)
ra_api_config    -- Resident Advisor API 설정 (단일 행, id=1)
```

### 콘텐츠 테이블 (다국어: `lang` 컬럼 `en`|`ko`)

```sql
-- 0001_initial_schema.sql
artist_info                    -- 아티스트 정보 key-value
home_sections                  -- 홈 섹션 카드
tracks                         -- 음악 트랙
performances                   -- 공연 일정 (lang 없음 — 공통)
events_info                    -- 이벤트 정보 (단일 행)
events_set_durations           -- 세트 시간 목록
events_tech_requirements       -- 기술 요구사항 목록
link_platforms                 -- 외부 링크
contact_info                   -- 연락처

-- 0002_dynamic_content.sql (동적 섹션·pageMeta)
about_sections                 -- 동적 섹션 헤더 (id, lang, title, type, order)
about_section_paragraphs       -- 섹션 단락 항목
about_section_philosophy_items -- 섹션 철학 항목
page_meta                      -- 페이지 메타 key-value (page, lang, key, value)
```

### 인증 테이블

```sql
admin_sessions   -- HTTP-only 쿠키 세션 (id, created_at, expires_at)
```

### 미디어 테이블

```sql
media_files      -- R2 오브젝트 메타데이터 (id, r2_key, filename, mime_type, size_bytes)
```

---

## API 엔드포인트 설계

### 구현 완료

| 메서드 | 경로 | 설명 |
|---|---|---|
| `POST` | `/api/auth/login` | 비밀번호 검증 → 세션 쿠키 발급 |
| `POST` | `/api/auth/logout` | 세션 삭제 |
| `GET` | `/api/auth/session` | 세션 유효성 확인 |

### 구현 예정 (Phase 4-b)

| 메서드 | 경로 | 설명 | 인증 |
|---|---|---|---|
| `GET` | `/api/content/[lang]` | 전체 공개 콘텐츠 조회 | ✗ |
| `GET/PUT` | `/api/admin/artist-info` | 아티스트 정보 | ✓ |
| `GET/PUT` | `/api/admin/about-sections` | 동적 섹션 | ✓ |
| `GET/PUT` | `/api/admin/page-meta` | 페이지 메타 | ✓ |
| `GET/PUT` | `/api/admin/home-sections` | 홈 섹션 카드 | ✓ |
| `GET/PUT` | `/api/admin/tracks` | 음악 트랙 | ✓ |
| `GET/PUT` | `/api/admin/performances` | 공연 일정 | ✓ |
| `GET/PUT` | `/api/admin/events-info` | 이벤트 정보 | ✓ |
| `GET/PUT` | `/api/admin/link-platforms` | 외부 링크 | ✓ |
| `GET/PUT` | `/api/admin/contact-info` | 연락처 | ✓ |
| `GET/PUT` | `/api/admin/theme` | 테마 색상 | ✓ |
| `GET/PUT` | `/api/admin/site-config` | 사이트 설정 | ✓ |
| `POST` | `/api/admin/migrate` | localStorage → D1 일괄 마이그레이션 | ✓ |
| `POST` | `/api/media/upload` | R2 업로드 | ✓ |
| `GET/DELETE` | `/api/media/[id]` | R2 오브젝트 조회·삭제 | ✓ |

### API 응답 형식

```typescript
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;   // 'UNAUTHORIZED' | 'BAD_REQUEST' | 'NOT_FOUND' | 'INTERNAL_ERROR'
    message: string;
  };
}
```

---

## R2 스토리지 구조

```
stann-lumo-media/
  images/profile/{uuid}.{ext}
  images/events/{uuid}.{ext}
  audio/tracks/{uuid}.{ext}
  audio/mixes/{uuid}.{ext}
  documents/{uuid}.{ext}
```
