export const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vUv = uv;
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`;

export const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uCameraPosition;

  varying vec2 vUv;
  varying vec3 vWorldPosition;

  void main() {
    vec4 tex = texture2D(uMap, vUv);

    // Edge vignette
    vec2 centered = vUv - 0.5;
    float edge = 1.0 - smoothstep(0.34, 0.86, length(centered));
    edge = mix(0.82, 1.0, edge);

    // Depth fade — floor raised to 0.78 so distant tiles stay bright on all devices
    float dist = distance(vWorldPosition, uCameraPosition);
    float depth = 1.0 - smoothstep(8.0, 26.0, dist);
    depth = mix(0.78, 1.0, depth);

    // Subtle desaturation at distance
    float luma = dot(tex.rgb, vec3(0.299, 0.587, 0.114));
    vec3 desaturated = mix(tex.rgb, vec3(luma), (1.0 - depth) * 0.25);

    vec3 color = desaturated * edge * depth;
    gl_FragColor = vec4(color, tex.a);
  }
`;