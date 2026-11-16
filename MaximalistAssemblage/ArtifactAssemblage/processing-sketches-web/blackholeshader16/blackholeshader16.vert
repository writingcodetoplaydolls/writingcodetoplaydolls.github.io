// Standard p5 WEBGL pass-through vertex shader (the fragment shader uses
// gl_FragCoord, so no varyings are needed).
#ifdef GL_ES
precision highp float;
#endif

attribute vec3 aPosition;

uniform mat4 uProjectionMatrix;
uniform mat4 uModelViewMatrix;

void main() {
  gl_Position = uProjectionMatrix * uModelViewMatrix * vec4(aPosition, 1.0);
}
