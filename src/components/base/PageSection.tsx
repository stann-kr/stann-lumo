import { ReactNode } from 'react';
import { createBorderFaint } from '../../utils/colorMix';

/**
 * PageSection 컴포넌트 Props
 */
interface PageSectionProps {
  /** 섹션 제목 */
  title: string;
  /** 아이콘 클래스 (선택 사항) */
  icon?: string;
  /** 섹션 콘텐츠 */
  children: ReactNode;
  /** 추가 CSS 클래스 */
  className?: string;
}

/**
 * 섹션 제목 + 아이콘 + 콘텐츠 래퍼 패턴 통합 컴포넌트
 * 
 * @description
 * About 페이지의 BIOGRAPHY, MUSICAL PHILOSOPHY 등 반복 패턴을 통합
 * 
 * @example
 * ```tsx
 * <PageSection 
 *   title="BIOGRAPHY" 
 *   icon="ri-user-line"
 * >
 *   <p>Content here...</p>
 * </PageSection>
 * ```
 */
export default function PageSection({
  title,
  icon,
  children,
  className = '',
}: PageSectionProps) {
  const borderFaint = createBorderFaint();

  return (
    <section className={`mb-16 ${className}`}>
      <div className="flex items-center gap-3 mb-6">
        {icon && (
          <div 
            className="w-5 h-5 flex items-center justify-center"
            style={{ color: 'var(--color-accent)' }}
          >
            <i className={icon} />
          </div>
        )}
        <h2 
          className="text-xl font-light tracking-[0.15em]"
          style={{ color: 'var(--color-primary)' }}
        >
          {title}
        </h2>
      </div>
      <div 
        className="border-t pt-6"
        style={borderFaint}
      >
        {children}
      </div>
    </section>
  );
}