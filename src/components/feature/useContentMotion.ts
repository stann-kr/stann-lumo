'use client';

import { useRef, type RefObject } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';
import { PUBLIC_MOTION, usePublicMotionInput } from './publicMotion';

gsap.registerPlugin(useGSAP);

/** The page opts individual elements into motion; content stays readable without JS. */
export function useContentMotion(rootRef: RefObject<HTMLElement | null>, revision?: string | number, enter = false) {
  const revealed = useRef(new WeakSet<HTMLElement>());
  const entered = useRef(false);
  const input = usePublicMotionInput();

  useGSAP(() => {
    const root = rootRef.current;
    if (!root || !window.matchMedia) return;
    gsap.registerPlugin(ScrollTrigger);
    const media = gsap.matchMedia();

    media.add('(prefers-reduced-motion: no-preference)', () => {
      const reveals = new Map<HTMLElement, gsap.core.Tween>();
      if (enter && !entered.current && input?.current !== 'keyboard' && !document.hidden) {
        entered.current = true;
        reveals.set(root, gsap.fromTo(root, { opacity: 0 }, {
          opacity: 1, duration: PUBLIC_MOTION.feedback, ease: PUBLIC_MOTION.ease, clearProps: 'opacity',
        }));
      }
      root.querySelectorAll<HTMLElement>('[data-reveal]').forEach((element, index) => {
        if (revealed.current.has(element)) return;
        if (input?.current === 'keyboard' || document.hidden) {
          revealed.current.add(element);
          return;
        }
        const isRow = element.dataset.reveal === 'row';
        const tween = gsap.fromTo(element, {
          y: isRow ? 0 : 16,
          opacity: 0,
        }, {
          y: 0, opacity: 1,
          duration: PUBLIC_MOTION.content,
          delay: (index % 3) * 0.035,
          ease: PUBLIC_MOTION.ease,
          clearProps: 'transform,opacity',
          onStart: () => { revealed.current.add(element); },
          scrollTrigger: { trigger: element, start: 'top 92%', once: true },
        });
        reveals.set(element, tween);
      });

      // Tabbing directly to a link must never wait for its scroll reveal.
      const revealFocused = (event: FocusEvent) => {
        if (!(event.target instanceof Element)) return;
        reveals.get(root)?.progress(1);
        const element = event.target.closest<HTMLElement>('[data-reveal]');
        if (element) reveals.get(element)?.progress(1);
      };
      root.addEventListener('focusin', revealFocused);
      const finishReveals = () => {
        reveals.forEach((tween, element) => {
          revealed.current.add(element);
          tween.progress(1);
        });
      };
      window.addEventListener('keydown', finishReveals, true);

      // Refresh after images/fonts settle, and after accordion or list size changes.
      let isActive = true;
      const refresh = gsap.delayedCall(0.16, () => ScrollTrigger.refresh()).pause();
      const scheduleRefresh = () => { if (isActive) refresh.restart(true); };
      const observer = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(scheduleRefresh);
      observer?.observe(root);
      root.addEventListener('load', scheduleRefresh, true);
      void document.fonts?.ready.then(scheduleRefresh);
      scheduleRefresh();

      return () => {
        isActive = false;
        observer?.disconnect();
        root.removeEventListener('load', scheduleRefresh, true);
        root.removeEventListener('focusin', revealFocused);
        window.removeEventListener('keydown', finishReveals, true);
      };
    }, rootRef);
    entered.current = true;

    media.add('(prefers-reduced-motion: no-preference) and (hover: hover) and (pointer: fine)', () => {
      const cleanups: Array<() => void> = [];
      root.querySelectorAll<HTMLElement>('[data-hover]').forEach((surface) => {
        const rule = surface.querySelector<HTMLElement>('[data-hover-rule]');
        if (!rule) return;
        const hover = gsap.timeline({ paused: true, defaults: { duration: PUBLIC_MOTION.feedback, ease: PUBLIC_MOTION.ease } });
        hover.fromTo(rule, { scaleX: 0 }, { scaleX: 1, transformOrigin: '0% 50%' }, 0);

        const enter = (event: PointerEvent) => { if (event.pointerType !== 'touch') hover.timeScale(1).play(); };
        const leave = () => { hover.timeScale(1.5).reverse(); };
        const focus = () => { hover.pause(0); };
        surface.addEventListener('pointerenter', enter);
        surface.addEventListener('pointerleave', leave);
        surface.addEventListener('focusin', focus);
        cleanups.push(() => {
          surface.removeEventListener('pointerenter', enter);
          surface.removeEventListener('pointerleave', leave);
          surface.removeEventListener('focusin', focus);
        });
      });
      return () => cleanups.forEach((cleanup) => cleanup());
    }, rootRef);

    return () => media.revert();
  }, { scope: rootRef, dependencies: [revision, enter], revertOnUpdate: true });
}
