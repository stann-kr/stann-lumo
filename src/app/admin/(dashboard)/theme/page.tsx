'use client';
import { useState, useEffect } from 'react';
import { useContent } from '@/contexts/ContentContext';
import AdminCard from '@/components/base/AdminCard';
import AdminSectionHeader from '@/components/base/AdminSectionHeader';
import FormInput from '@/components/base/FormInput';
import SuccessMessage from '@/components/base/SuccessMessage';
import RadioGroup from '@/components/base/RadioGroup';
import { useSaveNotification } from '@/hooks/useSaveNotification';
import { createBorderFaint, createBorderMid } from '@/utils/colorMix';
import { fetchDisplaySettings, updateDisplaySettings } from '@/services/adminService';
import { updateThemeColors as apiUpdateThemeColors } from '@/services/adminService';
import type { GlobalDisplaySettings } from '@/types/displaySettings';
import { DISPLAY_SETTINGS_DEFAULTS } from '@/types/displaySettings';

const COLOR_PRESETS = [
  {
    name: 'Warm Amber',
    colors: { primary: '#e8d5b0', secondary: '#c8b89a', accent: '#8a7560', muted: '#a89070', bg: '#0a0a0a', bgSidebar: '#050505' }
  },
  {
    name: 'Cool Slate',
    colors: { primary: '#d4e4f7', secondary: '#a8c5e0', accent: '#6b8caf', muted: '#8fa9c4', bg: '#0f1419', bgSidebar: '#090d11' }
  },
  {
    name: 'Forest Green',
    colors: { primary: '#d4e8d4', secondary: '#a8c9a8', accent: '#6b8f6b', muted: '#8faa8f', bg: '#0a120a', bgSidebar: '#060d06' }
  },
  {
    name: 'Sunset Rose',
    colors: { primary: '#f5d5d8', secondary: '#d9a8ad', accent: '#a86b73', muted: '#c48f95', bg: '#120a0b', bgSidebar: '#0c0608' }
  }
];

/**
 * Theme 색상 관리 페이지
 * - 색상 프리셋 적용
 * - 커스텀 색상 편집
 * - 실시간 미리보기
 */
const AdminThemePage = () => {
  const { content, updateContent, allContent, setCurrentEditLanguage, currentEditLanguage } = useContent();
  // 테마 색상은 언어와 무관하게 공유 — en 기준으로 읽음
  const [colors, setColors] = useState(allContent.en.themeColors);
  const [globalSettings, setGlobalSettings] = useState<GlobalDisplaySettings>(
    DISPLAY_SETTINGS_DEFAULTS.global
  );
  const { isVisible: showSuccess, showNotification } = useSaveNotification();

  useEffect(() => {
    fetchDisplaySettings('global').then((res) => {
      if (res.success && res.data) {
        setGlobalSettings(res.data as GlobalDisplaySettings);
      }
    });
  }, []);

  const updateColorField = (key: keyof typeof colors, value: string) => {
    setColors(prev => ({ ...prev, [key]: value }));
  };

  const applyPreset = (preset: typeof COLOR_PRESETS[0]) => {
    setColors(preset.colors);
  };

  const saveChanges = async () => {
    // 두 언어 모두에 동일한 테마 색상 적용
    const prevLang = currentEditLanguage;
    setCurrentEditLanguage('en');
    updateContent({ themeColors: colors });
    setCurrentEditLanguage('ko');
    updateContent({ themeColors: colors });
    setCurrentEditLanguage(prevLang);

    await Promise.allSettled([
      apiUpdateThemeColors(colors),
      updateDisplaySettings('global', globalSettings),
    ]);
    showNotification();
  };

  const resetColors = () => {
    setColors(content.themeColors);
  };

  /** 색상 입력 행 렌더링 헬퍼 */
  const renderColorRow = (key: keyof typeof colors, label: string) => (
    <div>
      <label className="block text-sm text-[var(--color-secondary)] tracking-wider mb-2">{label}</label>
      <div className="flex gap-3">
        <input
          type="color"
          value={colors[key]}
          onChange={(e) => updateColorField(key, e.target.value)}
          className="w-16 h-10 cursor-pointer bg-transparent"
          style={createBorderFaint()}
        />
        <input
          type="text"
          value={colors[key]}
          onChange={(e) => updateColorField(key, e.target.value)}
          className="flex-1 px-4 py-2 bg-[var(--color-bg)] text-[var(--color-secondary)] text-sm tracking-wider focus:outline-none border"
          style={createBorderMid()}
        />
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl">
        {/* Header */}
        <AdminSectionHeader
          title="THEME COLORS"
          description="사이트 전체 색상 팔레트 커스터마이징"
          onSave={saveChanges}
          showSaveButton={true}
          actions={
            <button
              onClick={resetColors}
              className="px-6 py-3 border text-[var(--color-secondary)] hover:bg-[var(--color-secondary)]/5 transition-all duration-200 cursor-pointer whitespace-nowrap"
              style={createBorderMid()}
            >
              <i className="ri-refresh-line mr-2"></i>RESET
            </button>
          }
        />

        <SuccessMessage message="변경 사항이 저장되었습니다" show={showSuccess} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Left Column: Color Editors */}
          <div className="space-y-6">
            {/* Color Presets */}
            <div>
              <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">PRESETS</h2>
              <AdminCard>
                <div className="grid grid-cols-2 gap-3">
                  {COLOR_PRESETS.map((preset) => (
                    <button
                      key={preset.name}
                      onClick={() => applyPreset(preset)}
                      className="p-4 border bg-[var(--color-bg)] hover:bg-[var(--color-secondary)]/5 transition-all duration-200 cursor-pointer whitespace-nowrap group"
                      style={createBorderFaint()}
                    >
                      <div className="text-sm text-[var(--color-secondary)] tracking-wider mb-3 group-hover:text-[var(--color-primary)] transition-colors">
                        {preset.name}
                      </div>
                      <div className="flex gap-1.5">
                        {Object.values(preset.colors).map((color, idx) => (
                          <div key={idx} className="w-full h-6" style={{ backgroundColor: color }}></div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </AdminCard>
            </div>

            {/* Color Pickers */}
            <div>
              <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">CUSTOM COLORS</h2>
              <AdminCard className="space-y-5">
                {renderColorRow('primary', 'PRIMARY')}
                {renderColorRow('secondary', 'SECONDARY')}
                {renderColorRow('accent', 'ACCENT')}
                {renderColorRow('muted', 'MUTED')}
                {renderColorRow('bg', 'CONTENT BACKGROUND')}
                {renderColorRow('bgSidebar', 'SIDEBAR BACKGROUND')}
              </AdminCard>
            </div>
          </div>

          {/* Right Column: Live Preview */}
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">LIVE PREVIEW</h2>
              <AdminCard>
                {/* 프리뷰 영역: 선택된 colors 값으로 직접 렌더링 */}
                <div className="flex overflow-hidden" style={{ minHeight: '320px' }}>
                  {/* Sidebar preview */}
                  <div className="w-32 shrink-0 flex flex-col p-4 gap-2" style={{ backgroundColor: colors.bgSidebar }}>
                    <p className="text-xs tracking-widest mb-2" style={{ color: colors.primary }}>SIDEBAR</p>
                    {['HOME', 'ABOUT', 'MUSIC', 'EVENTS'].map((item) => (
                      <div key={item} className="px-2 py-1.5 text-xs tracking-widest" style={{ color: colors.secondary, opacity: 0.5 }}>{item}</div>
                    ))}
                  </div>
                  {/* Content preview */}
                  <div className="flex-1 space-y-4" style={{ backgroundColor: colors.bg, padding: '1.5rem' }}>
                  <div>
                    <h3 className="text-2xl font-bold tracking-wider mb-2" style={{ color: colors.primary }}>
                      PRIMARY TEXT
                    </h3>
                    <p className="text-sm tracking-wide" style={{ color: colors.secondary }}>
                      Secondary text for descriptions and body content
                    </p>
                    <p className="text-xs tracking-wider mt-2" style={{ color: colors.muted }}>
                      Muted text for subtle information
                    </p>
                  </div>

                  <div className="space-y-3">
                    <button
                      className="w-full px-6 py-3 font-bold tracking-wider cursor-pointer whitespace-nowrap"
                      style={{ backgroundColor: colors.secondary, color: colors.bg }}
                    >
                      PRIMARY BUTTON
                    </button>
                    <button
                      className="w-full px-6 py-3 font-bold tracking-wider cursor-pointer whitespace-nowrap"
                      style={{ border: `1px solid ${colors.secondary}40`, color: colors.secondary, backgroundColor: 'transparent' }}
                    >
                      SECONDARY BUTTON
                    </button>
                  </div>

                  <div
                    className="p-6 border"
                    style={{ borderColor: `${colors.secondary}26`, backgroundColor: `${colors.secondary}0d` }}
                  >
                    <h4 className="text-lg font-bold tracking-wider mb-2" style={{ color: colors.primary }}>
                      CARD TITLE
                    </h4>
                    <p className="text-sm tracking-wide mb-3" style={{ color: colors.secondary }}>
                      Card content with secondary text color
                    </p>
                    <div className="flex items-center gap-2">
                      <i className="ri-music-2-line" style={{ color: colors.accent }}></i>
                      <span className="text-xs tracking-wider" style={{ color: colors.muted }}>
                        Accent icon with muted text
                      </span>
                    </div>
                  </div>

                  <input
                    type="text"
                    placeholder="Input field example"
                    className="w-full px-4 py-2 text-sm tracking-wider focus:outline-none"
                    style={{ backgroundColor: colors.bg, border: `1px solid ${colors.secondary}33`, color: colors.secondary }}
                  />

                  <div className="flex items-center gap-2">
                    <span className="text-sm tracking-wider" style={{ color: colors.accent }}>
                      <i className="ri-link mr-1"></i>Accent Link
                    </span>
                    <span className="text-sm tracking-wider" style={{ color: colors.secondary }}>
                      <i className="ri-arrow-right-line"></i>
                    </span>
                  </div>
                  </div>
                </div>
              </AdminCard>
            </div>

            {/* Global Display Settings */}
            <div>
              <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">GLOBAL DISPLAY SETTINGS</h2>
              <AdminCard>
                <div className="space-y-6">
                  <RadioGroup
                    label="PAGE MAX WIDTH"
                    value={globalSettings.pageMaxWidth}
                    options={[
                      { value: 'sm', label: 'SM (3xl)' },
                      { value: 'md', label: 'MD (4xl)' },
                      { value: 'lg', label: 'LG (5xl)' },
                      { value: 'xl', label: 'XL (6xl)' },
                    ]}
                    onChange={(v) => setGlobalSettings((prev) => ({ ...prev, pageMaxWidth: v }))}
                  />
                  <RadioGroup
                    label="DEFAULT SPACING"
                    value={globalSettings.defaultSpacing}
                    options={[
                      { value: 'sm', label: 'SM' },
                      { value: 'md', label: 'MD' },
                      { value: 'lg', label: 'LG' },
                    ]}
                    onChange={(v) => setGlobalSettings((prev) => ({ ...prev, defaultSpacing: v }))}
                  />
                  <FormInput
                    label="TYPING SPEED (MS/CHAR)"
                    type="number"
                    value={String(globalSettings.typingSpeed)}
                    onChange={(v) => setGlobalSettings((prev) => ({ ...prev, typingSpeed: Math.max(1, parseInt(v) || 1) }))}
                  />
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={globalSettings.animationEnabled}
                      onChange={(e) => setGlobalSettings((prev) => ({ ...prev, animationEnabled: e.target.checked }))}
                      className="w-4 h-4 accent-[var(--color-accent)] cursor-pointer"
                    />
                    <span className="text-xs text-[var(--color-secondary)] tracking-widest">ENABLE ANIMATIONS</span>
                  </label>
                </div>
              </AdminCard>
            </div>

          {/* Color Reference */}
            <div>
              <h2 className="text-xl font-bold text-[var(--color-secondary)] tracking-wider mb-4">COLOR REFERENCE</h2>
              <AdminCard>
                <div className="space-y-3 text-xs tracking-wider text-[var(--color-secondary)]/70">
                  {[
                    { key: 'primary' as const, label: 'PRIMARY', desc: 'Main headings, important text' },
                    { key: 'secondary' as const, label: 'SECONDARY', desc: 'Body text, descriptions' },
                    { key: 'accent' as const, label: 'ACCENT', desc: 'Icons, highlights, links' },
                    { key: 'muted' as const, label: 'MUTED', desc: 'Subtle text, metadata' },
                    { key: 'bg' as const, label: 'CONTENT BG', desc: 'Main content area background' },
                    { key: 'bgSidebar' as const, label: 'SIDEBAR BG', desc: 'Sidebar & mobile header background' },
                  ].map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 border shrink-0"
                        style={{ backgroundColor: colors[key], borderColor: `${colors.secondary}33` }}
                      ></div>
                      <div>
                        <div className="text-[var(--color-secondary)]">{label}</div>
                        <div>{desc}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </AdminCard>
            </div>
          </div>
        </div>
    </div>
  );
};

export default AdminThemePage;
