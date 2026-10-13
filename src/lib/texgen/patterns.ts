import type { CategoryDef, PatternDef } from './types';
import { FAMILY_PATTERNS } from './families';

export const CATEGORIES: CategoryDef[] = [
  { id: 'basic', zh: '基元' },
  { id: 'order', zh: '秩序' },
  { id: 'tile', zh: '瓦片' },
  { id: 'frame', zh: '画框' },
  { id: 'grad', zh: '渐变' },
  { id: 'chaos', zh: '混沌' },
  { id: 'scatter', zh: '散布' },
  { id: 'kaleido', zh: '花窗' },
  { id: 'mask', zh: '遮罩' },
  { id: 'wave', zh: '波纹' },
  { id: 'glow', zh: '辉光' },
];

const body = (s: string) => `float evalPattern(vec2 p, vec2 uv){\n${s}\n}`;

const HANDCRAFTED: PatternDef[] = [
  
  {
    id: 'disc', zh: '圆盘', cat: 'basic',
    params: [
      { label: '半径', min: 0.05, max: 1.0, step: 0.01, def: 0.5 },
      { label: '羽化', min: 0.0, max: 0.2, step: 0.005, def: 0.015 },
    ],
    glsl: body(`
      float d = length(p);
      return smoothstep(P0 + P1, P0 - P1, d);`),
  },
  {
    id: 'ring', zh: '圆环', cat: 'basic',
    params: [
      { label: '半径', min: 0.05, max: 1.0, step: 0.01, def: 0.5 },
      { label: '线宽', min: 0.01, max: 0.3, step: 0.01, def: 0.06 },
      { label: '羽化', min: 0.0, max: 0.1, step: 0.005, def: 0.012 },
    ],
    glsl: body(`
      float d = abs(length(p) - P0);
      return smoothstep(P1 + P2, P1 - P2, d);`),
  },
  {
    id: 'falloff', zh: '径向衰减', cat: 'basic',
    params: [
      { label: '半径', min: 0.1, max: 1.5, step: 0.01, def: 0.8 },
      { label: '衰减曲线', min: 0.3, max: 4.0, step: 0.05, def: 1.0 },
    ],
    glsl: body(`
      float d = clamp(length(p) / max(P0, 0.01), 0.0, 1.0);
      return pow(1.0 - d, P1);`),
  },
  {
    id: 'ngon', zh: '正多边形', cat: 'basic',
    params: [
      { label: '边数', min: 3, max: 12, step: 1, def: 6 },
      { label: '尺寸', min: 0.1, max: 1.0, step: 0.01, def: 0.5 },
      { label: '倒角', min: 0.0, max: 0.1, step: 0.005, def: 0.012 },
      { label: '旋转', min: 0, max: 360, step: 1, def: 0 },
    ],
    glsl: body(`
      vec2 q = rot2(p, radians(P3));
      float a = atan(q.y, q.x) + PI * 0.5;
      float r = length(q);
      float seg = TAU / max(floor(P0), 3.0);
      float d = cos(floor(0.5 + a / seg) * seg - a) * r;
      return smoothstep(P1 + P2, P1 - P2, d);`),
  },
  {
    id: 'star', zh: '星芒', cat: 'basic',
    params: [
      { label: '角数', min: 3, max: 10, step: 1, def: 5 },
      { label: '外径', min: 0.1, max: 1.0, step: 0.01, def: 0.55 },
      { label: '内径比', min: 0.1, max: 0.9, step: 0.01, def: 0.45 },
      { label: '羽化', min: 0.0, max: 0.1, step: 0.005, def: 0.012 },
    ],
    glsl: body(`
      float a = atan(p.y, p.x) + PI * 0.5;
      float r = length(p);
      float rad = P1 * (P2 + (1.0 - P2) * abs(cos(a * floor(P0))));
      return smoothstep(rad + P3, rad - P3, r);`),
  },
  {
    id: 'crescent', zh: '月牙', cat: 'basic',
    params: [
      { label: '半径', min: 0.1, max: 0.8, step: 0.01, def: 0.45 },
      { label: '错位', min: 0.0, max: 0.8, step: 0.01, def: 0.3 },
      { label: '羽化', min: 0.0, max: 0.1, step: 0.005, def: 0.012 },
      { label: '旋转', min: 0, max: 360, step: 1, def: 0 },
    ],
    glsl: body(`
      vec2 q = rot2(p, radians(P3));
      float f = P2;
      float a = smoothstep(P0 + f, P0 - f, length(q));
      float b = smoothstep(P0 + f, P0 - f, length(q - vec2(P1, 0.0)));
      return clamp(a - b, 0.0, 1.0);`),
  },

  
  {
    id: 'stripes', zh: '平行条纹', cat: 'order',
    params: [
      { label: '频率', min: 1, max: 32, step: 1, def: 6 },
      { label: '角度', min: 0, max: 180, step: 1, def: 0 },
      { label: '过渡', min: 0.02, max: 0.5, step: 0.01, def: 0.1 },
    ],
    glsl: body(`
      vec2 q = rot2(p, radians(P1));
      float v = 0.5 + 0.5 * sin(q.x * floor(P0) * PI);
      return smoothstep(0.5 - P2, 0.5 + P2, v);`),
  },
  {
    id: 'checker', zh: '棋盘格', cat: 'order',
    params: [
      { label: '格数', min: 1, max: 24, step: 1, def: 8 },
      { label: '边缘过渡', min: 0.0, max: 0.25, step: 0.005, def: 0.06 },
    ],
    glsl: body(`
      vec2 q = p * floor(P0) * 0.5;
      vec2 id = floor(q);
      float cell = mod(id.x + id.y, 2.0);
      vec2 f = fract(q);
      vec2 d2 = min(f, 1.0 - f);
      float db = min(d2.x, d2.y);
      float s = smoothstep(P1, 0.0, db);
      return 0.5 + (cell - 0.5) * s;`),
  },
  {
    id: 'dots', zh: '圆点阵', cat: 'order',
    params: [
      { label: '密度', min: 1, max: 32, step: 1, def: 8 },
      { label: '点半径', min: 0.05, max: 0.5, step: 0.01, def: 0.3 },
      { label: '羽化', min: 0.0, max: 0.2, step: 0.005, def: 0.03 },
    ],
    glsl: body(`
      vec2 q = p * floor(P0);
      vec2 f = fract(q) - 0.5;
      return smoothstep(P1 + P2, P1 - P2, length(f));`),
  },
  {
    id: 'hex', zh: '蜂巢格', cat: 'order',
    params: [
      { label: '密度', min: 1, max: 16, step: 1, def: 4 },
      { label: '间隙', min: 0.0, max: 0.2, step: 0.005, def: 0.0 },
      { label: '边缘过渡', min: 0.0, max: 0.15, step: 0.005, def: 0.02 },
    ],
    glsl: body(`
      vec2 rp = vec2(1.0, 1.7320508);
      vec2 hp = rp * 0.5;
      vec2 gv = p * floor(P0);
      vec2 a = mod(gv, rp) - hp;
      vec2 b = mod(gv - hp, rp) - hp;
      vec2 g = dot(a, a) < dot(b, b) ? a : b;
      float he = max(dot(normalize(vec2(1.0, 1.7320508)), abs(g)), abs(g).x);
      float edge = 0.5 - P1;
      return smoothstep(edge + P2, edge - P2, he);`),
  },
  {
    id: 'weave', zh: '编织纹', cat: 'order',
    params: [
      { label: '密度', min: 2, max: 24, step: 1, def: 8 },
      { label: '过渡', min: 0.02, max: 0.4, step: 0.01, def: 0.1 },
    ],
    glsl: body(`
      vec2 q = p * floor(P0) * PI;
      float wx = smoothstep(0.5 - P1, 0.5 + P1, 0.5 + 0.5 * sin(q.x));
      float wy = smoothstep(0.5 - P1, 0.5 + P1, 0.5 + 0.5 * sin(q.y));
      return max(min(wx, 1.0 - wy), min(wy, 1.0 - wx));`),
  },

  
  {
    id: 'noise', zh: '值噪声', cat: 'chaos',
    params: [
      { label: '缩放', min: 1, max: 24, step: 0.5, def: 6 },
      { label: '对比', min: 0.5, max: 3, step: 0.05, def: 1 },
    ],
    glsl: body(`
      float n = vnoise(p * P0);
      return pow(n, P1);`),
  },
  {
    id: 'fbm', zh: '叠分噪声', cat: 'chaos',
    params: [
      { label: '缩放', min: 1, max: 16, step: 0.5, def: 4 },
      { label: '倍频', min: 1, max: 8, step: 1, def: 5 },
      { label: '增益', min: 0.35, max: 0.75, step: 0.01, def: 0.5 },
      { label: '扭曲', min: 0, max: 1.5, step: 0.05, def: 0 },
    ],
    glsl: body(`
      vec2 q = p * P0;
      if(P3 > 0.001){
        vec2 w = vec2(fbm(q + vec2(3.1, 1.2), 3, 0.5),
                      fbm(q + vec2(8.7, 4.3), 3, 0.5));
        q += w * P3 * 2.0;
      }
      return fbm(q, int(P1), P2);`),
  },
  {
    id: 'ridged', zh: '山脊', cat: 'chaos',
    params: [
      { label: '缩放', min: 1, max: 16, step: 0.5, def: 4 },
      { label: '倍频', min: 1, max: 8, step: 1, def: 5 },
      { label: '增益', min: 0.35, max: 0.75, step: 0.01, def: 0.5 },
    ],
    glsl: body(`
      return ridged(p * P0, int(P1), P2);`),
  },
  {
    id: 'voronoi', zh: '细胞边界', cat: 'chaos',
    params: [
      { label: '密度', min: 2, max: 20, step: 1, def: 6 },
      { label: '抖动', min: 0, max: 1, step: 0.05, def: 1 },
      { label: '线宽', min: 0.0, max: 0.3, step: 0.005, def: 0.05 },
    ],
    glsl: body(`
      float f2;
      float f1 = voronoi(p * floor(P0), P1, f2);
      float edge = smoothstep(P2, 0.0, f2 - f1);
      float shade = 1.0 - f1 * 0.6;
      return clamp(edge + shade * 0.15, 0.0, 1.0);`),
  },
  {
    id: 'turb', zh: '湍流', cat: 'chaos', anim: true,
    params: [
      { label: '缩放', min: 1, max: 12, step: 0.5, def: 3 },
      { label: '倍频', min: 1, max: 8, step: 1, def: 5 },
      { label: '增益', min: 0.35, max: 0.75, step: 0.01, def: 0.5 },
      { label: '流速', min: 0, max: 2, step: 0.05, def: 0.4 },
    ],
    glsl: body(`
      vec2 q = p * P0;
      float t = u_time * P3;
      vec2 w = vec2(fbm(q + vec2(t, 0.0), 3, 0.5),
                    fbm(q + vec2(4.7, -t), 3, 0.5));
      return fbm(q + w * 1.2, int(P1), P2);`),
  },

  
  {
    id: 'sine', zh: '正弦波', cat: 'wave', anim: true,
    params: [
      { label: 'X 频率', min: 1, max: 16, step: 1, def: 4 },
      { label: 'Y 频率', min: 0, max: 16, step: 1, def: 0 },
      { label: '交叉融合', min: 0, max: 1, step: 0.05, def: 0 },
      { label: '角度', min: 0, max: 90, step: 1, def: 0 },
      { label: '波速', min: 0, max: 2, step: 0.05, def: 0 },
    ],
    glsl: body(`
      vec2 q = rot2(p, radians(P3));
      float t = u_time * P4;
      float va = sin(q.x * floor(P0) * PI + t * TAU);
      float vb = sin(q.y * floor(max(P1, 1.0)) * PI + t * TAU);
      float v = mix(va, vb, P2);
      return 0.5 + 0.5 * v;`),
  },
  {
    id: 'ripple', zh: '涟漪', cat: 'wave', anim: true,
    params: [
      { label: '环数', min: 2, max: 24, step: 1, def: 8 },
      { label: '衰减', min: 0, max: 3, step: 0.05, def: 1 },
      { label: '波速', min: 0, max: 4, step: 0.05, def: 1 },
    ],
    glsl: body(`
      float d = length(p);
      float v = sin(d * floor(P0) * TAU - u_time * P2 * TAU);
      float fall = 1.0 / (1.0 + d * P1 * 3.0);
      return 0.5 + 0.5 * v * fall;`),
  },
  {
    id: 'interfere', zh: '干涉波', cat: 'wave', anim: true,
    params: [
      { label: '波源间距', min: 0.1, max: 1.2, step: 0.01, def: 0.4 },
      { label: '频率', min: 2, max: 24, step: 1, def: 8 },
      { label: '波速', min: 0, max: 3, step: 0.05, def: 0.6 },
    ],
    glsl: body(`
      float t = u_time * P2 * TAU;
      float d1 = length(p - vec2(P0, 0.0));
      float d2 = length(p + vec2(P0, 0.0));
      float v = sin(d1 * floor(P1) * TAU - t) + sin(d2 * floor(P1) * TAU - t);
      return clamp(0.5 + 0.25 * v, 0.0, 1.0);`),
  },
  {
    id: 'pulse', zh: '同心脉动', cat: 'wave', anim: true,
    params: [
      { label: '频率', min: 2, max: 24, step: 1, def: 8 },
      { label: '锐度', min: 0.5, max: 8, step: 0.1, def: 2 },
      { label: '波速', min: 0, max: 3, step: 0.05, def: 1 },
    ],
    glsl: body(`
      float ph = length(p) * floor(P0) * TAU - u_time * P2 * TAU;
      return pow(0.5 + 0.5 * sin(ph), P1);`),
  },

  
  {
    id: 'shafts', zh: '光束', cat: 'glow',
    params: [
      { label: '数量', min: 2, max: 36, step: 1, def: 10 },
      { label: '锐度', min: 0.5, max: 8, step: 0.1, def: 3 },
      { label: '角度', min: 0, max: 360, step: 1, def: 0 },
      { label: '衰减半径', min: 0.2, max: 1.5, step: 0.01, def: 0.9 },
    ],
    glsl: body(`
      float a = atan(p.y, p.x) + radians(P2);
      float ray = pow(abs(cos(a * floor(P0) * 0.5)), P1);
      float fall = smoothstep(P3, 0.0, length(p));
      return ray * fall;`),
  },
  {
    id: 'vortex', zh: '旋涡臂', cat: 'glow', anim: true,
    params: [
      { label: '臂数', min: 1, max: 12, step: 1, def: 3 },
      { label: '扭转', min: -4, max: 4, step: 0.1, def: 2 },
      { label: '锐度', min: 1, max: 6, step: 0.1, def: 2 },
      { label: '转速', min: 0, max: 2, step: 0.05, def: 0.5 },
    ],
    glsl: body(`
      float a = atan(p.y, p.x) + length(p) * P1 * 3.0 - u_time * P3 * TAU;
      float v = pow(abs(sin(a * floor(P0) * 0.5)), P2);
      float fall = smoothstep(1.2, 0.15, length(p));
      return v * fall;`),
  },
  {
    id: 'flare', zh: '十字光斑', cat: 'glow',
    params: [
      { label: '臂长', min: 0.2, max: 1.5, step: 0.01, def: 0.8 },
      { label: '紧致', min: 2, max: 40, step: 1, def: 12 },
      { label: '核心', min: 0.05, max: 0.4, step: 0.01, def: 0.12 },
      { label: '角度', min: 0, max: 90, step: 1, def: 0 },
    ],
    glsl: body(`
      vec2 q = rot2(p, radians(P3));
      float bx = exp(-abs(q.y) * P1) * smoothstep(P0, 0.0, abs(q.x));
      float by = exp(-abs(q.x) * P1) * smoothstep(P0, 0.0, abs(q.y));
      float core = smoothstep(P2 + 0.01, P2 - 0.01, length(q));
      return clamp(max(max(bx, by), core), 0.0, 1.0);`),
  },
  {
    id: 'sparkle', zh: '星点闪烁', cat: 'glow', anim: true,
    params: [
      { label: '密度', min: 2, max: 24, step: 1, def: 8 },
      { label: '尺寸', min: 0.05, max: 0.5, step: 0.01, def: 0.2 },
      { label: '散布', min: 0, max: 1, step: 0.05, def: 0.8 },
      { label: '闪烁', min: 0, max: 3, step: 0.05, def: 1 },
    ],
    glsl: body(`
      vec2 q = p * floor(P0);
      vec2 id = floor(q);
      vec2 f = fract(q) - 0.5;
      float rnd = hash21(id);
      vec2 off = (vec2(hash21(id + 3.1), hash21(id + 7.7)) - 0.5) * P2 * 0.8;
      float d = length(f - off);
      float tw = 0.6 + 0.4 * sin(u_time * P3 * (1.0 + rnd * 3.0) + rnd * TAU);
      float s = P1 * (0.4 + 0.6 * rnd);
      return smoothstep(s, 0.0, d) * tw;`),
  },
];


export const PATTERNS: PatternDef[] = [...HANDCRAFTED, ...FAMILY_PATTERNS];

export const PATTERN_MAP: Map<string, PatternDef> = new Map(PATTERNS.map((p) => [p.id, p]));

export function defaultParams(p: PatternDef): number[] {
  return p.params.map((d) => d.def);
}
