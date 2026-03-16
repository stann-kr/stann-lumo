interface LanguageTabProps {
  currentLanguage: 'en' | 'ko';
  onLanguageChange: (lang: 'en' | 'ko') => void;
}

/**
 * Admin 페이지용 언어 탭 컴포넌트
 * - EN / KO 전환
 * - 현재 편집 중인 언어 표시
 */
const LanguageTab = ({ currentLanguage, onLanguageChange }: LanguageTabProps) => {
  return (
    <div className="inline-flex items-center gap-1 bg-[var(--color-secondary)]/5 p-1 rounded">
      <button
        onClick={() => onLanguageChange('en')}
        className={`px-4 py-1.5 text-xs tracking-widest transition-all cursor-pointer whitespace-nowrap ${
          currentLanguage === 'en'
            ? 'bg-[var(--color-accent)] text-[var(--color-bg)] font-bold'
            : 'text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)]'
        }`}
      >
        EN
      </button>
      <button
        onClick={() => onLanguageChange('ko')}
        className={`px-4 py-1.5 text-xs tracking-widest transition-all cursor-pointer whitespace-nowrap ${
          currentLanguage === 'ko'
            ? 'bg-[var(--color-accent)] text-[var(--color-bg)] font-bold'
            : 'text-[var(--color-secondary)]/50 hover:text-[var(--color-secondary)]'
        }`}
      >
        KO
      </button>
    </div>
  );
};

export default LanguageTab;