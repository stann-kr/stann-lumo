export const ambientVertexShader = `
attribute vec2 aPosition;
void main() {
  gl_Position = vec4(aPosition, 0.0, 1.0);
}
`;

export const ambientFragmentShader = `
precision highp float;

uniform vec2 uResolution;
uniform vec2 uPointer;
uniform float uTime;

vec3 mod289(vec3 x) { return x - floor(x / 289.0) * 289.0; }
vec2 mod289(vec2 x) { return x - floor(x / 289.0) * 289.0; }
vec3 permute(vec3 x) { return mod289(((x * 34.0) + 1.0) * x); }

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187, 0.366025403784439, -0.577350269189626, 0.024390243902439);
  vec2 i = floor(v + dot(v, C.yy));
  vec2 x0 = v - i + dot(i, C.xx);
  vec2 i1 = x0.x > x0.y ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;
  i = mod289(i);
  vec3 p = permute(permute(i.y + vec3(0.0, i1.y, 1.0)) + i.x + vec3(0.0, i1.x, 1.0));
  vec3 m = max(0.5 - vec3(dot(x0, x0), dot(x12.xy, x12.xy), dot(x12.zw, x12.zw)), 0.0);
  m = m * m;
  m = m * m;
  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;
  m *= 1.79284291400159 - 0.85373472095314 * (a0 * a0 + h * h);
  vec3 g;
  g.x = a0.x * x0.x + h.x * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

void main() {
  vec2 st = gl_FragCoord.xy / uResolution;
  st.x *= uResolution.x / uResolution.y;
  st += (uPointer + 0.5) * 0.1;

  // Preserve the reference's warp field, color-region geometry and time scales.
  float n1 = snoise(st * 1.5 + uTime * 0.1);
  float n2 = snoise(st * 2.0 - uTime * 0.15 + n1);
  vec2 warped = st + vec2(n1, n2) * 0.4;

  // Distinct warm and cool regions reveal the moving field as their hues blend.
  vec3 signalRed = vec3(92.0, 14.0, 29.0) / 255.0;
  vec3 burgundy = vec3(74.0, 20.0, 52.0) / 255.0;
  vec3 violet = vec3(52.0, 32.0, 82.0) / 255.0;
  vec3 slate = vec3(18.0, 43.0, 64.0) / 255.0;
  vec3 copper = vec3(67.0, 32.0, 22.0) / 255.0;
  float d1 = length(warped - vec2(0.2, 0.8));
  float d2 = length(warped - vec2(0.8, 0.2));
  float d3 = length(warped - vec2(0.5, 0.5));
  vec3 color = mix(signalRed, burgundy, smoothstep(0.0, 1.2, d1));
  color = mix(color, violet, smoothstep(0.2, 1.5, d3));
  color = mix(color, slate, smoothstep(0.4, 2.0, d2));
  float accentField = snoise(st * 3.0 + uTime * 0.05);
  color = mix(color, copper, smoothstep(0.5, 1.0, accentField) * 0.5);

  // Grain changes at 12 Hz independently of the slow color drift.
  vec2 grainPosition = gl_FragCoord.xy + floor(uTime * 12.0) * vec2(31.7, 15.1);
  float grain = fract(52.9829189 * fract(dot(grainPosition, vec2(0.06711056, 0.00583715))));
  gl_FragColor = vec4(max(color + (grain - 0.5) * 0.075, 0.0), 1.0);
}
`;
