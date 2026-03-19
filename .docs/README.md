# STANN LUMO — DJ 포트폴리오 + CMS

> 최종 업데이트: 2026-03-19

STANN LUMO의 DJ 포트폴리오 사이트 및 콘텐츠 관리 시스템.

---

## 기술 스택

| 항목 | 내용 |
|------|------|
| 프레임워크 | Next.js 15.5 (App Router) |
| 런타임 | Cloudflare Workers (`nodejs_compat`) |
| 배포 어댑터 | `@opennextjs/cloudflare` v1.17.1 |
| DB | Cloudflare D1 (SQLite) — `stann-lumo-db` |
| 스토리지 | Cloudflare R2 — `stann-lumo-media` |
| 국제화 | i18next (EN/KO) |
| 스타일 | Tailwind CSS v3 |
| 개발 환경 | Docker (Node 22 Alpine, `linux/arm64`) |

---

## 개발 환경 실행

### 사전 요구 사항

- Docker Desktop (Apple Silicon)
- `.env` 파일 생성 (`.env.example` 참고)

### 환경 변수 설정

```bash
cp .env.example .env
# .env 파일 편집 후 필요한 값 입력
```

**필수 환경 변수:**

| 변수명 | 설명 |
|--------|------|
| `ADMIN_PASSWORD` | 어드민 로그인 비밀번호 |
| `NEXT_PUBLIC_TERMINAL_URL` | 외부 터미널 URL |
| `NEXT_PUBLIC_FORM_ENDPOINT` | 폼 제출 엔드포인트 |
| `CLOUDFLARE_ACCOUNT_ID` | Cloudflare 계정 ID |
| `CLOUDFLARE_API_TOKEN` | Cloudflare API 토큰 |

### 개발 서버 실행

```bash
# 이미지 빌드 및 서버 시작
docker compose up

# 백그라운드 실행
docker compose up -d

# 로그 확인
docker compose logs -f web
```

브라우저에서 `http://localhost:3000` 접속.

> 개발 서버에서는 D1/R2 미연결 — API 실패 시 ContentContext 기본값으로 폴백.

### 패키지 관리

```bash
# 패키지 설치
docker compose run --rm web npm install <package>

# 전체 의존성 재설치
docker compose run --rm web npm install
```

### 타입 체크 / 린트

```bash
docker compose run --rm web npm run type-check
docker compose run --rm web npm run lint
```

---

## 프로젝트 구조

```
src/
├── app/
│   ├── layout.tsx              # Root layout (Server Component)
│   ├── Providers.tsx           # Client — i18n + Context 공급자
│   ├── (public)/               # 공개 페이지 그룹 (TerminalLayout)
│   │   ├── page.tsx            # /
│   │   ├── about/page.tsx      # /about
│   │   ├── music/page.tsx      # /music
│   │   ├── events/page.tsx     # /events
│   │   ├── contact/page.tsx    # /contact
│   │   ├── link/page.tsx       # /link
│   │   └── gallery/page.tsx    # /gallery
│   ├── admin/
│   │   ├── page.tsx            # /admin (로그인)
│   │   └── (dashboard)/        # 어드민 페이지 그룹 (ProtectedRoute)
│   │       ├── home/page.tsx
│   │       ├── about/page.tsx
│   │       ├── music/page.tsx
│   │       ├── events/page.tsx
│   │       ├── contact/page.tsx
│   │       ├── link/page.tsx
│   │       ├── theme/page.tsx
│   │       └── gallery/page.tsx
│   └── api/
│       ├── auth/               # login / logout / session
│       ├── content/[lang]/     # 공개 콘텐츠 API
│       ├── gallery/            # 공개 갤러리
│       ├── media/[id]/         # R2 미디어 프록시
│       └── admin/              # 어드민 CRUD API (19개)
├── components/
│   ├── base/                   # 공통 UI (RadioGroup 등)
│   └── feature/                # 레이아웃 (TerminalLayout, AdminLayout, PageLayout 등)
├── contexts/                   # ContentContext, LanguageContext
├── lib/                        # db.ts, auth.ts, adminAuth.ts
├── services/                   # apiClient, contentService, adminService, authService
├── types/                      # content.ts, displaySettings.ts
├── utils/                      # displaySettingsMap, colorMix, raApi 등
└── i18n/                       # en / ko 번역 파일
migrations/
├── 0001_initial_schema.sql
├── 0002_dynamic_content.sql
├── 0003_gallery.sql
├── 0004_gallery_media.sql
└── 0005_display_settings.sql
```

---

## 어드민 CMS

`/admin` 경로 접근 → `ADMIN_PASSWORD`로 로그인.

| 어드민 페이지 | 관리 콘텐츠 |
|--------------|------------|
| `/admin/home` | 홈 섹션 카드, 터미널 정보, Display Settings |
| `/admin/about` | 아티스트 정보, 동적 섹션, Display Settings |
| `/admin/music` | 트랙 목록, Display Settings |
| `/admin/events` | 공연 일정, RA API 설정, Display Settings |
| `/admin/contact` | 연락처, 이벤트 정보, Display Settings |
| `/admin/link` | 링크 플랫폼, Display Settings |
| `/admin/theme` | 테마 색상, Global Display Settings |
| `/admin/gallery` | 사진/동영상 업로드, 갤러리 레이아웃 설정 |

---

## 배포

→ 상세 절차는 `.docs/DEPLOYMENT.md` 참고.

```bash
# D1 마이그레이션 적용
docker compose run --rm web sh -c "npx wrangler d1 migrations apply stann-lumo-db --remote"

# 빌드 + 배포 (단일 세션 필수)
docker compose run --rm web npm run deploy
```

---

## 관련 문서

| 문서 | 내용 |
|------|------|
| [배포 가이드](.docs/DEPLOYMENT.md) | 단계별 배포 절차, 명령어, 체크리스트 |
| [변경 이력](.docs/CHANGE_LOG.md) | Phase별 변경 사항 (최신순) |
| [잔여 작업](.docs/TASKS.md) | 완료/미완료 태스크 (최신순) |
| [기술 명세](.docs/TECH_SPEC.md) | 아키텍처, DB 스키마, API 설계 |
| [트러블슈팅](.docs/TROUBLESHOOTING.md) | 에러 해결 이력 (최신순) |
