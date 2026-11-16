#ifdef GL_ES
precision highp float;
#endif

// Ported from BlackHoleStarfieldMix7_31.glsl (Amy Traylor / Eden collaboration).
// Change for WebGL1 (p5): the star loop bound must be a constant, so it runs to
// a fixed MAX (500) and still honours `numStars` via the early break.

uniform float time;
uniform vec2 resolution;
uniform int numStars;
uniform float maxTime;
uniform float state;
uniform float trailFade;
uniform float infallRatio; // range from 0.0 to 1.0

const int MAX_STARS = 500;

///////////////////////////////////////////
vec4 blendScreen(vec4 a, vec4 b) {
    vec3 rgb = 1.0 - (1.0 - a.rgb) * (1.0 - b.rgb);
    float alpha = max(a.a, b.a);
    return vec4(rgb, alpha);
}

vec4 blendMix(vec4 a, vec4 b, float t) {
    return mix(a, b, t);
}

////////////////////////////////////////////
float hash(vec2 p) {
 return fract(sin(dot(p*0.05, vec2(14.5, 76.38)))*43256.2895);
}

vec4 starfield(float bHRad){
    vec2 uv = ( gl_FragCoord.xy / resolution.xy ) * 2.0 - 1.0;
    uv.x *= resolution.x /  resolution.y;
    vec2 center = vec2(0.0, 0.0);
    vec2 offset = uv - center;
    float r = length(offset);
    float theta = atan(offset.y, offset.x);
    float angular_speed = 1.0 / (r + 0.1);
    theta -= time * angular_speed;
    uv = vec2(cos(theta), sin(theta)) * r + center;
    vec4 col = vec4(vec3(0.0), 1.);

    col = vec4(vec3(smoothstep(0.7+0.3*smoothstep(0.0, 0.35, abs((uv.x*0.5-1.0)*resolution.y/resolution.x+uv.y)), 1.0, hash(gl_FragCoord.xy))*hash(gl_FragCoord.xy*2.0)), 1.);

    if (state > 0.5) {
        float distToCenter = distance(gl_FragCoord.xy, resolution * 0.5);
        float normalized = distToCenter/bHRad;
        float alpha = smoothstep(1.0, 0.66, normalized);
        if (distToCenter < bHRad) {
            col = vec4(0.0, 0.01, 0.02, alpha);
        }
    }
    return vec4(col);
}
////////////////////////////////////////////

float random(float x) {
    return fract(sin(x * 12.9898) * 43758.5453);
}

void main() {
    vec2 fragCoord = gl_FragCoord.xy;
    vec4 color = vec4(0.0, 0.0, 0.0, 0.90);

    float timetest = maxTime * 0.0000001;
    float baseAngularVel = 6.28318 / maxTime;
    float blackHoleRadius = 0.0;
    float t = 0.;
    float sw = 1.0;
    float maxstarsize = 100.;

    if (state > 0.5) {
        // scale to the screen diagonal so the hole fully engulfs every corner
        // (0.75 * length > 0.5 * length = centre-to-corner distance) at the peak
        blackHoleRadius = (length(resolution) * 0.75) * (time / maxTime);
        t = smoothstep(0., maxTime, time);
    }

    for (int i = 0; i < MAX_STARS; i++) {
        if (i >= numStars) break;

        float starIndex = float(i);
        bool isInfalling = random(starIndex + 9999.0) < infallRatio;

        float r1 = random(starIndex);
        float r2 = random(starIndex + 1000.0);
        float r3 = random(starIndex + 2000.0);
        float r4 = random(starIndex + 3000.0);
        float r5 = random(starIndex + 4000.0);
        float r6 = random(starIndex + 5000.0);
        float r7 = random(starIndex + 6000.0);
        float r8 = random(starIndex + 7000.0);
        float r9 = random(starIndex + 8000.0);

        vec2 startPos = vec2(
            r1 * resolution.x * 1.1 - resolution.x * 0.1,
            r2 * resolution.y * 1.1 - resolution.y * 0.1
        );

        float radius = distance(startPos, resolution * 0.5);
        float theta = r3 * 6.28318;

        float baseSpeedFromDistance = 1.0 / (radius * 0.0001 + 0.01);
        float initialSpeed = timetest * baseSpeedFromDistance * r4 + timetest * 0.00000001;

        float currentTheta, currentRadius = radius;

        if (state > 0.5) {
            if(isInfalling){
                float distanceRatio = currentRadius / (resolution.x * 1.1);
                float centerWeight = 1.0 - pow(distanceRatio, 0.3);
                float timeProgress = time / maxTime;
                float speedMultiplier = initialSpeed + timeProgress * 2.0;
                float spiralSpeed = baseAngularVel * speedMultiplier * (1.0 + centerWeight * 4.0);
                float spiralRate = (1.0 + maxTime * 0.001) * (radius - blackHoleRadius) / maxTime;
                float stop = blackHoleRadius;
                currentRadius = max(stop, radius - time * spiralRate);
                currentTheta = theta + time * spiralSpeed;
                maxstarsize = 100.;
                sw = mix(19.0, maxstarsize, t);
            } else {
                currentRadius = radius;
                currentTheta = theta + time * baseAngularVel * initialSpeed * 10000.0;
                sw = mix(19.0, maxstarsize, t);
            }
            currentRadius = max(blackHoleRadius, currentRadius);
        } else {
            currentTheta = theta + time * baseAngularVel * initialSpeed * 10000.0;
            sw = mix(19.0, maxstarsize, t);
        }

        vec2 currentStarPos = vec2(
            currentRadius * cos(currentTheta),
            currentRadius * sin(currentTheta)
        ) + resolution * 0.5;

        float strokeWeight = r5 * sw;
        float distToStar = distance(fragCoord, currentStarPos);
        float maxInfluence = strokeWeight * 1.5;

        if (distToStar < maxInfluence) {
            float alpha = r6 * 100.0 + 50.0;
            vec3 starColor = vec3(
                (r7 * 80.0 + 175.0) / 255.0,
                (r8 * 75.0 + 180.0) / 255.0,
                (r9 * 55.0 + 200.0) / 255.0
            );

            float coreIntensity = 1.0 - smoothstep(0.0, strokeWeight * 0.5, distToStar);
            float glowIntensity = 1.0 - smoothstep(0.0, maxInfluence, distToStar);
            float totalIntensity = coreIntensity + glowIntensity * 0.3;

            color.rgb += starColor * (alpha / 255.0) * totalIntensity;
        }
    }

    vec4 stars = starfield(blackHoleRadius*1.1);
    float starfieldalpha = 0.75;
    vec4 final1 = blendScreen(color, stars*starfieldalpha);
    vec4 final = blendMix(final1, color, 0.5);

    gl_FragColor = final;
}
