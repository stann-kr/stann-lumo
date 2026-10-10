'use client';

import { useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';
import { PUBLIC_MOTION, usePublicMotionInput } from './publicMotion';
import styles from './KineticHeading.module.css';

gsap.registerPlugin(useGSAP);

interface KineticHeadingProps {
  title: string;
  extra?: string[];
}

export default function KineticHeading({ title, extra }: KineticHeadingProps) {
  const headingRef = useRef<HTMLHeadingElement>(null);
  const input = usePublicMotionInput();
  const lines = [title, ...(extra ?? [])];
  const label = lines.join(' ');

  useGSAP(() => {
    if (!window.matchMedia) return;
    const media = gsap.matchMedia();
    media.add('(prefers-reduced-motion: no-preference)', () => {
      const lines = headingRef.current?.querySelectorAll('[data-heading-line]');
      if (!lines?.length || input?.current === 'keyboard' || document.hidden) return;
      const entry = gsap.fromTo(lines, { yPercent: 100 }, {
        yPercent: 0, duration: PUBLIC_MOTION.heading, stagger: 0.04,
        ease: PUBLIC_MOTION.ease,
        clearProps: 'transform',
      });
      const finish = () => { entry.progress(1); };
      window.addEventListener('keydown', finish, true);
      return () => window.removeEventListener('keydown', finish, true);
    }, headingRef);
    return () => media.revert();
  }, { scope: headingRef, dependencies: [label], revertOnUpdate: true });

  return (
    <h1 ref={headingRef} aria-label={label}>
      {lines.map((line, lineIndex) => (
        <span className={styles.line} aria-hidden="true" key={lineIndex}>
          <span className={styles.text} data-heading-line>{line}</span>
        </span>
      ))}
    </h1>
  );
}
