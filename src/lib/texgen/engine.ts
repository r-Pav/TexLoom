import { fragSource, VERT_SRC } from './glsl';
import type { GradientStop, PatternDef } from './types';

export interface RenderOpts {
  time?: number;
  invert?: boolean;
}

const LUT_SIZE = 256;






export class TexEngine {
  private gl: WebGL2RenderingContext;
  private canvas: HTMLCanvasElement;
  private progs = new Map<string, WebGLProgram>();
  private lutTex: WebGLTexture;
  private quad: WebGLBuffer;
  private uLocs = new Map<string, Record<string, WebGLUniformLocation | null>>();
  private lutDirty = true;
  private stops: GradientStop[] = [{ t: 0, color: '#000000' }, { t: 1, color: '#ffffff' }];
  private fbo: WebGLFramebuffer | null = null;
  private fboTex: WebGLTexture | null = null;
  private fboSize = 0;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    const gl = canvas.getContext('webgl2', { preserveDrawingBuffer: true });
    if (!gl) throw new Error('当前浏览器不支持 WebGL2');
    this.gl = gl;

    this.quad = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);

    this.lutTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  }

  setGradient(stops: GradientStop[]) {
    this.stops = [...stops].sort((a, b) => a.t - b.t);
    this.lutDirty = true;
  }

  private uploadLut() {
    const data = new Uint8Array(LUT_SIZE * 4);
    const pts = this.stops.map((s) => ({ t: s.t, rgb: hexToRgb(s.color) }));
    if (pts.length === 0) pts.push({ t: 0, rgb: [0, 0, 0] }, { t: 1, rgb: [255, 255, 255] });
    for (let i = 0; i < LUT_SIZE; i++) {
      const t = i / (LUT_SIZE - 1);
      const c = sampleGradient(pts, t);
      data[i * 4] = c[0];
      data[i * 4 + 1] = c[1];
      data[i * 4 + 2] = c[2];
      data[i * 4 + 3] = 255;
    }
    const gl = this.gl;
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, LUT_SIZE, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, data);
    this.lutDirty = false;
  }

  private buildProgram(p: PatternDef): WebGLProgram {
    const gl = this.gl;
    const compile = (type: number, src: string) => {
      const sh = gl.createShader(type)!;
      gl.shaderSource(sh, src);
      gl.compileShader(sh);
      if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
        const log = gl.getShaderInfoLog(sh);
        gl.deleteShader(sh);
        throw new Error(`着色器编译失败 [${p.id}]: ${log}`);
      }
      return sh;
    };
    const prog = gl.createProgram()!;
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VERT_SRC));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, fragSource(p.glsl)));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      throw new Error(`着色器链接失败 [${p.id}]: ${gl.getProgramInfoLog(prog)}`);
    }
    const names = ['u_res', 'u_params', 'u_time', 'u_invert', 'u_lut'];
    const locs: Record<string, WebGLUniformLocation | null> = {};
    for (const n of names) locs[n] = gl.getUniformLocation(prog, n);
    this.uLocs.set(p.id, locs);
    return prog;
  }

  private ensure(p: PatternDef): WebGLProgram {
    let prog = this.progs.get(p.id);
    if (!prog) {
      prog = this.buildProgram(p);
      this.progs.set(p.id, prog);
    }
    return prog;
  }

  private draw(p: PatternDef, params: number[], opts: RenderOpts, w: number, h: number) {
    const gl = this.gl;
    if (this.lutDirty) this.uploadLut();
    const prog = this.ensure(p);
    gl.viewport(0, 0, w, h);
    gl.useProgram(prog);

    gl.bindBuffer(gl.ARRAY_BUFFER, this.quad);
    gl.enableVertexAttribArray(0);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

    const locs = this.uLocs.get(p.id)!;
    gl.uniform2f(locs.u_res, w, h);
    const arr = new Float32Array(10);
    arr.set(params.slice(0, 10));
    gl.uniform1fv(locs.u_params, arr);
    gl.uniform1f(locs.u_time, opts.time ?? 0);
    gl.uniform1f(locs.u_invert, opts.invert ? 1 : 0);
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, this.lutTex);
    gl.uniform1i(locs.u_lut, 0);

    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
  }

  
  render(p: PatternDef, params: number[], opts: RenderOpts = {}) {
    this.draw(p, params, opts, this.canvas.width, this.canvas.height);
  }

  private ensureFbo(size: number) {
    const gl = this.gl;
    if (this.fbo && this.fboSize === size) return;
    if (this.fboTex) gl.deleteTexture(this.fboTex);
    if (this.fbo) gl.deleteFramebuffer(this.fbo);
    this.fboTex = gl.createTexture()!;
    gl.bindTexture(gl.TEXTURE_2D, this.fboTex);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, size, size, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    this.fbo = gl.createFramebuffer()!;
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, this.fboTex, 0);
    this.fboSize = size;
  }

  
  private renderToPixels(p: PatternDef, params: number[], opts: RenderOpts, size: number): Uint8Array {
    const gl = this.gl;
    this.ensureFbo(size);
    gl.bindFramebuffer(gl.FRAMEBUFFER, this.fbo);
    this.draw(p, params, opts, size, size);
    const data = new Uint8Array(size * size * 4);
    gl.readPixels(0, 0, size, size, gl.RGBA, gl.UNSIGNED_BYTE, data);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    return data;
  }

  
  exportPngBlob(p: PatternDef, params: number[], opts: RenderOpts & { size: number }): Promise<Blob> {
    const size = opts.size;
    const data = this.renderToPixels(p, params, opts, size);
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.putImageData(flippedImageData(data, size), 0, 0);
    return new Promise((resolve, reject) => {
      c.toBlob((b) => (b ? resolve(b) : reject(new Error('PNG 编码失败'))), 'image/png');
    });
  }

  
  renderThumb(p: PatternDef, size = 96): string {
    const params = p.params.map((d) => d.def);
    const data = this.renderToPixels(p, params, { time: p.anim ? 0.6 : 0 }, size);
    const c = document.createElement('canvas');
    c.width = size;
    c.height = size;
    const ctx = c.getContext('2d')!;
    ctx.putImageData(flippedImageData(data, size), 0, 0);
    return c.toDataURL('image/png');
  }
}


function flippedImageData(data: Uint8Array, size: number): ImageData {
  const out = new ImageData(size, size);
  const row = size * 4;
  for (let y = 0; y < size; y++) {
    const src = (size - 1 - y) * row;
    out.data.set(data.subarray(src, src + row), y * row);
  }
  return out;
}


let shared: TexEngine | null = null;
export function getSharedEngine(): TexEngine {
  if (!shared) {
    const off = document.createElement('canvas');
    off.width = 8;
    off.height = 8;
    shared = new TexEngine(off);
  }
  return shared;
}

export function exportPngBlob(
  p: PatternDef,
  params: number[],
  stops: GradientStop[],
  opts: RenderOpts & { size: number },
): Promise<Blob> {
  const eng = getSharedEngine();
  eng.setGradient(stops);
  return eng.exportPngBlob(p, params, opts);
}

export function renderThumb(p: PatternDef, stops: GradientStop[], size = 96): string {
  const eng = getSharedEngine();
  eng.setGradient(stops);
  return eng.renderThumb(p, size);
}

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function sampleGradient(pts: { t: number; rgb: [number, number, number] }[], t: number): [number, number, number] {
  if (t <= pts[0].t) return pts[0].rgb;
  const last = pts[pts.length - 1];
  if (t >= last.t) return last.rgb;
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (t >= a.t && t <= b.t) {
      const f = (t - a.t) / Math.max(b.t - a.t, 1e-6);
      return [
        Math.round(a.rgb[0] + (b.rgb[0] - a.rgb[0]) * f),
        Math.round(a.rgb[1] + (b.rgb[1] - a.rgb[1]) * f),
        Math.round(a.rgb[2] + (b.rgb[2] - a.rgb[2]) * f),
      ];
    }
  }
  return last.rgb;
}
