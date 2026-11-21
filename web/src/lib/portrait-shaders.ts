/**
 * GLSL for the particle portrait. Colours stay raw sRGB (no conversion).
 *
 * The disintegration is a pure function of `uProgress` and per-particle constants:
 * no time, no accumulated state. Scrolling back therefore replays the exact same
 * path in reverse and rebuilds the original portrait.
 */

/** Ashima/Gustavson 3D simplex noise (MIT) + a divergence-free curl field built from it. */
const NOISE = /* glsl */ `
  vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
  vec4 permute(vec4 x) { return mod289(((x * 34.0) + 10.0) * x); }
  vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

  float snoise(vec3 v) {
    const vec2 C = vec2(1.0 / 6.0, 1.0 / 3.0);
    const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);
    vec3 i = floor(v + dot(v, C.yyy));
    vec3 x0 = v - i + dot(i, C.xxx);
    vec3 g = step(x0.yzx, x0.xyz);
    vec3 l = 1.0 - g;
    vec3 i1 = min(g.xyz, l.zxy);
    vec3 i2 = max(g.xyz, l.zxy);
    vec3 x1 = x0 - i1 + C.xxx;
    vec3 x2 = x0 - i2 + C.yyy;
    vec3 x3 = x0 - D.yyy;
    i = mod289(i);
    vec4 p = permute(permute(permute(
              i.z + vec4(0.0, i1.z, i2.z, 1.0))
            + i.y + vec4(0.0, i1.y, i2.y, 1.0))
            + i.x + vec4(0.0, i1.x, i2.x, 1.0));
    float n_ = 0.142857142857;
    vec3 ns = n_ * D.wyz - D.xzx;
    vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
    vec4 x_ = floor(j * ns.z);
    vec4 y_ = floor(j - 7.0 * x_);
    vec4 x = x_ * ns.x + ns.yyyy;
    vec4 y = y_ * ns.x + ns.yyyy;
    vec4 h = 1.0 - abs(x) - abs(y);
    vec4 b0 = vec4(x.xy, y.xy);
    vec4 b1 = vec4(x.zw, y.zw);
    vec4 s0 = floor(b0) * 2.0 + 1.0;
    vec4 s1 = floor(b1) * 2.0 + 1.0;
    vec4 sh = -step(h, vec4(0.0));
    vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
    vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;
    vec3 p0 = vec3(a0.xy, h.x);
    vec3 p1 = vec3(a0.zw, h.y);
    vec3 p2 = vec3(a1.xy, h.z);
    vec3 p3 = vec3(a1.zw, h.w);
    vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
    p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;
    vec4 m = max(0.5 - vec4(dot(x0, x0), dot(x1, x1), dot(x2, x2), dot(x3, x3)), 0.0);
    m = m * m;
    return 105.0 * dot(m * m, vec4(dot(p0, x0), dot(p1, x1), dot(p2, x2), dot(p3, x3)));
  }

  // Forward-difference gradient of the scalar noise field.
  vec3 noiseGrad(vec3 p) {
    const float e = 0.12;
    float n0 = snoise(p);
    return vec3(
      snoise(p + vec3(e, 0.0, 0.0)) - n0,
      snoise(p + vec3(0.0, e, 0.0)) - n0,
      snoise(p + vec3(0.0, 0.0, e)) - n0
    ) / e;
  }

  // cross(grad a, grad b) is divergence-free: a swirling, wind-like flow with no sinks.
  vec3 curl(vec3 p) {
    vec3 c = cross(noiseGrad(p), noiseGrad(p + vec3(31.4, 17.7, 9.2)));
    c *= 0.22;
    return c / (1.0 + length(c)); // soft limit
  }
`;

export const portraitVertexShader = /* glsl */ `
  #ifndef OCTAVES
  #define OCTAVES 2
  #endif

  uniform float uPointScale; // spacing * viewportPx * dpr * coverage / (2 * tan(fov / 2))
  uniform float uShape;      // 0 = round, 1 = square halftone
  uniform float uProgress;   // 0 = assembled portrait, 1 = fully scattered
  uniform vec2 uFocus;       // face centre, in aOrigin units
  uniform vec3 uAccent;      // warm colour scattering particles drift toward
  uniform float uAccentMix;
  uniform vec2 uFadeY;       // (full-alpha y, zero-alpha y) in aOrigin units; (-10, -11) disables
  uniform float uMono;       // 0 = dark theme (photo colours), 1 = light theme (dark ink dots)

  attribute vec3 aOrigin;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  attribute vec4 aRandom;
  attribute float aDelay;

  varying vec3 vColor;
  varying float vAlpha;

  ${NOISE}

  void main() {
    // Per-particle window inside the 0..1 range; everyone is finished at progress 1.
    float end = aDelay + (1.0 - aDelay) * mix(0.6, 1.0, aRandom.w);
    float local = clamp((uProgress - aDelay) / max(end - aDelay, 1e-4), 0.0, 1.0);

    vec3 p = aOrigin;
    float alphaK = 1.0;
    float sizeK = 1.0;
    float warm = 0.0;

    if (local > 0.0) {
      float travel = local * local * local; // ease-in cubic: gentle peel, fast finish

      // Direction: random unit vector (with depth) + upward + away from the face + light wind.
      vec3 rnd = normalize(vec3(aRandom.x, aRandom.y, aRandom.z) * 2.0 - 1.0 + vec3(1e-4));
      vec2 away = aOrigin.xy - uFocus;
      away /= max(length(away), 1e-3);
      vec3 dir = normalize(rnd * 0.7 + vec3(0.0, 0.55, 0.0) + vec3(away, 0.0) * 0.6 + vec3(0.35, 0.0, 0.0));
      float dist = 0.55 + aRandom.z * 1.1;

      // Organic swirl: curl noise sampled along a path that advances with local progress.
      vec3 q = aOrigin * 2.2 + vec3(aRandom.x, aRandom.y, aRandom.z) * 7.0 + vec3(0.0, local * 1.4, local * 0.6);
      vec3 flow = curl(q);
      #if OCTAVES > 1
        flow += 0.5 * curl(q * 2.3 + vec3(11.0));
      #endif

      // A little spin around the face, growing as the particle travels.
      float ang = (fract(aRandom.z * 13.7) - 0.5) * 1.6 * travel;
      float c = cos(ang);
      float s = sin(ang);
      p.xy = mat2(c, -s, s, c) * (p.xy - uFocus) + uFocus;

      vec3 disp = (dir * dist + flow * 1.1) * travel;
      disp.z *= 1.25; // extra depth scatter
      p += disp;

      sizeK = mix(1.0, 0.3, local);
      alphaK = 1.0 - smoothstep(0.62, 1.0, local);
      warm = smoothstep(0.05, 0.6, local);
    }

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float luma = dot(aColor, vec3(0.299, 0.587, 0.114));
    float size = aSize * (0.94 + 0.12 * aRandom.x) * sizeK;
    // Halftone: dot size follows brightness.
    size *= mix(1.0, mix(0.55, 1.1, luma), uShape);

    gl_PointSize = max(size * uPointScale / -mv.z, 1.0);
    // Light theme: pale photo colours would vanish on a pale page, so draw dark ink dots
    // whose tone follows the photo (newsprint-like).
    vec3 ink = mix(vec3(0.07, 0.06, 0.055), vec3(0.80, 0.76, 0.72), pow(luma, 0.9));
    vec3 base = mix(aColor, mix(ink, aColor * 0.6, 0.2), uMono);
    vColor = mix(base, uAccent, uAccentMix * warm);

    // Static fade toward the bottom of the portrait, from the assembled position,
    // so text laid over the shoulders stays readable.
    float fadeT = clamp((aOrigin.y - uFadeY.y) / (uFadeY.x - uFadeY.y), 0.0, 1.0);
    vAlpha = aAlpha * alphaK * (fadeT * fadeT * (3.0 - 2.0 * fadeT));
  }
`;

export const portraitFragmentShader = /* glsl */ `
  uniform float uShape;
  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    vec2 p = gl_PointCoord - 0.5;
    float alpha = vAlpha;
    if (uShape < 0.5) {
      float d = length(p) * 2.0;
      if (d > 1.0) discard;
      // Solid dot with a thin antialiased rim: dense dots read as a sharp image.
      alpha *= 1.0 - smoothstep(0.8, 1.0, d);
    }
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`;
