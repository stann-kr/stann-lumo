# 트러블슈팅 이력

> 최신 이슈가 상단에 위치. 신규 항목 추가 시 최상단 카테고리 섹션 내부 첫 번째에 삽입.

---

## 템플릿

```
### [YYYY-MM-DD] 이슈 제목

**발생 상황 및 에러 로그 요약**
- 증상:
- 에러 메시지:

**원인 분석**
-

**해결 방법**
- 적용된 Docker 명령어 및 코드 변경 내역:
```

---

## Cloudflare / 빌드 관련 이슈

### [2026-03-19] `opennextjs-cloudflare build` — `open-next.config.mjs` Permission denied

**발생 상황 및 에러 로그 요약**
- 증상: `opennextjs-cloudflare build` 실행 시 esbuild 단계에서 빌드 실패
- 에러:
  ```
  ✘ [ERROR] Could not resolve "./open-next.config.mjs"
  EACCES: permission denied, open '/app/.open-next/.build/open-next.config.mjs'
  ```
- 같은 디렉토리의 `cache.cjs`, `index.mjs` 등은 정상(`rw-r--r--`); `open-next.config.mjs`만 `--w-------` (0200, write-only)

**원인 분석**
- `@opennextjs/aws`의 `copyOpenNextConfig` 함수가 `fs.copyFileSync`로 임시 디렉토리(`/tmp/open-next-tmp-*`) → 바인드 마운트(`.:/app/.open-next/`)로 파일 복사
- Docker Desktop for Mac의 VirtioFS에서 해당 경로로의 `copyFileSync` 시 읽기 권한 누락(`0200`) 설정
- 기존 `.next/`, `node_modules/`와 동일한 VirtioFS 바인드 마운트 권한 문제

**해결 방법**
- `docker-compose.yml` `volumes`에 `/app/.open-next` 익명 볼륨 추가:
  ```yaml
  volumes:
    - .:/app
    - /app/node_modules
    - /app/.next
    - /app/.open-next    # 추가
  ```
- 바인드 마운트 대신 컨테이너 내부 파일 시스템 사용으로 권한 문제 회피
- `open-next.config.mjs` (수동 생성 중복 파일) 삭제 — `.ts` 컴파일 결과로 대체
- **주의**: 익명 볼륨은 `--rm` 종료 시 삭제되므로 빌드 + 배포는 단일 세션에서:
  ```bash
  docker compose run --rm web sh -c "npx opennextjs-cloudflare build && npx wrangler deploy"
  ```

---

## Apple Silicon / Docker 관련 이슈

### [2026-03-17] wrangler d1 migrations apply --local 실패 (Alpine glibc 부재)

**발생 상황 및 에러 로그 요약**
- 증상: `wrangler d1 migrations apply stann-lumo-db --local` 실행 시 workerd 바이너리 실행 불가
- 에러: `Error: spawn .../workerd ENOENT` → `ldd` 확인 시 `ld-linux-aarch64.so.1: No such file or directory`

**원인 분석**
- Alpine Linux는 `musl` libc 사용; Cloudflare `workerd` 바이너리는 `glibc(ld-linux-aarch64.so.1)` 동적 링크 대상
- Alpine 컨테이너에서 glibc 기반 바이너리 실행 불가 — 설치되어 있어도 로더가 없어 `ENOENT` 반환

**해결 방법**
- 로컬 D1 에뮬레이션 대신 `--remote` 플래그로 실제 Cloudflare D1에 직접 마이그레이션 적용
- `docker compose run --rm web sh -c "npx wrangler d1 migrations apply stann-lumo-db --remote"`
- **주의:** `wrangler dev` (로컬 Workers 에뮬레이션)도 동일한 이유로 Alpine 환경에서 불가 — 최종 검증은 `--remote` 또는 실제 CF Workers 배포로 진행

---

### [2026-03-17] 초기 Docker 환경 구축 (ARM64 바이너리 충돌)

**발생 상황**
Apple Silicon(ARM64) 환경에서 Docker 이미지 빌드 시 x86 바이너리 충돌 가능성.

**원인 분석**
macOS ARM64와 Linux x86_64 간 네이티브 바인딩 패키지 이진 호환성 문제.

**해결 방법**
- `Dockerfile`에 `FROM --platform=linux/arm64 node:22-alpine` 명시
- `docker-compose.yml`에 `platforms: linux/arm64` 명시
- `node_modules` 익명 볼륨으로 호스트-컨테이너 간 바이너리 충돌 방지

---

## Next.js 빌드 관련 이슈

### [2026-03-17] `<Html> should not be imported outside of pages/_document` 빌드 오류

**발생 상황 및 에러 로그 요약**
- 증상: `npm run build` 실행 시 정적 페이지 생성 단계에서 빌드 실패
- 에러:
  ```
  Generating static pages (0/5) ...
  Error: <Html> should not be imported outside of pages/_document.
  Error occurred prerendering page "/404".
  Export encountered an error on /_error: /404, exiting the build.
  ```

**원인 분석**
- `docker-compose.yml`에 `NODE_ENV=development` 설정 → `npm run build` 실행 시 비표준 NODE_ENV 값 전달됨
- `next build`는 `NODE_ENV=production` 전제로 동작; `development` 환경에서는 Pages Router 렌더링 경로(`_error.js`)를 `/404` 정적 생성에 사용
- Pages Router `_error.js`가 `next/document`의 `Html` 컴포넌트를 호출하는데, App Router 컨텍스트에서 `HtmlContext`가 설정되지 않아 가드(guard) 발동
- 오류 발생 전체 체인: `development` 모드 → `/404` 정적 생성 → `_error.js` Pages Router 폴백 → `Html` 컴포넌트 → `HtmlContext` 없음 → 에러

**해결 방법**
- `package.json` build 스크립트에 `NODE_ENV=production` 명시적 지정:
  ```json
  "build": "NODE_ENV=production next build"
  ```
- docker-compose 환경변수(`NODE_ENV=development`)가 빌드에 영향을 주지 않음
- 추가적으로 `src/app/not-found.tsx` → Server Component로 변환 + `export const dynamic = 'force-dynamic'` 추가 (보조적 조치)
- 빌드 검증 명령어: `docker compose run --rm web npm run build`
