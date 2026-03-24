# Stann Lumo - UI/UX 디자인 시스템 및 레퍼런스 가이드

이 문서는 Stann Lumo 웹사이트에 도입된 **미니멀 퓨처리스틱 (Minimal Futuristic) 및 FUI (Fictional User Interface)** 기반의 전역 디자인 시스템과 아키텍처, 그리고 주요 모션 렌더링 기법들을 명명하고 정리한 것입니다.

---

## 1. 코어 디자인 철학 (Design Philosophy)

- **테마 (Theme):** Sci-Fi, Space Ship HUD, Futurism
- **색상 (Colors):**
  - `Primary (Text)` : White (#ffffff) 또는 아주 밝은 회색
  - `Background` : Pitch Black (#000000) - 절대적인 검은색을 통한 고대비 몰입감
  - `Accent` : Theme 에 따른 네온 형광 컬러 (예: Emerald, Cyan, Orange 등)
- **타이포그래피 (Typography):**
  - **기본 텍스트:** `Google Orbit` - 한글 호환성이 뛰어나며 미래지향적인 뉘앙스를 가진 산세리프 글꼴.
  - **데이터/메타정보:** `JetBrains Mono` - 모노스페이스 폰트를 적극 활용하여 좌표, 시스템 ID, 타임스탬프, 로딩 데이터 등을 표현.
- **형태 (Shapes & Borders):**
  - `Border Radius: 0` - 둥근 모서리를 철저히 배제하고 각진 직각(Right Angles)만을 사용하여 날카로운 화면을 연출함.
  - `Hairline Borders` - 1px 두께의 희미한 테두리와 선형(Grid 라인)을 교차하여 복잡한 조준경(Crosshair) 프레임을 만듦.

---

## 2. 모션 및 인터랙션 엔진 (Motion & Interaction Engine)

복합적인 애니메이션 기법들을 용도에 맞게 최적화하여 혼합 적용함.

### 1) GSAP (GreenSock Animation Platform)

- **역할:** DOM 요소들의 정밀한 부팅형(Stagger) 시퀀스 제어.
- **적용점:** `PageLayout.tsx` 등 주요 페이지 래퍼 (Wrapper).
- **효과:** `useGSAP` 훅을 사용해 시스템이 기동될 때 `.gsap-stagger-item` 파츠들이 `0.1s` 또는 `0.05s` 간격으로 밑에서부터 차례차례 슬라이드업(팝업) 되도록 함.

### 2) Framer Motion

- **역할:** 전역 페이지 라우팅 전환 (Page Transitions).
- **적용점:** `TerminalLayout.tsx`의 `<AnimatePresence>` 래퍼.
- **효과:** Next.js 라우트를 이동할 때 즉시 끊기는 현상을 막고, 화면이 Blur 처리되며 아웃(Exit)되고 다음 화면이 Blur 해제되며 인(In) 되는 스캔/글리치(Scan/Glitch) 스타일의 부드러운 전환을 담당.

### 3) SplitType + GSAP 시너지 (Cipher Decode)

- **역할:** 터미널 오프닝 텍스트, 경고창, 제목 텍스트 특수효과.
- **적용점:** `CipherDecodeText.tsx` 컴포넌트.
- **효과:** 텍스트를 한 글자씩 DOM 노드로 분해(Split)한 뒤, `!<>-_\\/[]{}—=+*^?#_` 등 무작위 식별 기호로 뒤섞어두고(Scramble), 시간차로 원본 문구를 복호화(Decode)하여 표시하는 강렬한 해킹 효과 연출.

---

## 3. 3D 백그라운드 아키텍처 (Scene3D & Shaders)

전역 배경인 `<Scene3D />` 컴포넌트는 단조로운 우주 영상을 넘어, 마우스와 시스템 상태에 반응하는 인터랙티브 엔진으로 설계됨.

- **기술 스택:** `three`, `@react-three/fiber`, `@react-three/drei`, `@react-three/postprocessing`
- **코어 지오메트리 (Core Geometry):**
  - 중심부 투시도에 떠 있는 `Octahedron (8면체)` 코어를 배치하여 날카로운 기하학적 미학 구축.
  - `meshStandardMaterial`과 `emissive(자체 발광)`을 활용해 광원 효과를 극대화.
- **부품 요소 (FUI Elements):**
  - **FuiRings:** 중심 코어를 교차하며 다방향으로 천천히 회전하는 레이더/조준경 과녁 형태의 타겟 링.
  - **Particles:** 무작위 노이즈가 아닌 `Math.cos/sin`을 활용해 커다란 파동(Wave)처럼 떠다니는 데이터 정크(Junk) 플로우.
- **카메라 제어 (Parallax Rig):**
  - `CameraRig` 로직을 통해 사용자의 마우스 움직임(포인터 좌표)에 역행/순응하며 카메라 위치를 실시간 변경하여 화면에 깊은 공간감(Depth) 부여.

#### ❖ CRT 포스트 프로세싱 (Postprocessing / Shaders)

과거 브라운관(CRT) 모니터나 열화된 홀로그램 디스플레이 느낌을 내기 위해 `EffectComposer`에 다음 필터들을 합성함:

1. **Bloom:** 씬(Scene)에서 밝은 하이라이트/형광색 구간만 추출해 번지게(Glow) 만드는 자체 발광 이펙트.
2. **Noise:** 화면 전체에 미세하게 깔리는 지지직거리는 모니터 TV 노이즈 아티팩트.
3. **Chromatic Aberration:** 렌즈 주변에서 R, G, B 채널이 미세하게 어긋나는 카메라 색수차 효과를 추가하여 화면 왜곡(Glitch) 효과 증폭.
4. **Vignette:** 화면 렌즈 상하좌우 모서리 여백에 다크서클 음영을 깔아 중앙 3D 오브젝트와 텍스트로 시야 집중 유도.

---

## 4. 구조 레이아웃 컴포넌트 (Structural Components)

- **`TerminalLayout.tsx`:** 홈/메뉴를 포함한 앱 전체를 감싸는 최외곽 컨테이너. 데스크톱 기준 좌측 네비게이션 HUD, 우측 메인 콘텐츠 및 모서리 브래킷(Brackets) 코너 UI 제공.
- **`PageLayout.tsx`:** 각 콘텐츠 페이지(Home, Music, Events 등)마다 상단에 `[ACCESS_GRANTED]` 등의 시스템 메타 정보를 찍어주고 해킹 타이틀 모션(`CipherDecodeText`)을 출력한 뒤, 그 하위에 자식 노드들을 GSAP 로 흘려넣는 역할.
- **글로벌 오버레이:**
  - 화면 십자선 가이드 (CrosshairBoxes) 및 CursorGlow 마우스 이펙트.

---

> **요약 사항:** 현재 Stann Lumo의 UI는 단순히 CSS 떡칠을 통한 디자인이 아니며, **React의 재사용성을 바탕으로 한 GSAP DOM 제어 + 3D Canvas R5 렌더 트리 + Shaders(마스킹/후처리 합성) + Framer 상태 전환 라우팅**이 유기적으로 얽힌 초고도 통합 UI 시스템임.
