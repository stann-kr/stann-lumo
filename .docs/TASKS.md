# 잔여 작업 목록

> 최종 업데이트: 2026-03-19
> Phase 4-h(전 페이지 Display Settings) + 빌드 환경 수정 완료. Phase 5(배포) 진입 가능.

---

## 🔜 Phase 5: 최초 배포 체크리스트

- [ ] **Cloudflare Dashboard 환경 변수 설정**: `ADMIN_PASSWORD` Secret 등록
- [ ] **R2 버킷 생성** (미생성 시): `docker compose run --rm web sh -c "npx wrangler r2 bucket create stann-lumo-media"`
- [ ] **D1 마이그레이션 전체 적용**: `docker compose run --rm web sh -c "npx wrangler d1 migrations apply stann-lumo-db --remote"`
- [ ] **빌드 + 배포**: `docker compose run --rm web npm run deploy`
- [ ] **배포 후 어드민 접속 확인**: `https://[workers-url]/admin`
- [ ] **배포 후 공개 페이지 확인**: `https://[workers-url]/`

> 상세 절차 → `.docs/DEPLOYMENT.md` 참고

---

## ✅ 완료된 작업 (최신순)

### [2026-03-19] 빌드 환경 수정 — Cloudflare 배포 준비

- [x] `docker-compose.yml`: `/app/.open-next` 익명 볼륨 추가 (VirtioFS 권한 문제 해결)
- [x] `open-next.config.mjs` 삭제 (`.ts` 파일 컴파일로 대체)
- [x] `package.json`: `"deploy"` 스크립트 추가 (`opennextjs-cloudflare build && wrangler deploy`)
- [x] `.docs/DEPLOYMENT.md` 신규 작성 (배포 전체 절차 문서화)

### [2026-03-19] Phase 4-h: 전 페이지 Display Settings

- [x] `migrations/0005_display_settings.sql` 신규 (`display_settings` 테이블, 7개 페이지 기본 행)
- [x] `src/types/displaySettings.ts` 신규 — 7개 페이지 설정 인터페이스 + `DISPLAY_SETTINGS_DEFAULTS`
- [x] `src/utils/displaySettingsMap.ts` 신규 — Tailwind 클래스 매핑 상수
- [x] `src/components/base/RadioGroup.tsx` 신규 — 공용 베이스 컴포넌트 추출
- [x] `GET|PUT /api/admin/display-settings` 신규
- [x] `ContentContext`: `displaySettings` 노출 + `contentService` 통해 fetch
- [x] 어드민 7개 페이지 DISPLAY SETTINGS 카드 추가
- [x] 공개 페이지 6개 + `PageLayout` 동적 설정 기반 렌더링 전환

### [2026-03-18] Phase 4-g: 갤러리 고도화

- [x] `migrations/0004_gallery_media.sql` — 레거시 DROP + `gallery_photos` 확장 + `gallery_settings` 신규
- [x] `GalleryPhoto` 확장 · `GallerySettings` · `GalleryData` 타입 추가
- [x] API 3개 신규 (`gallery-settings GET/PUT` · `gallery/youtube POST`) · 4개 수정
- [x] 어드민: 포컬 포인트 피커 · YouTube 추가 · 미디어 타입별 카드 · DISPLAY SETTINGS 카드
- [x] 공개 페이지: DB 설정 기반 동적 렌더링 (masonry/grid · columns · gap · hover · caption · lightbox)

### [2026-03-18] Phase 4-f: 갤러리 기초 구현

- [x] `migrations/0003_gallery.sql` — `gallery_photos` 테이블
- [x] `GalleryPhoto` 타입 추가
- [x] `GET /api/gallery` · `GET /api/media/[id]` · `GET|PUT /api/admin/gallery` · `POST /api/admin/gallery/upload` · `DELETE /api/admin/gallery/[id]`
- [x] 공개 갤러리: CSS columns 마소니 + 라이트박스
- [x] 어드민 갤러리: 드래그 앤 드롭 업로드 + 메타 편집 + 정렬 + 삭제
- [x] 네비게이션 GALLERY 항목 추가 · i18n en/ko 키 추가

### [2026-03-18] 기타 개선

- [x] `admin/events/page.tsx` 한국어 하드코딩 → i18n 전환 (`events_sync_success`, `events_sync_error`, `admin_events_subtitle`)
- [x] 어드민 세션 만료 처리 — `ProtectedRoute` 5분 주기 재검증 + 만료 시 `/admin` 자동 리다이렉트
- [x] `src/types/content.ts` 불필요 타입 정리

### [2026-03-18] Phase 4-e: 데이터 마이그레이션 + 어드민 D1 연동

- [x] `POST /api/admin/migrate` — `MultiLanguageContent` JSON → D1 일괄 INSERT (batch 90개 청크)
- [x] 어드민 6개 페이지 `saveChanges` → `adminService` 호출 + `Promise.allSettled` 패턴
- [x] `POST /api/admin/ra-api-config` — raApiConfig D1 영속화

### [2026-03-18] Phase 4-d: ContentContext API 전환

- [x] `ContentContext`: localStorage 제거 → `contentService.fetchContent()` 호출 (en/ko 병렬)
- [x] `migrateContent()` / `loadFromStorage()` 제거
- [x] `updateContent()` 인메모리 업데이트 유지 (어드민 즉시 UI 반영용)

### [2026-03-18] Phase 4-c: 프론트엔드 서비스 계층

- [x] `src/services/apiClient.ts` — fetch 래퍼 (`apiGet` / `apiPut` / `apiPost`)
- [x] `src/services/contentService.ts` — `fetchContent(lang)`
- [x] `src/services/adminService.ts` — 어드민 API 전체 CRUD 함수
- [x] `src/services/authService.ts` — `login` / `logout` / `checkSession`

### [2026-03-18] Phase 4-b: D1 콘텐츠 API 구현

- [x] `GET /api/content/[lang]` — D1 16테이블 batch 조회 → `ContentData` 반환
- [x] 어드민 CRUD API 11개 (`artist-info` / `about-sections` / `page-meta` / `home-sections` / `tracks` / `performances` / `events-info` / `link-platforms` / `contact-info` / `theme` / `site-config`)

### [2026-03-18] 동적 섹션 + pageMeta 시스템

- [x] `DynamicSection` 타입 + `PageMeta` 타입 추가, `Biography` / `DesignPhilosophy` 제거
- [x] `migrations/0002_dynamic_content.sql` — `about_sections` / `about_section_paragraphs` / `about_section_philosophy_items` / `page_meta`
- [x] About 어드민 완전 재작성 — 동적 섹션 ADD/DELETE/순서변경
- [x] 공개 5개 페이지 + 어드민 5개 페이지 PAGE SETTINGS 카드 추가

### [2026-03-17] Phase 4-a: Cloudflare 인프라 기반

- [x] `wrangler.json` — D1(`DB`), R2(`MEDIA`) 바인딩, `nodejs_compat` 플래그
- [x] `open-next.config.ts` — `@opennextjs/cloudflare` 어댑터 설정
- [x] `migrations/0001_initial_schema.sql` — D1 전체 초기 스키마
- [x] `src/lib/db.ts` / `src/lib/auth.ts` / `src/lib/adminAuth.ts`
- [x] `POST /api/auth/login` · `POST /api/auth/logout` · `GET /api/auth/session`
- [x] `src/views/` 제거 → `src/app/` 직접 통합 + 빌드 오류 수정

### [2026-03-17] Phase 3: Next.js 15 App Router 이주

- [x] Vite / React Router 제거 → Next.js 15 (App Router) 전환
- [x] `src/app/` 구조 신규 구축 (공개 그룹 / 어드민 그룹 / API 라우트)
- [x] SSR 가드, hydration 오류 수정, Route Handlers 인증 구현

### [2026-03-17] Phase 1/2: 인프라 정비 + 코드 품질

- [x] Docker 환경 구성 (`Dockerfile`, `docker-compose.yml`, `.dockerignore`)
- [x] 위생 파일 (`gitignore`, `.env.example`) + `.docs/` 문서 폴더 초기화
- [x] 미사용 의존성/파일 제거, 타입 정합성 수정, 하드코딩 제거, i18n 전환, strict mode 활성화
