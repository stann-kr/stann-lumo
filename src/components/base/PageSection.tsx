import { ReactNode } from 'react';

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
  /** hud-panel 내부 패딩 제거 (리스트/테이블 등 flush 레이아웃용) */
  noPadding?: boolean;
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
  noPadding = false,
}: PageSectionProps) {
  return (
    <section className={`relative ${className}`}>
      <div className="flex items-center gap-3 mb-6 relative">
        <div className="absolute -left-6 top-1/2 -translate-y-1/2 w-4 h-px bg-[var(--color-muted)] hidden md:block"></div>
        {icon && (
          <div
            className="w-5 h-5 flex items-center justify-center font-mono text-[var(--color-accent)]"
          >
            <i className={icon} />
          </div>
        )}
        <h2
          className="text-sm md:text-base font-mono font-semibold tracking-[0.2em] text-[var(--color-primary)] uppercase"
        >
          {title}
        </h2>
        <div className="flex-1 h-px bg-[var(--color-muted)] opacity-30"></div>
      </div>
      <div className={`hud-panel ${noPadding ? '' : 'p-6 md:p-8'}`}>
        {children}
      </div>
    </section>
  );
}