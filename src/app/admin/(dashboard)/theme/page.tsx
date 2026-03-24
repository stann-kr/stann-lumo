'use client';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import { PALETTE, THEME, COLORS } from '@/styles/colors';

const COLOR_ENTRIES: { label: string; cssVar: string; hex: string }[] = [
  { label: 'PRIMARY',    cssVar: '--color-primary',    hex: THEME.primary   },
  { label: 'SECONDARY',  cssVar: '--color-secondary',  hex: THEME.secondary },
  { label: 'ACCENT',     cssVar: '--color-accent',     hex: THEME.accent    },
  { label: 'MUTED',      cssVar: '--color-muted',      hex: THEME.muted     },
  { label: 'BG',         cssVar: '--color-bg',         hex: THEME.bg        },
  { label: 'BG SIDEBAR', cssVar: '--color-bg-sidebar', hex: THEME.bgSidebar },
];

const ThemePage = () => {
  return (
    <div className="space-y-8">
      <AdminSectionHeader
        title="COLOR SYSTEM"
        description="색상은 코드에서 직접 관리됩니다. 색상 변경 시 아래 두 파일을 동시에 수정하세요."
        showSaveButton={false}
      />

      {/* 파일 경로 안내 */}
      <AdminCard>
        <p className="text-xs font-mono text-[var(--color-accent)] tracking-widest mb-4">EDIT LOCATIONS</p>
        <div className="space-y-3 font-mono text-xs">
          <div className="flex items-start gap-3 p-3 border border-[var(--color-muted)]/30">
            <i className="ri-file-code-line text-base text-[var(--color-accent)] shrink-0 mt-0.5"></i>
            <div>
              <p className="text-[var(--color-accent)] tracking-widest mb-1">src/styles/colors.ts</p>
              <p className="text-[var(--color-secondary)] opacity-60 leading-relaxed">
                PALETTE(원시 hex) → THEME(시맨틱 토큰) → COLORS(컴포넌트별 할당) 3레이어 구조.
                색상 변경 시 PALETTE 또는 THEME 섹션의 값을 수정.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3 p-3 border border-[var(--color-muted)]/30">
            <i className="ri-css3-line text-base text-[var(--color-accent)] shrink-0 mt-0.5"></i>
            <div>
              <p className="text-[var(--color-accent)] tracking-widest mb-1">src/app/globals.css — :root</p>
              <p className="text-[var(--color-secondary)] opacity-60 leading-relaxed">
                CSS 커스텀 프로퍼티 선언. colors.ts THEME 값과 1:1 동기화 필수.
                이 파일의 값이 브라우저에서 실제 렌더링되는 색상.
              </p>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* 현재 색상 테마 */}
      <AdminCard>
        <p className="text-xs font-mono text-[var(--color-accent)] tracking-widest mb-4">CURRENT THEME</p>
        <div className="space-y-2">
          {COLOR_ENTRIES.map(({ label, cssVar, hex }) => (
            <div key={cssVar} className="flex items-center gap-4 py-2 border-b border-[var(--color-muted)]/20 last:border-0">
              <div
                className="w-8 h-8 shrink-0 border border-[var(--color-muted)]/40"
                style={{ backgroundColor: hex }}
              />
              <div className="flex-1 font-mono text-xs">
                <p className="text-[var(--color-accent)] tracking-widest">{label}</p>
                <p className="text-[var(--color-secondary)] opacity-50">{cssVar}</p>
              </div>
              <p className="font-mono text-xs text-[var(--color-secondary)] opacity-70 tracking-widest">{hex}</p>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* 팔레트 */}
      <AdminCard>
        <p className="text-xs font-mono text-[var(--color-accent)] tracking-widest mb-4">PALETTE</p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {Object.entries(PALETTE).map(([name, hex]) => (
            <div key={name} className="space-y-2">
              <div
                className="w-full h-10 border border-[var(--color-muted)]/30"
                style={{ backgroundColor: hex }}
              />
              <div className="font-mono text-[10px]">
                <p className="text-[var(--color-secondary)] tracking-widest uppercase">{name}</p>
                <p className="text-[var(--color-secondary)] opacity-50">{hex}</p>
              </div>
            </div>
          ))}
        </div>
      </AdminCard>

      {/* 사용 예시 */}
      <AdminCard>
        <p className="text-xs font-mono text-[var(--color-accent)] tracking-widest mb-4">USAGE</p>
        <div className="font-mono text-xs space-y-4">
          <div>
            <p className="text-[var(--color-accent)] tracking-widest mb-2">CSS (Tailwind)</p>
            <div className="bg-black/40 p-3 space-y-1 border border-[var(--color-muted)]/20">
              <p className="text-[var(--color-secondary)] opacity-70">text-[var(--color-accent)]</p>
              <p className="text-[var(--color-secondary)] opacity-70">border-[var(--color-muted)]</p>
              <p className="text-[var(--color-secondary)] opacity-70">bg-[var(--color-accent)]/5</p>
            </div>
          </div>
          <div>
            <p className="text-[var(--color-accent)] tracking-widest mb-2">TypeScript (inline style)</p>
            <div className="bg-black/40 p-3 space-y-1 border border-[var(--color-muted)]/20">
              <p className="text-[var(--color-secondary)] opacity-70">{'import { COLORS } from "@/styles/colors"'}</p>
              <p className="text-[var(--color-secondary)] opacity-70">{'style={{ borderColor: COLORS.border.faint }}'}</p>
              <p className="text-[var(--color-secondary)] opacity-70">{'// Three.js: COLORS.scene3d.accent'}</p>
            </div>
          </div>
          <div>
            <p className="text-[var(--color-accent)] tracking-widest mb-2">유틸리티 함수</p>
            <div className="bg-black/40 p-3 space-y-1 border border-[var(--color-muted)]/20">
              <p className="text-[var(--color-secondary)] opacity-70">createBorderFaint() — muted/30 border</p>
              <p className="text-[var(--color-secondary)] opacity-70">createBorderMid()   — muted/60 border</p>
              <p className="text-[var(--color-secondary)] opacity-70">createBorderAccent()— accent border</p>
            </div>
          </div>
        </div>
      </AdminCard>

      {/* 컴포넌트별 색상 할당 */}
      <AdminCard>
        <p className="text-xs font-mono text-[var(--color-accent)] tracking-widest mb-4">COMPONENT COLOR MAP</p>
        <div className="font-mono text-xs space-y-3">
          <p className="text-[var(--color-secondary)] opacity-50 leading-relaxed">
            각 UI 요소의 색상 할당은{' '}
            <span className="text-[var(--color-accent)]">src/styles/colors.ts</span> 의
            COLORS 객체에서 확인 및 수정 가능.
          </p>
          <div className="grid md:grid-cols-2 gap-2">
            {Object.keys(COLORS).map((section) => (
              <div key={section} className="flex items-center gap-2 py-1.5 border-b border-[var(--color-muted)]/15">
                <i className="ri-palette-line text-[var(--color-accent)] text-xs"></i>
                <span className="text-[var(--color-secondary)] tracking-widest uppercase">{section}</span>
              </div>
            ))}
          </div>
        </div>
      </AdminCard>
    </div>
  );
};

export default ThemePage;
