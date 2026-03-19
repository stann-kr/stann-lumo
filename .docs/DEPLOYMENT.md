# 배포 가이드 — STANN LUMO

> 최종 업데이트: 2026-03-19
> 대상 환경: Apple Silicon Mac + Docker → Cloudflare Workers

---

## 개요

| 항목 | 값 |
|------|-----|
| 런타임 | Cloudflare Workers (nodejs_compat) |
| 어댑터 | @opennextjs/cloudflare v1.17.1 |
| DB | Cloudflare D1 (stann-lumo-db) |
| 스토리지 | Cloudflare R2 (stann-lumo-media) |
| 빌드 환경 | Docker (linux/arm64) |

> **주의**: 로컬 Mac에 Node.js/npm이 없으므로 모든 명령어는 Docker 컨테이너 내부에서 실행.

---

## 사전 체크리스트

배포 전 아래 항목 확인 필수.

### 1. Cloudflare Dashboard 환경 변수 설정

Workers & Pages → stann-lumo → Settings → Environment Variables

| 변수명 | 타입 | 설명 |
|--------|------|------|
| `ADMIN_PASSWORD` | Secret | 어드민 로그인 비밀번호 |

> `NEXT_PUBLIC_*` 변수는 빌드 타임 인라인 → Dashboard 설정 불필요.
> R2/D1 바인딩은 `wrangler.json`으로 자동 설정됨.

### 2. D1 마이그레이션 상태 확인

```bash
docker compose run --rm web sh -c "npx wrangler d1 migrations list stann-lumo-db --remote"
```

미적용 마이그레이션이 있으면 배포 전 반드시 적용 (→ [D1 마이그레이션 적용](#d1-마이그레이션-적용) 참고).

### 3. R2 버킷 존재 확인

```bash
docker compose run --rm web sh -c "npx wrangler r2 bucket list"
```

`stann-lumo-media` 버킷이 없으면 생성:

```bash
docker compose run --rm web sh -c "npx wrangler r2 bucket create stann-lumo-media"
```

---

## 배포 절차

### Step 1 — D1 마이그레이션 적용

```bash
docker compose run --rm web sh -c "npx wrangler d1 migrations apply stann-lumo-db --remote"
```

- 모든 `.sql` 파일을 순서대로 적용 (`migrations/` 디렉토리 기준)
- 이미 적용된 마이그레이션은 자동 스킵
- 신규 마이그레이션만 실행됨

**마이그레이션 파일 목록 (2026-03-19 기준)**:

| 파일 | 내용 |
|------|------|
| `0001_initial_schema.sql` | 전체 초기 스키마 (콘텐츠 + 인증 테이블) |
| `0002_dynamic_content.sql` | About 동적 섹션 + page_meta |
| `0003_gallery.sql` | gallery_photos 기초 |
| `0004_gallery_media.sql` | 미디어 타입 확장 + gallery_settings |
| `0005_display_settings.sql` | display_settings 전 페이지 설정 |

### Step 2 — 빌드 + 배포 (단일 세션)

```bash
docker compose run --rm web sh -c "npx opennextjs-cloudflare build && npx wrangler deploy"
```

또는 `package.json` 스크립트 사용:

```bash
docker compose run --rm web npm run deploy
```

> **중요**: `.open-next/` 빌드 결과물은 익명 볼륨에 저장됨.
> `--rm` 종료 시 볼륨이 삭제되므로 빌드와 배포는 **반드시 같은 `sh -c` 세션**에서 실행.

### Step 3 — 배포 확인

```bash
# 배포된 Workers 목록 확인
docker compose run --rm web sh -c "npx wrangler deployments list"

# 실시간 로그 확인 (트래픽 발생 시)
docker compose run --rm web sh -c "npx wrangler tail"
```

---

## 초기 데이터 마이그레이션 (최초 1회)

D1에 기존 콘텐츠를 채워야 하는 경우 (최초 배포 후 1회만 실행):

1. 브라우저에서 `https://[your-workers-url]/admin` 접속 → 로그인
2. 어드민 패널에서 콘텐츠 직접 입력 (추천)

또는 `POST /api/admin/migrate` 엔드포인트 활용 (기존 localStorage 데이터가 있는 경우):

```bash
curl -X POST https://[your-workers-url]/api/admin/migrate \
  -H "Cookie: session=[your-session-token]" \
  -H "Content-Type: application/json" \
  -d '{ ...MultiLanguageContent JSON... }'
```

> 마이그레이션 완료 후 `/api/admin/migrate` 라우트 삭제 권장 (일회성 엔드포인트).

---

## 콘텐츠 업데이트 후 재배포

콘텐츠(어드민에서 DB 편집)는 재배포 없이 즉시 반영됨.
코드 변경 시에만 재배포 필요:

```bash
docker compose run --rm web npm run deploy
```

---

## 환경별 빌드 구분

| 구분 | 명령어 |
|------|--------|
| 개발 서버 | `docker compose up` |
| Next.js 프로덕션 빌드 확인 | `docker compose run --rm web npm run build` |
| Cloudflare 빌드만 | `docker compose run --rm web sh -c "npx opennextjs-cloudflare build"` |
| 빌드 + 배포 | `docker compose run --rm web npm run deploy` |
| 배포 + 로그 | `docker compose run --rm web sh -c "npx opennextjs-cloudflare build && npx wrangler deploy && npx wrangler tail"` |

---

## 알려진 주의사항

### VirtioFS 파일 권한 문제 (해결됨)

- **증상**: `opennextjs-cloudflare build` 시 `open-next.config.mjs Permission denied`
- **원인**: Docker Desktop VirtioFS에서 `fs.copyFileSync` → 바인드 마운트 시 `--w-------` (0200) 권한 설정됨
- **해결**: `docker-compose.yml`에 `/app/.open-next` 익명 볼륨 추가 (현재 적용됨)

### wrangler dev 로컬 에뮬레이션 불가 (Alpine 환경)

- **증상**: `wrangler dev` 실행 시 `workerd ENOENT`
- **원인**: Alpine Linux(musl) — Cloudflare workerd는 glibc 동적 링크
- **해결**: 로컬 에뮬레이션 대신 `--remote` 플래그 또는 실제 배포로 검증

---

## 트러블슈팅

### 빌드 실패 시 로그 확인

```bash
# 빌드 실패 상세 로그
docker compose run --rm web sh -c "npx opennextjs-cloudflare build 2>&1 | tail -50"
```

### D1 마이그레이션 실패 시

```bash
# 마이그레이션 이력 확인
docker compose run --rm web sh -c "npx wrangler d1 migrations list stann-lumo-db --remote"

# 특정 마이그레이션만 적용
docker compose run --rm web sh -c "npx wrangler d1 execute stann-lumo-db --remote --file=migrations/0005_display_settings.sql"
```

### 배포 후 500 에러 시

```bash
# Workers 실시간 로그
docker compose run --rm web sh -c "npx wrangler tail --format=pretty"
```

---

## 관련 문서

- `.docs/TECH_SPEC.md` — 전체 기술 명세 (API, DB 스키마)
- `.docs/TROUBLESHOOTING.md` — 에러 해결 이력
- `wrangler.json` — Cloudflare 리소스 바인딩 설정
- `open-next.config.ts` — Workers 어댑터 설정
