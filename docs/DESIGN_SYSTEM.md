# 디자인 시스템

공개 사이트는 v5 판(plate) 체계를 쓴다. 검정 바탕 위에 각진 판을 간격으로 나누고, 붉은색은 신호에만 쓴다. 시안 원본은 Artifact Design 캔버스(https://claude.ai/artifact/LsKdx338m7MYQNUuEREhYQ)의 v5 보드다. 코드가 보드와 달라지는 UI 변경은 같은 작업에서 보드도 고친다.

## 판 체계와 토큰

| 역할 | 토큰과 값 |
|---|---|
| 바탕 | `--v5-field` `#000` |
| 판 / 교차 행 | `--v5-plate` `#141414` / `--v5-plate-2` `#1c1c1c` |
| 띠(소제목·키 바탕) | `--v5-band` `#262626` |
| 미디어 바탕 | `--v5-inset` `#0c0c0c` |
| 신호 | `--v5-red` `#ff0033`, hover `--v5-red-hover`; 재생·현재 항목·다음 공연·TICKETS·BOOKING/문의에만 쓴다 |
| 본문 링크 | `--v5-link` `#ff4d6a` |
| 섭외 판 | `--v5-bone` `#e8e6df`, `--v5-bone-2`, `--v5-bone-muted` |
| 보조 글자 | `--v5-muted` `#a3a3a3`, `--v5-muted-2` `#c4c4c4` |
| 판 간격 / 키 간격 | `--v5-gap` 10px(640px 이하 8px) / `--v5-key-gap` 2px |

- 판은 테두리선 대신 간격으로 나누고 모서리를 둥글게 하지 않는다. 그림자와 그라데이션 장식은 쓰지 않는다. 믹스 화면 제목의 가독성용 검정 그라데이션만 예외다.
- 글꼴: 제목·본문은 Inter이고 한글은 Noto Sans KR이다. Noto Sans KR은 가변 글꼴을 글자 범위별 조각으로 받아, 페이지가 실제로 쓰는 한글 조각만 내려받는다. 웹폰트가 오기 전이나 실패하면 Apple SD Gothic Neo, Malgun Gothic으로 대체한다. 라벨·날짜·수치는 JetBrains Mono(`--os-font-mono`)를 쓴다. 라벨은 11px, 자간 .14em, 대문자다. 내지의 띠 소제목(h2)은 같은 mono 글꼴의 15px이다. 한국어 페이지는 `--mono-word-spacing`으로 단어 간격을 줄인다. 표제는 900 굵기, 대문자, 자간 -.045em이다.
- 토큰은 `src/app/globals.css`가 소유한다. STANN OS 공통 토큰은 `src/styles/stann-os.css` 사본이고, `scripts/check-token-sync.mjs`가 빌드 전에 원본과의 동기화를 검사한다. 관리자 화면은 `src/styles/designV2.module.css`와 `--color-*` 변수를 쓴다.

## 공통 부품

`src/styles/v5.module.css`가 내지의 공통 부품을 소유한다. 홈과 프레스킷은 이 모듈보다 먼저 만들어져 같은 규칙을 각자의 CSS Module에 둔다.

- `plate`, `inset`, `band`, `pad`, `stack`: 판, 미디어 바탕, 소제목 띠, 안쪽 여백, 판 세로 묶음
- `rows`: 판 색과 교차 행 색을 번갈아 쓰는 목록
- `key`, `red`, `ink`, `keys`: 채워진 버튼·링크 키. 선택·현재 위치는 흰 키로 반전한다. 비활성은 흐린 판으로 표시한다.
- `readout`: 제목 판 옆의 수치 칸(항목 수, 날짜)
- `lamp`: 현재·다음을 알리는 8px 붉은 사각형
- `label`, `mono`, `muted`, `display`: 글자 역할

## 화면 배치

- **헤더**(`PublicSiteShell`): 워드마크, 주 탐색 키(mono 11px, 400 굵기), KO/EN 전환, 붉은 Booking 키로 이뤄진다.
  - 주 탐색: Music·Events·Archive·About·Press kit. 데스크톱은 Links를 여섯째 키로 둔다.
  - 1199px 이하에서는 Menu 대화상자로 접는다. 메뉴는 Contact와 Links를 주 항목 아래에 둔다.
  - 푸터는 두지 않는다. 연속 로딩 목록에서는 모든 페이지를 불러온 뒤에야 닿기 때문이다.
- **홈**(`HomePageClient`)은 캔버스 Main·Mobile 보드를 따른다.
  - 첫 줄: 사진 위 아티스트 이름 판과 믹스 판. 믹스 판은 `MixPlayer`의 고정 16:9 화면, 최근 믹스 목록, SoundCloud ↗·All mixes → 키로 이뤄진다. 재생 중인 믹스에 붉은 표시를 둔다. 모바일은 All mixes 키 하나만 남긴다.
  - 다음 공연 줄: 붉은 램프와 TICKETS 키를 단다.
  - 믹스 카드: 4열이며 1199px 이하에서 2열이다.
  - 일정·섭외: 섭외는 bone 판이고 모바일에서 일정보다 먼저 온다.
  - 아카이브 줄: 같은 크기의 4:5 칸 네 개다(모바일 2열). 포스터와 사진은 inset 바탕에 원본 비율 그대로 담고 자르지 않는다.
- **내지**: `PageLayout`의 제목 판과 수치 칸 뒤에 각 화면의 판을 쌓는다. 화면별 배치·반응형 규칙은 `src/components/public/*PageClient.module.css`가 소유한다.
  - 공연: 예정 공연은 서울 날짜 기준 가까운 순서, 지난 공연은 최신 순서로 보여 준다. 포스터 썸네일은 행 높이를 바꾸지 않는다.
  - 아카이브: 4열 그리드이고 1199px 이하 3열, 767px 이하 2열, 359px 이하 1열이다. 원본을 자르지 않는다.
    - 정렬·페이지·Random seed는 URL에 남는다.
    - 상세의 이전·다음은 목록 정렬을 따른다.
    - 목록 복귀는 원래 항목과 스크롤 위치를 복원한다.
  - 소개: 사진 판과 이름·인용·기본 정보 판을 나란히 둔다. 바이오그래피는 문단을 나누고 981px 이상에서 2단으로 흐른다.
- **프레스킷**(`PressKitPageClient`)은 캔버스 Presskit·PresskitMobile 보드를 따른다. 공연 관계자용 페이지라 사이트 헤더 대신 전용 헤더(64px)를 쓴다.
  - 전용 헤더: 홈으로 가는 워드마크, PRESS KIT 표지, KO/EN, 전체 다운로드 ZIP 키, 붉은 Booking 키. 이름(Stann Lumo)이 h1이다.
  - 좌우 여백은 모든 폭에서 16px이고, 맨 아래에 STANN LUMO — PRESS KIT · 2026 푸터를 둔다.
  - 바이오 txt 두 개와 전체 ZIP은 `npm run press:build`가 `pressKit.ts`의 바이오와 `public/press/download`의 파일로 만든다. 바이오나 파일을 바꾸면 다시 만들고, `npm run test:scripts`가 낡은 파일과 틀린 크기 표기를 잡는다.
- **대체 화면**: 없는 경로와 오류 화면은 `PublicFallback.module.css`의 판(코드 램프, 큰 제목, 돌아가기 키)을 쓴다. 루트 레이아웃까지 실패하면 `src/app/global-error.tsx`가 같은 판을 실제 토큰 값으로 다시 그린다.
- **이미지**: `LoadingImage`(`src/capabilities/media`)는 화면에 가까워질 때 요청한다. 불러오는 동안과 실패 상태를 틀 안에 표시하고 `contain`으로 그린다.

## 상호작용과 모션

- 모션 값은 `publicMotion.ts`의 `PUBLIC_MOTION`이 소유한다(ease `power3.out`, 피드백 160ms, 내용 240ms).
  - 내지 진입: 본문 전체가 160ms 불투명도로 한 번 나타난다.
  - `data-reveal` 요소: 화면에 들어올 때 한 번 나타난다. 행(`row`)은 불투명도만 바뀌고, 나머지는 8px 올라오며 나타난다.
  - 키보드 탐색과 포커스 이동은 남은 등장 동작을 즉시 끝낸다.
  - 이 동작들은 움직임 감소 설정이 꺼져 있을 때만 실행한다.
  - 회전, 포인터 추적, 확대·축소, 자동 반복 장식, 스크롤 고정은 쓰지 않는다.
- 키·행의 hover는 배경색만 160ms(`--os-dur-fast`) 선형으로 바꾼다. 이 전환도 움직임 감소 설정에서는 생략한다.
- 경로를 이동하면 `PublicPageLoading`이 헤더 아래에 짧은 안내와 얇은 붉은 선을 띄운다. 최소 표시 시간이나 가짜 진행률은 쓰지 않는다.
- `useRevealGate`는 첫 화면 이미지를 최대 2초 기다린 뒤 페이지를 보여 준다. 스크립트가 멈추면 shell의 CSS 안전장치가 페이지를 보여 준다.
- 모바일 메뉴가 열리면 다음을 지킨다.
  - 배경 문서의 스크롤을 잠근다.
  - 메뉴 안에서 포커스가 순환한다.
  - Escape로 닫고, 닫으면 여는 버튼으로 포커스가 돌아간다.
- 건너뛰기 링크를 두고, 경로를 이동하면 본문으로 포커스를 옮긴다.
- 믹스 화면은 재생해도 높이가 변하지 않는다. 임베드가 같은 16:9 자리에서 커버를 대체한다.

## 주요 소유자

| 구성 | 역할 |
|---|---|
| `src/app/globals.css`, `src/styles/stann-os.css` | v5 토큰, STANN OS 공통 토큰 사본 |
| `src/styles/v5.module.css` | 내지 공통 판·키·행·수치 부품 |
| `PublicSiteShell`, `useShellMotion`, `useRevealGate`, `PublicPageLoading`, `PublicLink` | 헤더, 탐색, 메뉴 대화상자, 언어 전환, 첫 화면 대기, 경로 로딩 |
| `PageLayout`, `useContentMotion`, `publicMotion.ts` | 내지 제목 판, 진입·스크롤 등장, 입력 방식 추적 |
| `src/components/public/*PageClient`, `MixPlayer`, `TrackCover` | 화면별 판과 인접 CSS Module |
| `PublicNotFound`, `PublicFallback.module.css`, `src/app/global-error.tsx` | 없는 경로·오류 대체 화면 |
| `LoadingImage` | 이미지 지연 요청과 상태 틀 |
| `AdminLayout`, `AdminCard`, `AdminSectionHeader`, `designV2.module.css` | 관리자 공통 구성 |

다음 모듈은 저장소에 남아 있지만 공개 화면에 마운트하지 않는다. 삭제는 별도 결정이다.

- SignalNet·ambient 장면(`SignalNet`, `HomeAmbientScene`, `Scene3D`, `ambient/`)
- 이전 홈의 `KineticHeading`, `CipherDecodeText`

화면의 실제 표시·반응형·모션 검토와 코드 테스트·빌드 결과는 따로 확인한다.
