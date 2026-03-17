# 잔여 작업 목록

> 최종 업데이트: 2026-03-17
> Phase 1(인프라 정비), Phase 2(코드 품질), Phase 3(Next.js 15 App Router 이주) 완료. 이하 Phase 4 잔여 작업 정리.

---

## Phase 4: Cloudflare D1 + R2 통합

### 3-1. Wrangler 설정

- [ ] `wrangler.toml` 생성
  - D1 바인딩: `DB`
  - R2 바인딩: `MEDIA_BUCKET`
  - 빌드 커맨드: `npm run build`, 출력 디렉토리: `out/`
- [ ] `package.json`에 wrangler 관련 스크립트 추가 (`wrangler:dev`, `wrangler:deploy`)
- [ ] `.env.example`에 Cloudflare 관련 변수 추가 (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_API_TOKEN`, `D1_DATABASE_ID`, `R2_BUCKET_NAME`)

### 3-2. D1 데이터베이스 스키마 작성

- [ ] `functions/db/schema.sql` 작성
  - 설정 테이블: `site_config`, `theme_colors`, `ra_api_config`
  - 다국어 콘텐츠 테이블 (`lang` 컬럼 EN/KO): `artist_info`, `biography_paragraphs`, `musical_philosophy`, `design_philosophy_paragraphs`, `home_sections`, `tracks`, `performances`, `events_info`, `events_set_durations`, `events_tech_requirements`, `link_platforms`, `contact_info`
  - 인증 테이블: `admin_users`, `admin_sessions`
  - 미디어 메타데이터 테이블: `media_files`
- [ ] `functions/db/seed.sql` 작성 — 초기 데이터 (현재 localStorage 기준값)

### 3-3. API 엔드포인트 구현 (Cloudflare Pages Functions)

#### 인증

- [ ] `functions/api/auth/login.ts` — `POST`: 비밀번호 검증 → 세션 쿠키 발급
- [ ] `functions/api/auth/logout.ts` — `POST`: 세션 삭제
- [ ] `functions/api/auth/session.ts` — `GET`: 세션 유효성 확인
- [ ] `functions/api/admin/_middleware.ts` — 세션 인증 미들웨어

#### 공개 콘텐츠

- [ ] `functions/api/content/[lang].ts` — `GET`: 전체 공개 콘텐츠 조회 (`en` | `ko`)

#### 어드민 CRUD

- [ ] `functions/api/admin/artist-info.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/biography.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/philosophy.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/home-sections.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/tracks.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/performances.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/events-info.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/link-platforms.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/contact-info.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/theme.ts` — `GET` / `PUT`
- [ ] `functions/api/admin/site-config.ts` — `GET` / `PUT`

#### 미디어

- [ ] `functions/api/media/upload.ts` — `POST`: R2 업로드 (presigned URL 또는 직접 스트리밍)
- [ ] `functions/api/media/[id].ts` — `GET` / `DELETE`

### 3-4. 프론트엔드 서비스 계층 구현

- [ ] `src/services/apiClient.ts` — fetch 래퍼 (base URL, 에러 처리, 타입 `ApiResponse<T>`)
- [ ] `src/services/contentService.ts` — 공개 콘텐츠 API 호출
- [ ] `src/services/adminService.ts` — 어드민 CRUD API 호출
- [ ] `src/services/authService.ts` — 로그인/로그아웃/세션 API 호출
- [ ] `src/services/mediaService.ts` — 미디어 업로드/삭제 API 호출

### 3-5. ContentContext API 전환

- [ ] `src/contexts/ContentContext.tsx`: localStorage 직접 접근 → `contentService` / `adminService` API 호출로 교체
- [ ] 마이그레이션 코드(migration logic) 제거
- [ ] `src/pages/admin/login/page.tsx`: `VITE_ADMIN_PASSWORD` → `POST /api/auth/login` 서버사이드 검증 전환

### 3-6. 데이터 마이그레이션

- [ ] `functions/api/admin/migrate.ts` — `POST`: localStorage JSON → D1 일괄 INSERT 일회성 엔드포인트
- [ ] 마이그레이션 실행 후 엔드포인트 제거

---

## Phase 4: 배포 및 문서화

### 4-1. Cloudflare Pages 배포

- [ ] Cloudflare Pages 프로젝트 생성 및 GitHub 연동
- [ ] D1 데이터베이스 생성: `wrangler d1 create stann-lumo-db`
- [ ] R2 버킷 생성: `wrangler r2 bucket create stann-lumo-media`
- [ ] `wrangler.toml` 바인딩 ID 채우기
- [ ] Cloudflare Pages 환경 변수 설정 (Secrets: `SESSION_SECRET` 등)
- [ ] 배포 테스트: `wrangler pages deploy out/`

### 4-2. 문서 현행화

- [ ] `.docs/TECH_SPEC.md`: D1 스키마 최종판, API 명세 업데이트
- [ ] `.docs/README.md`: 배포 절차, 환경 변수 전체 목록 보강

---

## 기타 개선 (낮은 우선순위)

- [ ] `src/pages/admin/music/page.tsx`: 로컬 `Track` 인터페이스 → `src/types/content.ts`에서 import로 통일
- [ ] `src/types/content.ts` 검토 — 실제 사용 여부 불명확한 타입 정리
- [ ] `admin/events/page.tsx` 한국어 하드코딩 잔존 확인 (`{raPerformances.length}개의 이벤트를 가져왔습니다.`) → i18n 전환
- [ ] R2 미디어 업로드 UI — 어드민 페이지에 이미지/오디오 업로드 기능 추가
- [ ] 어드민 세션 만료 처리 — 토큰 만료 시 자동 로그아웃 및 `/admin` 리다이렉트

---

## 완료된 작업

- [x] **Phase 1**: Docker 환경, 위생 파일(`.gitignore`, `.dockerignore`, `.env.example`), `.docs/` 문서 폴더
- [x] **Phase 2**: 미사용 의존성/파일 제거, 타입 정합성 수정, 하드코딩 제거, i18n 전환, strict mode 활성화, 린트 정상화
- [x] 타입 체크 에러 0개, 린트 경고/에러 0개
- [x] Docker 개발 서버 정상 실행 확인
