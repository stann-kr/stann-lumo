import { afterEach, describe, expect, it, vi } from 'vitest';
import { createAmbientRenderer } from './ambientRenderer';

function graphics() {
  vi.stubGlobal('WebGLRenderingContext', class {});
  const gl = {
    VERTEX_SHADER: 1, FRAGMENT_SHADER: 2, COMPILE_STATUS: 3, LINK_STATUS: 4,
    ARRAY_BUFFER: 5, STATIC_DRAW: 6, FLOAT: 7, TRIANGLES: 8,
    createShader: vi.fn(() => ({})), createProgram: vi.fn(() => ({})), createBuffer: vi.fn(() => ({})),
    shaderSource: vi.fn(), compileShader: vi.fn(), attachShader: vi.fn(), linkProgram: vi.fn(),
    getShaderParameter: vi.fn(() => true), getProgramParameter: vi.fn(() => true),
    bindBuffer: vi.fn(), bufferData: vi.fn(), useProgram: vi.fn(),
    getAttribLocation: vi.fn(() => 0), enableVertexAttribArray: vi.fn(), vertexAttribPointer: vi.fn(),
    getUniformLocation: vi.fn(() => ({})), uniform2f: vi.fn(), uniform1f: vi.fn(),
    viewport: vi.fn(), drawArrays: vi.fn(), deleteShader: vi.fn(), deleteProgram: vi.fn(), deleteBuffer: vi.fn(),
  };
  const canvas = { width: 300, height: 150, getContext: vi.fn(() => gl) } as unknown as HTMLCanvasElement;
  return { gl, canvas };
}

afterEach(() => vi.unstubAllGlobals());

describe('ambient GPU resource boundary', () => {
  it('caps the drawing buffer for large screens, preserves aspect ratio and releases its GPU resources', () => {
    const { canvas, gl } = graphics();
    const renderer = createAmbientRenderer(canvas)!;
    for (const [width, height] of [[3840, 2160], [1440, 900], [390, 844]]) {
      renderer.resize(width!, height!);
      expect(canvas.width * canvas.height).toBeLessThanOrEqual(900_000);
      expect(canvas.width).toBeLessThanOrEqual(width!);
      expect(Math.abs(canvas.width / canvas.height - width! / height!)).toBeLessThan(0.005);
    }
    renderer.render(4, 0.2, -0.1);
    expect(gl.uniform2f).toHaveBeenLastCalledWith(expect.any(Object), 0.2, -0.1);
    expect(gl.drawArrays).toHaveBeenCalledTimes(1);
    renderer.dispose();
    expect(gl.deleteBuffer).toHaveBeenCalledTimes(1);
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteShader).toHaveBeenCalledTimes(2);
  });

  it.each(['compile', 'link'] as const)('cleans partially initialized resources after a %s failure', (stage) => {
    const { canvas, gl } = graphics();
    if (stage === 'compile') gl.getShaderParameter.mockReturnValue(false);
    else gl.getProgramParameter.mockReturnValue(false);
    expect(createAmbientRenderer(canvas)).toBeNull();
    expect(gl.deleteProgram).toHaveBeenCalledTimes(1);
    expect(gl.deleteShader).toHaveBeenCalledTimes(stage === 'compile' ? 1 : 2);
    expect(gl.createBuffer).not.toHaveBeenCalled();
  });
});
