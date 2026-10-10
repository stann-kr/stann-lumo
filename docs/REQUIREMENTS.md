# 요구사항

## 목적

`stann-lumo`는 Stann Lumo의 음악가 정체성을 archive와 live-facing 웹 표면으로 제공한다. 방문자는 음악, 공연, archive, contact/link 정보를 탐색할 수 있고, 운영자는 admin dashboard를 통해 콘텐츠를 관리할 수 있어야 한다.

## 범위

포함 범위:

- 공개 artist site route 제공
- music, events, archive, about, contact, link 페이지 제공
- 다국어 콘텐츠와 language context 제공
- 상단 공개 탐색과 펼침 패널 홈, 콘텐츠별 목록·상세 제공
- admin dashboard에서 home/about/contact/link/music/events/archive/theme 관리
- Cloudflare D1/R2 기반 데이터와 media storage 연동

제외 범위:

- stann-web hub 기능의 중복 구현
- TERMINAL live interface 기능의 중복 구현
- 결제/티켓팅 시스템 자체 구현

## 사용자와 역할

| 역할 | 설명 | 주요 행동 |
|---|---|---|
| 방문자 | Stann Lumo 음악/공연 정보를 확인하는 사용자 | music, events, archive, contact, link 탐색 |
| 팬/협업자 | 음악과 공연 맥락을 확인하는 사용자 | release/event/archive link 확인 |
| 운영자 | 사이트 콘텐츠를 관리하는 사용자 | admin dashboard에서 콘텐츠 수정 |
| 개발자 | 앱과 배포를 유지하는 사용자 | D1/R2, OpenNext, Wrangler, build 검증 |

## 기능 요구사항

| ID | 요구사항 | 검증 기준 |
|---|---|---|
| FR-001 | public site는 home, about, music, events, archive, contact, link route를 제공해야 한다. | `src/app/(public)/` route가 존재하고 탐색 가능하다. |
| FR-002 | admin dashboard는 주요 콘텐츠 영역을 관리할 수 있어야 한다. | `src/app/admin/(dashboard)/` 하위 관리 page가 존재한다. |
| FR-003 | 사용자는 언어 전환을 통해 콘텐츠를 볼 수 있어야 한다. | `LanguageContext`와 i18next 기반 UI가 동작한다. |
| FR-004 | public site는 CMS 순서의 홈 패널과 콘텐츠별 목록·미디어 상세를 제공해야 한다. | `PublicSiteShell`과 화면별 client가 기존 route·언어·키보드 탐색을 유지한다. |
| FR-005 | Cloudflare D1/R2 binding을 통해 데이터와 media storage를 운영할 수 있어야 한다. | `wrangler.json`에 DB/MEDIA binding이 정의되어 있다. |

## 비기능 요구사항

| ID | 요구사항 | 검증 기준 |
|---|---|---|
| NFR-001 | build 전 token sync 검사가 실행되어야 한다. | `prebuild` script가 `scripts/check-token-sync.mjs`를 실행한다. |
| NFR-002 | TypeScript typecheck가 통과해야 한다. | `npm run type-check`가 통과한다. |
| NFR-003 | lint는 unused disable directive와 warning을 엄격하게 처리해야 한다. | `npm run lint`가 warning 0 기준으로 동작한다. |

## 미해결 질문

- admin 인증 방식과 운영 권한 경계의 공개 문서화 수준.
- archive/media 콘텐츠의 장기 schema와 migration 정책.
- stann-web hub와 stann-lumo archive 사이의 CTA grammar 최종 기준.
