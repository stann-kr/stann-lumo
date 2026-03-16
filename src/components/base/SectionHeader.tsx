import { createBorderFaint } from '../../utils/colorMix';

/**
 * SectionHeader 컴포넌트 Props
 */
interface SectionHeaderProps {
  /** 페이지 제목 */
  title: string;
  /** 부제목 (선택 사항) */
  subtitle?: string;
  /** 제목 정렬 방식 (기본값: center) */
  align?: 'left' | 'center' | 'right';
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 페이지 제목 + 구분선 + 부제목 패턴 통합 컴포넌트
 * 
 * @description
 * 모든 public 페이지에서 반복되는 h1 + div.w-12.h-px + p 패턴을 통합
 * 
 * @example
 * ```tsx
 * <SectionHeader 
 *   title="ABOUT" 
 *   subtitle="Discover the story behind the music"
 * />
 * ```
 */
export default function SectionHeader({
  title,
  subtitle,
  align = 'center',
  className = '',
}: SectionHeaderProps) {
  const borderFaint = createBorderFaint();

  const alignClass = {
    left: 'items-start text-left',
    center: 'items-center text-center',
    right: 'items-end text-right',
  }[align];

  return (
    <div className={`flex flex-col ${alignClass} gap-4 mb-12 ${className}`}>
      <h1 
        className="text-4xl font-light tracking-[0.2em]"
        style={{ color: 'var(--color-primary)' }}
      >
        {title}
      </h1>
      <div 
        className="w-12 h-px"
        style={borderFaint}
      />
      {subtitle && (
        <p 
          className="text-sm tracking-wide max-w-2xl"
          style={{ color: 'var(--color-secondary)' }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}