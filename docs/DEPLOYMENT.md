# 배포 가이드

## 개요

`stann-lumo`는 OpenNext for Cloudflare와 Wrangler를 사용해 Cloudflare에 배포한다. D1 database와 R2 bucket binding을 사용한다.

## 배포 대상

| Git branch | Worker | URL/traffic | D1 | R2 |
|---|---|---|---|---|
| feature/fix branch | `stann-lumo-dev` preview version | preview URL, 고정 traffic 없음 | `stann-lumo-db-dev` | `stann-lumo-media-dev` |
| `dev` | `stann-lumo-dev` | 고정 development Worker | `stann-lumo-db-dev` | `stann-lumo-media-dev` |
| `main` | `stann-lumo` | `lumo.stann.kr` production traffic | `stann-lumo-db` | `stann-lumo-media` |

두 Worker 모두 `worker.ts` custom entrypoint에서 `.open-next/worker.js`의 fetch handler를 재사용하고 `.open-next/assets`를 사용한다. D1 binding은 `DB`, R2 binding은 `MEDIA`로 동일하지만 resource ID와 bucket은 환경별로 분리한다.

production Worker의 정기 RA 수집은 **매주 일요일 04:15 KST**이며 기준일은 2026-09-13이다. Cron은 매일 04:15 KST에 실행 필요 여부만 확인한다. 정상 수집은 7일 주기를 유지하고, 정기 수집 실패 시 하루 간격으로 최대 두 번 재시도한다. 배포·장애로 정기 실행을 놓쳤으면 다음 일일 확인에서 최근 누락 주기를 한 번 보충한다. development Worker와 preview에는 Cron Trigger를 등록하지 않는다.

동기화는 공식 `GetEvents` 응답의 새 이벤트만 `ra-{eventId}`로 추가한다. 기존 RA ID, 관리자 수정값과 포스터 연결은 교체하지 않는다. 조회 범위는 관리자에 저장된 RA `option`과 `year`를 사용하므로 고정 연도를 설정했다면 다음 해 운영 전에 확인한다. 플라이어 자동 저장은 포함하지 않는다.

관리자 Events의 `RA AUTOMATIC SYNC`에서 최근 결과, 마지막 성공, 다음 실행/재시도와 제외 목록을 확인할 수 있다. `SYNC RA NOW`는 서버에서 즉시 저장하며, 편집 중인 이벤트와 RA 설정을 먼저 저장해야 한다. 동시 실행은 잠금으로 막고 수동 재시도는 최소 1분 간격으로 제한한다.

RA 이벤트를 삭제하고 저장하면 수집 제외 목록에도 기록된다. `RESTORE`는 제외만 해제하며 다음 수동·정기 수집 때 다시 가져온다. 오래된 관리자 목록을 저장하면 409 충돌로 거부하고 입력은 유지한다. 최신 목록을 다시 불러오는 조작은 미저장 이벤트 편집을 버리므로 확인 후 사용한다. 포스터는 이벤트 편집을 저장한 상태에서 변경한다.

## RA 운영 스키마

`0002_ra_sync_operations.sql`은 상태·실행 잠금을 위한 `ra_sync_state`, 제외 목록인 `ra_event_exclusions`와 이벤트 변경 버전을 갱신하는 트리거를 추가한다. 기존 공연·포스터 데이터는 변경하지 않는다. 이벤트 API와 Cron을 배포하기 전에 대상 환경에 이 migration을 별도로 적용해야 한다.

승인된 순서는 개발 D1 migration → 개발 코드 배포·검증 → 운영 D1 migration → 운영 코드 배포·검증이다. 코드 롤백 시 추가 테이블은 남겨두며, 구버전 코드에는 충돌·제외 보호가 없으므로 자동 수집을 운영하지 않는다. 배포 인증에는 대상 Workers와 D1 권한이 필요하며 인증값을 저장소에 넣지 않는다.

## 사전 체크리스트

- Cloudflare/Wrangler 인증이 유효해야 한다.
- production과 development의 D1 database와 R2 bucket이 각각 존재해야 한다.
- 필요한 secret과 환경 변수 실값은 배포 환경에만 저장한다.
- token sync 검사가 통과해야 한다.
- OpenNext가 읽는 `.env*`에는 허용된 공개 URL 설정만 둔다. local wrapper는 git-ignored `.dev.vars`에서 관리자 비밀번호만 일회성 Worker 환경으로 전달하고 Cloudflare credential을 배제한다. production 값은 Cloudflare secret 또는 binding으로 제공한다.
- 표준 `npm run build`는 `.next-build`를 사용하지만, Cloudflare Workers Builds에서는 OpenNext 호환을 위해 `.next`를 생성한다.

## 로컬 검증

```bash
npm run lint
npm test
npm run test:env
npm run test:local-config
npm run type-check
npm run build:cloudflare
```

## Workers Builds 계약

- feature/fix branch는 `npm run build:cloudflare` 뒤 `npm run deploy:preview:artifact`를 실행한다.
- `dev`는 `npm run build:cloudflare` 뒤 `npm run deploy:dev:artifact`를 실행한다.
- `main`은 `npm run build:cloudflare` 뒤 `npm run deploy:production:artifact`를 실행한다.
- deploy guard는 `WORKERS_CI_BRANCH`와 `WORKERS_CI_COMMIT_SHA`를 확인해 다른 branch의 배포를 거부한다.
- production Worker에는 `main` trigger만 연결하고, feature와 `dev` trigger는 development Worker에 연결한다.

초기 development Worker 생성이나 복구가 필요할 때만 승인 후 `npm run deploy:dev`를 사용한다. 이 명령은 development 환경만 허용한다. 로컬 production deploy 명령은 제공하지 않으며 production은 승인된 `main` merge의 Workers Builds trigger로만 배포한다.

development D1 migration은 code deploy와 분리한다. 승인된 schema 변경에 한해 다음 명령을 별도로 실행한다.

```bash
npm run d1:dev:apply
```

## 배포 후 확인

- `https://lumo.stann.kr` 접속 확인.
- public route와 admin route 기본 응답 확인.
- D1/R2 의존 기능 smoke test.
- 보안 header와 static asset 응답 확인.

## 주의사항

- Cloudflare token, account id, secret 값은 공개 문서와 git history에 기록하지 않는다.
- D1/R2 binding 이름은 공개 가능하지만 실 인증값은 공개하지 않는다.
- `dev` PR merge는 development 자동 배포까지 포함한다.
- `main` PR 생성은 production merge·deploy 승인이 아니다. `main` merge 전에는 production 승인을 다시 확인한다.
- migration, secret, D1/R2 data와 route 변경은 code deploy와 별도 경계로 취급한다.
