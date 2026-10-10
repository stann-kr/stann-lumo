import { act, fireEvent, render } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import PublicAmbientBackground from './PublicAmbientBackground';
import { createAmbientRenderer, type AmbientRenderer } from './ambientRenderer';

vi.mock('./ambientRenderer', () => ({ createAmbientRenderer: vi.fn() }));

describe('public ambient background lifecycle', () => {
  let callbacks: Map<number, FrameRequestCallback>;
  let renderer: { [Method in keyof AmbientRenderer]: Mock<AmbientRenderer[Method]> };
  let connection: EventTarget & { saveData: boolean };
  let finePointer: MediaQueryList;

  beforeEach(() => {
    callbacks = new Map();
    let sequence = 0;
    vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) => { callbacks.set(++sequence, callback); return sequence; });
    vi.stubGlobal('cancelAnimationFrame', (id: number) => callbacks.delete(id));
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    finePointer = Object.assign(new EventTarget(), { matches: true }) as MediaQueryList;
    // Background motion deliberately remains enabled for reduced motion per this task's instruction.
    vi.stubGlobal('matchMedia', () => finePointer);
    connection = Object.assign(new EventTarget(), { saveData: false });
    vi.stubGlobal('navigator', { connection });
    renderer = { resize: vi.fn(), render: vi.fn(), dispose: vi.fn() };
    vi.mocked(createAmbientRenderer).mockReset().mockReturnValue(renderer);
  });
  afterEach(() => { vi.restoreAllMocks(); vi.unstubAllGlobals(); });

  const frameAt = (time: number) => act(() => {
    const pending = [...callbacks.values()];
    callbacks.clear();
    pending.forEach(callback => callback(time));
  });
  const move = (x: number, y: number, pointerType = 'mouse') => act(() => {
    const event = new Event('pointermove');
    Object.assign(event, { clientX: x, clientY: y, pointerType });
    window.dispatchEvent(event);
  });

  it('bounds draw frequency and eases toward pointer coordinates without moving content or restarting the renderer', () => {
    const { container } = render(<PublicAmbientBackground />);
    const canvas = container.querySelector('canvas')!;
    frameAt(1000);
    expect(canvas).toHaveAttribute('data-ready', 'true');
    expect(canvas.parentElement).toHaveAttribute('aria-hidden', 'true');
    move(window.innerWidth, 0);
    frameAt(1016);
    expect(renderer.render).toHaveBeenCalledTimes(1);
    frameAt(1034);
    const [, x, y] = renderer.render.mock.lastCall!;
    expect(x).toBeGreaterThan(0);
    expect(x).toBeLessThan(0.5);
    expect(y).toBe(x);
    frameAt(1068);
    expect(renderer.render.mock.lastCall![1]).toBeGreaterThan(x);
    expect(createAmbientRenderer).toHaveBeenCalledTimes(1);
    expect(renderer.resize).toHaveBeenCalledTimes(1);
  });

  it('pauses hidden / covered content and resumes the same renderer without advancing hidden time', () => {
    const view = render(<PublicAmbientBackground />);
    frameAt(1000);
    frameAt(1034);
    const elapsed = renderer.render.mock.lastCall![0];
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(true);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    expect(callbacks.size).toBe(0);
    vi.spyOn(document, 'hidden', 'get').mockReturnValue(false);
    act(() => document.dispatchEvent(new Event('visibilitychange')));
    frameAt(60000);
    expect(renderer.render.mock.lastCall![0]).toBe(elapsed);
    view.rerender(<PublicAmbientBackground paused />);
    expect(callbacks.size).toBe(0);
    view.rerender(<PublicAmbientBackground paused={false} />);
    expect(callbacks.size).toBe(1);
    expect(createAmbientRenderer).toHaveBeenCalledTimes(1);
    expect(renderer.dispose).not.toHaveBeenCalled();
    const stale = [...callbacks.values()][0]!;
    view.unmount();
    expect(callbacks.size).toBe(0);
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    act(() => stale(60034));
    expect(callbacks.size).toBe(0);
  });

  it('uses a static fallback on save-data and WebGL failure, and releases an active renderer when save-data is enabled', () => {
    connection.saveData = true;
    const view = render(<PublicAmbientBackground />);
    expect(createAmbientRenderer).not.toHaveBeenCalled();
    expect(callbacks.size).toBe(0);
    connection.saveData = false;
    act(() => connection.dispatchEvent(new Event('change')));
    frameAt(1000);
    connection.saveData = true;
    act(() => connection.dispatchEvent(new Event('change')));
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    expect(view.container.querySelector('canvas')).toHaveAttribute('data-ready', 'false');
    expect(callbacks.size).toBe(0);
    view.unmount();
    connection.saveData = false;
    vi.mocked(createAmbientRenderer).mockReturnValue(null);
    const fallback = render(<PublicAmbientBackground />);
    expect(fallback.container.querySelector('canvas')).not.toHaveAttribute('data-ready', 'true');
    expect(callbacks.size).toBe(0);
  });

  it('falls back after context loss and recreates GPU resources when the context is restored', () => {
    const view = render(<PublicAmbientBackground />);
    const canvas = view.container.querySelector('canvas')!;
    frameAt(1000);
    const loss = new Event('webglcontextlost', { cancelable: true });
    fireEvent(canvas, loss);
    expect(loss.defaultPrevented).toBe(true);
    expect(callbacks.size).toBe(0);
    expect(canvas).toHaveAttribute('data-ready', 'false');
    expect(renderer.dispose).toHaveBeenCalledTimes(1);
    fireEvent(canvas, new Event('webglcontextrestored'));
    frameAt(2000);
    expect(createAmbientRenderer).toHaveBeenCalledTimes(2);
    expect(canvas).toHaveAttribute('data-ready', 'true');
    view.unmount();
    expect(renderer.dispose).toHaveBeenCalledTimes(2);
  });

  it('ignores touch and coarse-pointer positions while keeping the ambient animation running', () => {
    render(<PublicAmbientBackground />);
    frameAt(1000);
    move(window.innerWidth, 0, 'touch');
    frameAt(1034);
    expect(renderer.render.mock.lastCall!.slice(1)).toEqual([0, 0]);
    Object.defineProperty(finePointer, 'matches', { value: false });
    move(window.innerWidth, 0);
    frameAt(1068);
    expect(renderer.render.mock.lastCall!.slice(1)).toEqual([0, 0]);
    expect(callbacks.size).toBe(1);
  });
});
