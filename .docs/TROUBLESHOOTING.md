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

### [2026-03-19] 어드민 로그인 실패 — `getCloudflareContext` 잘못된 import

**발생 상황 및 에러 로그 요약**
- 증상: Cloudflare Dashboard Variables에 `ADMIN_PASSWORD` 설정했으나 로그인 시 "비밀번호 불일치" 오류
- 원인 확인: `src/lib/db.ts`의 `getRequestCtx()`가 CF Workers 런타임에서 `null` 반환 → `ADMIN_PASSWORD = ''` 폴백

**원인 분석**
- 기존 코드: `require('@opennextjs/cloudflare').getRequestContext` — 함수가 존재하지 않아 `null` 반환
- `@opennextjs/cloudflare` v1.17.1 실제 export: `getCloudflareContext` (이전 버전의 `getRequestContext`와 다름)
- `null` 반환 → `getEnv()` 폴백: `process.env.ADMIN_PASSWORD` (undefined) → `''` 빈 문자열
- 추가로 `wrangler.json`의 `"vars": { "ADMIN_PASSWORD": "" }` 빈 값이 Dashboard Variable을 덮어쓰는 구조적 문제도 병존

**해결 방법**
- `src/lib/db.ts`: `require()` dynamic → `import { getCloudflareContext } from '@opennextjs/cloudflare'` 정적 import 전환
  ```ts
  import { getCloudflareContext } from '@opennextjs/cloudflare';
  function getRequestCtx() { try { return getCloudflareContext(); } catch { return null; } }
  ```
- `wrangler.json`: `"vars": { "ADMIN_PASSWORD": "" }` → `"vars": {}` 로 수정 (빈 값 제거)
- Cloudflare Dashboard → Workers → Settings → Variables에서 `ADMIN_PASSWORD` 설정 후 재배포

---

### [2026-03-19] Cloudflare 자동 배포 빌드 오류 — `eslint-config-next` Unexpected array

**발생 상황 및 에러 로그 요약**
- 증상: Cloudflare Add Application CI/CD 빌드 실패
- 에러:
  ```
  ⨯ ESLint: Unexpected array.
  ```

**원인 분석**
- `eslint-config-next` v16+는 ESLint flat config 형식에서 배열(Array)을 default export로 반환
- `eslint.config.ts`에서 배열을 config 항목에 직접 포함 시 ESLint "Unexpected array" 오류 발생
- v15 이하에서는 단일 객체 반환이었으나 v16부터 배열로 변경됨

**해결 방법**
- `eslint.config.ts`에서 `Array.isArray` 체크 후 스프레드 처리:
  ```ts
  ...(Array.isArray(nextPlugin) ? nextPlugin : [nextPlugin]) as any[],
  ```

---

### [2026-03-19] Cloudflare 자동 배포 빌드 오류 — `getRequestContext` not exported

**발생 상황 및 에러 로그 요약**
- 증상: Cloudflare Add Application CI/CD 빌드 실패
- 에러:
  ```
  Type error: Module '"@opennextjs/cloudflare"' has no exported member 'getRequestContext'.
  ```

**원인 분석**
- `@opennextjs/cloudflare` v1.17.1의 실제 export명은 `getCloudflareContext`
- 정적 import `import { getRequestContext } from '@opennextjs/cloudflare'` → 타입 오류 발생

**해결 방법**
- import명을 `getCloudflareContext`로 수정

---

### [2026-03-19] Cloudflare 자동 배포 빌드 오류 — `wrangler versions upload` 진입점 미지정

**발생 상황 및 에러 로그 요약**
- 증상: Cloudflare Add Application CI/CD 빌드/업로드 실패
- 에러:
  ```
  Missing entry-point to Worker script
  ```

**원인 분석**
- Cloudflare Add Application은 내부적으로 `wrangler versions upload` 사용
- `wrangler.json`에 `"main"` 필드가 없으면 Worker 스크립트 진입점을 찾지 못함

**해결 방법**
- `wrangler.json`에 `"main": ".open-next/worker.js"` 추가
- `"assets": { "directory": ".open-next/assets" }` 추가로 정적 자산 404도 동시 해결

---

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
