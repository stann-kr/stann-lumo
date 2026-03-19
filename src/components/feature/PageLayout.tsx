'use client';
import type { CSSProperties, ReactNode, ReactElement } from 'react';
import { Children, isValidElement } from 'react';
import TypingText from '../home/TypingText';
import { createBorderMid } from '../../utils/colorMix';
import { MAX_WIDTH_MAP } from '../../utils/displaySettingsMap';
import { useContent } from '../../contexts/ContentContext';

interface PageLayoutProps {
  title: string;
  titleExtra?: string[];
  subtitle?: string;
  typingSpeed?: number;
  typingDelay?: number;
  children: ReactNode;
  spacing?: 'sm' | 'md' | 'lg';
}

const spacingMap = {
  sm: 'space-y-6',
  md: 'space-y-10',
  lg: 'space-y-14',
};

const PageLayout = ({
  title,
  titleExtra,
  subtitle,
  typingSpeed,
  typingDelay = 100,
  children,
  spacing,
}: PageLayoutProps) => {
  const borderMid = createBorderMid();
  const { displaySettings } = useContent();
  const global = displaySettings.global;

  // 페이지별 props 우선, 없으면 global 설정 사용
  const resolvedTypingSpeed = typingSpeed ?? global.typingSpeed;
  const resolvedSpacing = spacing ?? global.defaultSpacing;
  const resolvedMaxWidth = MAX_WIDTH_MAP[global.pageMaxWidth];

  const extraDelays = (titleExtra ?? []).reduce<number[]>((acc, part, i) => {
    if (i === 0) {
      acc.push(typingDelay + title.length * resolvedTypingSpeed + 200);
    } else {
      const prev = acc[i - 1];
      const prevLen = (titleExtra ?? [])[i - 1].length;
      acc.push(prev + prevLen * resolvedTypingSpeed + 200);
    }
    return acc;
  }, []);

  const baseDelay = global.animationEnabled ? 200 : 0;
  const stepDelay = global.animationEnabled ? 120 : 0;

  const animatedChildren = Children.map(children, (child, index) => {
    const delay = baseDelay + index * stepDelay;
    if (isValidElement(child)) {
      const el = child as ReactElement<{ className?: string; style?: CSSProperties }>;
      return (
        <div
          key={index}
          className={global.animationEnabled ? 'animate-slideUp' : ''}
          style={
            global.animationEnabled
              ? { animationDelay: `${delay}ms`, animationFillMode: 'both', opacity: 0 }
              : undefined
          }
        >
          {el}
        </div>
      );
    }
    return child;
  });

  return (
    <div className={`${resolvedMaxWidth} ${spacingMap[resolvedSpacing]} py-8`}>
      {/* Page Header */}
      <div
        className={global.animationEnabled ? 'space-y-3 animate-slideUp' : 'space-y-3'}
        style={
          global.animationEnabled
            ? { animationDelay: '0ms', animationFillMode: 'both', opacity: 0 }
            : undefined
        }
      >
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] tracking-tight leading-tight">
          <TypingText text={title} speed={resolvedTypingSpeed} delay={typingDelay} />
          {titleExtra && titleExtra.map((part, i) => (
            <span key={i} className="block">
              <TypingText
                text={part}
                speed={resolvedTypingSpeed}
                delay={extraDelays[i]}
              />
            </span>
          ))}
        </h1>
        <div className="w-12 h-px" style={borderMid} />
        {subtitle && (
          <p className="text-[var(--color-secondary)] opacity-50 text-xs tracking-widest">
            {subtitle}
          </p>
        )}
      </div>

      {/* Page Content */}
      {animatedChildren}
    </div>
  );
};

export default PageLayout;
