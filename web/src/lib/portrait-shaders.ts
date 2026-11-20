/** GLSL for the particle portrait. Colours stay raw sRGB (no conversion). */

export const portraitVertexShader = /* glsl */ `
  uniform float uPointScale; // spacing * viewportPx * dpr * coverage / (2 * tan(fov / 2))
  uniform float uShape;      // 0 = round, 1 = square halftone
  uniform float uProgress;   // 0 = assembled portrait, 1 = fully scattered

  attribute vec3 aOrigin;
  attribute vec3 aColor;
  attribute float aAlpha;
  attribute float aSize;
  attribute vec4 aRandom;

  varying vec3 vColor;
  varying float vAlpha;

  void main() {
    // Each particle leaves at its own moment: a left-to-right crumble with random jitter,
    // so the portrait dissolves instead of popping.
    float sweep = clamp(aOrigin.x * 0.86 + 0.5, 0.0, 1.0);
    float stagger = aRandom.w * 0.22 + sweep * 0.3;
    float t = clamp(uProgress * 1.55 - stagger, 0.0, 1.0);
    float e = t * t * (3.0 - 2.0 * t);
    float travel = e * e; // gentle start, fast finish

    vec3 p = aOrigin;

    // Swirl around the centre, then drift outward in a random direction.
    float ang = (fract(aRandom.z * 13.7) - 0.5) * 3.0 * travel;
    float c = cos(ang);
    float s = sin(ang);
    p.xy = mat2(c, -s, s, c) * p.xy;

    vec3 dir = vec3(aRandom.x, aRandom.y, aRandom.z) * 2.0 - 1.0;
    vec2 radial = normalize(aOrigin.xy + vec2(1e-4));
    float dist = (0.3 + aRandom.z * 1.2) * travel;
    p.xy += (radial * 0.6 + dir.xy) * dist;
    p.z += dir.z * dist * 0.9;
    p.y -= travel * 0.3;

    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    gl_Position = projectionMatrix * mv;

    float luma = dot(aColor, vec3(0.299, 0.587, 0.114));
    float size = aSize * (0.94 + 0.12 * aRandom.x);
    // Halftone: dot size follows brightness.
    size *= mix(1.0, mix(0.55, 1.1, luma), uShape);
    size *= mix(1.0, 0.55, e);

    gl_PointSize = max(size * uPointScale / -mv.z, 1.0);
    vColor = aColor;
    vAlpha = aAlpha * (1.0 - smoothstep(0.35, 1.0, e));
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
