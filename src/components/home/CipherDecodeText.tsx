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
  const textRef = useRef<HTMLDivElement>(null);

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
    
    // manual scramble animation without ScrambleTextPlugin
    chars.forEach((char, index) => {
      // skip empty spaces
      if (originalTexts[index].trim() === '') {
        return;
      }
      
      let dummyObj = { value: 0 };
      char.style.opacity = '0'; // initially hidden
      
      gsap.to(dummyObj, {
        value: 1,
        // duration 0.5 to 1.5s randomly
        duration: 0.5 + Math.random(),
        // delay staggered slightly
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
        }
      });
    });

    return () => {
      split.revert();
    };
  }, [text, delay]);

  return <div ref={textRef} className={className}>{text}</div>;
}
