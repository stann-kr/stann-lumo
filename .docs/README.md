# Stann Lumo — DJ 포트폴리오

STANN LUMO의 DJ 포트폴리오 및 콘텐츠 관리 시스템.

## 기술 스택

- **프론트엔드**: React 19 + TypeScript + Vite + Tailwind CSS
- **라우팅**: React Router v7
- **국제화**: i18next (EN/KO)
- **배포**: Cloudflare Pages
- **DB (Phase 3)**: Cloudflare D1 (SQLite)
- **스토리지 (Phase 3)**: Cloudflare R2

## 개발 환경 실행

### 사전 요구 사항
- Docker Desktop (Apple Silicon)
- `.env` 파일 생성 (`.env.example` 참고)

### 환경 변수 설정

```bash
cp .env.example .env
# .env 파일을 편집하여 필요한 값 입력
```

### Docker로 개발 서버 실행

```bash
# 이미지 빌드 및 서버 시작
docker compose up

# 백그라운드 실행
docker compose up -d

# 로그 확인
docker compose logs -f web
```

브라우저에서 `http://localhost:3000` 접속.

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

## 프로젝트 구조

```
src/
├── components/
│   ├── base/          # 재사용 베이스 컴포넌트
│   └── feature/       # 레이아웃 컴포넌트
├── contexts/          # React Context (콘텐츠, 언어)
├── hooks/             # 커스텀 훅
├── i18n/              # 국제화 번역 파일
├── pages/             # 라우트 페이지 컴포넌트
│   └── admin/         # 어드민 CMS 페이지
├── router/            # 라우트 설정
├── types/             # TypeScript 타입 정의
└── utils/             # 유틸리티 함수
```

## 어드민 CMS

`/admin` 경로로 접근. `.env`의 `VITE_ADMIN_PASSWORD` 값으로 로그인.

관리 가능 섹션:
- 홈 (`/admin/home`)
- About (`/admin/about`)
- 음악 (`/admin/music`)
- 이벤트 (`/admin/events`)
- 연락처 (`/admin/contact`)
- 링크 (`/admin/link`)
- 테마 (`/admin/theme`)

## 배포 (Cloudflare Pages)

```bash
# 빌드
docker compose run --rm web npm run build

# Wrangler로 배포
npx wrangler pages deploy out/
```

## 관련 문서

- [변경 이력](.docs/CHANGE_LOG.md)
- [기술 명세](.docs/TECH_SPEC.md)
- [기능 요구사항](.docs/REQUIREMENTS.md)
- [트러블슈팅](.docs/TROUBLESHOOTING.md)
