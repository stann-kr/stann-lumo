'use client';

import { useEffect, useRef } from 'react';
import { createAmbientRenderer, type AmbientRenderer } from './ambientRenderer';
import styles from './PublicAmbientBackground.module.css';

type AmbientConnection = EventTarget & { saveData?: boolean };

export default function PublicAmbientBackground({ paused = false }: { paused?: boolean }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pausedRef = useRef(paused);
  const syncRef = useRef<(() => void) | null>(null);

  useEffect(() => { pausedRef.current = paused; syncRef.current?.(); }, [paused]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const connection = (navigator as Navigator & { connection?: AmbientConnection }).connection;
    const finePointer = window.matchMedia?.('(hover: hover) and (pointer: fine)');
    let renderer: AmbientRenderer | null = null;
    let frame = 0, elapsed = 0, previousTick = 0, previousDraw = 0;
    let pointerX = 0, pointerY = 0, targetX = 0, targetY = 0;
    let disposed = false, lost = false, unavailable = false;

    const stop = () => { cancelAnimationFrame(frame); frame = 0; previousTick = 0; };
    const release = () => { renderer?.dispose(); renderer = null; canvas.dataset.ready = 'false'; };
    const tick = (now: number) => {
      if (disposed || !renderer || document.hidden || pausedRef.current || connection?.saveData) return;
      const delta = previousTick ? Math.min((now - previousTick) / 1000, 0.1) : 0;
      previousTick = now;
      elapsed += delta;
      const follow = 1 - Math.exp(-delta * 4);
      pointerX += (targetX - pointerX) * follow;
      pointerY += (targetY - pointerY) * follow;
      if (now - previousDraw >= 1000 / 30 - 0.5) {
        renderer.render(elapsed, pointerX, pointerY);
        canvas.dataset.ready = 'true';
        previousDraw = now;
      }
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      stop();
      if (disposed) return;
      if (connection?.saveData) { release(); return; }
      if (document.hidden || pausedRef.current || lost || unavailable) return;
      if (!renderer) {
        try { renderer = createAmbientRenderer(canvas); } catch { renderer = null; }
        if (!renderer) { unavailable = true; return; }
      }
      renderer.resize(window.innerWidth, window.innerHeight);
      previousDraw = -Infinity;
      frame = requestAnimationFrame(tick);
    };
    const move = (event: PointerEvent) => {
      if (!finePointer?.matches || event.pointerType === 'touch') return;
      targetX = Math.max(-0.5, Math.min(0.5, event.clientX / window.innerWidth - 0.5));
      targetY = Math.max(-0.5, Math.min(0.5, 0.5 - event.clientY / window.innerHeight));
    };
    const resetPointer = () => { targetX = 0; targetY = 0; };
    const leave = (event: PointerEvent) => { if (!event.relatedTarget) resetPointer(); };
    const contextLost = (event: Event) => { event.preventDefault(); lost = true; stop(); release(); };
    const contextRestored = () => { lost = false; unavailable = false; sync(); };

    syncRef.current = sync;
    document.addEventListener('visibilitychange', sync);
    window.addEventListener('resize', sync);
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerout', leave, { passive: true });
    window.addEventListener('blur', resetPointer);
    finePointer?.addEventListener('change', resetPointer);
    connection?.addEventListener?.('change', sync);
    canvas.addEventListener('webglcontextlost', contextLost);
    canvas.addEventListener('webglcontextrestored', contextRestored);
    sync();

    return () => {
      disposed = true;
      syncRef.current = null;
      stop();
      release();
      document.removeEventListener('visibilitychange', sync);
      window.removeEventListener('resize', sync);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerout', leave);
      window.removeEventListener('blur', resetPointer);
      finePointer?.removeEventListener('change', resetPointer);
      connection?.removeEventListener?.('change', sync);
      canvas.removeEventListener('webglcontextlost', contextLost);
      canvas.removeEventListener('webglcontextrestored', contextRestored);
    };
  }, []);

  return <div className={styles.ambient} aria-hidden="true">
    <canvas ref={canvasRef} className={styles.canvas} />
  </div>;
}
