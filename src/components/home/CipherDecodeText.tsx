'use client';

import { useEffect, useRef } from 'react';
import SplitType from 'split-type';
import gsap from 'gsap';

interface CipherDecodeTextProps {
  text: string;
  className?: string;
  delay?: number;
}

export default function CipherDecodeText({ text, className = '', delay = 0 }: CipherDecodeTextProps) {
  const textRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    if (!textRef.current || !text) return;

    // Set exact text before splitting
    textRef.current.textContent = text;

    // Split text into characters
    const split = new SplitType(textRef.current, { types: 'chars' });
    if (!split.chars) return;

    const chars = split.chars;
    const originalTexts = chars.map(c => c.textContent || '');
    const symbols = 'ABCDEF0123456789!<>-_\\/[]{}—=+*^?#_';
    const totalDelay = delay / 1000; // ms to s

    // gsap.context()로 모든 트윈을 묶어 cleanup 시 일괄 kill
    const ctx = gsap.context(() => {
      chars.forEach((char, index) => {
        // 공백 스킵
        if (originalTexts[index].trim() === '') return;

        const dummyObj = { value: 0 };
        char.style.opacity = '0';

        gsap.to(dummyObj, {
          value: 1,
          duration: 0.5 + Math.random(),
          delay: totalDelay + index * 0.02,
          ease: 'none',
          onStart: () => {
            char.style.opacity = '0.7';
            char.style.color = 'var(--color-accent)';
            char.style.textShadow = '0 0 8px var(--color-accent)';
          },
          onUpdate: () => {
            if (dummyObj.value < 0.95) {
              char.textContent = symbols[Math.floor(Math.random() * symbols.length)];
            } else {
              char.textContent = originalTexts[index];
              char.style.opacity = '1';
              char.style.color = '';
              char.style.textShadow = 'none';
            }
          },
        });
      });
    });

    return () => {
      ctx.revert();
      split.revert();
    };
  }, [text, delay]);

  return <span ref={textRef} className={className}>{text}</span>;
}
