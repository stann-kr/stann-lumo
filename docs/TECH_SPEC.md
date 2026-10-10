# 기술 명세

## 아키텍처 개요

`stann-lumo`는 Next.js App Router 기반 artist web app이다. public route group은 서버의 safe projection을 받고, admin dashboard route group은 인증 뒤 편집용 content context를 사용한다. Cloudflare 배포는 OpenNext worker와 Wrangler binding을 기준으로 한다.

```text
src/app/(public)/
└─ PublicSiteShell + public pages
src/app/admin/
└─ AdminLayout + dashboard pages
Cloudflare
├─ D1 binding: DB
└─ R2 binding: MEDIA
```

## 실제 소스 기준

| 영역 | 파일/경로 | 확인 내용 |
|---|---|---|
| Public routes | `src/app/(public)/` | home, about, music, events, archive, contact, link |
| Admin routes | `src/app/admin/(dashboard)/` | home, about, contact, link, music, events, archive, theme |
| Public shell | `src/components/feature/PublicSiteShell.tsx` | navigation, language, focus, signal links |
| 3D scene | `src/components/feature/Scene3D.tsx` | 보관된 모듈; 공개 shell에서는 미사용 |
| Admin content | `src/contexts/ContentContext.tsx` | 편집용 콘텐츠 bootstrap과 상태 |
| Terminal capability | `src/capabilities/terminal/` | 설정 contract, D1 persistence, API client |
| Language | `src/contexts/LanguageContext.tsx` | language state |
| Deploy | `wrangler.json` | Cloudflare route, D1, R2 binding |

## 런타임과 프레임워크

| 영역 | 값 |
|---|---|
| Framework | Next.js 16 |
| Runtime | Node.js 22 이상 |
| React | 19 |
| Language | TypeScript 5.8 |
| Motion | GSAP, Framer Motion, SplitType |
| 3D | Three.js, React Three Fiber, Drei, Postprocessing |
| i18n | i18next, react-i18next |
| Deploy | OpenNext for Cloudflare, Wrangler |
| Storage | Cloudflare D1, R2 |

## 주요 모듈

| 모듈 | 역할 |
|---|---|
| `PublicSiteShell.tsx` | public site shell, navigation, focus, signal links |
| `PageLayout.tsx` | public page frame |
| `AdminLayout.tsx` | admin dashboard shell |
| `ProtectedRoute.tsx` | admin route protection boundary |
| `ContentContext.tsx` | admin content bootstrap and edit state |
| `src/capabilities/terminal/` | terminal config contract, persistence, client boundary |
| `LanguageContext.tsx` | language state |
| `Scene3D.tsx` | 보관된 3D 모듈; 공개 shell에서는 미사용 |
| `SignalNet.tsx` | STANN OS signal network 표시 |
| `wrangler.json` | Cloudflare route and binding config |

홈 미리보기는 `HomeProjection`에서 음악 3개·공연 2개·이미지 3개까지 조회하고 화면에 필요한 공개 필드만 전달한다. 관리자 전체 content provider는 공개 route에 연결하지 않는다.

## 데이터 모델과 저장소

Cloudflare resources:

| Binding | Resource | 용도 |
|---|---|---|
| `DB` | D1 database `stann-lumo-db` | content/admin data |
| `MEDIA` | R2 bucket `stann-lumo-media` | media asset storage |

상세 schema와 migration 절차는 deployment/runbook 보강 시 별도 문서화한다.

공개 `GET /api/content/[lang]`은 화면 표시용 콘텐츠만 반환한다. 관리자 전용 외부 이벤트 연동 설정은 별도의 인증 API에서 관리하며 공개 응답과 브라우저 저장소에 포함하지 않는다. 공개 콘텐츠 응답은 현재 `Cache-Control: no-store, max-age=0`을 사용한다.

## 인증과 권한

- public route는 방문자에게 공개된다.
- admin route는 `ProtectedRoute`와 admin dashboard 구조를 기준으로 보호한다.
- 관리자 외부 이벤트 연동 설정 API는 저장 여부만 반환하며, 실제 API key는 서버 전용 모듈에서만 읽는다. 빈 key 업데이트는 기존 값을 보존하고 명시적 삭제 요청만 저장 값을 제거한다.
- 관리자 외부 이벤트 연동 API의 성공·오류·인증 실패 응답은 모두 private/no-store 정책을 적용한다.
- admin 인증/권한의 상세 정책은 실제 구현과 함께 별도 최신화가 필요하다.

## 환경 변수와 설정

| 항목 | 설명 | 공개 가능 여부 |
|---|---|---|
| `NODE_ENV` | build/dev mode | 가능 |
| `.env` | Next.js/OpenNext 공개 URL 설정 | allowlist 값만 가능 |
| `.dev.vars` | local wrapper가 관리자 비밀번호만 일회성 Worker 환경으로 투영 | 파일명·키 이름만 가능 |
| `DB` | Cloudflare D1 binding | binding 이름만 가능 |
| `MEDIA` | Cloudflare R2 binding | binding 이름만 가능 |
| Cloudflare token/account | 배포 인증 | 실값 금지 |

## 배포와 운영

배포는 OpenNext Cloudflare build 후 Wrangler deploy를 기준으로 한다.

```bash
npm run deploy
```

상세 절차는 [배포 가이드](./DEPLOYMENT.md)를 따른다.

## 테스트와 검증

```bash
npm run lint
npm test
npm run test:env
npm run test:local-config
npm run type-check
npm run build:cloudflare
```

Cloudflare build는 token sync, OpenNext 환경 변수 allowlist, Worker build, 생성된 환경 변수 산출물 allowlist를 순서대로 검사한다.

## 변경 시 같이 볼 파일

| 변경 영역 | 함께 확인할 파일 |
|---|---|
| public route 변경 | `src/app/(public)/**`, `README.md`, `REQUIREMENTS.md` |
| admin 기능 변경 | `src/app/admin/**`, `ProtectedRoute.tsx`, `TECH_SPEC.md` |
| content schema 변경 | `ContentContext.tsx`, D1 migration, `DEPLOYMENT.md` |
| Cloudflare binding 변경 | `wrangler.json`, `DEPLOYMENT.md`, `TROUBLESHOOTING.md` |
| 디자인 토큰 변경 | `DESIGN_SYSTEM.md`, `scripts/check-token-sync.mjs` |

## 문서 최신성 기준

다음 변경 시 이 문서를 갱신한다.

- public/admin route 구조 변경
- D1/R2 binding 변경
- admin 인증/권한 정책 변경
- deployment command 또는 OpenNext/Wrangler config 변경
- STANN OS signal link grammar 변경

## 알려진 기술 부채

- admin 권한 경계의 상세 정책은 실제 구현 기준으로 재검토가 필요하다.
