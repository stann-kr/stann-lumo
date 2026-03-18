# 잔여 작업 목록

> 최종 업데이트: 2026-03-18
> Phase 1~4-a(인프라·코드품질·Next.js 이주·Cloudflare 기반) 완료. 이하 Phase 4-b(D1 콘텐츠 API) 잔여 작업.

---

## ✅ 완료된 작업

- [x] **Phase 1**: Docker 환경, 위생 파일(`.gitignore`, `.dockerignore`, `.env.example`), `.docs/` 문서 폴더
- [x] **Phase 2**: 미사용 의존성/파일 제거, 타입 정합성 수정, 하드코딩 제거, i18n 전환, strict mode 활성화, 린트 정상화
- [x] **Phase 3**: Next.js 15 App Router 이주 (`src/app/`, Route Handlers, SSR 가드, hydration 수정)
- [x] **Phase 4-a: 파일 구조 정리**: `src/views/` 제거 → 컴포넌트 `src/app/` 직접 통합
- [x] **Phase 4-a: 빌드 오류 수정**: `NODE_ENV=production` 명시 / `suppressHydrationWarning` / Context localStorage 지연 로딩
- [x] **Phase 4-a: Cloudflare 인프라 기반**
  - [x] `wrangler.json`: D1(`DB`), R2(`MEDIA`) 바인딩 설정
  - [x] `migrations/0001_initial_schema.sql`: D1 전체 스키마 (콘텐츠 + 인증 + 미디어 테이블)
  - [x] `src/lib/db.ts`: CF Workers/Node.js 이중 환경 D1·R2 바인딩 헬퍼
  - [x] `src/lib/auth.ts`: D1 기반 세션 생성·검증·삭제, 쿠키 헤더 빌더
  - [x] `src/lib/adminAuth.ts`: Route Handler 세션 인증 미들웨어 헬퍼
  - [x] `src/app/api/auth/login/route.ts`: `POST` 로그인 → 세션 쿠키 발급
  - [x] `src/app/api/auth/logout/route.ts`: `POST` 세션 삭제
  - [x] `src/app/api/auth/session/route.ts`: `GET` 세션 유효성 확인
- [x] **동적 섹션 시스템 구현** (`aboutSections: DynamicSection[]`)
  — `src/types/content.ts`, `src/contexts/ContentContext.tsx`,
    `src/app/(public)/about/page.tsx`, `src/app/admin/(dashboard)/about/page.tsx`
- [x] **pageMeta 시스템 구현** (5개 공개 페이지 타이틀/섹션 타이틀 어드민 편집 가능)
  — `src/types/content.ts`, `src/contexts/ContentContext.tsx`,
    5개 공개 페이지, 5개 어드민 페이지 PAGE SETTINGS 카드
- [x] **`migrations/0002_dynamic_content.sql` 추가**
  — `about_sections`, `about_section_paragraphs`, `about_section_philosophy_items`, `page_meta`
- [x] **`src/types/content.ts` 불필요 타입 제거** (`Biography`, `DesignPhilosophy` 삭제)

---

## ✅ Phase 4-b: D1 콘텐츠 API 구현

### 1. 공개 콘텐츠 API

- [x] `src/app/api/content/[lang]/route.ts` — `GET`: 전체 공개 콘텐츠 조회 (`en` | `ko`)
  - D1 → `ContentData` 타입으로 조합하여 반환 (db.batch 16쿼리)
  - DB 없는 개발 환경: 503 반환 → ContentContext 기본값 폴백

### 2. 어드민 콘텐츠 CRUD API

- [x] `src/app/api/admin/artist-info/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/about-sections/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/page-meta/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/home-sections/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/tracks/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/performances/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/events-info/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/link-platforms/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/contact-info/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/theme/route.ts` — `GET` / `PUT`
- [x] `src/app/api/admin/site-config/route.ts` — `GET` / `PUT`

---

## ✅ Phase 4-c: 프론트엔드 서비스 계층

- [x] `src/services/apiClient.ts` — fetch 래퍼 (`ApiResponse<T>`, 에러 처리)
- [x] `src/services/contentService.ts` — 공개 콘텐츠 API 호출
- [x] `src/services/adminService.ts` — 어드민 CRUD API 호출
- [x] `src/services/authService.ts` — 로그인/로그아웃/세션 API 호출

---

## ✅ Phase 4-d: ContentContext API 전환

- [x] `src/contexts/ContentContext.tsx`: localStorage 직접 접근 제거 → `contentService.fetchContent()` 호출
- [x] `migrateContent()` / `loadFromStorage()` 제거
- [x] 페이지 로드 시 공개 API(en+ko 병렬)에서 콘텐츠 fetch → Context 주입
- **비고**: `updateContent()`는 인메모리 업데이트 유지. 어드민 저장 영구화는 각 어드민 페이지에서 `adminService` 직접 호출로 처리 예정

---

## ✅ Phase 4-e: 데이터 마이그레이션

- [x] `src/app/api/admin/migrate/route.ts` — `POST`: `MultiLanguageContent` JSON → D1 일괄 INSERT
  - 전체 테이블 초기화 후 en/ko 재삽입 (batch 청크 90개 분할)
  - 실행 후 라우트 삭제 권장 (일회성 엔드포인트)

## ✅ 어드민 페이지 D1 API 연동

- [x] `admin/home/page.tsx` — `saveChanges`: `updateHomeSections` + `updatePageMeta` + `updateTerminalInfo`
- [x] `admin/about/page.tsx` — `handleSave`: `updateArtistInfo` + `updateAboutSections`
- [x] `admin/music/page.tsx` — `saveChanges`: `updateTracks` + `updatePageMeta`
- [x] `admin/events/page.tsx` — `saveChanges`: `updatePerformances` + `updatePageMeta`
- [x] `admin/contact/page.tsx` — `saveChanges`: `updateContactInfo` + `updateEventsInfo` + `updatePageMeta`
- [x] `admin/link/page.tsx` — `saveChanges`: `updateLinkPlatforms` + `updatePageMeta` + `updateTerminalInfo`
- **비고**: DB 미사용 환경(dev)에서는 API 실패 시 `Promise.allSettled`로 무시 후 인메모리 업데이트 유지

---

## 🔲 Phase 4-f: R2 미디어 (낮은 우선순위)

- [ ] `src/app/api/media/upload/route.ts` — `POST`: R2 직접 업로드
- [ ] `src/app/api/media/[id]/route.ts` — `GET` / `DELETE`
- [ ] 어드민 페이지 미디어 업로드 UI 추가

---

## 🔲 Phase 5: 배포

- [ ] Cloudflare Workers 최종 배포 검증 (`npm run build` → `opennextjs-cloudflare`)
- [ ] D1 마이그레이션 원격 적용: `wrangler d1 migrations apply stann-lumo-db --remote`
- [ ] 환경 변수 Cloudflare Dashboard 설정 (`ADMIN_PASSWORD`)
- [ ] `.docs/README.md` 배포 절차 보강

---

## ✅ 기타 개선

- [x] `admin/events/page.tsx` 한국어 하드코딩 → i18n 전환 (`events_sync_success`, `events_sync_error`, `admin_events_subtitle`)
- [x] 어드민 세션 만료 처리 — `ProtectedRoute` 5분 주기 재검증 + 만료 시 `/admin` 자동 리다이렉트
- [x] `src/types/content.ts` 불필요 타입 정리
