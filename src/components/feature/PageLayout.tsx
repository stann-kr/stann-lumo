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
    <div className={`${resolvedMaxWidth} ${spacingMap[resolvedSpacing]} pb-8 relative`}>
      {/* Sci-Fi Page Header */}
      <div
        className={`relative ${global.animationEnabled ? 'space-y-4 animate-slideUp' : 'space-y-4'}`}
        style={
          global.animationEnabled
            ? { animationDelay: '0ms', animationFillMode: 'both', opacity: 0 }
            : undefined
        }
      >
        <div className="font-mono text-[10px] text-[var(--color-accent)] tracking-widest flex items-center gap-2">
          <span className="w-1.5 h-1.5 bg-[var(--color-accent)] animate-pulse"></span>
          ACCESS_GRANTED // PAGE_INIT
        </div>
        
        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-[0.1em] text-[var(--color-primary)] leading-none break-words">
          <TypingText text={title} speed={resolvedTypingSpeed} delay={typingDelay} />
          {titleExtra && titleExtra.map((part, i) => (
            <span key={i} className="block mt-2">
              <TypingText
                text={part}
                speed={resolvedTypingSpeed}
                delay={extraDelays[i]}
              />
            </span>
          ))}
        </h1>
        
        <div className="flex items-center gap-4 pt-4">
          <div className="flex-1 h-px bg-[var(--color-muted)] opacity-50"></div>
          {subtitle && (
            <p className="font-mono text-[10px] text-[var(--color-accent)] tracking-[0.2em] uppercase shrink-0">
              [{subtitle}]
            </p>
          )}
        </div>
      </div>

      {/* Page Content */}
      <div className="relative z-10 pt-4">
        {animatedChildren}
      </div>
    </div>
  );
};

export default PageLayout;
