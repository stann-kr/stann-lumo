import { ReactNode, Children, isValidElement, ReactElement } from 'react';
import TypingText from '../../pages/home/components/TypingText';
import { createBorderMid } from '../../utils/colorMix';

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
  typingSpeed = 80,
  typingDelay = 100,
  children,
  spacing = 'md',
}: PageLayoutProps) => {
  const borderMid = createBorderMid();

  const extraDelays = (titleExtra ?? []).reduce<number[]>((acc, part, i) => {
    if (i === 0) {
      acc.push(typingDelay + title.length * typingSpeed + 200);
    } else {
      const prev = acc[i - 1];
      const prevLen = (titleExtra ?? [])[i - 1].length;
      acc.push(prev + prevLen * typingSpeed + 200);
    }
    return acc;
  }, []);

  const baseDelay = 200;
  const stepDelay = 120;

  const animatedChildren = Children.map(children, (child, index) => {
    const delay = baseDelay + index * stepDelay;
    if (isValidElement(child)) {
      const el = child as ReactElement<{ className?: string; style?: React.CSSProperties }>;
      return (
        <div
          key={index}
          className="animate-slideUp"
          style={{ animationDelay: `${delay}ms`, animationFillMode: 'both', opacity: 0 }}
        >
          {el}
        </div>
      );
    }
    return child;
  });

  return (
    <div className={`max-w-5xl mx-auto ${spacingMap[spacing]} py-8`}>
      {/* Page Header */}
      <div
        className="space-y-3 animate-slideUp"
        style={{ animationDelay: '0ms', animationFillMode: 'both', opacity: 0 }}
      >
        <h1 className="text-4xl md:text-5xl font-bold text-[var(--color-primary)] tracking-tight leading-tight">
          <TypingText text={title} speed={typingSpeed} delay={typingDelay} />
          {titleExtra && titleExtra.map((part, i) => (
            <span key={i} className="block">
              <TypingText
                text={part}
                speed={typingSpeed}
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
