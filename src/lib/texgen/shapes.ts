




export interface ShapeDef {
  id: string;
  zh: string;
  
  glsl: string;
}

export const SHAPES: ShapeDef[] = [
  {
    id: 'square', zh: '方块',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); return max(d.x, d.y) - 1.0; }`,
  },
  {
    id: 'rect-h', zh: '横长条',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); return max(d.x - 1.0, d.y - 0.45) ; }`,
  },
  {
    id: 'rect-v', zh: '竖长条',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); return max(d.x - 0.45, d.y - 1.0); }`,
  },
  {
    id: 'round-box', zh: '圆角方块',
    glsl: `float sh(vec2 q){ vec2 d = abs(q) - vec2(0.82); return length(max(d, vec2(0.0))) + min(max(d.x, d.y), 0.0) - 0.18; }`,
  },
  {
    id: 'diamond', zh: '菱形',
    glsl: `float sh(vec2 q){ return (abs(q.x) + abs(q.y)) * 0.70710678 - 1.0; }`,
  },
  {
    id: 'diamond-slim', zh: '细菱',
    glsl: `float sh(vec2 q){ vec2 d = abs(q * vec2(0.6, 1.4)); return (d.x + d.y) * 0.70710678 - 1.0; }`,
  },
  {
    id: 'cross', zh: '十字',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); return min(max(d.x - 0.38, d.y - 1.0), max(d.x - 1.0, d.y - 0.38)); }`,
  },
  {
    id: 'cross-x', zh: '斜十字',
    glsl: `float sh(vec2 q){ vec2 r = abs(rot2(q, PI * 0.25)); return min(max(r.x - 0.38, r.y - 1.0), max(r.x - 1.0, r.y - 0.38)); }`,
  },
  {
    id: 'capsule-h', zh: '横胶囊',
    glsl: `float sh(vec2 q){ vec2 a = vec2(-0.55, 0.0), b = vec2(0.55, 0.0); vec2 pa = q - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - 0.45; }`,
  },
  {
    id: 'capsule-v', zh: '竖胶囊',
    glsl: `float sh(vec2 q){ vec2 a = vec2(0.0, -0.55), b = vec2(0.0, 0.55); vec2 pa = q - a, ba = b - a; float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0); return length(pa - ba * h) - 0.45; }`,
  },
  {
    id: 'ellipse-h', zh: '横椭圆',
    glsl: `float sh(vec2 q){ return (length(q / vec2(1.0, 0.62)) - 1.0) * 0.62; }`,
  },
  {
    id: 'ellipse-v', zh: '竖椭圆',
    glsl: `float sh(vec2 q){ return (length(q / vec2(0.62, 1.0)) - 1.0) * 0.62; }`,
  },
  {
    id: 'trapezoid', zh: '梯形',
    glsl: `float sh(vec2 q){ float hw = mix(0.55, 1.05, clamp(q.y * 0.5 + 0.5, 0.0, 1.0)); vec2 d = abs(q); return max(d.x - hw, d.y - 1.0); }`,
  },
  {
    id: 'parallelogram', zh: '平行四边形',
    glsl: `float sh(vec2 q){ vec2 r = vec2(q.x - q.y * 0.35, q.y); vec2 d = abs(r); return max(d.x - 0.8, d.y - 0.8); }`,
  },
  {
    id: 'arrow', zh: '箭头',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); float body = max(d.x - 0.35, d.y - 0.28); float hw = mix(0.28, 0.95, smoothstep(0.3, 1.0, d.x)); float head = max(d.x - 1.0, d.y - hw); return min(body, head); }`,
  },
  {
    id: 'chevron', zh: '人字带',
    glsl: `float sh(vec2 q){ vec2 d = abs(vec2(q.x, q.y - 0.35)); float m = 1.1 - d.x * 1.1; return abs(d.y - m) * 0.7 - 0.14; }`,
  },
  {
    id: 'semicircle', zh: '半圆',
    glsl: `float sh(vec2 q){ return max(length(q) - 1.0, -q.y); }`,
  },
  {
    id: 'pie', zh: '扇形',
    glsl: `float sh(vec2 q){ float d = length(q) - 1.0; d = max(d, -dot(q, vec2(0.0, -1.0))); d = max(d, -dot(q, vec2(0.866, -0.5))); return d; }`,
  },
  {
    id: 'arc-band', zh: '弧带',
    glsl: `float sh(vec2 q){ float d = abs(length(q) - 0.75) - 0.2; d = max(d, -dot(q, vec2(0.0, -1.0))); d = max(d, -dot(q, vec2(0.866, -0.5))); return d; }`,
  },
  {
    id: 'lens', zh: '橄榄形',
    glsl: `float sh(vec2 q){ float d1 = length(q - vec2(0.55, 0.0)) - 1.0; float d2 = length(q + vec2(0.55, 0.0)) - 1.0; return max(d1, d2); }`,
  },
  {
    id: 'gear', zh: '齿轮',
    glsl: `float sh(vec2 q){ float a = atan(q.y, q.x); float r = length(q); float rad = 0.88 + 0.14 * smoothstep(0.2, 0.8, 0.5 + 0.5 * cos(a * 9.0)); return r - rad; }`,
  },
  {
    id: 'heart', zh: '心形',
    glsl: `float sh(vec2 q){ float x = q.x, y = -q.y - 0.1; float v = x * x + y * y - 0.8; return (v * v * v - x * x * y * y * y) * 0.5; }`,
  },
  {
    id: 'crescent-sd', zh: '弯月',
    glsl: `float sh(vec2 q){ float d1 = length(q) - 1.0; float d2 = length(q - vec2(0.55, 0.15)) - 0.9; return max(d1, -d2); }`,
  },
  {
    id: 'spark-4', zh: '四角星',
    glsl: `float sh(vec2 q){ float a = atan(q.y, q.x); float r = length(q); float rad = 0.35 + 0.65 * pow(abs(cos(a * 2.0)), 1.5); return r - rad; }`,
  },
  {
    id: 'banner', zh: '飘带',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); float body = max(d.x - 1.1, d.y - 0.3); float cut = max(1.1 - d.x, d.y - (d.x - 1.1) * 1.1); return max(body, -cut); }`,
  },
  {
    id: 'hex-flat', zh: '平顶六边',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); return max(dot(d, normalize(vec2(1.0, 1.7320508))), d.x) - 1.0; }`,
  },
  {
    id: 'pillow', zh: '枕形',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); return pow(d.x, 3.0) + pow(d.y, 3.0) - 1.0; }`,
  },
  {
    id: 'clover', zh: '四叶草',
    glsl: `float sh(vec2 q){ float a = atan(q.y, q.x); float r = length(q); float rad = 0.55 + 0.45 * abs(cos(a * 2.0)); return r - rad; }`,
  },
  {
    id: 'ring-notch', zh: '缺口环',
    glsl: `float sh(vec2 q){ float d = abs(length(q) - 0.75) - 0.22; d = max(d, -dot(q, vec2(0.0, -1.0))); return d; }`,
  },
  {
    id: 'droplet', zh: '水滴',
    glsl: `float sh(vec2 q){ vec2 r = vec2(q.x, -q.y); float d = length(r - vec2(0.0, 0.25)) - 0.75; d = max(d, -dot(r - vec2(0.0, -0.55), normalize(vec2(1.0, 0.35)))); d = max(d, -dot(r - vec2(0.0, -0.55), normalize(vec2(-1.0, 0.35)))); return d; }`,
  },
  {
    id: 'spiral-sq', zh: '方螺旋',
    glsl: `float sh(vec2 q){ vec2 d = abs(q); float m = max(d.x, d.y); float f = fract(m * 4.0 - atan(q.y, q.x) / TAU); return abs(f - 0.5) * 0.25 + m - 1.0; }`,
  },
];


export function polygonShape(n: number): ShapeDef {
  return {
    id: `poly-${n}`,
    zh: `${n} 边形`,
    glsl: `float sh(vec2 q){ float a = atan(q.y, q.x) + PI * 0.5; float seg = TAU / ${n.toFixed(1)}; float d = cos(floor(0.5 + a / seg) * seg - a) * length(q); return d - 0.93; }`,
  };
}


export function starShape(n: number): ShapeDef {
  return {
    id: `star-${n}`,
    zh: `${n} 角星`,
    glsl: `float sh(vec2 q){ float a = atan(q.y, q.x) + PI * 0.5; float r = length(q); float seg = PI / ${n.toFixed(1)}; float m = abs(mod(a, seg * 2.0) - seg) / seg; float rad = mix(1.0, 0.45, m); return r - rad; }`,
  };
}


const SERIES_SHAPES: ShapeDef[] = [
  ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16].map(polygonShape),
  ...[3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(starShape),
];

export const SHAPE_MAP: Map<string, ShapeDef> = new Map(
  [...SHAPES, ...SERIES_SHAPES].map((s) => [s.id, s]),
);
