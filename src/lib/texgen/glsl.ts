

export const VERT_SRC = `#version 300 es
layout(location=0) in vec2 a_pos;
void main(){ gl_Position = vec4(a_pos, 0.0, 1.0); }
`;

export const FRAG_HEAD = `#version 300 es
precision highp float;
uniform vec2  u_res;
uniform float u_params[10];
uniform float u_time;
uniform float u_invert;
uniform sampler2D u_lut;
out vec4 fragColor;

#define P0 u_params[0]
#define P1 u_params[1]
#define P2 u_params[2]
#define P3 u_params[3]
#define P4 u_params[4]
#define P5 u_params[5]
#define P6 u_params[6]
#define P7 u_params[7]
#define P8 u_params[8]
#define P9 u_params[9]
#define PI  3.14159265359
#define TAU 6.28318530718
`;

export const GLSL_CORE = `
vec2 rot2(vec2 p, float a){
  float c = cos(a), s = sin(a);
  return mat2(c, -s, s, c) * p;
}

float hash21(vec2 p){
  vec3 q = fract(vec3(p.xyx) * 0.1031);
  q += dot(q, q.yzx + 33.33);
  return fract((q.x + q.y) * q.z);
}

float vnoise(vec2 p){
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  float a = hash21(i);
  float b = hash21(i + vec2(1.0, 0.0));
  float c = hash21(i + vec2(0.0, 1.0));
  float d = hash21(i + vec2(1.0, 1.0));
  return mix(mix(a, b, u.x), mix(c, d, u.x), u.y);
}

float fbm(vec2 p, int oct, float gain){
  float amp = 0.5, sum = 0.0, norm = 0.0;
  for(int i = 0; i < 8; i++){
    if(i >= oct) break;
    sum += amp * vnoise(p);
    norm += amp;
    p = p * 2.03 + vec2(17.3, 9.1);
    amp *= gain;
  }
  return sum / max(norm, 1e-4);
}

float ridged(vec2 p, int oct, float gain){
  float amp = 0.5, sum = 0.0, norm = 0.0;
  for(int i = 0; i < 8; i++){
    if(i >= oct) break;
    float n = 1.0 - abs(2.0 * vnoise(p) - 1.0);
    sum += amp * n * n;
    norm += amp;
    p = p * 2.11 + vec2(5.2, 13.7);
    amp *= gain;
  }
  return sum / max(norm, 1e-4);
}

float voronoi(vec2 p, float jitter, out float f2){
  vec2 ip = floor(p), fp = fract(p);
  float f1 = 8.0;
  f2 = 8.0;
  for(int y = -1; y <= 1; y++)
  for(int x = -1; x <= 1; x++){
    vec2 g = vec2(float(x), float(y));
    vec2 o = vec2(hash21(ip + g), hash21(ip + g + 91.7));
    o = 0.5 + (o - 0.5) * clamp(jitter, 0.0, 1.0);
    vec2 r = g + o - fp;
    float d = dot(r, r);
    if(d < f1){ f2 = f1; f1 = d; }
    else if(d < f2){ f2 = d; }
  }
  return sqrt(f1);
}
`;

export const FRAG_MAIN = `
void main(){
  vec2 uv = gl_FragCoord.xy / u_res;
  float aspect = u_res.x / u_res.y;
  vec2 p = (uv - 0.5) * 2.0;
  p.x *= aspect;
  float v = clamp(evalPattern(p, uv), 0.0, 1.0);
  if(u_invert > 0.5) v = 1.0 - v;
  vec3 col = texture(u_lut, vec2(v, 0.5)).rgb;
  fragColor = vec4(col, 1.0);
}
`;

export function fragSource(patternGlsl: string): string {
  return FRAG_HEAD + GLSL_CORE + patternGlsl + FRAG_MAIN;
}
