#ifdef GL_ES
precision highp float;
#endif

// Ported from blackholeJuly16_notouch.glsl (Amy Traylor / Eden collaboration).
// Unchanged from the original except precision (mediump -> highp for stability).

uniform float time;
uniform vec2 resolution;
uniform vec2 mouse;
uniform float bumpiness;
uniform float radius;
uniform float ringSpacing;
uniform float zoom;

#define PI 3.1415926535898

float sinusoidBumps(vec3 p) {
    return sin(p.x * 16.0 + time * 0.7) * cos(p.y * 16.0 + time * 1.1) * sin(p.z * 16.0 - time * 0.4)
         + 0.5 * sin(p.x * 32.0 + time * 0.1) * cos(p.y * 32.0 + time * 0.3) * sin(p.z * 32.0 - time * 0.2);
}

mat3 rotateX(float angle) {
    float c = cos(angle), s = sin(angle);
    return mat3(1.0, 0.0, 0.0,
                0.0, c, -s,
                0.0, s, c);
}
mat3 rotateY(float angle) {
    float c = cos(angle), s = sin(angle);
    return mat3(c, 0.0, s,
                0.0, 1.0, 0.0,
               -s, 0.0, c);
}

vec3 rainbowColor(float v) {
    return 0.6 + 0.4 * cos(vec3(0.0, 2.0, 4.0) + v * 6.2831);
}

vec4 blendScreen(vec4 a, vec4 b) {
    vec3 rgb = 1.0 - (1.0 - a.rgb) * (1.0 - b.rgb);
    float alpha = max(a.a, b.a);
    return vec4(rgb, alpha);
}

vec4 blendOver(vec4 base, vec4 overlay) {
    float a = overlay.a + base.a * (1.0 - overlay.a);
    vec3 rgb = (overlay.rgb * overlay.a + base.rgb * base.a * (1.0 - overlay.a)) / max(a, 0.0001);
    return vec4(rgb, a);
}

vec4 blendMix(vec4 a, vec4 b, float t) {
    return mix(a, b, t);
}

vec4 layerSphere(vec2 uv, vec4 baseColor, float phaseOffset, float baseRadius) {
    float dist = length(uv);
    vec3 fake3D = normalize(vec3(uv, sqrt(max(0.0, 1.0 - dist * dist))));
    float ripple = sinusoidBumps(fake3D + vec3(0.0, 0.0, time + phaseOffset));
    float r = baseRadius + bumpiness * ripple * 0.51;

    if (dist > r) return vec4(0.0);

    float z = sqrt(r * r - dist * dist);
    vec3 pos = vec3(uv, z);
    vec3 normal = normalize(pos);
    float bump = bumpiness * sinusoidBumps(normal + vec3(0.0, 0.0, time + phaseOffset));
    normal = normalize(normal + bump * 0.2);

    vec3 lightDir = normalize(vec3(sin(time) * -0.24, sin(time) * 0.23, 0.8));
    float diff = max(dot(normal, lightDir), 0.0);
    float ambient = 0.15;
    float specular = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 12.0);
    float t = clamp((length(uv) - 0.55) / (1.75 - 0.55), 0.0, 1.0);
    float radialFade = t * t * (3.0 - 2.0 * t);

    vec4 color = (baseColor * (ambient + diff) + specular * vec4(1.0)) * radialFade;
    return vec4(color);
}

vec4 centralSphere(vec2 uv, vec4 baseColor, float phaseOffset, float baseRadius, float radMulti) {
    float dist = length(uv);

    vec3 fake3D = normalize(vec3(uv, sqrt(max(0.0, 1.0 - dist * dist))));
    float ripple = sinusoidBumps(fake3D + vec3(0.0, 0.0, time + phaseOffset));
    float r = baseRadius + bumpiness * ripple * radMulti;
    if (dist > r) return vec4(0.0);

    float z = sqrt(r * r - dist * dist);
    vec3 pos = vec3(uv, z);
    vec3 normal = normalize(pos);
    float bump = bumpiness * sinusoidBumps(normal + vec3(0.0, 0.0, time + phaseOffset));
    normal = normalize(normal + bump * 0.2);

    vec3 lightDir = normalize(vec3(sin(time) * -0.14, sin(time) * 0.3, 0.8));
    float diff = max(dot(normal, lightDir), 0.0);
    float ambient = 0.15;
    float specular = pow(max(dot(reflect(-lightDir, normal), vec3(0.0, 0.0, 1.0)), 0.0), 12.0);

    float t = length(uv);
    float radialFade = 1.0 / (1.0 + exp(-50.0 * (t - 0.60)));

    vec4 color = (baseColor * (ambient + diff) + specular * vec4(1.0)) * radialFade;
    return vec4(color);
}

void main() {
    vec2 uv = (gl_FragCoord.xy / resolution.xy) * 2.0 - 1.0;
    uv.x *= resolution.x / resolution.y;

    uv *= zoom;

    int numLayers = 18;
    vec3 colors[18];
    colors[0] = vec3(0., 0.9, 1.0);
    colors[1] = vec3(0., 0.70, 0.5);
    colors[2] = vec3(0.1, 0.53, 0.9);
    colors[3] = vec3(0., 0.5, .9);
    colors[4] = vec3(0., 0.07, 0.75);
    colors[5] = vec3(0.2, 0.9, 0.6);
    colors[6] = vec3(0.2, 0.9, 1.0);
    colors[7] = vec3(0., 0.07, 0.5);
    colors[8] = vec3(0.1, 0.53, 0.9);
    colors[9] = vec3(0.1, 0.25, .9);
    colors[10] = vec3(0., 0.17, 0.95);
    colors[11] = vec3(0.2, 0.9, 0.6);
    colors[12] = vec3(0.1, 0.9, 1.0);
    colors[13] = vec3(0.1, 0.8, 0.5);
    colors[14] = vec3(0.1, 0.53, 0.79);
    colors[15] = vec3(0., 0.75, .9);
    colors[16] = vec3(0., 0.27, 0.75);
    colors[17] = vec3(0.2, 0.19, 0.6);
    vec4 accum = vec4(0.0);
    vec4 accumCenter = vec4(0.0);
    float baseRadius = radius*0.58;
    float baseRadius2 = radius*0.65;
    vec3 w_pos = vec3(uv, 0.);

    for (int i = 0; i < 18; i++) {
        if (i >= numLayers) break;
        float phase = 12.0;
        vec3 col = colors[i];
        float spacing = 1.0/ float(numLayers);
        float layerValue = float(i) * spacing;
        baseRadius = baseRadius - (float(i) * spacing);
        baseRadius2 = baseRadius2 - (float(i) * spacing);

        float brightness = 1.0 - layerValue/5.;
        vec4 coreColor = vec4(vec3(brightness), brightness);

        float angleX = (time / resolution.y - 0.5) * PI * phase;
        float angleY = (time / resolution.x - 0.5) * PI * -phase;
        mat3 rot2 = rotateY(angleY) * rotateX(angleX);

        accumCenter += centralSphere(w_pos.xy, coreColor*vec4(colors[1], .9), phase, baseRadius, ringSpacing);
    }

    vec4 blackHole = blendOver(accum, accumCenter);
    vec4 blackHoleDark = blendMix(accumCenter, accum, mouse.y/resolution.y);
    vec4 blackHoleLight = blendMix(accum, accumCenter, mouse.x/resolution.x);

    float fade = smoothstep(0., 1.0, zoom);

    gl_FragColor = blackHole*fade;
}
