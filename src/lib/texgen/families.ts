import { SHAPE_MAP, SHAPES, polygonShape, starShape } from './shapes';
import type { CategoryId, ParamDef, PatternDef } from './types';





const body = (s: string) => `float evalPattern(vec2 p, vec2 uv){\n${s}\n}`;
const P = (label: string, min: number, max: number, step: number, def: number): ParamDef => ({
  label, min, max, step, def,
});

const inject = (shapeGlsl: string, core: string) => `${shapeGlsl}\n${body(core)}`;



const SDF_STYLES = [
  {
    suffix: '', zhSuffix: '',
    params: [P('尺寸', 0.1, 1.0, 0.01, 0.55), P('羽化', 0.0, 0.15, 0.005, 0.015), P('旋转', 0, 360, 1, 0)],
    core: `
      vec2 q = rot2(p, radians(P2));
      float d = sh(q / max(P0, 0.02)) * max(P0, 0.02);
      return smoothstep(P1, -P1, d);`,
  },
  {
    suffix: '-ring', zhSuffix: '·环',
    params: [P('尺寸', 0.1, 1.0, 0.01, 0.55), P('线宽', 0.02, 0.25, 0.005, 0.08), P('羽化', 0.0, 0.1, 0.005, 0.015), P('旋转', 0, 360, 1, 0)],
    core: `
      vec2 q = rot2(p, radians(P3));
      float d = abs(sh(q / max(P0, 0.02))) * max(P0, 0.02);
      return smoothstep(P2, -P2, d - P1 * 0.5);`,
  },
  {
    suffix: '-shade', zhSuffix: '·晕',
    params: [P('尺寸', 0.1, 1.0, 0.01, 0.55), P('羽化', 0.0, 0.15, 0.005, 0.02), P('衰减半径', 0.3, 2.0, 0.01, 1.2), P('旋转', 0, 360, 1, 0)],
    core: `
      vec2 q = rot2(p, radians(P3));
      float d = sh(q / max(P0, 0.02)) * max(P0, 0.02);
      float fill = smoothstep(P1, -P1, d);
      float fall = clamp(1.0 - length(p) / max(P2, 0.01), 0.0, 1.0);
      return fill * (0.25 + 0.75 * fall);`,
  },
  {
    suffix: '-glow', zhSuffix: '·辉',
    params: [P('尺寸', 0.1, 1.0, 0.01, 0.5), P('羽化', 0.0, 0.1, 0.005, 0.01), P('辉光紧致', 1, 16, 0.5, 6), P('旋转', 0, 360, 1, 0)],
    core: `
      vec2 q = rot2(p, radians(P3));
      float d = sh(q / max(P0, 0.02)) * max(P0, 0.02);
      float fill = smoothstep(P1, -P1, d);
      float g = exp(-max(d, 0.0) * P2);
      return max(fill, g * 0.85);`,
  },
];

const sdfFamilyShapes = [
  ...SHAPES,
  ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(polygonShape),
  ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(starShape),
];

function sdfFamily(): PatternDef[] {
  const out: PatternDef[] = [];
  for (const s of sdfFamilyShapes) {
    for (const st of SDF_STYLES) {
      out.push({
        id: `sdf-${s.id}${st.suffix}`,
        zh: `${s.zh}${st.zhSuffix}`,
        cat: 'basic' as CategoryId,
        params: st.params,
        glsl: inject(s.glsl, st.core),
      });
    }
  }
  return out;
}



const GRID_SHAPES = [
  'square', 'rect-h', 'rect-v', 'round-box', 'diamond', 'diamond-slim',
  'cross', 'cross-x', 'capsule-h', 'capsule-v', 'ellipse-h', 'ellipse-v',
  'trapezoid', 'parallelogram', 'chevron', 'hex-flat', 'spark-4', 'clover',
  'pillow', 'gear', 'heart', 'crescent-sd', 'lens', 'ring-notch',
];

const GRID_STYLES = [
  {
    suffix: '-full', zhSuffix: '·满格',
    params: [P('密度', 1, 24, 1, 6), P('尺寸', 0.05, 0.48, 0.01, 0.38), P('羽化', 0.0, 0.12, 0.005, 0.02)],
    core: `
      vec2 q = p * floor(P0);
      vec2 f = fract(q) - 0.5;
      float d = sh(f / max(P1, 0.01)) * max(P1, 0.01);
      return smoothstep(P2, -P2, d);`,
  },
  {
    suffix: '-outline', zhSuffix: '·描边',
    params: [P('密度', 1, 24, 1, 4), P('尺寸', 0.05, 0.48, 0.01, 0.38), P('线宽', 0.01, 0.15, 0.005, 0.05), P('羽化', 0.0, 0.08, 0.005, 0.02)],
    core: `
      vec2 q = p * floor(P0);
      vec2 f = fract(q) - 0.5;
      float d = abs(sh(f / max(P1, 0.01))) * max(P1, 0.01);
      return smoothstep(P3, -P3, d - P2 * 0.5);`,
  },
  {
    suffix: '-spin', zhSuffix: '·乱向',
    params: [P('密度', 1, 24, 1, 6), P('尺寸', 0.05, 0.48, 0.01, 0.34), P('羽化', 0.0, 0.12, 0.005, 0.02), P('乱向程度', 0, 1, 0.05, 0.7)],
    core: `
      vec2 q = p * floor(P0);
      vec2 id = floor(q);
      vec2 f = fract(q) - 0.5;
      float rnd = hash21(id + 5.5);
      f = rot2(f, rnd * TAU * P3);
      float d = sh(f / max(P1, 0.01)) * max(P1, 0.01);
      return smoothstep(P2, -P2, d);`,
  },
];

function gridFamily(): PatternDef[] {
  const out: PatternDef[] = [];
  for (const id of GRID_SHAPES) {
    const s = SHAPE_MAP.get(id)!;
    for (const st of GRID_STYLES) {
      out.push({
        id: `grid-${s.id}${st.suffix}`,
        zh: `${s.zh}阵${st.zhSuffix}`,
        cat: 'order' as CategoryId,
        params: st.params,
        glsl: inject(s.glsl, st.core),
      });
    }
  }
  return out;
}



interface TileDef { id: string; zh: string; glsl: string; }

const TILES: TileDef[] = [
  { id: 'arc', zh: '单弧', glsl: `float tile(vec2 f){ float d1 = abs(length(f - vec2(0.5, 0.5)) - 0.5); float d2 = abs(length(f + vec2(0.5, 0.5)) - 0.5); return min(d1, d2) - 0.055; }` },
  { id: 'sarc', zh: '双弧', glsl: `float tile(vec2 f){ float d1 = abs(length(f - vec2(0.5, 0.5)) - 0.5); float d2 = abs(length(f + vec2(0.5, 0.5)) - 0.5); return abs(d1 - d2) * 1.2 - 0.05; }` },
  { id: 'diag', zh: '对角线', glsl: `float tile(vec2 f){ return abs(f.x + f.y) - 0.045; }` },
  { id: 'diag2', zh: '双对角', glsl: `float tile(vec2 f){ return min(abs(f.x + f.y), abs(f.x - f.y)) - 0.04; }` },
  { id: 'cross', zh: '十字线', glsl: `float tile(vec2 f){ return min(abs(f.x), abs(f.y)) - 0.04; }` },
  { id: 'dot', zh: '中点圆', glsl: `float tile(vec2 f){ return length(f) - 0.17; }` },
  { id: 'dots2', zh: '双点', glsl: `float tile(vec2 f){ return min(length(f - vec2(0.22, 0.0)), length(f + vec2(0.22, 0.0))) - 0.1; }` },
  { id: 'half', zh: '斜半格', glsl: `float tile(vec2 f){ return (f.x + f.y) * 0.5 - 0.015; }` },
  { id: 'dia', zh: '菱形块', glsl: `float tile(vec2 f){ return (abs(f.x) + abs(f.y)) * 0.70710678 - 0.3; }` },
  { id: 'corner', zh: '角方块', glsl: `float tile(vec2 f){ vec2 g = abs(f) - 0.5; vec2 d2 = abs(g) - vec2(0.13); return length(max(d2, vec2(0.0))) + min(max(d2.x, d2.y), 0.0); }` },
  { id: 'vline', zh: '竖线', glsl: `float tile(vec2 f){ return abs(f.x) - 0.04; }` },
  { id: 'hline', zh: '横线', glsl: `float tile(vec2 f){ return abs(f.y) - 0.04; }` },
  { id: 'wave', zh: '波浪线', glsl: `float tile(vec2 f){ return abs(f.y - 0.16 * sin(f.x * TAU)) - 0.035; }` },
  { id: 'dotline', zh: '线中点', glsl: `float tile(vec2 f){ return min(abs(f.y) - 0.03, length(f) - 0.1); }` },
  { id: 'sqring', zh: '方环', glsl: `float tile(vec2 f){ vec2 d = abs(f); float m = max(d.x, d.y); return abs(m - 0.33) - 0.05; }` },
  { id: 'ciring', zh: '圆环', glsl: `float tile(vec2 f){ return abs(length(f) - 0.33) - 0.05; }` },
];

const TILE_VARIANTS = [
  { suffix: '', zhSuffix: '', code: '' },
  { suffix: '-m', zhSuffix: '·镜像', code: 'if(rnd < 0.5) f.x = -f.x;' },
  { suffix: '-r', zhSuffix: '·旋', code: 'if(rnd < 0.5) f = vec2(f.y, -f.x);' },
  { suffix: '-i', zhSuffix: '·反', code: 'INVERT' },
];

function tileFamily(): PatternDef[] {
  const out: PatternDef[] = [];
  for (const t of TILES) {
    for (const v of TILE_VARIANTS) {
      const invert = v.code === 'INVERT';
      const code = invert ? '' : v.code;
      const core = `
        vec2 q = p * floor(P0);
        vec2 id = floor(q);
        vec2 f = fract(q) - 0.5;
        float rnd = hash21(id);
        ${code}
        float d = tile(f);
        float v = smoothstep(P1, -P1, d);
        return ${invert ? '1.0 - v' : 'v'};`;
      out.push({
        id: `tile-${t.id}${v.suffix}`,
        zh: `曲径${t.zh}${v.zhSuffix}`,
        cat: 'tile' as CategoryId,
        params: [P('密度', 1, 16, 1, 4), P('线宽', 0.0, 0.12, 0.005, 0.03)],
        glsl: `${t.glsl}\n${body(core)}`,
      });
    }
  }
  return out;
}



const FRAME_PROFILES: { id: string; zh: string; expr: string }[] = [
  { id: 'single', zh: '单线', expr: `v = band(m, R, w);` },
  { id: 'thick', zh: '粗线', expr: `v = band(m, R, w * 2.2);` },
  { id: 'double', zh: '双线', expr: `v = band(m, R, w) + band(m, R - w * 3.2, w);` },
  { id: 'triple', zh: '三线', expr: `v = band(m, R, w) + band(m, R - w * 3.0, w) + band(m, R - w * 6.0, w * 0.7);` },
  { id: 'wide2', zh: '疏双线', expr: `v = band(m, R, w) + band(m, R - w * 7.0, w * 1.4);` },
  { id: 'innerglow', zh: '内发光', expr: `v = band(m, R, w); v = max(v, smoothstep(R, R - w * 5.0, m) * 0.45);` },
  { id: 'outerglow', zh: '外发光', expr: `v = band(m, R, w); v = max(v, exp(-max(m - R, 0.0) / max(w * 3.0, 0.01)) * band(m, R + w * 8.0, w * 16.0) * 0.8);` },
  { id: 'corners', zh: '角框', expr: `float cm = smoothstep(0.25, 0.5, abs(cos(a * 2.0))); v = band(m, R, w) * cm;` },
  { id: 'cornerdots', zh: '角点框', expr: `v = band(m, R, w); v += smoothstep(w * 1.2, 0.0, length(abs(p) - vec2(R * 0.72)));` },
  { id: 'wavy', zh: '波边', expr: `float rc = R + 0.03 * sin(a * floor(P2)); v = band(m, rc, w);` },
  { id: 'dashed', zh: '断线', expr: `v = band(m, R, w) * step(fract(a / TAU * floor(P2)), 0.62);` },
  { id: 'fade', zh: '渐隐', expr: `v = band(m, R, w) * (0.25 + 0.75 * (0.5 + 0.5 * sin(a + P2)));` },
];

const FRAME_BASES = [
  { suffix: '', zhSuffix: '', m: `float m = max(abs(p.x), abs(p.y));` },
  { suffix: '-c', zhSuffix: '·圆', m: `float m = length(p);` },
];

function frameFamily(): PatternDef[] {
  const out: PatternDef[] = [];
  for (const b of FRAME_BASES) {
    for (const f of FRAME_PROFILES) {
      const core = `
        ${b.m}
        float a = atan(p.y, p.x);
        float R = max(P0, 0.05);
        float w = max(P1, 0.008);
        float soft = max(w * 0.45, 0.006);
        float v = 0.0;
        ${f.expr}
        return clamp(v, 0.0, 1.0);`;
      out.push({
        id: `frame-${f.id}${b.suffix}`,
        zh: `画框·${f.zh}${b.zhSuffix}`,
        cat: 'frame' as CategoryId,
        params: [P('框距', 0.4, 1.3, 0.01, 0.95), P('线宽', 0.01, 0.12, 0.005, 0.035), P('花样频率', 2, 24, 1, 8)],
        glsl: `float band(float d, float c, float w, float s){ return smoothstep(s, -s, abs(d - c) - w * 0.5); }\nfloat band(float d, float c, float w){ return band(d, c, w, max(w * 0.45, 0.006)); }\n${body(core)}`,
      });
    }
  }
  return out;
}



const GRADS: { id: string; zh: string; glsl: string; params: ParamDef[] }[] = [
  { id: 'linear', zh: '线性', glsl: `vec2 q = rot2(p, radians(P1)); return clamp(q.x * P0 * 0.5 + 0.5, 0.0, 1.0);`, params: [P('缩放', 0.2, 4, 0.05, 1), P('角度', 0, 360, 1, 0)] },
  { id: 'diag', zh: '对角', glsl: `vec2 q = rot2(p, radians(45.0 + P1)); return clamp(q.x * P0 * 0.5 + 0.5, 0.0, 1.0);`, params: [P('缩放', 0.2, 4, 0.05, 1), P('角度', -90, 90, 1, 0)] },
  { id: 'radial', zh: '径向', glsl: `return clamp(length(p) / max(P0, 0.01) * P1, 0.0, 1.0);`, params: [P('半径', 0.1, 2, 0.01, 1), P('缩放', 0.2, 3, 0.05, 1)] },
  { id: 'radial2', zh: '径向平方', glsl: `float d = clamp(length(p) / max(P0, 0.01), 0.0, 1.0); return d * d * P1;`, params: [P('半径', 0.1, 2, 0.01, 1), P('缩放', 0.2, 3, 0.05, 1)] },
  { id: 'square', zh: '方形', glsl: `return clamp(max(abs(p.x), abs(p.y)) / max(P0, 0.01) * P1, 0.0, 1.0);`, params: [P('半径', 0.1, 2, 0.01, 1), P('缩放', 0.2, 3, 0.05, 1)] },
  { id: 'diamond', zh: '菱形', glsl: `return clamp((abs(p.x) + abs(p.y)) / max(P0, 0.01) * P1 * 0.7071, 0.0, 1.0);`, params: [P('半径', 0.1, 2, 0.01, 1), P('缩放', 0.2, 3, 0.05, 1)] },
  { id: 'conic', zh: '圆锥', glsl: `float a = atan(p.y, p.x) + radians(P1); return fract(a / TAU * floor(P0));`, params: [P('扇区数', 1, 16, 1, 1), P('旋转', 0, 360, 1, 0)] },
  { id: 'biconic', zh: '双圆锥', glsl: `float a = atan(p.y, p.x) + radians(P1); float v = abs(fract(a / TAU * floor(P0)) - 0.5) * 2.0; return v;`, params: [P('扇区数', 1, 16, 1, 1), P('旋转', 0, 360, 1, 0)] },
  { id: 'quad', zh: '四象限', glsl: `return clamp(p.x * p.y * P0 * 2.0 + 0.5, 0.0, 1.0);`, params: [P('缩放', 0.2, 4, 0.05, 1)] },
  { id: 'mirror-h', zh: '水平镜像', glsl: `return clamp(abs(p.x) / max(P0, 0.01) * P1, 0.0, 1.0);`, params: [P('半径', 0.1, 2, 0.01, 1), P('缩放', 0.2, 3, 0.05, 1)] },
  { id: 'two-src', zh: '双源', glsl: `float d1 = length(p - vec2(P1, 0.0)); float d2 = length(p + vec2(P1, 0.0)); return clamp(d1 / max(d1 + d2, 0.001) * P0, 0.0, 1.0);`, params: [P('缩放', 0.5, 4, 0.05, 1), P('间距', 0, 1.2, 0.01, 0.4)] },
  { id: 'spiral', zh: '角向螺旋', glsl: `float a = atan(p.y, p.x) + length(p) * P1 * 4.0; return fract(a / TAU * floor(P0));`, params: [P('臂数', 1, 12, 1, 2), P('扭转', 0, 4, 0.1, 1)] },
];

function gradFamily(): PatternDef[] {
  return GRADS.map((g) => ({
    id: `grad-${g.id}`,
    zh: `渐变·${g.zh}`,
    cat: 'grad' as CategoryId,
    params: g.params,
    glsl: body(g.glsl),
  }));
}



const MIX_SHAPES = ['square', 'round-box', 'diamond', 'cross', 'ellipse-h', 'hex-flat', 'star-5', 'heart', 'gear', 'lens'];
const MIX_NOISES = [
  { suffix: 'vn', zhSuffix: '值噪', expr: `vnoise(q * P0)` },
  { suffix: 'fb', zhSuffix: '叠分', expr: `fbm(q * P0, int(P1), P2)` },
  { suffix: 'rg', zhSuffix: '山脊', expr: `ridged(q * P0, int(P1), P2)` },
];

function noiseMixFamily(): PatternDef[] {
  const out: PatternDef[] = [];
  for (const id of MIX_SHAPES) {
    const s = SHAPE_MAP.get(id)!;
    for (const n of MIX_NOISES) {
      const core = `
        vec2 q = p;
        float nz = ${n.expr};
        float d = sh(q / max(P3, 0.02)) * max(P3, 0.02);
        float mask = smoothstep(0.03, -0.03, d);
        return clamp(nz * 1.15, 0.0, 1.0) * mask;`;
      out.push({
        id: `mix-${s.id}-${n.suffix}`,
        zh: `蚀刻·${s.zh}·${n.zhSuffix}`,
        cat: 'chaos' as CategoryId,
        params: [P('噪声缩放', 1, 20, 0.5, 6), P('倍频', 1, 8, 1, 4), P('增益', 0.35, 0.75, 0.01, 0.5), P('形状尺寸', 0.2, 1.2, 0.01, 0.7)],
        glsl: inject(s.glsl, core),
      });
    }
  }
  return out;
}



const SCATTER_SHAPES = ['square', 'diamond', 'cross', 'star-5', 'capsule-h', 'ellipse-h', 'heart', 'spark-4', 'gear', 'hex-flat'];

function scatterFamily(): PatternDef[] {
  const out: PatternDef[] = [];
  for (const id of SCATTER_SHAPES) {
    const s = SHAPE_MAP.get(id)!;
    for (const loose of [false, true]) {
      const core = `
        vec2 q = p * floor(P0);
        vec2 idc = floor(q);
        vec2 f = fract(q) - 0.5;
        float rnd = hash21(idc + 3.7);
        ${loose ? 'f += (vec2(hash21(idc + 1.3), hash21(idc + 2.9)) - 0.5) * 0.55;' : ''}
        if(hash21(idc + 7.1) > P3) return 0.0;
        float sr = P1 * (0.45 + 0.55 * rnd);
        vec2 fr = rot2(f, rnd * TAU * ${loose ? '0.0' : 'P3'});
        float d = sh(fr / max(sr, 0.01)) * max(sr, 0.01);
        return smoothstep(P2, -P2, d);`;
      out.push({
        id: `scatter-${s.id}${loose ? '-loose' : ''}`,
        zh: `散布·${s.zh}${loose ? '·游离' : ''}`,
        cat: 'scatter' as CategoryId,
        params: [P('密度', 2, 24, 1, 8), P('尺寸', 0.05, 0.4, 0.01, 0.16), P('羽化', 0.0, 0.1, 0.005, 0.015), P(loose ? '出现率' : '乱向', 0, 1, 0.05, loose ? 0.8 : 0.6)],
        glsl: inject(s.glsl, core),
      });
    }
  }
  return out;
}



function kaleidoFamily(): PatternDef[] {
  const out: PatternDef[] = [];
  for (let k = 4; k <= 14; k++) {
    for (const noise of [false, true]) {
      const core = noise
        ? `
          float seg = TAU / ${k.toFixed(1)};
          float a = atan(p.y, p.x);
          float r = length(p);
          a = mod(a, seg);
          a = abs(a - seg * 0.5);
          vec2 s = vec2(cos(a), sin(a)) * r;
          return fbm(s * P0, int(P1), 0.5);`
        : `
          float seg = TAU / ${k.toFixed(1)};
          float a = atan(p.y, p.x);
          float r = length(p);
          a = mod(a, seg);
          a = abs(a - seg * 0.5);
          vec2 s = vec2(cos(a), sin(a)) * r;
          float d = (abs(s.x) + abs(s.y)) * 0.70710678 - P1;
          return smoothstep(P2, -P2, d);`;
      out.push({
        id: `kaleido-${k}${noise ? '-n' : ''}`,
        zh: `花窗·${k} 扇${noise ? '·噪' : ''}`,
        cat: 'kaleido' as CategoryId,
        params: noise
          ? [P('缩放', 1, 12, 0.5, 4), P('倍频', 1, 8, 1, 4)]
          : [P('条宽', 0.05, 0.6, 0.01, 0.4), P('羽化', 0.0, 0.1, 0.005, 0.02)],
        glsl: body(core),
      });
    }
  }
  return out;
}



const MASKS: { id: string; zh: string; glsl: string; params: ParamDef[]; anim?: boolean }[] = [
  { id: 'linear', zh: '线性', glsl: `vec2 q = rot2(p, radians(P1)); return smoothstep(-P0, P0, q.x);`, params: [P('过渡宽度', 0.02, 1, 0.01, 0.4), P('角度', 0, 360, 1, 0)] },
  { id: 'radial', zh: '径向', glsl: `return smoothstep(P0, P0 - P1, length(p));`, params: [P('半径', 0.1, 1.5, 0.01, 0.7), P('过渡宽度', 0.02, 1, 0.01, 0.3)] },
  { id: 'ellipse', zh: '椭圆', glsl: `return smoothstep(P0, P0 - P1, length(p * vec2(1.0, P2)));`, params: [P('半径', 0.1, 1.5, 0.01, 0.8), P('过渡宽度', 0.02, 1, 0.01, 0.3), P('扁率', 0.3, 1, 0.01, 0.6)] },
  { id: 'angular', zh: '角向', glsl: `float a = atan(p.y, p.x) + radians(P1); float v = fract(a / TAU * floor(P0)); return smoothstep(0.5 - P2, 0.5 + P2, v);`, params: [P('扇区数', 2, 24, 1, 6), P('旋转', 0, 360, 1, 0), P('过渡', 0.0, 0.5, 0.01, 0.1)] },
  { id: 'two-circ', zh: '双圆', glsl: `float d1 = smoothstep(P0, P0 - P1, length(p - vec2(P2, 0.0))); float d2 = smoothstep(P0, P0 - P1, length(p + vec2(P2, 0.0))); return max(d1, d2);`, params: [P('半径', 0.1, 1.2, 0.01, 0.6), P('过渡宽度', 0.02, 0.8, 0.01, 0.25), P('间距', 0, 0.9, 0.01, 0.35)] },
  { id: 'band', zh: '条带', glsl: `vec2 q = rot2(p, radians(P2)); return smoothstep(P0, P0 - P1, abs(q.x));`, params: [P('半宽', 0.05, 1, 0.01, 0.4), P('过渡宽度', 0.02, 0.6, 0.01, 0.15), P('角度', 0, 180, 1, 0)] },
  { id: 'soft-check', zh: '软棋盘', glsl: `vec2 q = p * floor(P0); float v = mod(floor(q.x) + floor(q.y), 2.0); vec2 f = fract(q) - 0.5; float edge = smoothstep(0.5, 0.5 - P1, max(abs(f.x), abs(f.y))); return mix(0.5, v, edge);`, params: [P('格数', 1, 16, 1, 4), P('边缘过渡', 0.0, 0.5, 0.01, 0.2)] },
  { id: 'slash', zh: '斜切半屏', glsl: `vec2 q = rot2(p, radians(P1)); return smoothstep(-P0, P0, q.x + q.y * P2);`, params: [P('过渡宽度', 0.02, 1, 0.01, 0.3), P('角度', 0, 360, 1, 0), P('斜率', -2, 2, 0.05, 0)] },
  { id: 'ripple-edge', zh: '波纹边', glsl: `float d = length(p) + 0.05 * sin(atan(p.y, p.x) * floor(P2)); return smoothstep(P0, P0 - P1, d);`, params: [P('半径', 0.2, 1.2, 0.01, 0.8), P('过渡宽度', 0.02, 0.6, 0.01, 0.2), P('波纹数', 2, 24, 1, 8)] },
  { id: 'noise-th', zh: '噪声阈值', glsl: `float n = fbm(p * P0, 3, 0.5); return smoothstep(P1 - P2, P1 + P2, n);`, params: [P('缩放', 1, 16, 0.5, 5), P('阈值', 0.1, 0.9, 0.01, 0.5), P('过渡', 0.0, 0.3, 0.005, 0.05)] },
  { id: 'halftone', zh: '半调网', glsl: `vec2 q = p * floor(P0); vec2 f = fract(q) - 0.5; float g = clamp(p.x * P1 + 0.5, 0.0, 1.0); return smoothstep(g * 0.5 + 0.03, g * 0.5 - 0.03, length(f));`, params: [P('网线数', 4, 48, 1, 20), P('渐变斜率', 0.2, 3, 0.05, 1)] },
  { id: 'cross-win', zh: '十字窗', glsl: `float vx = smoothstep(P0, P0 - P1, abs(p.x)); float vy = smoothstep(P0, P0 - P1, abs(p.y)); return max(vx, vy) * smoothstep(1.4, 0.9, length(p));`, params: [P('窗半宽', 0.05, 0.8, 0.01, 0.3), P('过渡宽度', 0.02, 0.5, 0.01, 0.12)] },
];

function maskFamily(): PatternDef[] {
  return MASKS.map((m) => ({
    id: `mask-${m.id}`,
    zh: `遮罩·${m.zh}`,
    cat: 'mask' as CategoryId,
    params: m.params,
    anim: m.anim,
    glsl: body(m.glsl),
  }));
}



const WAVES_EXTRA: { id: string; zh: string; anim?: boolean; glsl: string; params: ParamDef[] }[] = [
  { id: 'standing', zh: '驻波', glsl: `float v = sin(p.x * floor(P0) * PI) * sin(p.y * floor(P1) * PI); return 0.5 + 0.5 * v;`, params: [P('X 波数', 1, 12, 1, 3), P('Y 波数', 1, 12, 1, 3)] },
  { id: 'beat', zh: '拍频波', glsl: `float v = sin(p.x * floor(P0) * PI) + sin(p.x * floor(P1) * PI + u_time * P2); return clamp(0.5 + 0.25 * v, 0.0, 1.0);`, anim: true, params: [P('频率 A', 2, 24, 1, 8), P('频率 B', 2, 24, 1, 9), P('流速', 0, 3, 0.05, 0.5)] },
  { id: 'spiral-wave', zh: '螺旋波', anim: true, glsl: `float a = atan(p.y, p.x); float r = length(p); float v = sin(a * floor(P0) + r * floor(P1) * TAU - u_time * P2 * TAU); return 0.5 + 0.5 * v;`, params: [P('角频率', 1, 12, 1, 4), P('径频率', 1, 16, 1, 6), P('波速', 0, 3, 0.05, 0.8)] },
  { id: 'square-ring', zh: '同心方环', glsl: `float m = max(abs(p.x), abs(p.y)); return pow(0.5 + 0.5 * sin(m * floor(P0) * TAU - u_time * P1 * TAU), P2);`, anim: true, params: [P('频率', 2, 20, 1, 6), P('波速', 0, 3, 0.05, 0.6), P('锐度', 0.5, 6, 0.1, 1.5)] },
  { id: 'hex-interfere', zh: '六向干涉', glsl: `float v = 0.0; for(int i = 0; i < 6; i++){ float a = float(i) * TAU / 6.0; v += sin(length(p - vec2(cos(a), sin(a)) * P0) * floor(P1) * TAU - u_time * P2); } return clamp(0.5 + v * 0.17, 0.0, 1.0);`, anim: true, params: [P('源半径', 0.2, 1.2, 0.01, 0.6), P('频率', 2, 16, 1, 5), P('波速', 0, 3, 0.05, 0.5)] },
  { id: 'diag-packet', zh: '对角波包', glsl: `vec2 q = rot2(p, radians(45.0)); float env = exp(-abs(q.y) * P1 * 2.0); float v = sin(q.x * floor(P0) * PI - u_time * P2 * TAU); return 0.5 + 0.5 * v * env;`, anim: true, params: [P('频率', 2, 24, 1, 8), P('包络宽', 0.5, 6, 0.1, 2), P('波速', 0, 3, 0.05, 0.8)] },
  { id: 'cross-wave', zh: '十字波', glsl: `float v = sin(abs(p.x) * floor(P0) * PI - u_time) + sin(abs(p.y) * floor(P0) * PI - u_time); return clamp(0.5 + 0.25 * v, 0.0, 1.0);`, anim: true, params: [P('频率', 2, 20, 1, 6), P('波速', 0, 3, 0.05, 1)] },
  { id: 'target', zh: '靶心脉冲', glsl: `float d = length(p); float v = pow(0.5 + 0.5 * sin(d * floor(P0) * TAU), P1); float core = smoothstep(0.12, 0.0, d); return max(v * 0.8, core);`, params: [P('环数', 2, 20, 1, 8), P('锐度', 0.5, 6, 0.1, 2)] },
];

function waveFamily(): PatternDef[] {
  return WAVES_EXTRA.map((w) => ({
    id: `wave-${w.id}`,
    zh: w.zh,
    cat: 'wave' as CategoryId,
    anim: w.anim,
    params: w.params,
    glsl: body(w.glsl),
  }));
}



const GLOWS_EXTRA: { id: string; zh: string; anim?: boolean; glsl: string; params: ParamDef[] }[] = [
  { id: 'halo', zh: '光晕环', glsl: `float d = abs(length(p) - P0) / max(P1, 0.01); return exp(-d * d);`, params: [P('环半径', 0.1, 1.2, 0.01, 0.6), P('晕宽', 0.02, 0.4, 0.005, 0.12)] },
  { id: 'halo2', zh: '双晕环', glsl: `float d1 = abs(length(p) - P0) / max(P1, 0.01); float d2 = abs(length(p) - P0 * 0.55) / max(P1 * 0.7, 0.01); return exp(-d1 * d1) * 0.8 + exp(-d2 * d2) * 0.5;`, params: [P('环半径', 0.1, 1.2, 0.01, 0.65), P('晕宽', 0.02, 0.4, 0.005, 0.1)] },
  { id: 'bokeh', zh: '散景斑', glsl: `vec2 q = p * floor(P0); vec2 id = floor(q); vec2 f = fract(q) - 0.5; float rnd = hash21(id); vec2 off = (vec2(hash21(id + 1.7), hash21(id + 4.1)) - 0.5) * 0.6; float d = length(f - off) / max(P1 * (0.4 + 0.6 * rnd), 0.01); return exp(-d * d) * (0.4 + 0.6 * rnd);`, params: [P('密度', 2, 16, 1, 5), P('斑大小', 0.05, 0.5, 0.01, 0.22)] },
  { id: 'blade', zh: '光刃', anim: true, glsl: `vec2 q = rot2(p, u_time * P2); float v = pow(abs(sin(atan(q.y, q.x) * floor(P0) * 0.5)), P1); return v * smoothstep(1.1, 0.3, length(q));`, params: [P('刃数', 1, 8, 1, 2), P('锐度', 1, 6, 0.1, 2.5), P('转速', 0, 2, 0.05, 0.3)] },
  { id: 'flash', zh: '爆闪', anim: true, glsl: `float d = length(p); float v = exp(-d * P0 * 3.0) * (0.7 + 0.3 * sin(u_time * P1 * TAU)); return v;`, params: [P('紧致', 1, 12, 0.5, 5), P('闪速', 0, 4, 0.05, 1)] },
  { id: 'ringdots', zh: '光环点阵', glsl: `float a = atan(p.y, p.x); float r = length(p); float ring = exp(-pow(abs(r - P0) / max(P1, 0.01), 2.0)); float dots = pow(0.5 + 0.5 * cos(a * floor(P2)), 8.0); return ring * (0.3 + 0.7 * dots);`, params: [P('环半径', 0.2, 1.2, 0.01, 0.8), P('晕宽', 0.02, 0.3, 0.005, 0.08), P('点数', 2, 32, 1, 12)] },
  { id: 'rain', zh: '雨点光', anim: true, glsl: `vec2 q = vec2(p.x * floor(P0), p.y * floor(P0) - u_time * P2); vec2 id = floor(q); vec2 f = fract(q) - 0.5; float rnd = hash21(id); f.x += (rnd - 0.5) * 0.6; float d = length(f * vec2(1.0, 0.55)) / max(P1, 0.01); return exp(-d * d) * step(0.5, rnd);`, params: [P('密度', 4, 32, 1, 14), P('点大小', 0.03, 0.3, 0.005, 0.1), P('下落速度', 0, 4, 0.05, 1)] },
  { id: 'spin-star', zh: '旋转星芒', anim: true, glsl: `vec2 q = rot2(p, u_time * P2); float a = atan(q.y, q.x); float r = length(q); float v = pow(abs(cos(a * floor(P0))), 12.0) * smoothstep(P1, 0.0, r); float core = exp(-r * 6.0); return clamp(v + core, 0.0, 1.0);`, params: [P('芒数', 2, 12, 1, 4), P('芒长', 0.2, 1.2, 0.01, 0.7), P('转速', -2, 2, 0.05, 0.4)] },
];

function glowFamily(): PatternDef[] {
  return GLOWS_EXTRA.map((g) => ({
    id: `glow-${g.id}`,
    zh: g.zh,
    cat: 'glow' as CategoryId,
    anim: g.anim,
    params: g.params,
    glsl: body(g.glsl),
  }));
}



export const FAMILY_PATTERNS: PatternDef[] = [
  ...sdfFamily(),      
  ...gridFamily(),     
  ...tileFamily(),     
  ...frameFamily(),    
  ...gradFamily(),     
  ...noiseMixFamily(), 
  ...scatterFamily(),  
  ...kaleidoFamily(),  
  ...maskFamily(),     
  ...waveFamily(),     
  ...glowFamily(),     
];
